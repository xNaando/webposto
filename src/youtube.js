// Integração com a YouTube Data API v3 (mesma tecnologia do projeto treinosfit).
// Tudo roda no client; resultados ficam em cache no localStorage pra economizar quota.

const API_KEY = 'AIzaSyBhifKyMeGe8aJu5FaQHvpNEgduN_JSGM0'
const BASE = 'https://www.googleapis.com/youtube/v3'

const META_TTL = 7 * 24 * 3600 * 1000 // metadados de playlist/vídeo: 7 dias
const ITEMS_TTL = 6 * 3600 * 1000 // itens da playlist: 6 horas

function cacheGet(key, ttl) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > ttl) return null
    return data
  } catch {
    return null
  }
}

function cacheSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // cache cheio: ignora
  }
}

function bestThumb(thumbnails) {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    null
  )
}

async function ytGet(path) {
  const r = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}key=${API_KEY}`)
  if (!r.ok) throw new Error(`YouTube API ${r.status}`)
  return r.json()
}

// busca metas de vários itens de uma vez (lotes de 50) — usa cache por id
export async function fetchItemsMeta(items) {
  const result = {}
  const missing = []
  for (const item of items) {
    const key = `yt_meta_${item.kind}_${item.id}`
    const cached = cacheGet(key, META_TTL)
    if (cached) result[item.id] = cached
    else missing.push(item)
  }
  if (!missing.length) return result

  const playlists = missing.filter((i) => i.kind === 'playlist').map((i) => i.id)
  const videos = missing.filter((i) => i.kind === 'video').map((i) => i.id)

  const fetchBatch = async (kind, ids) => {
    for (let i = 0; i < ids.length; i += 50) {
      try {
        const d = await ytGet(`/${kind}s?part=snippet,contentDetails&id=${ids.slice(i, i + 50).join(',')}`)
        for (const it of d.items || []) {
          const m = {
            title: it.snippet.title,
            description: it.snippet.description || '',
            channel: it.snippet.channelTitle,
            thumb: bestThumb(it.snippet.thumbnails),
            count: it.contentDetails?.itemCount ?? null,
            duration: it.contentDetails?.duration || '',
          }
          result[it.id] = m
          cacheSet(`yt_meta_${kind}_${it.id}`, m)
        }
      } catch {
        // falha no lote: cards caem no fallback (título estático)
      }
    }
  }

  await Promise.all([
    fetchBatch('playlist', playlists),
    fetchBatch('video', videos),
  ])
  return result
}

// título, descrição, canal e capa de uma playlist ou vídeo
export async function fetchItemMeta(item) {
  const cached = cacheGet(`yt_meta_${item.kind}_${item.id}`, META_TTL)
  if (cached) return cached

  let meta = null
  try {
    const d = await ytGet(`/${item.kind}s?part=snippet,contentDetails&id=${item.id}`)
    const s = d.items?.[0]?.snippet
    if (s) {
      meta = {
        title: s.title,
        description: s.description || '',
        channel: s.channelTitle,
        thumb: bestThumb(s.thumbnails),
        count: d.items[0].contentDetails?.itemCount ?? null,
        duration: d.items[0].contentDetails?.duration || '',
      }
    }
  } catch {
    return null
  }

  if (meta) cacheSet(`yt_meta_${item.kind}_${item.id}`, meta)
  return meta
}

// remove vídeos ocultos, privados, deletados ou bloqueados para embed
function isVisibleItem(item) {
  const s = item.snippet
  if (!s?.resourceId?.videoId) return false
  const t = (s.title || '').toLowerCase()
  if (!t || t.includes('private') || t.includes('deleted') || t.includes('privado')) return false
  if (!s.thumbnails?.default) return false
  if (item.status && item.status.privacyStatus !== 'public') return false
  return true
}

// checa no lote se o vídeo pode ser embedado e não é bloqueado no BR; captura a duração
async function filterEmbeddable(items) {
  const ids = items.map((i) => i.snippet.resourceId.videoId)
  const ok = new Set()
  const durs = new Map()
  for (let i = 0; i < ids.length; i += 50) {
    const slice = ids.slice(i, i + 50)
    try {
      const d = await ytGet(`/videos?part=status,contentDetails&id=${slice.join(',')}`)
      for (const v of d.items || []) {
        const blocked = v.contentDetails?.regionRestriction?.blocked || []
        if (v.status?.embeddable && v.status?.privacyStatus === 'public' && !blocked.includes('BR')) {
          ok.add(v.id)
          if (v.contentDetails?.duration) durs.set(v.id, v.contentDetails.duration)
        }
      }
    } catch {
      // se a checagem falhar, mantém o que já passou no filtro do snippet
      slice.forEach((id) => ok.add(id))
    }
  }
  return { items: items.filter((i) => ok.has(i.snippet.resourceId.videoId)), durs }
}

// todos os vídeos de uma playlist (paginado, filtrado)
export async function fetchPlaylistVideos(playlistId) {
  const cached = cacheGet(`yt_items_${playlistId}`, ITEMS_TTL)
  if (cached) return cached

  const items = []
  let pageToken = ''
  do {
    const d = await ytGet(
      `/playlistItems?part=snippet,status&maxResults=50&playlistId=${playlistId}` +
        (pageToken ? `&pageToken=${pageToken}` : '')
    )
    if (d.error) throw new Error(d.error.message)
    items.push(...(d.items || []))
    pageToken = d.nextPageToken || ''
  } while (pageToken)

  const { items: visible, durs } = await filterEmbeddable(items.filter(isVisibleItem))
  const videos = visible.map((i) => {
    const videoId = i.snippet.resourceId.videoId
    return {
      id: videoId,
      title: i.snippet.title,
      description: i.snippet.description || '',
      channel: i.snippet.videoOwnerChannelTitle || i.snippet.channelTitle,
      thumb: bestThumb(i.snippet.thumbnails) || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: durs.get(videoId) || '',
      position: i.snippet.position,
    }
  })

  cacheSet(`yt_items_${playlistId}`, videos)
  return videos
}

export function videoEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0`
}
