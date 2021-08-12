import { isArray } from 'lodash'
import * as React from 'react'
import { Fragment, ReactElement, useEffect, useState } from 'react'
import { applyLimit } from './apply-limit'
import { transformByPattern } from './transform-by-pattern'

export type SingleTextLike = string | ReactElement<{ children: TextLike }> | null
export type TextLike = SingleTextLike | SingleTextLike[]

export const TextLike = {
  isString(element: TextLike): element is string {
    return typeof element === 'string'
  },
  isSingleElement(element: TextLike): element is ReactElement<{ children: TextLike }> {
    return (
      !!element &&
      typeof element === 'object' &&
      Object.prototype.hasOwnProperty.call(element, 'props')
    )
  },
  isArray(element: TextLike): element is SingleTextLike[] {
    return isArray(element)
  },
}

export interface TextMatcherPattern {
  pattern: RegExp
  replacer?: (text: string) => TextLike
  allowOtherPatterns?: boolean
  // If not set raw string will be used.
  // It still will be wrapped with Fragment if allowOtherPatterns = false.
  Component?: React.ComponentType<{ children: TextLike; originalMatch: string }>
}

interface Props {
  children?: TextLike
  patterns: TextMatcherPattern[]
  limit?: number
  collapsed?: boolean
  renderMoreButton?: (onPress: () => void) => ReactElement
  renderLessButton?: (onPress: () => void) => ReactElement
}

export const TextTransformer = React.memo((props: Props) => {
  const { children = '', patterns, limit, collapsed, renderMoreButton, renderLessButton } = props

  const [show, setShow] = useState(false)

  useEffect(() => {
    if (collapsed !== undefined) {
      setShow(!collapsed)
    }
  }, [collapsed])

  const transformedByPatterns = patterns.reduce(transformByPattern, children)
  let displayButton = false
  if (limit) {
    const limited = applyLimit(transformedByPatterns, limit)
    displayButton = limited.symbolsLeft <= 0
    if (displayButton && !show) {
      return (
        <Fragment>
          {limited.result}
          {!!renderMoreButton && renderMoreButton(() => setShow(true))}
        </Fragment>
      )
    }
  }
  return (
    <Fragment>
      {transformedByPatterns}
      {displayButton && !!renderLessButton && renderLessButton(() => setShow(false))}
    </Fragment>
  )
})
