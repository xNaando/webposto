import { useState } from 'react'
import Icon from './Icon'
import { parseYouTube } from '../utils'

// Modal para adicionar playlist/vídeo do YouTube por link
export default function AddCustom({ onAdd, onClose }) {
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  const parsed = parseYouTube(url)

  function submit(e) {
    e.preventDefault()
    if (!parsed) {
      setErr('Link inválido. Cole a URL de uma playlist ou vídeo do YouTube.')
      return
    }
    onAdd({
      ...parsed,
      title: parsed.kind === 'playlist' ? 'Playlist do YouTube' : 'Vídeo do YouTube',
    })
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <h3>Adicionar do YouTube</h3>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </div>
        <p className="muted">
          Cole o link de uma <strong>playlist</strong> ou <strong>vídeo</strong> do YouTube para criar
          uma trilha extra — só você vê.
        </p>
        <label className="field">
          <span>Link do YouTube</span>
          <input
            autoFocus
            value={url}
            onChange={(e) => { setUrl(e.target.value); setErr('') }}
            placeholder="https://www.youtube.com/playlist?list=..."
          />
        </label>
        {err && <p className="field-err">{err}</p>}
        {parsed && !err && (
          <p className="field-ok">
            <Icon name="check" size={14} />
            {parsed.kind === 'playlist' ? 'Playlist reconhecida' : 'Vídeo reconhecido'}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn primary" disabled={!parsed}>
            <Icon name="plus" size={15} /> Adicionar
          </button>
        </div>
      </form>
    </div>
  )
}
