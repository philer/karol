import {Exception} from "../exception"
import {LanguageSpecification, TokenType as tt} from "./specification"
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

type Context = LanguageSpecification & {
  symbols: SymbolTable
  depth: number
}

const checkBuiltin = (symbol: any): symbol is Builtin => symbol.isBuiltin


/**
 * Run a program upon the world simulation.
 * More specifically, interpret a given AST and
 * yield actions for each step that may be executed
 * in their own time by a RunTime.
 */
export function run(code: string, spec: LanguageSpecification) {
  const ast = textToAst(code, spec)
  const symbols: SymbolTable = Object.create(null)
  for (const identifier of Object.keys(spec.builtins)) {
    symbols[identifier] = {identifier, isBuiltin: true}
  }
  return visitSequence(ast, {...spec, symbols, depth: 0})
}

function* visitSequence(sequence: Sequence, context: Context): BuiltinCalls {
  let result
  for (const statement of sequence) {
    result = yield* visitStatement(statement, context)
  }
  return result
}

function* visitStatement(statement: Statement, context: Context): BuiltinCalls {
  switch (statement.type) {
    case tt.IDENTIFIER:
      return yield* call(statement, context)

    case tt.IF:
      if (yield* visitExpression(statement.condition, context)) {
        return yield* visitSequence(statement.sequence, context)
      } else if (statement.alternative) {
        return yield* visitSequence(statement.alternative, context)
      }
      return

    case tt.WHILE: {
      let result
      while (yield* visitExpression(statement.condition, context)) {
        result = yield* visitSequence(statement.sequence, context)
      }
      return result
    }

    case tt.REPEAT: {
      // There is currently nothing in the language that could change the
      // result of the limit expression while the loop is running.
      const count = (yield* visitExpression(statement.count, context)) as number
      let result
      for (let i = 0 ; i < count ; i++) {
        result = yield* visitSequence(statement.sequence, context)
      }
      return result
    }

    case tt.PROGRAM:
      return yield* visitSequence(statement.sequence, context)

    case tt.ROUTINE: {
      const {symbols, normalizeIdentifier} = context
      const identifier = normalizeIdentifier(statement.identifier)
      if (identifier in symbols) {
        throw new Exception("error.runtime.cannot_overwrite_function", {identifier})
      }
      symbols[identifier] = statement
      return
    }

    default:
      throw new Exception("error.runtime.unimplemented_statement_type",
        // @ts-expect-error Parser implementation out of sync with interpreter
        statement.type)
  }
}

function* visitExpression(expression: Expression, context: Context): BuiltinCalls {
  switch (expression.type) {
    case tt.INTEGER:
      return +expression.value

    case tt.IDENTIFIER: {
      return yield* call(expression, context)
    }

    case tt.NOT:
      return ! (yield* visitExpression(expression.expression, context))

    default:
      throw new Exception("error.runtime.unimplemented_expression_type",
        // @ts-expect-error Parser implementation out of sync with interpreter
        expression.type)
  }
}

/** Call a builtin or user defined routine. */
function* call(call: Call, context: Context): BuiltinCalls {
  const {depth, symbols, normalizeIdentifier} = context
  if (depth > MAX_RECURSION_DEPTH) {
    throw new Exception("error.runtime.max_recursion_depth_exceeded", {depth})
  }

  const identifier = normalizeIdentifier(call.identifier)
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
    args.push(yield* visitExpression(arg, context))
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
  return yield* visitSequence(routine.sequence, {
    ...context,
    symbols: localSymbols,
    depth: depth + 1,
  })
}
