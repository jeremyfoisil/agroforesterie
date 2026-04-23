export function computeShpPrice(haies, ml, p) {
  const score = (x, max) => {
    if (max <= 0) return 0
    if (p.prog === 'sqrt') return Math.min(Math.sqrt(x) / Math.sqrt(max), 1)
    if (p.prog === 'lin')  return Math.min(x / max, 1)
    return Math.min(Math.log(1 + x) / Math.log(1 + max), 1)
  }
  return p.base + (p.wH * score(haies, p.maxH) + p.wML * score(ml, p.maxML)) * p.scale
}
