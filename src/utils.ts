/**
 * Returns new array with all adjacent string elements merged.
 */
export function mergeAdjacentStrings<T>(array: T[]): T[] {
  const newArray = [...array]
  let i = 0
  while (i < newArray.length - 1) {
    const item1 = newArray[i]
    if (typeof item1 === 'string') {
      const item2 = newArray[i + 1]
      if (typeof item2 === 'string') {
        // Merge two strings.
        newArray[i] = (item1 + item2) as any as T
        newArray.splice(i + 1, 1)
      } else {
        // Safely skip the next index.
        i += 2
      }
    } else {
      i++
    }
  }
  return newArray
}
