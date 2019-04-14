export interface Coordinate {
  x: number;
  y: number;
}

export interface Lane {
  id: number;
  laneid: number;
  depth: number;
  coordinates: Coordinate[];
}

export interface Intersection extends Coordinate {
  id: number;
  lanes: Set<number>;
}

export interface LanesAndIntersections {
  lanes: Lane[];
  intersections: Intersection[];
}

export const isIntersection = (c: Coordinate): c is Intersection => c.hasOwnProperty('lanes')

export const nextIntersectionId = ((): (() => number) => {
  let i = 0
  return (): number => (i += 1)
})()

export const nextLaneId = ((): (() => number) => {
  let i = 0
  return (): number => (i += 1)
})()
