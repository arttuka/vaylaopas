import { useEffect, useRef } from 'react'
import geojson from 'geojson'
import {
  Id,
  Index,
  LngLat,
  MapSettings,
  Point,
  Pred,
  Route,
  RouteProps,
  Settings,
} from './types'

const identity = <T>(t: T): T => t

export const partition = <T>(arr: T[], n: number, step: number = n): T[][] => {
  const result = []
  let i = 0
  while (i + n <= arr.length) {
    result.push(arr.slice(i, i + n))
    i += step
  }
  return result
}

export const splitAt = <T>(
  arr: T[],
  pred: (t1: T, t2: T) => boolean
): T[][] => {
  if (arr.length === 0) {
    return []
  }
  let i = 1
  const result = [arr[0]]
  while (i < arr.length && !pred(arr[i - 1], arr[i])) {
    result.push(arr[i])
    ++i
  }
  return [result, ...splitAt(arr.slice(i), pred)]
}

export const range = (count: number, start = 0, step = 1): number[] =>
  [...Array(count).keys()].map((i) => start + i * step)

export function spreadIf<T>(t: T): [] | [T]
export function spreadIf<T, S>(t: T, s: S): [] | [S]
export function spreadIf<T, S>(t: T, s?: S): [] | [T | S] {
  return t ? [s ?? t] : []
}

export const round = (n: number, decimals = 0): number => {
  const m = Math.pow(10, decimals)
  return Math.round(n * m) / m
}

export const toNM = (meters: number): number => meters / 1852

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const numToLetter = (n: number): string =>
  n < 26 ? letters[n] : numToLetter(Math.floor(n / 26) - 1) + letters[n % 26]

const complement =
  <T>(pred: Pred<T>): Pred<T> =>
  (t: T) =>
    !pred(t)

export const removeWhere = <T>(arr: T[], pred: Pred<T>): T[] =>
  arr.filter(complement(pred))

export const updateIndex = <T>(arr: T[], i: number, t: Partial<T>): T[] => [
  ...arr.slice(0, i),
  { ...arr[i], ...t },
  ...arr.slice(i + 1),
]

export const updateWhere = <T>(arr: T[], pred: Pred<T>, t: Partial<T>): T[] => {
  const index = arr.findIndex(pred)
  if (index >= 0) {
    return updateIndex(arr, index, t)
  } else {
    return arr
  }
}

export const hasProperty =
  <K extends string, V, T extends { [k in K]: V }>(k: K, v: V): Pred<T> =>
  (t: T) =>
    t[k] === v

export const hasId = <T extends Id>(id: string): Pred<T> =>
  hasProperty('id', id)

export const hasAnyId =
  <T extends Id>(ids: string[]): Pred<T> =>
  (t: T) =>
    ids.includes(t.id)

export const insertIndex = <T>(arr: T[], i: number, t: T): T[] => [
  ...arr.slice(0, i),
  t,
  ...arr.slice(i),
]

export const addMany = <T>(set: Set<T>, ...ts: T[]): Set<T> => {
  for (const t of ts) {
    set.add(t)
  }
  return set
}

export function mapBy<T, S>(
  arr: T[],
  keyfn: (t: T) => number,
  valfn: (t: T) => S
): Index<S>
export function mapBy<T>(arr: T[], keyfn: (t: T) => number): Index<T>
export function mapBy<T, S>(
  arr: T[],
  keyfn: (t: T) => number,
  valfn?: (t: T) => S
): Index<T> | Index<S> {
  if (valfn === undefined) {
    return mapBy(arr, keyfn, identity)
  } else {
    const ret: Index<S> = {}
    for (const t of arr) {
      ret[keyfn(t)] = valfn(t)
    }
    return ret
  }
}

export const pick = <T, K extends keyof T>(arr: T[], key: K): T[K][] =>
  arr.map((t) => t[key])

export const calculateDuration = (meters: number, knots: number): number =>
  (toNM(meters) / knots) * 60

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  return `${hours > 0 ? `${hours} h ` : ''}${Math.floor(minutes % 60)} min`
}

export const add = (n1?: number, n2?: number): number | undefined =>
  n1 !== undefined && n2 !== undefined ? n1 + n2 : undefined

const mergeRouteprops = (r1: RouteProps, r2: RouteProps): RouteProps => ({
  found: r1.found && r2.found,
  length: add(r1.length, r2.length),
  duration: add(r1.duration, r2.duration),
  fuel: add(r1.fuel, r2.fuel),
})

export const mergeRoutes = (routes: RouteProps[]): RouteProps =>
  routes.reduce(mergeRouteprops, {
    found: true,
    length: 0,
    duration: 0,
    fuel: 0,
  })

export const combineSegments = (routes: Route[]): RouteProps[] =>
  splitAt(routes, (r) => r.type === 'destination').map(mergeRoutes)

export const enrichRoutes = (routes: Route[], settings: Settings): Route[] => {
  const { speed, consumption } = settings
  return routes.map((route) => {
    const { length } = route
    const duration = speed && length && calculateDuration(length, speed)
    const fuel = duration && consumption && (duration * consumption) / 60
    return {
      ...route,
      duration,
      fuel,
    }
  })
}

export const getStoredSetting = (
  key: keyof (Settings & MapSettings)
): number | undefined => {
  const value = localStorage.getItem(key)
  return value ? parseFloat(value) : undefined
}

export const storeSetting = (
  key: keyof (Settings & MapSettings),
  value?: number
): void => {
  if (value !== undefined) {
    localStorage.setItem(key, value.toString())
  } else {
    localStorage.removeItem(key)
  }
}

export const useInterval = (
  callback: (ms: number) => void,
  ms: number
): void => {
  const callbackRef = useRef(callback)
  const prevTime = useRef(Date.now())

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    prevTime.current = Date.now()
    const tick = (): void => {
      const now = Date.now()
      callbackRef.current(now - prevTime.current)
      prevTime.current = now
    }
    const id = setInterval(tick, ms)
    return (): void => {
      clearInterval(id)
    }
  }, [ms])
}

export const throttle = <T>(
  fn: (t: T) => void,
  ms: number
): ((t: T) => void) => {
  let throttled = false
  return (t: T): void => {
    if (!throttled) {
      throttled = true
      fn(t)
      setTimeout(() => {
        throttled = false
      }, ms)
    }
  }
}

export const calculateOffset = (
  lngLat: LngLat,
  point: geojson.Position
): geojson.Position => [lngLat.lng - point[0], lngLat.lat - point[1]]

export const applyOffset = (
  lngLat: LngLat,
  offset: geojson.Position
): LngLat => ({
  lng: lngLat.lng - offset[0],
  lat: lngLat.lat - offset[1],
})

export const makeIdGenerator = (prefix: string): (() => string) => {
  let i = 0
  return () => `${prefix}-${i++}`
}

export const sqDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return dx * dx + dy * dy
}
