export function fmt(n) {
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}

export function fmtN(n, d = 0) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
}

export function fmtLen(m) {
  if (m >= 1000) {
    return (m / 1000).toLocaleString('fr-FR', {
      minimumFractionDigits: 1, maximumFractionDigits: 1
    }) + ' km'
  }
  return Math.round(m).toLocaleString('fr-FR') + ' m'
}
