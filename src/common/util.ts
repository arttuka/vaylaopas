import { useEffect, useRef } from 'react'
import { Index, Route, Settings } from '../common/types'

export const partition = <T>(arr: T[], n: number, step: number = n): T[][] => {
  const result = []
  let i = 0
  while (i + n <= arr.length) {
    result.push(arr.slice(i, i + n))
    i += step
  }
  return result
}

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

export const round = (n: number, decimals = 0): number => {
  const m = Math.pow(10, decimals)
  return Math.round(n * m) / m
}

export const toNM = (meters: number): number => round(meters / 1852, 1)

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const numToLetter = (n: number): string => {
  if (n < 26) {
    return letters[n]
  } else {
    return numToLetter(Math.floor(n / 26) - 1) + letters[n % 26]
  }
}

export const removeIndex = <T>(arr: T[], i: number): T[] => [
  ...arr.slice(0, i),
  ...arr.slice(i + 1),
]

const complement = <T>(pred: (t: T) => boolean) => (t: T): boolean => !pred(t)

export const removeWhere = <T>(arr: T[], pred: (t: T) => boolean): T[] => {
  return arr.filter(complement(pred))
}

export const updateIndex = <T>(arr: T[], i: number, t: Partial<T>): T[] => [
  ...arr.slice(0, i),
  { ...arr[i], ...t },
  ...arr.slice(i + 1),
]

export const updateWhere = <T>(
  arr: T[],
  pred: (t: T) => boolean,
  t: Partial<T>
): T[] => {
  const index = arr.findIndex(pred)
  if (index >= 0) {
    return updateIndex(arr, index, t)
  } else {
    return arr
  }
}

export const hasId = (id: string) => (t: { id: string }): boolean => id === t.id

export const hasAnyId = (ids: string[]) => (t: { id: string }): boolean =>
  ids.includes(t.id)

export const insertIndex = <T>(arr: T[], i: number, t: T): T[] => [
  ...arr.slice(0, i),
  t,
  ...arr.slice(i),
]

export const addMany = <T>(set: Set<T>, ...ts: T[]): Set<T> => {
  ts.forEach((t): void => {
    set.add(t)
  })
  return set
}

export const mapBy = <T, S>(
  arr: T[],
  keyfn: (t: T) => number,
  valfn: (t: T) => S
): Index<S> => {
  const ret: Index<S> = {}
  arr.forEach((t): void => {
    ret[keyfn(t)] = valfn(t)
  })
  return ret
}

export const calculateDuration = (meters: number, knots: number): number =>
  Math.floor((toNM(meters) / knots) * 60)

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  return `${hours > 0 ? `${hours} h ` : ''}${Math.floor(minutes % 60)} min`
}

export const add = (n1?: number, n2?: number): number | undefined =>
  n1 !== undefined && n2 !== undefined ? n1 + n2 : undefined

const mergeRoutes = (r1: Route, r2: Route): Route => ({
  route: [...r1.route, ...r2.route],
  startAndEnd: [r1.startAndEnd[0], r2.startAndEnd[1]],
  length: r1.length + r2.length,
  type: r2.type,
  duration: add(r1.duration, r2.duration),
  fuel: add(r1.fuel, r2.fuel),
})

export const combineSegments = (routes: Route[]): Route[] => {
  const result: Route[] = []
  let remainingRoutes = routes
  while (remainingRoutes.length > 0) {
    const rs = takeUntil(remainingRoutes, (r) => r.type === 'destination')
    result.push(rs.reduce(mergeRoutes))
    remainingRoutes = remainingRoutes.slice(rs.length)
  }
  return result
}

export const enrichRoutes = (routes: Route[], settings: Settings): Route[] => {
  const { speed, consumption } = settings
  return routes.map(
    (route): Route => {
      const duration = speed && calculateDuration(route.length, speed)
      const fuel = duration && consumption && (duration * consumption) / 60
      return {
        ...route,
        duration,
        fuel,
      }
    }
  )
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

export const range = (count: number, start = 0): number[] =>
  [...Array(count).keys()].map((i) => i + start)

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
