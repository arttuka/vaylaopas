import { partition } from './util'

const arr = [0, 1, 2, 3, 4, 5, 6, 7]

test('partition', (): void => {
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
