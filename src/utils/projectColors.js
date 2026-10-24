export const DEFAULT_PROJECT_COLOR = '#000000'

export function projectIconTextColor(color) {
  const hex = /^#[0-9a-f]{6}$/i.test(color || '') ? color : DEFAULT_PROJECT_COLOR
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 160 ? '#111111' : '#ffffff'
}
