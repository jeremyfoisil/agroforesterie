export const SHP_COLORS = [
  '#e63946', '#2a9d8f', '#e9c46a', '#f4a261',
  '#264653', '#6d6875', '#457b9d', '#588157'
]

export const PALETTE = [
  '#e63946', '#c1121f', '#ff6b6b', '#ff9f1c', '#f4a261', '#e9c46a',
  '#2a9d8f', '#52b788', '#95d5b2', '#3a5a40', '#588157', '#264653',
  '#457b9d', '#1d3557', '#023e8a', '#0077b6', '#6d6875', '#b5838d',
  '#7209b7', '#3f37c9', '#4361ee', '#f77f00', '#d62828', '#333333'
]

export const ALL_YEARS = Array.from({ length: 25 }, (_, i) => 2026 + i)
export const TIMELINE_VISIBLE = 8
export const TIMELINE_MAX_OFFSET = ALL_YEARS.length - TIMELINE_VISIBLE

export const DEPT_STYLE_DARK  = { color: '#444', weight: 0.9, opacity: 0.50, fill: false }
export const DEPT_STYLE_LIGHT = { color: '#fff', weight: 1.1, opacity: 0.70, fill: false }
