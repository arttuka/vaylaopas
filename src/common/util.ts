export const partition = <T>(arr: T[], n: number, step: number = n): T[][] => {
  const result = []
  let i = 0
  while (i + n <= arr.length) {
    result.push(arr.slice(i, i + n))
    i += step
  }
  return result
}

export const round = (n: number, decimals: number = 0): number => {
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

export const replaceIndex = <T>(arr: T[], i: number, t: T): T[] => [
  ...arr.slice(0, i),
  t,
  ...arr.slice(i + 1),
]

export const insertIndex = <T>(arr: T[], i: number, t: T): T[] => [
  ...arr.slice(0, i),
  t,
  ...arr.slice(i),
]

export const addMany = <T>(set: Set<T>, ...ts: T[]): Set<T> => {
  ts.forEach(
    (t): void => {
      set.add(t)
    }
  )
  return set
}
