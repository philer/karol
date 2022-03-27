import {Exception} from "../exception"
import type {LanguageSpecification, TokenType} from "./specification"
// eslint-disable-next-line no-duplicate-imports
import {symbolToTokenType, TokenType as tt} from "./specification"

export interface Token {
  type: TokenType
  isBuiltin?: boolean
  value: string
  line: number
  column: number
}

/**
 * Iterable lexer
 */
export function* tokenize(
  text: string,
  {keywords, builtins, normalizeKeyword, normalizeIdentifier}: LanguageSpecification,
  yieldWhitespace = false,
  yieldComments = false,
): Generator<Token, Token> {
  const length = text.length

  const reSpaces = /\s+/y
  const reComment = /\{.*?\}/sy
  const reSinglelineComment = /\/\/.*/y
  const reInteger = /\d+/y

  // https://stackoverflow.com/questions/30225552/regex-for-diacritics/44586972
  // https://stackoverflow.com/questions/30798522/regular-expression-not-working-for-at-least-one-european-character
  const reWord = /[A-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ][A-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ0-9]*/y

  let position = 0
  let line = 1
  let column = 1

  let value = ""
  let match: RegExpExecArray | null
  let lines: string[]

  while (position < length) {

    // word (identifier / keyword)
    reWord.lastIndex = position
    if (match = reWord.exec(text)) {
      value = match[0]
      yield {
        type: keywords[normalizeKeyword(value)] || tt.IDENTIFIER,
        isBuiltin: builtins.hasOwnProperty(normalizeIdentifier(value)),
        value, line, column,
      }
      column += value.length
      position += value.length
      continue
    }

    // whitespace
    reSpaces.lastIndex = position
    if (match = reSpaces.exec(text)) {
      value = match[0]
      if (yieldWhitespace) {
        yield {type: tt.WHITESPACE, value, line, column}
      }
      lines = value.split("\n")
      if (lines.length > 1) {
        line += lines.length - 1
        column = lines[lines.length - 1].length + 1
      } else {
        column += value.length
      }
      position += value.length
      continue
    }

    // multi-line comment
    reComment.lastIndex = position
    if (match = reComment.exec(text)) {
      value = match[0]
      if (yieldComments) {
        yield {type: tt.COMMENT, value, line, column}
      }
      lines = value.split("\n")
      if (lines.length > 1) {
        line += lines.length - 1
        column = lines[lines.length - 1].length + 1
      } else {
        column += value.length
      }
      position += value.length
      continue
    }

    // single-line comment
    reSinglelineComment.lastIndex = position
    if (match = reSinglelineComment.exec(text)) {
      value = match[0]
      if (yieldComments) {
        yield {type: tt.COMMENT, value, line, column}
      }
      column += value.length
      position += value.length
      continue
    }

    // special character (must be checked after // comments)
    value = text[position]
    if (symbolToTokenType.hasOwnProperty(value)) {
      yield {type: symbolToTokenType[value], value, line, column}
      ++column
      ++position
      continue
    }

    // integer
    reInteger.lastIndex = position
    if (match = reInteger.exec(text)) {
      value = match[0]
      yield {type: tt.INTEGER, value, line, column}
      column += value.length
      position += value.length
      continue
    }

    // found nothing useful
    throw new Exception("error.parser.token_read", {
      line,
      column,
      remainingText: text.slice(position),
    })
  }
  return {type: tt.EOF, value: "", line, column}
}
