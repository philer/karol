import {Exception} from "../localization"

// Token types
export type IDENTIFIER = "IDENTIFIER"
export const IDENTIFIER: IDENTIFIER = "IDENTIFIER"
export type INTEGER = "INTEGER"
export const INTEGER: INTEGER = "INTEGER"
export type NOT = "NOT"
export const NOT: NOT = "NOT"
export type IF = "IF"
export const IF: IF = "IF"
export type THEN = "THEN"
export const THEN: THEN = "THEN"
export type ELSE = "ELSE"
export const ELSE: ELSE = "ELSE"
export type WHILE = "WHILE"
export const WHILE: WHILE = "WHILE"
export type DO = "DO"
export const DO: DO = "DO"
export type REPEAT = "REPEAT"
export const REPEAT: REPEAT = "REPEAT"
export type TIMES = "TIMES"
export const TIMES: TIMES = "TIMES"
export type PROGRAM = "PROGRAM"
export const PROGRAM: PROGRAM = "PROGRAM"
export type ROUTINE = "ROUTINE"
export const ROUTINE: ROUTINE = "ROUTINE"
export type LPAREN = "LPAREN"
export const LPAREN: LPAREN = "LPAREN"
export type RPAREN = "RPAREN"
export const RPAREN: RPAREN = "RPAREN"
export type LBRACKET = "LBRACKET"
export const LBRACKET: LBRACKET = "LBRACKET"
export type RBRACKET = "RBRACKET"
export const RBRACKET: RBRACKET = "RBRACKET"
// export type LBRACE = "LBRACE"
// export const LBRACE: LBRACE = "LBRACE"  // comments
// export type RBRACE = "RBRACE"
// export const RBRACE: RBRACE = "RBRACE"  // comments
export type LESS = "LESS"
export const LESS: LESS = "LESS"
export type GREATER = "GREATER"
export const GREATER: GREATER = "GREATER"
export type EQUALS = "EQUALS"
export const EQUALS: EQUALS = "EQUALS"
export type ASTERISC = "ASTERISC"
export const ASTERISC: ASTERISC = "ASTERISC"
export type SLASH = "SLASH"
export const SLASH: SLASH = "SLASH"
export type HYPHENMINUS = "HYPHENMINUS"
export const HYPHENMINUS: HYPHENMINUS = "HYPHENMINUS"
export type PLUS = "PLUS"
export const PLUS: PLUS = "PLUS"
export type DOT = "DOT"
export const DOT: DOT = "DOT"
export type COMMA = "COMMA"
export const COMMA: COMMA = "COMMA"
export type COLON = "COLON"
export const COLON: COLON = "COLON"
export type SEMI = "SEMI"
export const SEMI: SEMI = "SEMI"
export type SINGLEQUOTE = "SINGLEQUOTE"
export const SINGLEQUOTE: SINGLEQUOTE = "SINGLEQUOTE"
export type DOUBLEQUOTE = "DOUBLEQUOTE"
export const DOUBLEQUOTE: DOUBLEQUOTE = "DOUBLEQUOTE"
export type WHITESPACE = "WHITESPACE"
export const WHITESPACE: WHITESPACE = "WHITESPACE"
export type COMMENT = "COMMENT"
export const COMMENT: COMMENT = "COMMENT"
export type EOF = "EOF"
export const EOF: EOF = "EOF"

export type TokenType =
  | IDENTIFIER | INTEGER | NOT
  | IF | THEN | ELSE
  | WHILE | DO | REPEAT | TIMES
  | PROGRAM | ROUTINE
  | LPAREN | RPAREN | LBRACKET | RBRACKET /* | LBRACE | RBRACE */
  | LESS | GREATER | EQUALS
  | ASTERISC | SLASH | HYPHENMINUS | PLUS
  | DOT | COMMA | COLON | SEMI
  | SINGLEQUOTE | DOUBLEQUOTE
  | WHITESPACE | COMMENT | EOF

const keywordTokenTypes: Record<string, TokenType> = {
  "wenn": IF,
  "if": IF,
  "dann": THEN,
  "then": THEN,
  "sonst": ELSE,
  "else": ELSE,
  "solange": WHILE,
  "while": WHILE,
  "tue": DO,
  "do": DO,
  "nicht": NOT,
  "not": NOT,
  "wiederhole": REPEAT,
  "repeat": REPEAT,
  "mal": TIMES,
  "times": TIMES,
  "programm": PROGRAM,
  "program": PROGRAM,
  "anweisung": ROUTINE,
  "routine": ROUTINE,
}

const symbolTokenTypes: Record<string, TokenType> = {
  "(": LPAREN,
  ")": RPAREN,
  "[": LBRACKET,
  "]": RBRACKET,
  // "{": LBRACE,  // comments
  // "}": RBRACE,  // comments
  "<": LESS,
  ">": GREATER,
  "=": EQUALS,
  "*": ASTERISC,
  "/": SLASH,
  "-": HYPHENMINUS,
  "+": PLUS,
  ".": DOT,
  ",": COMMA,
  ":": COLON,
  ";": SEMI,
  "'": SINGLEQUOTE,
  '"': DOUBLEQUOTE,
}

export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

/**
 * Iterable lexer
 */
export function* tokenize(
  text: string,
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
  const reWord = /[A-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ]+/y

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
      yield {type: keywordTokenTypes[value.toLowerCase()] || IDENTIFIER,
        value, line, column}
      column += value.length
      position += value.length
      continue
    }

    // whitespace
    reSpaces.lastIndex = position
    if (match = reSpaces.exec(text)) {
      value = match[0]
      if (yieldWhitespace) {
        yield {type: WHITESPACE, value, line, column}
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
        yield {type: COMMENT, value, line, column}
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
        yield {type: COMMENT, value, line, column}
      }
      column += value.length
      position += value.length
      continue
    }

    // special character (must be checked after // comments)
    value = text[position]
    if (symbolTokenTypes.hasOwnProperty(value)) {
      yield {type: symbolTokenTypes[value], value, line, column}
      ++column
      ++position
      continue
    }

    // integer
    reInteger.lastIndex = position
    if (match = reInteger.exec(text)) {
      value = match[0]
      yield {type: INTEGER, value, line, column}
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
  return {type: EOF, value: "", line, column}
}
