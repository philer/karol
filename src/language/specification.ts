import * as config from "../config"
import {getLocaleData} from "../localization"
import type {Builtins} from "../simulation/world"
import {identity} from "../util"


export const TokenType = {
  IDENTIFIER: "IDENTIFIER",
  INTEGER: "INTEGER",
  NOT: "NOT",
  IF: "IF",
  THEN: "THEN",
  ELSE: "ELSE",
  WHILE: "WHILE",
  DO: "DO",
  REPEAT: "REPEAT",
  TIMES: "TIMES",
  PROGRAM: "PROGRAM",
  ROUTINE: "ROUTINE",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
  // LBRACE: "LBRACE",
  // RBRACE: "RBRACE",
  LESS: "LESS",
  GREATER: "GREATER",
  EQUALS: "EQUALS",
  ASTERISC: "ASTERISC",
  SLASH: "SLASH",
  HYPHENMINUS: "HYPHENMINUS",
  PLUS: "PLUS",
  DOT: "DOT",
  COMMA: "COMMA",
  COLON: "COLON",
  SEMI: "SEMI",
  SINGLEQUOTE: "SINGLEQUOTE",
  DOUBLEQUOTE: "DOUBLEQUOTE",
  WHITESPACE: "WHITESPACE",
  COMMENT: "COMMENT",
  EOF: "EOF",
} as const

export type TokenType = keyof typeof TokenType

export const symbolToTokenType: Readonly<Record<string, TokenType>> = {
  "(": TokenType.LPAREN,
  ")": TokenType.RPAREN,
  "[": TokenType.LBRACKET,
  "]": TokenType.RBRACKET,
  // "{": TokenType.LBRACE,  // comments
  // "}": TokenType.RBRACE,  // comments
  "<": TokenType.LESS,
  ">": TokenType.GREATER,
  "=": TokenType.EQUALS,
  "*": TokenType.ASTERISC,
  "/": TokenType.SLASH,
  "-": TokenType.HYPHENMINUS,
  "+": TokenType.PLUS,
  ".": TokenType.DOT,
  ",": TokenType.COMMA,
  ":": TokenType.COLON,
  ";": TokenType.SEMI,
  "'": TokenType.SINGLEQUOTE,
  '"': TokenType.DOUBLEQUOTE,
}

export type LanguageSpecification = Readonly<{
  keywords: Readonly<Record<string, TokenType>>
  builtins: Readonly<Record<string, keyof Builtins>>
  normalizeIdentifier: (identifier: string) => string
  normalizeKeyword: (keyword: string) => string
}>

const toLowerCase = (str: string) => str.toLowerCase()

export const defaultSpec: LanguageSpecification = {
  keywords: {
    if: "IF",
    then: "THEN",
    else: "ELSE",
    while: "WHILE",
    do: "DO",
    not: "NOT",
    repeat: "REPEAT",
    times: "TIMES",
    program: "PROGRAM",
    routine: "ROUTINE",
  },
  builtins: {
    isEdge: "isLookingAtEdge",
    notIsEdge: "isNotLookingAtEdge",
    step: "step",
    stepBackwards: "stepBackwards",
    isLookingNorth: "isLookingNorth",
    isLookingEast: "isLookingEast",
    isLookingSouth: "isLookingSouth",
    isLookingWest: "isLookingWest",
    turnLeft: "turnLeft",
    turnRight: "turnRight",
    isBlock: "isLookingAtBlock",
    notIsBlock: "isNotLookingAtBlock",
    placeBlock: "placeBlock",
    takeBlock: "takeBlock",
    isOnMark: "isOnMark",
    notIsOnMark: "isNotOnMark",
    placeMark: "placeMark",
    takeMark: "takeMark",
  },
  normalizeKeyword: identity,
  normalizeIdentifier: identity,
}

/**
 * Load a customized programming language specification
 */
export async function load(): Promise<LanguageSpecification> {
  const {code} = await config.get()
  const locales = await Promise.all(code.locales.map(getLocaleData))
  const normalizeKeyword = code.caseSensitiveKeywords ? identity : toLowerCase
  const normalizeIdentifier = code.caseSensitiveIdentifiers ? identity : toLowerCase

  const keywords = {} as Record<string, TokenType>
  const builtins = {} as Record<string, keyof Builtins>
  for (const {language} of locales) {
    for (const [tt, translations] of Object.entries(language.keywords)) {
      for (const trans of translations) {
        keywords[trans] = tt as TokenType
        keywords[normalizeKeyword(trans)] = tt as TokenType
      }
    }
    for (const [cmd, translations] of Object.entries(language.builtins)) {
      for (const trans of translations) {
        builtins[trans] = cmd as keyof Builtins
        builtins[normalizeIdentifier(trans)] = cmd as keyof Builtins
      }
    }
  }

  return {keywords, builtins, normalizeKeyword, normalizeIdentifier}
}
