export function chaserLabel(chaser) {
  if (!chaser) return 'To chase'
  const bits = chaser.full_name.trim().split(/\s+/)
  const first = bits[0]
  const initial = bits.length > 1 ? ` ${bits[bits.length - 1][0]}` : ''
  return `${first}${initial} to chase`
}

export function daysSince(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso)) / 86400000)
}
