import * as React from 'react'
import { Fragment, ReactElement } from 'react'
import { SingleTextLike, TextLike } from './react-text-transformer'

const ellipsis = '...'
function applyStringLimit(text: string, limit: number): { symbolsLeft: number; result: string } {
  const symbolsLeft = limit - text.length
  return {
    result:
      symbolsLeft <= 0 ? `${text.slice(0, Math.max(0, limit - ellipsis.length))}${ellipsis}` : text,
    symbolsLeft,
  }
}

function applySingleElementLimit(
  element: ReactElement<{ children: TextLike }>,
  limit: number,
): { symbolsLeft: number; result: TextLike } {
  const result = applyLimit(element.props.children, limit)
  return {
    result: React.cloneElement(element, undefined, result?.result),
    symbolsLeft: result?.symbolsLeft,
  }
}

function applyArrayLimit(
  element: SingleTextLike[],
  limit: number,
): { symbolsLeft: number; result: TextLike } {
  const childrenResult = element.reduce<{ result: TextLike[]; symbolsLeft: number }>(
    (acc, i) => {
      if (acc.symbolsLeft > 0) {
        const result = applyLimit(i, acc.symbolsLeft)
        return {
          result: [...acc.result, result?.result],
          symbolsLeft: result?.symbolsLeft,
        }
      }
      return acc
    },
    { result: [], symbolsLeft: limit },
  )
  return {
    result: React.createElement(Fragment, undefined, childrenResult.result) as TextLike,
    symbolsLeft: childrenResult.symbolsLeft,
  }
}

export function applyLimit(
  element: TextLike,
  limit: number,
): { symbolsLeft: number; result: TextLike } {
  if (TextLike.isString(element)) {
    return applyStringLimit(element, limit)
  } else if (TextLike.isSingleElement(element)) {
    return applySingleElementLimit(element, limit)
  } else if (TextLike.isArray(element)) {
    return applyArrayLimit(element, limit)
  }
  // Fall back to null case.
  return { symbolsLeft: limit, result: '' }
}
