import { useState, useCallback } from 'react'

const KEY = 'webposto_tutoriais_v1'

const defaults = {
  watched: {}, // { [playlistId]: [videoId] } — aulas marcadas como assistidas
}

let memFallback = null // fallback caso localStorage esteja indisponível

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(defaults)
    const parsed = JSON.parse(raw)
    return {
      ...structuredClone(defaults),
      ...parsed,
      watched: parsed.watched || {},
    }
  } catch {
    return memFallback || structuredClone(defaults)
  }
}

export function saveStore(store) {
  memFallback = store
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // sem localStorage: mantém só em memória
  }
}

// Hook central: [store, update]
export function useStore() {
  const [store, setStore] = useState(loadStore)

  const update = useCallback((fn) => {
    setStore((prev) => {
      const next = typeof fn === 'function' ? fn(structuredClone(prev)) : fn
      saveStore(next)
      return next
    })
  }, [])

  return [store, update]
}

export function watchedCount(store, playlistId) {
  return store.watched[playlistId]?.length || 0
}
