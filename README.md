# react-text-transformer

This package provides **ReactTextTransformer** component which parses text into
react components as per provided patterns.

It is "platform agnostic" and applicable to both React web and React Native projects
as it works with "text-like" children components: `string`s or React elements that have
`string` or (again) "text-like" `children` property.

# Examples and how it works

In this example user mentions (`@username`) will be found by regular expression
and replaced by red-colored text with leading "@" removed:
> Hello from artemnsk!You can reach me on `www.mydomain.com/artemnsk`.

```tsx
import * as React from 'react'
import {
  TextLike,
  TextMatcherPattern,
  ReactTextTransformer,
} from 'react-text-transformer'
import { Text } from 'react-native'

const mentionPattern: TextMatcherPattern = {
  pattern: /\B(@\w+)\b/g,
  replacer: (match: string) => match.replace('@', ''),
  Component({ children }: { children: string }) {
    // In case of web it can be replaced with e.g.
    //  <div style={{ color: 'red' }}>{children}</div>.
    return <Text style={{ color: 'red' }}>{children}</Text>
  },
}

function MyTextComponent() {
  return (
    <ReactTextTransformer patterns={[mentionPattern]}>
      <Text>
        Hello from @artemnsk!
        <Text>You can reach me on www.mydomain.com/@artemnsk.</Text>
      </Text>
    </ReactTextTransformer>
  )
}
```

How it works in few words.

**ReactTextTransformer** walks through the whole `children` tree (with potentially nested **Text** components)
and processes all `string` "leaves".
Then `pattern` regexp `split()`s them - that's why it is important to provide regexp capturing parenthesis in it.
Each captured string will be passed to `replacer` method which can convert them into
something else (in our case we remove the leading '@' symbol). Then the `replacer` output
goes component specified in `Component` property. And finally, React element
produced by the `Component` will be put in place of the originally matched string.

Returning to examples, it is also possible to use multiple patterns.
In the next example we will transform `www.mydomain.com/*` URLs (with required path).
Notice that `urlPattern` is the first pattern to apply, otherwise username will be processed
first and wrapped with `<Text>...</Text>` as per `mentionPattern` specification.

```tsx
const urlPattern: TextMatcherPattern = {
  pattern: /\b(www\.mydomain.com\/.+)\b/g,
  // Omitted replacer means that matched string will be sent to Component as is.
  Component({ children }: { children: string }) {
    // Here we can use component that opens this URL on tap/click (e.g. <a> for web).
    return <Text style={{ color: 'blue' }}>{children}</Text>
  },
}

function MyTextComponent() {
  return (
    <ReactTextTransformer patterns={[urlPattern, mentionPattern]}>
      <Text>
        Hello from @artemnsk!
        <Text>You can reach me on www.mydomain.com/@artemnsk.</Text>
      </Text>
    </ReactTextTransformer>
  )
}
```

Notice that URL path was not touched by `mentionPattern`:
> Hello from artemnsk!You can reach me on `www.mydomain.com/@artemnsk`.

It didn't happen because `mentionPattern` didn't dive into `urlPattern`'s output
to change `@artemnsk` into `artemnsk`. By default, any match processed by pattern marks
the output as "visited" so that other patterns are not allowed to go there.
If we want to let `mentionPattern` visit `urlPattern`'s output tree,
we should add `allowOtherPatterns: true` parameter to `urlPattern`:

```tsx
const urlPattern: TextMatcherPattern = {
  pattern: /\b(www\.mydomain.com\/.+)\b/g,
  allowOtherPatterns: true,
  Component({ children }: { children: string }) {
    return <Text style={{ color: 'blue' }}>{children}</Text>
  },
}
```

Not output will be:
> Hello from artemnsk!You can reach me on `www.mydomain.com/artemnsk`.

This time `artemnsk` URL path has no leading `@` character
(and red-colored because of extra **Text** wrapper).
