// ---------- helpers gerais ----------
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// ---------- youtube ----------
export function parseYouTube(input) {
  const s = (input || '').trim()
  if (!s) return null
  try {
    const u = new URL(s)
    const list = u.searchParams.get('list')
    if (list) return { kind: 'playlist', id: list }
    const v = u.searchParams.get('v')
    if (v) return { kind: 'video', id: v }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '')
      if (id) return { kind: 'video', id }
    }
    const m = u.pathname.match(/\/(shorts|embed)\/([\w-]+)/)
    if (m) return { kind: 'video', id: m[2] }
  } catch {
    if (/^[\w-]{11}$/.test(s)) return { kind: 'video', id: s }
    if (/^[\w-]{12,}$/.test(s)) return { kind: 'playlist', id: s }
  }
  return null
}

export function ytUrl(item) {
  return item.kind === 'playlist'
    ? `https://www.youtube.com/playlist?list=${item.id}`
    : `https://youtu.be/${item.id}`
}

// ISO 8601 (PT#H#M#S) -> "12:34" ou "1:02:10"
export function fmtDuration(iso) {
  if (!iso) return ''
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return ''
  const h = +m[1] || 0
  const min = +m[2] || 0
  const s = +m[3] || 0
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`
}
