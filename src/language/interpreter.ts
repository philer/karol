import {Exception} from "../exception"
import * as tokens from "./tokens"
import {Call, Expression, RoutineDefinition, Sequence, Statement, textToAst} from "./parser"

const MAX_RECURSION_DEPTH = 100

export type Value = number | boolean | undefined

export interface BuiltinCall {
  identifier: string
  args: Value[]
  line: number
}

export type BuiltinCalls = Generator<BuiltinCall, Value, Value>

interface Builtin {
  identifier: string
  isBuiltin?: true
}

type SymbolTable = Record<string, Builtin | RoutineDefinition | Value>

const checkBuiltin = (symbol: any): symbol is Builtin => symbol.isBuiltin


/**
 * Run a program upon the world simulation.
 * More specifically, interpret a given AST and
 * yield actions for each step that may be executed
 * in their own time by a RunTime.
 */
export function run(code: string, builtins: string[]) {
  const ast = textToAst(code)
  const symbols: SymbolTable = Object.create(null)
  for (const identifier of builtins) {
    symbols[identifier] = {identifier, isBuiltin: true}
  }
  return visitSequence(ast, symbols, 0)
}

function* visitSequence(sequence: Sequence, symbols: SymbolTable, depth: number): BuiltinCalls {
  let result
  for (const statement of sequence) {
    result = yield* visitStatement(statement, symbols, depth)
  }
  return result
}

function* visitStatement(statement: Statement, symbols: SymbolTable, depth: number): BuiltinCalls {
  switch (statement.type) {
    case tokens.IDENTIFIER:
      return yield* call(statement, symbols, depth)

    case tokens.IF:
      if (yield* visitExpression(statement.condition, symbols, depth)) {
        return yield* visitSequence(statement.sequence, symbols, depth)
      } else if (statement.alternative) {
        return yield* visitSequence(statement.alternative, symbols, depth)
      }
      return

    case tokens.WHILE: {
      let result
      while (yield* visitExpression(statement.condition, symbols, depth)) {
        result = yield* visitSequence(statement.sequence, symbols, depth)
      }
      return result
    }

    case tokens.REPEAT: {
      // There is currently nothing in the language that could change the
      // result of the limit expression while the loop is running.
      const count = (yield* visitExpression(statement.count, symbols, depth)) as number
      let result
      for (let i = 0 ; i < count ; i++) {
        result = yield* visitSequence(statement.sequence, symbols, depth)
      }
      return result
    }

    case tokens.PROGRAM:
      return yield* visitSequence(statement.sequence, symbols, depth)

    case tokens.ROUTINE:
      symbols[statement.identifier.toLowerCase()] = statement
      break

    default:
      throw new Exception("error.runtime.unimplemented_statement_type",
        // @ts-expect-error Parser implementation out of sync with interpreter
        statement.type)
  }
}

function* visitExpression(expression: Expression, symbols: SymbolTable, depth: number): BuiltinCalls {
  switch (expression.type) {
    case tokens.INTEGER:
      return +expression.value

    case tokens.IDENTIFIER: {
      return yield* call(expression, symbols, depth)
    }

    case tokens.NOT:
      return ! (yield* visitExpression(expression.expression, symbols, depth))

    default:
      throw new Exception("error.runtime.unimplemented_expression_type",
        // @ts-expect-error Parser implementation out of sync with interpreter
        expression.type)
  }
}

/** Call a builtin or user defined routine. */
function* call(call: Call, symbols: SymbolTable, depth: number): BuiltinCalls {
  if (depth > MAX_RECURSION_DEPTH) {
    throw new Exception("error.runtime.max_recursion_depth_exceeded",
      MAX_RECURSION_DEPTH)
  }

  const identifier = call.identifier.toLowerCase()
  if (!(identifier in symbols)) {
    throw new Exception("error.runtime.undefined",
      {identifier, line: call.line})
  }

  const routine = symbols[identifier]
  if (typeof routine !== "object") {
    return routine
  }

  const args: Value[] = []
  for (const arg of call.arguments) {
    // Note that results can be undefined - The language is _not_ type safe.
    args.push(yield* visitExpression(arg, symbols, depth))
  }

  if (checkBuiltin(routine)) {
    return yield {identifier, args, line: call.line}
  }

  // Making use of prototype inheritance for simplicity.
  // We could copy the entries instead but would still want Objet.create(null).
  const localSymbols: SymbolTable = Object.create(symbols)
  for (let i = 0, len = routine.argNames.length ; i < len ; ++i) {
    localSymbols[routine.argNames[i]] = args[i]
  }
  return yield* visitSequence(routine.sequence, localSymbols, depth + 1)
}
