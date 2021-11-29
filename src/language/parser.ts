import {Exception} from "../exception"
import {commaList} from "../util"
import {translate} from "../localization"
import * as tokens from "./tokens"
// eslint-disable-next-line no-duplicate-imports
import {Token, TokenType, tokenTypeToLiteral, tokenize} from "./tokens"


export interface AbstractStatement {
  type: TokenType
  line: number
}
export interface Call extends AbstractStatement {
  type: "IDENTIFIER"
  line: number
  identifier: string
  arguments: Expression[]
}
export interface IntegerExpression extends AbstractStatement {
  type: "INTEGER"
  value: number
}
export interface NotExpression extends AbstractStatement {
  type: "NOT"
  expression: Expression
}
export interface IfStatement extends AbstractStatement {
  type: "IF"
  condition: Expression
  sequence: Sequence
  alternative?: Sequence
}
export interface WhileStatement extends AbstractStatement {
  type: "WHILE"
  condition: Expression
  sequence: Sequence
}
export interface RepeatStatement extends AbstractStatement {
  type: "REPEAT"
  count: Expression
  sequence: Sequence
}
export interface ProgramDefinition extends AbstractStatement {
  type: "PROGRAM"
  sequence: Sequence
}
export interface RoutineDefinition extends AbstractStatement {
  type: "ROUTINE"
  identifier: string
  argNames: string[]
  sequence: Sequence
}

export type Expression =
  | Call
  | IntegerExpression
  | NotExpression

export type Statement =
  | Call
  | IfStatement
  | WhileStatement
  | RepeatStatement
  | ProgramDefinition
  | RoutineDefinition

export type Sequence = Statement[]


export class Parser {
  tokens: Iterator<Token>
  currentToken: Token
  depth: number

  constructor(tokens: Iterator<Token>) {
    this.tokens = tokens
    this.depth = 0
    this.forward()
  }

  forward() {
    this.currentToken = this.tokens.next().value
  }

  eat(...types: TokenType[]): TokenType {
    if (types.includes(this.currentToken.type)) {
      const type = this.currentToken.type
      this.forward()
      return type
    } else {
      throw error("error.parser.unexpected_token_instead", this.currentToken, types)
    }
  }

  maybeEat(...types: TokenType[]): TokenType | false {
    if (types.includes(this.currentToken.type)) {
      const type = this.currentToken.type
      this.forward()
      return type
    }
    return false
  }

  readToken(...types: TokenType[]): string {
    if (types.includes(this.currentToken.type)) {
      const value = this.currentToken.value
      this.forward()
      return value
    }
    throw error("error.parser.unexpected_token_instead", this.currentToken, types)
  }

  readExpression(): Expression {
    const {line} = this.currentToken
    switch (this.currentToken.type) {
      case tokens.IDENTIFIER: {
        return this.readCall()
      }

      case tokens.INTEGER: {
        const value = +this.currentToken.value
        this.forward()
        return {type: tokens.INTEGER, line, value}
      }

      case tokens.NOT: {
        this.forward()
        return {type: tokens.NOT, line, expression: this.readExpression()}
      }

      case tokens.LPAREN: {
        const expr = this.readExpression()
        this.eat(tokens.RPAREN)
        return expr
      }
    }
    throw error("error.parser.unexpected_token", this.currentToken)
  }

  readCall(): Call {
    const call = {
      type: tokens.IDENTIFIER,
      line: this.currentToken.line,
      identifier: this.currentToken.value,
      arguments: [] as Expression[],
    }
    this.forward()
    if (this.maybeEat(tokens.LPAREN) && !this.maybeEat(tokens.RPAREN)) {
      call.arguments.push(this.readExpression())
      while (this.eat(tokens.RPAREN, tokens.COMMA) === tokens.COMMA) {
        call.arguments.push(this.readExpression())
      }
    }
    return call
  }

  readSequence(...endTokens: [TokenType, ...TokenType[]]): Sequence {
    const statements: Sequence = []
    this.depth++
    while (!endTokens.includes(this.currentToken.type)) {
      statements.push(this.readStatement())
    }
    this.depth--
    return statements
  }

  readStatement(): Statement {
    const {type, line} = this.currentToken
    switch (type) {
      case tokens.IDENTIFIER: {
        return this.readCall()
      }

      case tokens.IF: {
        this.forward()
        const condition = this.readExpression()
        this.eat(tokens.THEN)
        const sequence = this.readSequence(tokens.ELSE, tokens.ASTERISC)
        const statement: IfStatement = {type, line, condition, sequence}
        if (this.currentToken.type === tokens.ELSE) {
          this.forward()
          statement.alternative = this.readSequence(tokens.ASTERISC)
        }
        this.eat(tokens.ASTERISC)
        this.eat(tokens.IF)
        return statement
      }

      case tokens.WHILE: {
        this.forward()
        const condition = this.readExpression()
        this.eat(tokens.DO)
        const sequence = this.readSequence(tokens.ASTERISC)
        this.eat(tokens.ASTERISC)
        this.eat(tokens.WHILE)
        return {type, line, condition, sequence}
      }

      case tokens.REPEAT: {
        const type: "REPEAT" | "WHILE" = tokens.REPEAT
        let statement: WhileStatement | RepeatStatement
        this.forward()
        if (this.currentToken.type === tokens.WHILE) {
          this.forward()
          statement = {
            type: tokens.WHILE,
            line,
            condition: this.readExpression(),
            sequence: this.readSequence(tokens.ASTERISC),
          }
        } else {
          const count = this.readExpression()
          this.eat(tokens.TIMES)
          statement = {type, line, count, sequence: this.readSequence(tokens.ASTERISC)}
        }
        this.eat(tokens.ASTERISC)
        this.eat(tokens.REPEAT)
        return statement
      }

      case tokens.PROGRAM: {
        if (this.depth > 1) {
          throw error("error.parser.nested_program_definition", this.currentToken)
        }
        this.forward()
        const sequence = this.readSequence(tokens.ASTERISC)
        this.eat(tokens.ASTERISC)
        this.eat(tokens.PROGRAM)
        return {type, line, sequence}
      }

      case tokens.ROUTINE: {
        if (this.depth > 1) {
          throw error("error.parser.nested_program_definition", this.currentToken)
        }
        this.forward()
        const identifier = this.readToken(tokens.IDENTIFIER)
        const argNames = []
        if (this.maybeEat(tokens.LPAREN) && !this.maybeEat(tokens.RPAREN)) {
          argNames.push(this.readToken(tokens.IDENTIFIER))
          while (this.eat(tokens.RPAREN, tokens.COMMA) === tokens.COMMA) {
            argNames.push(this.readToken(tokens.IDENTIFIER))
          }
        }
        const sequence = this.readSequence(tokens.ASTERISC)
        this.eat(tokens.ASTERISC)
        this.eat(tokens.ROUTINE)
        return {type, line, identifier, argNames, sequence}
      }
    }
    throw error("error.parser.unexpected_token", this.currentToken)
  }
}


function error(key: string, token: Token, expected: TokenType[] = []) {
  if (token.type === tokens.EOF) {
    key = expected.length ? "error.parser.unexpected_eof_instead" : "error.parser.unexpected_eof"
  }
  return new Exception(key, {
    ...token,
    expected: commaList(
      expected.map(tt => `'${tokenTypeToLiteral.get(tt) || tt}'`),
      ` ${translate("or")} `,
    ),
  })
}


/** Convenience funtion turns code into an abstract syntax tree. */
export const textToAst = (text: string) =>
  new Parser(tokenize(text)).readSequence(tokens.EOF)
