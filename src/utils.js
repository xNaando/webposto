// ---------- helpers gerais ----------
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// ---------- youtube ----------
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
