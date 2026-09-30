import { useState } from 'react'
import Icon from './Icon'
import { watchedCount } from '../store'
import { clamp } from '../utils'
import logo from '../assets/logo.png'

// Card de trilha: capa, título e nº de aulas vêm do YouTube (com fallback local)
function TrailCard({ pl, meta, store, onOpen }) {
  const count = meta?.count ?? pl.count
  const done = watchedCount(store, pl.id)
  const pct = count ? clamp(done / count, 0, 1) * 100 : 0
  const thumb =
    meta?.thumb || (pl.kind === 'video' ? `https://img.youtube.com/vi/${pl.id}/hqdefault.jpg` : null)
  const finished = count > 0 && done >= count

  return (
    <div className="pl-card card" onClick={() => onOpen(pl)} style={{ '--c': pl.color || '#fbbf24' }}>
      <div className="pl-thumb">
        {thumb ? <img src={thumb} alt="" loading="lazy" /> : null}
        <span className="pl-shade" />
        <span className="pl-play"><Icon name="play" size={24} /></span>
        <span className="pl-tag">{pl.tag}</span>
        {count > 0 && (
          <span className="pl-count">
            <Icon name="video" size={12} /> {count} {count === 1 ? 'aula' : 'aulas'}
          </span>
        )}
        {done > 0 && (
          <span className="pl-prog">
            <span style={{ width: `${pct}%` }} />
          </span>
        )}
      </div>
      <div className="pl-body">
        <strong className="pl-title">{meta?.title || pl.title}</strong>
        <span className="pl-meta muted">{meta?.channel || pl.channel}</span>
        {pl.blurb && <span className="pl-blurb">{pl.blurb}</span>}
        {finished && (
          <span className="pl-done"><Icon name="check" size={13} /> Concluída</span>
        )}
      </div>
    </div>
  )
}

export default function Home({ playlists, metas, store, onOpen }) {
  const [tag, setTag] = useState('Todas')

  const all = playlists
  const tags = ['Todas', ...new Set(all.map((p) => p.tag))]

  const filtered = all.filter((p) => tag === 'Todas' || p.tag === tag)

  const totalVideos = all.reduce((n, p) => n + (metas[p.id]?.count || p.count || 0), 0)
  const totalWatched = all.reduce((n, p) => n + watchedCount(store, p.id), 0)

  function scrollToTrilhas() {
    document.getElementById('trilhas')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-inner container">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <Icon name="fuel" size={14} /> Central de treinamento
            </span>
            <h1>
              Domine o <em>webPosto</em> em vídeo-aulas
            </h1>
            <p className="hero-sub">
              Trilhas completas para treinar sua equipe — do primeiro acesso à gestão do posto.
              Assista no seu ritmo e acompanhe o progresso de cada trilha.
            </p>
            <div className="hero-cta">
              <button className="btn primary lg" onClick={scrollToTrilhas}>
                <Icon name="play" size={17} /> Começar agora
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <strong>{all.length}</strong>
                <span>trilhas</span>
              </div>
              <div className="stat">
                <strong>{totalVideos || '—'}</strong>
                <span>vídeo-aulas</span>
              </div>
              <div className="stat">
                <strong>{totalWatched}</strong>
                <span>assistidas</span>
              </div>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="mock">
              <div className="mock-bar"><i /><i /><i /></div>
              <div className="mock-thumb">
                <img className="mock-logo" src={logo} alt="" aria-hidden="true" />
                <span className="mock-play"><Icon name="play" size={28} /></span>
              </div>
              <div className="mock-rows">
                <div className="mock-row"><i className="mock-dot ok" /><span style={{ width: '82%' }} /><Icon name="check" size={12} /></div>
                <div className="mock-row"><i className="mock-dot ok" /><span style={{ width: '64%' }} /><Icon name="check" size={12} /></div>
                <div className="mock-row"><i className="mock-dot" /><span style={{ width: '74%' }} /><Icon name="play" size={12} /></div>
                <div className="mock-row"><i className="mock-dot" /><span style={{ width: '58%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container" id="trilhas">
        <div className="sec-head">
          <div>
            <h2>Trilhas de aprendizado</h2>
            <p className="muted">Escolha uma trilha e assista na ordem — seu progresso fica salvo neste navegador.</p>
          </div>
        </div>

        <div className="chip-row">
          {tags.map((t) => (
            <button key={t} className={`chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid">
          {filtered.map((pl, i) => (
            <TrailCard
              key={`${pl.id}-${i}`}
              pl={pl}
              meta={metas[pl.id]}
              store={store}
              onOpen={onOpen}
            />
          ))}
        </div>
      </section>
    </>
  )
}
