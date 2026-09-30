import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { fetchItemMeta, fetchPlaylistVideos, videoEmbedUrl } from '../youtube'
import { clamp, fmtDuration, ytUrl } from '../utils'

// Tela de uma trilha (playlist ou vídeo solto): player + lista de aulas com
// progresso de assistidas. Ao abrir, retoma na primeira aula não assistida.
export default function PlaylistView({ item, store, toggleWatched, onBack }) {
  const accent = item.color || '#fbbf24'
  const isPlaylist = item.kind === 'playlist'
  const [meta, setMeta] = useState(null)
  const [videos, setVideos] = useState(null) // null = carregando
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(0)
  const playerRef = useRef(null)
  const watchedRef = useRef(new Set())
  watchedRef.current = new Set(store.watched[item.id] || [])

  function goTo(i) {
    setSelected(i)
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  useEffect(() => {
    let alive = true
    setMeta(null)
    setVideos(null)
    setError('')
    setSelected(0)

    fetchItemMeta(item).then((m) => alive && m && setMeta(m))

    if (isPlaylist) {
      fetchPlaylistVideos(item.id)
        .then((v) => {
          if (!alive) return
          if (!v.length) setError('Não encontrei vídeos públicos nessa playlist.')
          setVideos(v)
          const first = v.findIndex((x) => !watchedRef.current.has(x.id))
          setSelected(first === -1 ? 0 : first)
        })
        .catch(() => alive && setError('Não consegui carregar os vídeos agora. Tente de novo mais tarde.'))
    } else {
      setVideos([
        {
          id: item.id,
          title: item.title,
          description: '',
          thumb: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
        },
      ])
    }
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.kind, isPlaylist])

  const title = meta?.title || item.title
  const channel = meta?.channel || item.channel
  const desc = meta?.description || item.blurb || ''
  const current = videos?.[selected]

  const watched = watchedRef.current
  const ids = new Set((videos || []).map((v) => v.id))
  const done = [...watched].filter((id) => ids.has(id)).length
  const total = videos?.length || meta?.count || item.count || 0
  const pct = total ? Math.round(clamp(done / total, 0, 1) * 100) : 0
  const isCurWatched = current ? watched.has(current.id) : false

  return (
    <div className="view container">
      <button className="btn ghost back-btn" onClick={onBack}>
        <Icon name="arrow-left" size={16} /> Todas as trilhas
      </button>

      <header className="view-head" style={{ '--c': accent }}>
        <span className="view-tag">{item.tag || 'Trilha'}</span>
        <h1>{title}</h1>
        <p className="muted">
          {channel}
          {total ? ` · ${total} ${total === 1 ? 'vídeo' : 'vídeos'}` : ''}
        </p>
        {desc && <p className="view-desc">{desc}</p>}
        {total > 0 && (
          <div className="vprog">
            <div className="vprog-bar"><span style={{ width: `${pct}%` }} /></div>
            <span className="muted">{done}/{total} assistidas</span>
          </div>
        )}
      </header>

      {error && (
        <div className="card yt-error">
          <p>{error}</p>
          <a className="btn primary sm" href={ytUrl(item)} target="_blank" rel="noreferrer">
            Abrir no YouTube
          </a>
        </div>
      )}

      {videos === null && !error && (
        <div className="yt-loading card">
          <span className="spinner" />
          <p className="muted">Buscando aulas no YouTube...</p>
        </div>
      )}

      {videos && videos.length > 0 && (
        <div className="view-grid">
          <div className="view-main">
            <div className="player-wrap card" ref={playerRef}>
              <div className="player-frame">
                <iframe
                  src={videoEmbedUrl(current.id)}
                  title={current.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {videos.length > 1 && (
                <div className="yt-nav">
                  <button className="btn ghost sm" disabled={selected === 0} onClick={() => goTo(selected - 1)}>
                    <Icon name="arrow-left" size={15} /> Anterior
                  </button>
                  <span className="yt-nav-pos">Aula {selected + 1} de {videos.length}</span>
                  <button
                    className="btn ghost sm"
                    disabled={selected === videos.length - 1}
                    onClick={() => goTo(selected + 1)}
                  >
                    Próxima <Icon name="chevron" size={15} />
                  </button>
                </div>
              )}

              <div className="player-info">
                <div className="player-title-row">
                  <h3>{current.title}</h3>
                  {current.duration && (
                    <span className="dur"><Icon name="clock" size={13} /> {fmtDuration(current.duration)}</span>
                  )}
                </div>
                {current.description && <p className="muted desc-clamp">{current.description}</p>}
                <div className="player-actions">
                  <button
                    className={`btn sm ${isCurWatched ? 'ok' : 'primary'}`}
                    onClick={() => toggleWatched(item.id, current.id)}
                  >
                    <Icon name="check" size={15} />
                    {isCurWatched ? 'Assistida' : 'Marcar como assistida'}
                  </button>
                  <a
                    className="btn ghost sm"
                    href={ytUrl({ kind: 'video', id: current.id })}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir no YouTube <Icon name="arrow-up-right" size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {videos.length > 1 && (
            <aside className="view-aside">
              <div className="aside-head">
                <span><Icon name="list" size={15} /> Conteúdo da trilha</span>
                <span className="muted">{done}/{videos.length}</span>
              </div>
              <div className="yt-list">
                {videos.map((v, i) => (
                  <button
                    key={v.id}
                    className={`yt-item ${i === selected ? 'active' : ''} ${watched.has(v.id) ? 'done' : ''}`}
                    style={{ '--c': accent }}
                    onClick={() => goTo(i)}
                  >
                    <span className="yt-num">
                      {watched.has(v.id) ? <Icon name="check" size={14} /> : i + 1}
                    </span>
                    <span className="yt-thumbwrap">
                      <img src={v.thumb} alt="" loading="lazy" />
                      {v.duration && <span className="yt-dur">{fmtDuration(v.duration)}</span>}
                    </span>
                    <span className="yt-item-info">
                      <strong>{v.title}</strong>
                    </span>
                    <span
                      className="yt-checkbtn"
                      role="button"
                      tabIndex={0}
                      title={watched.has(v.id) ? 'Desmarcar' : 'Marcar como assistida'}
                      onClick={(e) => { e.stopPropagation(); toggleWatched(item.id, v.id) }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), toggleWatched(item.id, v.id))}
                    >
                      <Icon name="check" size={14} />
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
