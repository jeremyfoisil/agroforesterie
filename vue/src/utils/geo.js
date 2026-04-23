import * as turf from '@turf/turf'

export function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180
  const dl = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function geomLength(geometry) {
  if (!geometry) return 0
  const calcLine = coords => {
    let l = 0
    for (let i = 1; i < coords.length; i++) {
      l += haversineM(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0])
    }
    return l
  }
  if (geometry.type === 'LineString') return calcLine(geometry.coordinates)
  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates.reduce((s, c) => s + calcLine(c), 0)
  }
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.reduce((s, g) => s + geomLength(g), 0)
  }
  return 0
}

function makeUnionFind(n) {
  const p = Array.from({ length: n }, (_, i) => i)
  const find = i => { while (p[i] !== i) { p[i] = p[p[i]]; i = p[i] } return i }
  const union = (a, b) => { p[find(a)] = find(b) }
  const groups = () => {
    const m = {}
    for (let i = 0; i < n; i++) {
      const r = find(i)
      if (!m[r]) m[r] = []
      m[r].push(i)
    }
    return Object.values(m)
  }
  return { find, union, groups }
}

function getLineFeatures(proj) {
  if (!proj.fc || !proj.fc.features) return []
  return proj.fc.features.filter(f =>
    f.geometry && ['LineString', 'MultiLineString'].includes(f.geometry.type)
  )
}

function lineCentroid(f) {
  const coords = []
  const g = f.geometry
  if (g.type === 'LineString') g.coordinates.forEach(c => coords.push(c))
  else if (g.type === 'MultiLineString') g.coordinates.forEach(l => l.forEach(c => coords.push(c)))
  if (!coords.length) return null
  return [
    coords.reduce((s, c) => s + c[0], 0) / coords.length,
    coords.reduce((s, c) => s + c[1], 0) / coords.length
  ]
}

function calcClusterHull(features, bufferKm) {
  const allPts = []
  features.forEach(f => {
    if (!f.geometry) return
    try {
      const buf = turf.buffer(f, bufferKm, { units: 'kilometers' })
      if (buf) turf.coordAll(buf).forEach(c => allPts.push(turf.point(c)))
    } catch (e) {
      const g = f.geometry
      if (g.type === 'LineString') g.coordinates.forEach(c => allPts.push(turf.point(c)))
      else if (g.type === 'MultiLineString') g.coordinates.forEach(l => l.forEach(c => allPts.push(turf.point(c))))
    }
  })
  if (allPts.length < 3) return null
  try {
    return turf.convex(turf.featureCollection(allPts)) || null
  } catch (e) {
    return null
  }
}

export function calcOptimizedProjectAOIs(proj, bufferM, clusterM) {
  const features = getLineFeatures(proj)
  if (!features.length) return []
  const centroids = features.map(lineCentroid)
  const uf = makeUnionFind(features.length)
  for (let i = 0; i < features.length; i++) {
    if (!centroids[i]) continue
    for (let j = i + 1; j < features.length; j++) {
      if (!centroids[j]) continue
      if (haversineM(centroids[i][1], centroids[i][0], centroids[j][1], centroids[j][0]) <= clusterM) {
        uf.union(i, j)
      }
    }
  }
  const bufKm = bufferM / 1000
  return uf.groups().map(indices => {
    const hull = calcClusterHull(indices.map(i => features[i]), bufKm)
    if (!hull) return null
    return { hull, area: turf.area(hull) / 1e6, featureCount: indices.length }
  }).filter(Boolean)
}

export function consolidateAOIs(allProjectAOIs, consolKm) {
  const flat = []
  allProjectAOIs.forEach(p =>
    p.aois.forEach(a => flat.push({ ...a, projectId: p.projectId, projectName: p.projectName, color: p.color }))
  )
  const individualArea = flat.reduce((s, a) => s + a.area, 0)
  if (!flat.length) return { groups: [], totalArea: 0, individualArea: 0 }

  const centroids = flat.map(a => {
    try { return turf.centroid(a.hull).geometry.coordinates } catch (e) { return null }
  })
  const uf = makeUnionFind(flat.length)
  for (let i = 0; i < flat.length; i++) {
    if (!centroids[i]) continue
    for (let j = i + 1; j < flat.length; j++) {
      if (!centroids[j]) continue
      if (haversineM(centroids[i][1], centroids[i][0], centroids[j][1], centroids[j][0]) / 1000 <= consolKm) {
        uf.union(i, j)
      }
    }
  }
  const groups = uf.groups().map(indices => {
    const items = indices.map(i => flat[i])
    const projectIds = [...new Set(items.map(i => i.projectId))]
    const allPts = []
    items.forEach(item => {
      try { turf.coordAll(item.hull).forEach(c => allPts.push(turf.point(c))) } catch (e) {}
    })
    let mergedHull = null, mergedArea = 0
    if (allPts.length >= 3) {
      try {
        mergedHull = turf.convex(turf.featureCollection(allPts))
        if (mergedHull) mergedArea = turf.area(mergedHull) / 1e6
      } catch (e) {}
    }
    if (!mergedArea) mergedArea = items.reduce((s, i) => s + i.area, 0)
    return { items, projectIds, mergedHull, mergedArea, isMultiProject: projectIds.length > 1 }
  })
  return {
    groups,
    totalArea: groups.reduce((s, g) => s + g.mergedArea, 0),
    individualArea
  }
}
