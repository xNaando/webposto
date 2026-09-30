import { useEffect, useMemo, useState } from 'react'
import { useStore, watchedCount } from './store'
import { PLAYLISTS } from './data/playlists'
import { fetchItemsMeta } from './youtube'
import Home from './components/Home'
import PlaylistView from './components/PlaylistView'
import Icon from './components/Icon'
import logo from './assets/logo.png'

export default function App() {
  const [store, update] = useStore()
  const [open, setOpen] = useState(null) // trilha aberta
  const [metas, setMetas] = useState({})

  const all = useMemo(() => [...PLAYLISTS, ...store.custom], [store.custom])

  // busca título/capa/nº de aulas de todas as trilhas em lotes (com cache)
  useEffect(() => {
    let alive = true
    fetchItemsMeta(all).then((m) => alive && setMetas(m))
    return () => {
      alive = false
    }
  }, [all])

  const toggleWatched = (plId, videoId) =>
    update((s) => {
      const set = new Set(s.watched[plId] || [])
      if (set.has(videoId)) set.delete(videoId)
      else set.add(videoId)
      s.watched[plId] = [...set]
      return s
    })

  const addCustom = (item) =>
    update((s) => {
      if (!s.custom.some((c) => c.id === item.id)) s.custom.push(item)
      return s
    })

  const removeCustom = (id, kind) =>
    update((s) => {
      s.custom = s.custom.filter((c) => !(c.id === id && c.kind === kind))
      return s
    })

  const totalVideos = all.reduce((n, p) => n + (metas[p.id]?.count || p.count || 0), 0)
  const totalWatched = all.reduce((n, p) => n + watchedCount(store, p.id), 0)

  function goHome() {
    setOpen(null)
    window.scrollTo(0, 0)
  }
  function openItem(pl) {
    setOpen(pl)
    window.scrollTo(0, 0)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner container">
          <button className="brand" onClick={goHome}>
            <img className="brand-logo" src={logo} alt="webPosto" />
            <span className="brand-name">
              web<strong>Posto</strong> <em>tutoriais</em>
            </span>
          </button>
          <div className="top-actions">
            <span className="pill" title="Aulas assistidas">
              <Icon name="check" size={14} />
              <strong>{totalWatched}</strong>/<span>{totalVideos || '—'}</span> assistidas
            </span>
          </div>
        </div>
      </header>

      <main>
        {open ? (
          <PlaylistView item={open} store={store} toggleWatched={toggleWatched} onBack={goHome} />
        ) : (
          <Home
            playlists={PLAYLISTS}
            custom={store.custom}
            metas={metas}
            store={store}
            onOpen={openItem}
            onAdd={addCustom}
            onRemove={removeCustom}
          />
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <img className="footer-logo" src={logo} alt="" />
          <span>
            Central de treinamento webPosto · vídeos hospedados no YouTube · progresso salvo neste navegador
          </span>
        </div>
      </footer>
    </div>
  )
}
