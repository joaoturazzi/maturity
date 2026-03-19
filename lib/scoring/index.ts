export { calculateDimensionScore, calculateIME, getMaturityLevel } from './calculateIME'
export { calculateGaps } from './calculateGaps'
export { determinePriority } from './determinePriority'

// Cores por dimensão — mapeamento central
export const DIMENSION_COLORS: Record<string, { color: string; bg: string }> = {
  'Estratégia': { color: '#1a5276', bg: '#eaf2fb' },
  'Produto':    { color: '#8e44ad', bg: '#f5eef8' },
  'Mercado':    { color: '#1e8449', bg: '#eafaf1' },
  'Finanças':   { color: '#d68910', bg: '#fef9e7' },
  'Branding':   { color: '#c0392b', bg: '#fdedec' },
}

// Cores por nível de maturidade
export const MATURITY_COLORS: Record<string, string> = {
  'Initial':    '#c0392b',
  'Developing': '#d68910',
  'Defined':    '#555555',
  'Managed':    '#1a5276',
  'Optimized':  '#1e8449',
}

// Cores por priority
export const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  'Critical': { color: '#c0392b', bg: '#fdf2f2' },
  'High':     { color: '#d68910', bg: '#fef9e7' },
  'Medium':   { color: '#1a5276', bg: '#eaf2fb' },
  'Low':      { color: '#555555', bg: '#f4f4f3' },
}
