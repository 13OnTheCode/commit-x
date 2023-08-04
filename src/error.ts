import { sep } from 'node:path'
import { cwd } from 'node:process'

import { dim, red } from 'colorette'

export function parseStack(stack: string) {
  const _cwd = cwd() + sep

  return stack.split('\n').splice(1).map((l) => l.trim().replace(/file:\/\/\/?/, '').replace(_cwd, ''))
}

export function prettyError(error: Error) {
  const { message, name, stack } = error
  let result = red(message ? `${name}: ${message}` : name)

  if (stack) {
    const _stack = parseStack(stack)

    for (const i of _stack) {
      result += '\n  ' + dim(i)
    }
  }

  return result
}
