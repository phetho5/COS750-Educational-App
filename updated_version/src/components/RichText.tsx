/* Shows text where **words like these** are bold. Used for lesson text in src/content/. */
import { Fragment } from 'react'
import { splitBold } from '../content/format'

export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitBold(text).map((part, i) => (part.bold ? <strong key={i}>{part.text}</strong> : <Fragment key={i}>{part.text}</Fragment>))}
    </>
  )
}
