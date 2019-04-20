import { partition, numToLetter, removeIndex } from './util'

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
