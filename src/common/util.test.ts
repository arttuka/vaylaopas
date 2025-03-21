import {
  splitAt,
  range,
  numToLetter,
  removeWhere,
  updateIndex,
  insertIndex,
  updateWhere,
  hasProperty,
  hasId,
  addMany,
  mapBy,
  calculateDuration,
  formatDuration,
  debounce,
  throttle,
  combineSegments,
} from './util'
import { Route } from './types'

const timeout = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

test('splitAt', (): void => {
  const pred = (i: number, j: number): boolean => i > j
  expect(splitAt([], pred)).toEqual([])
  expect(splitAt([0], pred)).toEqual([[0]])
  expect(splitAt([0, 2, 1, 3, 5, 4], pred)).toEqual([[0, 2], [1, 3, 5], [4]])
  expect(splitAt([5, 4, 3, 2, 1], pred)).toEqual([[5], [4], [3], [2], [1]])
})

test('range', (): void => {
  expect(range(0)).toEqual([])
  expect(range(5)).toEqual([0, 1, 2, 3, 4])
  expect(range(5, 3)).toEqual([3, 4, 5, 6, 7])
  expect(range(5, 3, 2)).toEqual([3, 5, 7, 9, 11])
})

test('numToLetter', (): void => {
  expect(numToLetter(3)).toEqual('D')
  expect(numToLetter(26 + 2)).toEqual('AC')
  expect(numToLetter(26 * 26 * 5 + 26 * 14 + 20)).toEqual('ENU')
})

test('removeWhere', (): void => {
  const arr = [0, 1, 2, 3]
  expect(removeWhere(arr, (i) => i === 2)).toEqual([0, 1, 3])
  expect(removeWhere(arr, (i) => i === 4)).toEqual([0, 1, 2, 3])
})

type TestObj = { id: string; n: number }

test('hasProperty', (): void => {
  const obj: TestObj = { id: '0', n: 1 }
  expect(hasProperty('id', '0')(obj)).toBe(true)
  expect(hasProperty('id', '1')(obj)).toBe(false)
  expect(hasProperty('n', 0)(obj)).toBe(false)
  expect(hasProperty('n', 1)(obj)).toBe(true)
})

test('updateIndex', (): void => {
  const arr: TestObj[] = [
    { id: '0', n: 0 },
    { id: '1', n: 1 },
  ]
  expect(updateIndex(arr, 0, { n: 9 })).toEqual([
    { id: '0', n: 9 },
    { id: '1', n: 1 },
  ])
})

test('updateWhere', (): void => {
  const arr: TestObj[] = [
    { id: '0', n: 0 },
    { id: '1', n: 1 },
  ]
  expect(updateWhere(arr, hasId('0'), { n: 9 })).toEqual([
    { id: '0', n: 9 },
    { id: '1', n: 1 },
  ])
  expect(updateWhere(arr, hasId('9'), { n: 9 })).toEqual([
    { id: '0', n: 0 },
    { id: '1', n: 1 },
  ])
})

test('insertIndex', (): void => {
  const arr = [0, 1, 2]
  expect(insertIndex(arr, 0, 9)).toEqual([9, 0, 1, 2])
  expect(insertIndex(arr, 1, 9)).toEqual([0, 9, 1, 2])
  expect(insertIndex(arr, 2, 9)).toEqual([0, 1, 9, 2])
  expect(insertIndex(arr, 3, 9)).toEqual([0, 1, 2, 9])
})

test('addMany', (): void => {
  const set = new Set([1, 2, 3])
  expect(addMany(set, 3, 4, 5)).toEqual(new Set([1, 2, 3, 4, 5]))
})

test('mapBy', (): void => {
  const arr = ['1', '2', '3']
  const keyfn = (s: string) => parseInt(s, 10) - 1
  expect(mapBy(arr, keyfn, (s) => `x${s}`)).toEqual({
    0: 'x1',
    1: 'x2',
    2: 'x3',
  })
  expect(mapBy(arr, keyfn)).toEqual({ 0: '1', 1: '2', 2: '3' })
})

test('calculateDuration', (): void => {
  expect(calculateDuration(1852 * 5, 5)).toEqual(60)
  expect(calculateDuration(1852 * 1.5, 4.5)).toEqual(20)
})

test('formatDuration', (): void => {
  expect(formatDuration(59)).toEqual('59 min')
  expect(formatDuration(60)).toEqual('1 h 0 min')
  expect(formatDuration(61)).toEqual('1 h 1 min')
})

test('debounce', async (): Promise<void> => {
  const fn = jest.fn()
  const debouncedFn = debounce(fn, 50)
  debouncedFn(1)
  debouncedFn(2)
  debouncedFn(3)
  await timeout(50)
  debouncedFn(4)
  debouncedFn(5)
  debouncedFn(6)
  await timeout(50)
  expect(fn).toHaveBeenCalledTimes(2)
  expect(fn.mock.calls).toEqual([[3], [6]])
})

test('throttle', async (): Promise<void> => {
  const fn = jest.fn()
  const throttledFn = throttle(fn, 50)
  throttledFn(1)
  throttledFn(2)
  throttledFn(3)
  await timeout(50)
  throttledFn(4)
  throttledFn(5)
  throttledFn(6)
  expect(fn).toHaveBeenCalledTimes(2)
  expect(fn.mock.calls).toEqual([[1], [4]])
})

test('combineSegments', (): void => {
  const routes = [
    { type: 'destination', found: true, length: 3, duration: 1, fuel: 1 },
    { type: 'via', found: true, length: 4, duration: 2, fuel: 2 },
    { type: 'destination', found: true, length: 5, duration: 3, fuel: 3 },
    { type: 'destination', found: true, length: 6, duration: 4, fuel: 4 },
  ] as Route[]
  const segments = combineSegments(routes)
  expect(segments).toEqual([
    { found: true, length: 7, duration: 3, fuel: 3 },
    { found: true, length: 5, duration: 3, fuel: 3 },
    { found: true, length: 6, duration: 4, fuel: 4 },
  ])
})
