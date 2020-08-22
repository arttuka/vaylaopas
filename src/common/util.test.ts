import {
  partition,
  takeUntil,
  numToLetter,
  removeWhere,
  updateIndex,
  insertIndex,
  updateWhere,
  hasId,
  addMany,
  mapBy,
  calculateDuration,
  formatDuration,
  range,
  throttle,
  calculateOffset,
  applyOffset,
} from './util'
import { Index } from '../common/types'

const timeout = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

test('partition', (): void => {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7]
  expect(partition(arr, 2)).toEqual([
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ])
  expect(partition(arr, 3)).toEqual([
    [0, 1, 2],
    [3, 4, 5],
  ])
  expect(partition(arr, 2, 1)).toEqual([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
  ])
})

test('takeUntil', (): void => {
  const pred = (i: number): boolean => i === 4
  expect(takeUntil([0, 1, 2, 3, 4, 5, 6, 7], pred)).toEqual([0, 1, 2, 3, 4])
  expect(takeUntil([5, 6, 7, 8, 9], pred)).toEqual([5, 6, 7, 8, 9])
  expect(takeUntil([], pred)).toEqual([])
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

interface TestObj {
  id: string
  n: number
}

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
  const expected: Index<string> = {
    0: 'x1',
    1: 'x2',
    2: 'x3',
  }
  const result = mapBy(
    arr,
    (s): number => parseInt(s, 10) - 1,
    (s): string => `x${s}`
  )
  expect(result).toEqual(expected)
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

test('range', (): void => {
  expect(range(0)).toEqual([])
  expect(range(3)).toEqual([0, 1, 2])
  expect(range(3, 10)).toEqual([10, 11, 12])
})

test('throttle', async (done): Promise<void> => {
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
  done()
})

test('positionOffset', (): void => {
  const offset = calculateOffset({ lng: 50, lat: 40 }, [49, 42])
  expect(offset).toEqual([1, -2])
  expect(applyOffset({ lng: 60, lat: 50 }, offset)).toEqual({
    lng: 59,
    lat: 52,
  })
})
