import {Exception} from "../localization"

// Token types
// TODO Might use Symbol here, gotta check performance.
const IDENTIFIER = "IDENTIFIER"
const INTEGER = "INTEGER"
const NOT = "NOT"

const IF = "IF"
const THEN = "THEN"
const ELSE = "ELSE"
const WHILE = "WHILE"
const DO = "DO"
const REPEAT = "REPEAT"
const TIMES = "TIMES"
const PROGRAM = "PROGRAM"
const ROUTINE = "ROUTINE"

const LPAREN = "LPAREN"
const RPAREN = "RPAREN"
const LBRACKET = "LBRACKET"
const RBRACKET = "RBRACKET"
const LBRACE = "LBRACE"
const RBRACE = "RBRACE"
const LESS = "LESS"
const GREATER = "GREATER"
const EQUALS = "EQUALS"
const ASTERISC = "ASTERISC"
const SLASH = "SLASH"
const HYPHENMINUS = "HYPHENMINUS"
const PLUS = "PLUS"
const DOT = "DOT"
const COMMA = "COMMA"
const COLON = "COLON"
const SEMI = "SEMI"
const SINGLEQUOTE = "SINGLEQUOTE"
const DOUBLEQUOTE = "DOUBLEQUOTE"

const WHITESPACE = "WHITESPACE"
const COMMENT = "COMMENT"
const EOF = "EOF"

export const TokenTypes = Object.freeze({
  IDENTIFIER, INTEGER, NOT,
  IF, THEN, ELSE, WHILE, DO, REPEAT, TIMES,
  PROGRAM, ROUTINE,
  LPAREN, RPAREN, LBRACKET, RBRACKET, LBRACE, RBRACE,
  LESS, GREATER, EQUALS,
  ASTERISC, SLASH, HYPHENMINUS, PLUS,
  DOT, COMMA, COLON, SEMI,
  SINGLEQUOTE, DOUBLEQUOTE,
  WHITESPACE, COMMENT, EOF,
})

const keywordTokenTypes = {
  "wenn":       IF,
  "if":         IF,
  "dann":       THEN,
  "then":       THEN,
  "sonst":      ELSE,
  "else":       ELSE,
  "solange":    WHILE,
  "while":      WHILE,
  "tue":        DO,
  "do":         DO,
  "nicht":      NOT,
  "not":        NOT,
  "wiederhole": REPEAT,
  "repeat":     REPEAT,
  "mal":        TIMES,
  "times":      TIMES,
  "programm":   PROGRAM,
  "program":    PROGRAM,
  "anweisung":  ROUTINE,
  "routine":    ROUTINE,
}
const symbolTokenTypes = {
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
const symbols = new Set(Object.keys(symbolTokenTypes))


/**
 * Iterable lexer
 */
export function* tokenize(text, yieldWhitespace = false, yieldComments = false) {
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
  let match, lines

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
    if (symbols.has(value)) {
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


export class Parser {
  constructor(tokens) {
    this.tokens = tokens
    this.depth = 0
    this.forward()
  }

  forward() {
    this.currentToken = this.tokens.next().value
  }

  eat(...types) {
    if (types.includes(this.currentToken.type)) {
      const type = this.currentToken.type
      this.forward()
      return type
    } else {
      throw new Exception("error.parser.unexpected_token_instead", {
        ...this.currentToken,
        expected: types,
      })
    }
  }

  maybeEat(...types) {
    if (types.includes(this.currentToken.type)) {
      const type = this.currentToken.type
      this.forward()
      return type
    }
    return false
  }

  readToken(...types) {
    if (types.includes(this.currentToken.type)) {
      const value = this.currentToken.value
      this.forward()
      return value
    }
    throw new Exception("error.parser.unexpected_token_instead", {
      ...this.currentToken,
      expected: types,
    })
  }

  readExpression() {
    switch (this.currentToken.type) {
      case IDENTIFIER: {
        return this.readCall()
      }
      case INTEGER: {
        const value = +this.currentToken.value
        this.forward()
        return {type: INTEGER, value}
      }
      case NOT: {
        this.forward()
        return {type: NOT, expression: this.readExpression()}
      }
      case LPAREN: {
        const expr = this.readExpression()
        this.eat(RPAREN)
        return expr
      }
    }
  }

  readCall() {
    const call = {
      type: IDENTIFIER,
      identifier: this.currentToken.value,
      arguments: [],
      line: this.currentToken.line,
    }
    this.forward()
    if (this.maybeEat(LPAREN)) {
      if (!this.maybeEat(RPAREN)) {
        call.arguments.push(this.readExpression())
        while (this.eat(RPAREN, COMMA) === COMMA) {
          call.arguments.push(this.readExpression())
        }
      }
    }
    return call
  }

  readSequence() {
    const statements = []
    const endTokens = [ASTERISC, ELSE, EOF]
    this.depth++
    while (!endTokens.includes(this.currentToken.type)) {
      statements.push(this.readStatement())
    }
    this.depth--
    return statements
  }

  readStatement() {
    const statement = {type: this.currentToken.type}
    switch (this.currentToken.type) {
      case IDENTIFIER:
        return this.readCall()

      case IF:
        this.forward()
        statement.condition = this.readExpression()
        this.eat(THEN)
        statement.sequence = this.readSequence()
        if (this.currentToken.type === ELSE) {
          this.forward()
          statement.alternative = this.readSequence()
        }
        this.eat(ASTERISC)
        this.eat(IF)
        return statement

      case WHILE:
        this.forward()
        statement.condition = this.readExpression()
        this.eat(DO)
        statement.sequence = this.readSequence()
        this.eat(ASTERISC)
        this.eat(WHILE)
        return statement

      case REPEAT:
        this.forward()
        if (this.currentToken.type === WHILE) {
          statement.type = WHILE
          this.forward()
          statement.condition = this.readExpression()
        } else {
          statement.count = this.readExpression()
          this.eat(TIMES)
        }
        statement.sequence = this.readSequence()
        this.eat(ASTERISC)
        this.eat(REPEAT)
        return statement

      case PROGRAM:
        if (this.depth > 1) {
          throw new Exception("error.parser.nested_program_definition",
            this.tokens.line)
        }
        this.forward()
        statement.sequence = this.readSequence()
        this.eat(ASTERISC)
        this.eat(PROGRAM)
        return statement

      case ROUTINE:
        if (this.depth > 1) {
          throw new Exception("error.parser.nested_program_definition",
            this.tokens.line)
        }
        this.forward()
        statement.identifier = this.readToken(IDENTIFIER)
        statement.argNames = []
        if (this.maybeEat(LPAREN)) {
          if (!this.maybeEat(RPAREN)) {
            statement.argNames.push(this.readToken(IDENTIFIER))
            while (this.eat(RPAREN, COMMA) === COMMA) {
              statement.argNames.push(this.readToken(IDENTIFIER))
            }
          }
        }
        statement.sequence = this.readSequence()
        this.eat(ASTERISC)
        this.eat(ROUTINE)
        return statement
    }
    throw new Exception("error.parser.unexpected_token", this.currentToken)
  }
}

/**
 * Convenience funtion turns code into an abstract syntax tree (AST).
 * @param  {string} text
 * @return {Object}
 */
export const textToAst = text => new Parser(tokenize(text)).readSequence()
