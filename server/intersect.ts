import { Position } from 'geojson'

export interface Vertex {
  x: number
  y: number
  isIntersection: boolean
}

export interface Chain {
  vertices: Vertex[]
  index: number
}

const nextMonotoneChain = (points: Position[]): Chain => {
  if (points.length < 2) {
    console.log(`unexpected length for chain: ${points.length}`)
  }
  const result = points.slice(0, 2)
  const reverse = result[0][0] > result[1][0]
  let prev = points[1]
  let i = 2
  while (i < points.length && (reverse ? prev[0] > points[i][0] : prev[0] <= points[i][0])) {
    result.push(points[i])
    prev = points[i]
    i += 1
  }
  const vertices = (reverse ? result.reverse() : result).map(([x, y]) => ({
    x,
    y,
    isIntersection: false,
  }))
  return {
    vertices,
    index: 0
  }
}

export const toMonotoneChains = (points: Position[]): Chain[] => {
  const result = []
  let current = points
  while (current.length) {
    const next = nextMonotoneChain(current)
    result.push(next)
    if (next.vertices.length === current.length) {
      break
    }
    current = current.slice(next.vertices.length - 1)
  }
  return result
}

const compareChains = (left: Chain, right: Chain): number => {
  return left.vertices[left.index].x - right.vertices[right.index].x
}

const lineSegmentIntersection = (p1: Vertex, p2: Vertex, p3: Vertex, p4: Vertex): Vertex | null => {
  const g = ((p3.y - p4.y) * (p1.x - p3.x) + (p4.x - p3.x) * (p1.y - p3.y)) /
    ((p4.x - p3.x) * (p1.y - p2.y) - (p1.x - p2.x) * (p4.y - p3.y))
  const h = ((p1.y - p2.y) * (p1.x - p3.x) + (p2.x - p1.x) * (p1.y - p3.y)) /
    ((p4.x - p3.x) * (p1.y - p2.y) - (p1.x - p2.x) * (p4.y - p3.y))
  if(0 <= g && g <= 1 && 0 <= h && h <= 1) {
    if(g === 0 && p1.isIntersection || h === 0 && p3.isIntersection) {
      return null
    }
    return {
      x: p1.x + g * (p2.x - p1.x),
      y: p1.y + g * (p2.y - p1.y),
      isIntersection: true,
    }
  }
  return null
}

const findIntersection = (c1: Chain, c2: Chain): Vertex | null => {
  if (c1 !== c2) {
    const v1 = c1.vertices[c1.index - 1]
    const v2 = c1.vertices[c1.index]
    const v3 = c2.vertices[c2.index - 1]
    const v4 = c2.vertices[c2.index]
    const intersection = lineSegmentIntersection(v1, v2, v3, v4)
    if (intersection) {
      c1.vertices.splice(c1.index, 0, intersection)
      c2.vertices.splice(c2.index, 0, intersection)
      return intersection
    }
  }
  return null
}

const findIntersections = (chain: Chain, chains: Set<Chain>): Vertex[] => {
  const result = []
  for (const c of chains) {
    const intersection = findIntersection(chain, c)
    if(intersection) {
      result.push(intersection)
    }
  }
  return result
}

export const findAllIntersections = (chains: Chain[]): Vertex[] => {
  const acl = [...chains].sort(compareChains)
  const scl = new Set<Chain>()
  const output: Vertex[] = []
  while (acl.length) {
    const current = acl[0]
    current.index += 1
    if (current.index === current.vertices.length) {
      scl.delete(current)
      acl.shift()
    } else {
      scl.add(current)
      output.push(...findIntersections(current, scl))
      acl.sort(compareChains)
    }
  }
  return output
}
