import {
  partition,
  numToLetter,
  removeIndex,
  replaceIndex,
  insertIndex,
  addMany,
  mapBy,
} from './util'
import { Index } from '../common/types'

test('partition', (): void => {
  const arr = [0, 1, 2, 3, 4, 5, 6, 7]
  expect(partition(arr, 2)).toEqual([[0, 1], [2, 3], [4, 5], [6, 7]])
  expect(partition(arr, 3)).toEqual([[0, 1, 2], [3, 4, 5]])
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

test('numToLetter', (): void => {
  expect(numToLetter(3)).toEqual('D')
  expect(numToLetter(26 + 2)).toEqual('AC')
  expect(numToLetter(26 * 26 * 5 + 26 * 14 + 20)).toEqual('ENU')
})

test('removeIndex', (): void => {
  const arr = [0, 1, 2, 3]
  expect(removeIndex(arr, 0)).toEqual([1, 2, 3])
  expect(removeIndex(arr, 1)).toEqual([0, 2, 3])
  expect(removeIndex(arr, 2)).toEqual([0, 1, 3])
  expect(removeIndex(arr, 3)).toEqual([0, 1, 2])
})

test('replaceIndex', (): void => {
  const arr = [0, 1, 2, 3]
  expect(replaceIndex(arr, 0, 9)).toEqual([9, 1, 2, 3])
  expect(replaceIndex(arr, 1, 9)).toEqual([0, 9, 2, 3])
  expect(replaceIndex(arr, 2, 9)).toEqual([0, 1, 9, 3])
  expect(replaceIndex(arr, 3, 9)).toEqual([0, 1, 2, 9])
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
