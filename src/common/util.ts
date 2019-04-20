export const partition = <T>(arr: T[], n: number, step: number = n): T[][] => {
  const result = []
  let i = 0
  while (i + n <= arr.length) {
    result.push(arr.slice(i, i + n))
    i += step
  }
  return result
}
