export interface Coordinate {
  x: number
  y: number
}

export interface Lane {
  id: number
  laneId: number
  depth: number
  coordinates: Coordinate[]
}

export interface Intersection extends Coordinate {
  id: number
  lanes: Set<number>
}

export interface LanesAndIntersections {
  lanes: Lane[]
  intersections: Intersection[]
}

export const isIntersection = (c: Coordinate): c is Intersection => c.hasOwnProperty('lanes')

export const nextIntersectionId = (() => {
  let i = 0
  return () => (i += 1)
})()

export const nextLaneId = (() => {
  let i = 0
  return () => (i += 1)
})()
