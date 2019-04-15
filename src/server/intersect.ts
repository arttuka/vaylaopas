import { Coordinate, Intersection, Lane, isIntersection, nextIntersectionId, nextLaneId } from '../common/lane'

export interface ComparableLane extends Lane {
  index: number;
}

const nextMonotoneChain = (lane: Lane, from: number): Lane => {
  const { coordinates, laneid: laneId, depth } = lane
  if (coordinates.length < 2 + from) {
    console.log(`unexpected length for lane: ${coordinates.length}`)
  }
  const result = coordinates.slice(from, from + 2)
  const reverse = result[0].x > result[1].x
  let prev = coordinates[1]
  let i = from + 2
  while (i < coordinates.length && (reverse ? prev.x > coordinates[i].x : prev.x <= coordinates[i].x)) {
    result.push(coordinates[i])
    prev = coordinates[i]
    i += 1
  }
  return {
    coordinates: (reverse ? result.reverse() : result),
    laneid: laneId,
    depth,
    id: nextLaneId(),
  }
}

export const toMonotoneChains = (lane: Lane): Lane[] => {
  const result = []
  let from = 0
  while (from < lane.coordinates.length) {
    const next = nextMonotoneChain(lane, from)
    result.push(next)
    if (from + next.coordinates.length === lane.coordinates.length) {
      break
    }
    from += next.coordinates.length - 1
  }
  return result
}

const compareLanes = (left: ComparableLane, right: ComparableLane): number => {
  return left.coordinates[left.index].x - right.coordinates[right.index].x
}

const lineSegmentIntersection = (
  c1: Coordinate,
  c2: Coordinate,
  c3: Coordinate,
  c4: Coordinate
): Intersection | null => {
  const g = ((c3.y - c4.y) * (c1.x - c3.x) + (c4.x - c3.x) * (c1.y - c3.y)) /
    ((c4.x - c3.x) * (c1.y - c2.y) - (c1.x - c2.x) * (c4.y - c3.y))
  const h = ((c1.y - c2.y) * (c1.x - c3.x) + (c2.x - c1.x) * (c1.y - c3.y)) /
    ((c4.x - c3.x) * (c1.y - c2.y) - (c1.x - c2.x) * (c4.y - c3.y))
  if(0 <= g && g <= 1 && 0 <= h && h <= 1) {
    if(g === 0 && isIntersection(c1) || h === 0 && isIntersection(c3)) {
      return null
    }
    return {
      x: c1.x + g * (c2.x - c1.x),
      y: c1.y + g * (c2.y - c1.y),
      id: nextIntersectionId(),
      lanes: new Set(),
    }
  }
  return null
}

const findIntersection = (l1: ComparableLane, l2: ComparableLane): Intersection | null => {
  if (l1 !== l2) {
    const c1 = l1.coordinates[l1.index - 1]
    const c2 = l1.coordinates[l1.index]
    const c3 = l2.coordinates[l2.index - 1]
    const c4 = l2.coordinates[l2.index]
    const intersection = lineSegmentIntersection(c1, c2, c3, c4)
    if (intersection) {
      intersection.lanes.add(l1.id).add(l2.id)
      l1.coordinates.splice(l1.index, 0, intersection)
      l2.coordinates.splice(l2.index, 0, intersection)
      return intersection
    }
  }
  return null
}

const findIntersections = (lane: ComparableLane, lanes: Set<ComparableLane>): Intersection[] => {
  const result = []
  for (const c of lanes) {
    const intersection = findIntersection(lane, c)
    if(intersection) {
      result.push(intersection)
    }
  }
  return result
}

export const findAllIntersections = (lanes: Lane[]): Intersection[] => {
  const acl: ComparableLane[] = lanes.map((lane): ComparableLane => ({ ...lane, index: 0 })).sort(compareLanes)
  const scl = new Set<ComparableLane>()
  const output: Intersection[] = []
  let i = 0
  while (acl.length) {
    i += 1
    if(i % 100 === 0) console.log(`findAllIntersections ${acl.length}`)
    const current = acl[0]
    current.index += 1
    if (current.index === current.coordinates.length) {
      scl.delete(current)
      acl.shift()
    } else {
      scl.add(current)
      output.push(...findIntersections(current, scl))
      acl.sort(compareLanes)
    }
  }
  return output
}
