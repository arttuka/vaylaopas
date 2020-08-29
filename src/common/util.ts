import { useEffect, useRef } from 'react'
import geojson from 'geojson'
import { Index, LngLat, Route, RouteProps, Settings } from './types'

type Pred<T> = (t: T) => boolean

export const takeUntil = <T>(arr: T[], pred: (t: T) => boolean): T[] => {
  const result = []
  let i = 0
  while (i < arr.length) {
    result.push(arr[i])
    if (pred(arr[i])) {
      break
    }
    ++i
  }
  return result
}

export const range = (count: number): number[] => [...Array(count).keys()]

export const round = (n: number, decimals = 0): number => {
  const m = Math.pow(10, decimals)
  return Math.round(n * m) / m
}

export const toNM = (meters: number): number => round(meters / 1852, 1)

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const numToLetter = (n: number): string =>
  n < 26 ? letters[n] : numToLetter(Math.floor(n / 26) - 1) + letters[n % 26]

const complement = <T>(pred: Pred<T>) => (t: T): boolean => !pred(t)

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

export const hasId = <T extends { id: string }>(id: string) => (
  t: T
): boolean => id === t.id

export const hasAnyId = <T extends { id: string }>(ids: string[]) => (
  t: T
): boolean => ids.includes(t.id)

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
    return mapBy(arr, keyfn, (t) => t)
  } else {
    const ret: Index<S> = {}
    for (const t of arr) {
      ret[keyfn(t)] = valfn(t)
    }
    return ret
  }
}

export const pick = <T, K extends keyof T>(arr: T[], key: K): Array<T[K]> =>
  arr.map((t) => t[key])

export const calculateDuration = (meters: number, knots: number): number =>
  Math.floor((toNM(meters) / knots) * 60)

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  return `${hours > 0 ? `${hours} h ` : ''}${Math.floor(minutes % 60)} min`
}

export const add = (n1?: number, n2?: number): number | undefined =>
  n1 !== undefined && n2 !== undefined ? n1 + n2 : undefined

export const mergeRoutes = (r1: RouteProps, r2: RouteProps): RouteProps => ({
  found: r1.found && r2.found,
  length: add(r1.length, r2.length),
  duration: add(r1.duration, r2.duration),
  fuel: add(r1.fuel, r2.fuel),
})

export const combineSegments = (routes: Route[]): RouteProps[] => {
  const result: RouteProps[] = []
  let remainingRoutes = routes
  while (remainingRoutes.length > 0) {
    const rs: RouteProps[] = takeUntil(
      remainingRoutes,
      (r) => r.type === 'destination'
    )
    result.push(rs.reduce(mergeRoutes))
    remainingRoutes = remainingRoutes.slice(rs.length)
  }
  return result
}

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

export const getStoredSetting = (key: keyof Settings): number | undefined => {
  const value = localStorage.getItem(key)
  return value ? parseFloat(value) : undefined
}

export const storeSetting = (key: keyof Settings, value?: number): void => {
  if (value !== undefined) {
    localStorage.setItem(key, value.toString())
  } else {
    localStorage.removeItem(key)
  }
}

export const useInterval = (callback: () => void, ms: number): void => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const tick = (): void => callbackRef.current()
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
