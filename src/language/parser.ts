import {Exception} from "../exception"
import {translate} from "../localization"
import {commaList} from "../util"
import type {LanguageSpecification, TokenType} from "./specification"
// eslint-disable-next-line no-duplicate-imports
import {symbolToTokenType, TokenType as tt} from "./specification"
import {Token, tokenize} from "./tokenize"


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
  spec: LanguageSpecification
  currentToken: Token
  depth: number

  constructor(tokens: Iterator<Token>, spec: LanguageSpecification) {
    this.tokens = tokens
    this.spec = spec
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
      throw this.error("error.parser.unexpected_token_instead", types)
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
    throw this.error("error.parser.unexpected_token_instead", types)
  }

  readExpression(): Expression {
    const {line} = this.currentToken
    switch (this.currentToken.type) {
      case tt.IDENTIFIER: {
        return this.readCall()
      }

      case tt.INTEGER: {
        const value = +this.currentToken.value
        this.forward()
        return {type: tt.INTEGER, line, value}
      }

      case tt.NOT: {
        this.forward()
        return {type: tt.NOT, line, expression: this.readExpression()}
      }

      case tt.LPAREN: {
        const expr = this.readExpression()
        this.eat(tt.RPAREN)
        return expr
      }
    }
    throw this.error("error.parser.unexpected_token")
  }

  readCall(): Call {
    const call = {
      type: tt.IDENTIFIER,
      line: this.currentToken.line,
      identifier: this.currentToken.value,
      arguments: [] as Expression[],
    }
    this.forward()
    if (this.maybeEat(tt.LPAREN) && !this.maybeEat(tt.RPAREN)) {
      call.arguments.push(this.readExpression())
      while (this.eat(tt.RPAREN, tt.COMMA) === tt.COMMA) {
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
      case tt.IDENTIFIER: {
        return this.readCall()
      }

      case tt.IF: {
        this.forward()
        const condition = this.readExpression()
        this.eat(tt.THEN)
        const sequence = this.readSequence(tt.ELSE, tt.ASTERISC)
        const statement: IfStatement = {type, line, condition, sequence}
        if (this.currentToken.type === tt.ELSE) {
          this.forward()
          statement.alternative = this.readSequence(tt.ASTERISC)
        }
        this.eat(tt.ASTERISC)
        this.eat(tt.IF)
        return statement
      }

      case tt.WHILE: {
        this.forward()
        const condition = this.readExpression()
        this.eat(tt.DO)
        const sequence = this.readSequence(tt.ASTERISC)
        this.eat(tt.ASTERISC)
        this.eat(tt.WHILE)
        return {type, line, condition, sequence}
      }

      case tt.REPEAT: {
        const type: "REPEAT" | "WHILE" = tt.REPEAT
        let statement: WhileStatement | RepeatStatement
        this.forward()
        if (this.currentToken.type === tt.WHILE) {
          this.forward()
          statement = {
            type: tt.WHILE,
            line,
            condition: this.readExpression(),
            sequence: this.readSequence(tt.ASTERISC),
          }
        } else {
          const count = this.readExpression()
          this.eat(tt.TIMES)
          statement = {type, line, count, sequence: this.readSequence(tt.ASTERISC)}
        }
        this.eat(tt.ASTERISC)
        this.eat(tt.REPEAT)
        return statement
      }

      case tt.PROGRAM: {
        if (this.depth > 1) {
          throw this.error("error.parser.nested_program_definition")
        }
        this.forward()
        const sequence = this.readSequence(tt.ASTERISC)
        this.eat(tt.ASTERISC)
        this.eat(tt.PROGRAM)
        return {type, line, sequence}
      }

      case tt.ROUTINE: {
        if (this.depth > 1) {
          throw this.error("error.parser.nested_routine_definition")
        }
        this.forward()
        const identifier = this.readToken(tt.IDENTIFIER)
        const argNames = []
        if (this.maybeEat(tt.LPAREN) && !this.maybeEat(tt.RPAREN)) {
          argNames.push(this.readToken(tt.IDENTIFIER))
          while (this.eat(tt.RPAREN, tt.COMMA) === tt.COMMA) {
            argNames.push(this.readToken(tt.IDENTIFIER))
          }
        }
        const sequence = this.readSequence(tt.ASTERISC)
        this.eat(tt.ASTERISC)
        this.eat(tt.ROUTINE)
        return {type, line, identifier, argNames, sequence}
      }
    }
    throw this.error("error.parser.unexpected_token")
  }

  error(key: string, expected: TokenType[] = []) {
    if (this.currentToken.type === tt.EOF) {
      key = expected.length
        ? "error.parser.unexpected_eof_instead"
        : "error.parser.unexpected_eof"
    }

    // reverse lookup of expected TokenTypes for helpful error messages
    const tokenTypeToLiteral = Object.fromEntries(
      Object.entries({...this.spec.keywords, ...symbolToTokenType})
        .map(([literal, tt]) => [tt, literal]),
    )
    return new Exception(key, {
      ...this.currentToken,
      expected: commaList(
        expected.map(tt => `'${tokenTypeToLiteral[tt] || tt}'`),
        ` ${translate("or")} `,
      ),
    })
  }
}


/** Convenience funtion turns code into an abstract syntax tree. */
export const textToAst = (text: string, spec: LanguageSpecification) =>
  new Parser(tokenize(text, spec), spec).readSequence(tt.EOF)
