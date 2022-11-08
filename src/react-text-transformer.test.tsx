import * as React from 'react'
import { Fragment } from 'react'
import { create } from 'react-test-renderer'
import { ReactTextTransformer } from './react-text-transformer'

describe('Text Transformer', () => {
  test('Generally works with cascading elements', async () => {
    const pattern1 = {
      pattern: /(toBeReplaced_1)/,
      replacer: () => 'wasReplaced_1',
      Component: Fragment,
    }
    const pattern2 = {
      pattern: /(toBeReplaced_2)/,
      replacer: () => 'wasReplaced_2',
      Component: Fragment,
    }

    const renderer = create(
      <ReactTextTransformer patterns={[pattern1, pattern2]}>
        toBeReplaced_1 untouched1
        <Fragment key='1'>
          untouched2
          <Fragment key='2'>toBeReplaced_2</Fragment>
          <Fragment key='3'>toBeReplaced_1</Fragment>
          untouched3
        </Fragment>
      </ReactTextTransformer>,
    )

    expect(renderer.toJSON()).toMatchObject([
      'wasReplaced_1',
      ' untouched1',
      'untouched2',
      'wasReplaced_2',
      'wasReplaced_1',
      'untouched3',
    ])
  })

  test('Does not change already processed text', async () => {
    const pattern1 = {
      pattern: /(toBeReplaced_1)/,
      // This matches pattern2 but should not be replaced.
      replacer: () => 'NOT toBeReplaced_2',
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }
    const pattern2 = {
      pattern: /(toBeReplaced_2)/,
      replacer: () => 'wasReplaced_2',
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }

    const renderer = create(
      <ReactTextTransformer patterns={[pattern1, pattern2]}>
        toBeReplaced_1 untouchedText toBeReplaced_2
      </ReactTextTransformer>,
    )

    expect(renderer.toJSON()).toMatchObject([
      'NOT toBeReplaced_2',
      ' untouchedText ',
      'wasReplaced_2',
    ])
  })

  test('Change already processed text if allowed', async () => {
    const pattern1 = {
      pattern: /(toBeReplaced_1)/,
      replacer: () => 'ALLOWED toBeReplaced_2',
      allowOtherPatterns: true,
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }
    const pattern2 = {
      pattern: /(toBeReplaced_2)/,
      replacer: () => 'wasReplaced_2',
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }

    const renderer = create(
      <ReactTextTransformer patterns={[pattern1, pattern2]}>
        toBeReplaced_1 untouchedText toBeReplaced_2
      </ReactTextTransformer>,
    )

    expect(renderer.toJSON()).toMatchObject([
      'ALLOWED ',
      'wasReplaced_2',
      ' untouchedText ',
      'wasReplaced_2',
    ])
  })

  test('Adjacent strings are merged fine everywhere applicable', async () => {
    const pattern1 = {
      pattern: /(toBeReplaced_1)/,
      replacer: () => 'toBeRepl',
      allowOtherPatterns: true,
    }
    const pattern2 = {
      pattern: /(\s*toBeReplaced_2)/,
      replacer: () => 'aced_3',
      allowOtherPatterns: true,
    }
    const pattern3 = {
      pattern: /(toBeReplaced_3)/,
      replacer: () => 'wasReplaced_3',
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }

    const renderer = create(
      <ReactTextTransformer patterns={[pattern1, pattern2, pattern3]}>
        toBeReplaced_1 toBeReplaced_2 untouched
      </ReactTextTransformer>,
    )

    expect(renderer.toJSON()).toMatchObject(['wasReplaced_3', ' untouched'])
  })

  test('Properly sets elements key', async () => {
    const originalError = global.console.error
    const spy = jest.spyOn(global.console, 'error')
    const consoleErrorSpy = jest.fn()
    spy.mockImplementation((...args) => {
      if (args[0].indexOf('Encountered two children with the same key') !== -1) {
        consoleErrorSpy('Looks like performs a state update on an unmounted component.')
      }
      originalError(...args)
    })

    const pattern1 = {
      pattern: /(toBeReplaced_1)/,
      replacer: () => 'wasReplaced_1',
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }
    const pattern2 = {
      pattern: /(toBeReplaced_2)/,
      replacer: () => 'wasReplaced_2',
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }

    const renderer = create(
      <ReactTextTransformer patterns={[pattern1, pattern2]}>
        toBeReplaced_1 toBeReplaced_2
      </ReactTextTransformer>,
    )

    expect(renderer.toJSON()).toMatchObject(['wasReplaced_1', ' ', 'wasReplaced_2'])
    expect(consoleErrorSpy).not.toBeCalled()
  })

  test('Properly limits', async () => {
    const pattern = {
      pattern: /(toBeReplaced_1)/,
      replacer: () => '0123456789 invisible',
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }
    const renderMoreButton = () => <Fragment>more</Fragment>

    const renderer = create(
      <ReactTextTransformer patterns={[pattern]} limit={20} renderMoreButton={renderMoreButton}>
        012
        <Fragment key='1'>
          3456789
          <Fragment key='2'>toBeReplaced_1</Fragment>
        </Fragment>
      </ReactTextTransformer>,
    )

    expect(renderer.toJSON()).toMatchObject(['012', '3456789', '0123456...', 'more'])
  })

  test('Null values should be suppressed properly', async () => {
    const pattern = {
      pattern: /(toBeReplaced)/,
      replacer: () => '3456789',
      Component: ({ children }: { children: string }) => <Fragment>{children}</Fragment>,
    }

    const renderer = create(
      <ReactTextTransformer patterns={[pattern]} limit={13}>
        012
        <Fragment key='1'>{null}</Fragment>
        {null}
        <Fragment key='2'>{[null, null, 'toBeReplaced']}</Fragment>
        {'not visible'}
      </ReactTextTransformer>,
    )

    expect(renderer.toJSON()).toMatchObject(['012', '3456789', '...'])
  })
})
