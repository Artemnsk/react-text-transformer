import { mergeAdjacentStrings } from './utils'

describe('Text Transformer utils', () => {
  describe('mergeAdjacentStrings', () => {
    const cases: Array<[string, unknown[], unknown[]]> = [
      ['test #1', ['a', 3, 'b', 'c', 'd'], ['a', 3, 'bcd']],
      ['test #2', ['a', 'b', 'c', 'd'], ['abcd']],
      ['test #3', [3, 4, null, 5], [3, 4, null, 5]],
    ]

    test.each(cases)('%s', (name, input, output) => {
      expect(mergeAdjacentStrings(input)).toEqual(output)
    })
  })
})
