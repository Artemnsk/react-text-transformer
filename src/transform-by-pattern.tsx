import * as React from 'react'
import { Fragment, ReactElement } from 'react'
import { SingleTextLike, TextLike, TextMatcherPattern } from './react-text-transformer'
import { mergeAdjacentStrings } from './utils'

function wasElementProcessedAndBlocked(element: ReactElement<{ children: TextLike }>): boolean {
  return `${element.key}`.indexOf('processed_blocked') === 0
}

/**
 * Search for @pattern matches in @text string. If found splits it on parts.
 * Each part that matches pattern passed to corresponding renderText().
 */
function transformStringByPattern(
  text = '',
  pattern: TextMatcherPattern,
  patternNum: number,
): TextLike {
  const split = text.split(pattern.pattern)
  if (split.length === 1) {
    return text
  } else {
    // Find matches.
    const result = split
      .map((s, index) => {
        if (pattern.pattern.test(s)) {
          if (pattern.allowOtherPatterns && !pattern.Component) {
            // Output with a string. Different adjacent string chunks will be merged later.
            return pattern.replacer?.(s) || s
          } else {
            const Component = pattern.Component || Fragment
            const key = [
              'processed',
              ...(pattern.allowOtherPatterns ? [] : ['blocked']),
              patternNum,
              index,
            ].join('_')
            return React.createElement(Component, {
              children: pattern.replacer ? pattern.replacer(s) : s,
              originalMatch: s,
              key,
            })
          }
        }
        return s
      })
      .filter(i => !!i)
    return mergeAdjacentStrings(result)
  }
}

function transformSingleElementByPattern(
  element: ReactElement<{ children: TextLike }>,
  pattern: TextMatcherPattern,
  patternNum: number,
): TextLike {
  // Do not dive deeper if this element was already processed & blocked by renderText function.
  if (wasElementProcessedAndBlocked(element)) {
    return element
  }
  const children = transformByPattern(element.props.children, pattern, patternNum)
  return React.cloneElement(element, undefined, children)
}

function transformArrayByPattern(
  element: SingleTextLike[],
  pattern: TextMatcherPattern,
  patternNum: number,
): TextLike {
  const children = element.reduce<SingleTextLike[]>((acc, item) => {
    // Do not dive deeper if this element was already processed & blocked by renderText function.
    if (TextLike.isSingleElement(item) && wasElementProcessedAndBlocked(item)) {
      return [...acc, item]
    }
    const result = transformByPattern(item, pattern, patternNum)
    return [...acc, ...(TextLike.isArray(result) ? result : [result])]
  }, [])
  return React.createElement(Fragment, undefined, children) as TextLike
}

/**
 * Recursively search for string leafs of TextLike tree.
 * Then passes the ball to string transformer function.
 * Doesn't attempt string transformation if already processed & blocked by other pattern.
 */
export function transformByPattern(
  element: TextLike,
  pattern: TextMatcherPattern,
  patternNum: number,
): TextLike {
  if (TextLike.isString(element)) {
    return transformStringByPattern(element, pattern, patternNum)
  } else if (TextLike.isSingleElement(element)) {
    return transformSingleElementByPattern(element, pattern, patternNum)
  } else if (TextLike.isArray(element)) {
    return transformArrayByPattern(element, pattern, patternNum)
  }
  return element
}
