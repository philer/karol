import {Exception} from "../localization"
import {TokenTypes as TT, textToAst} from "./parser"
import {assignEntries, zip} from "../util"

const MAX_RECURSION_DEPTH = 100

/**
 * Run a program upon the world simulation.
 * More specifically, interpret a given AST and
 * yield actions for each step that may be executed
 * in their own time by a RunTime.
 */
export function run(code, builtins) {
  const ast = textToAst(code)
  const symbols = Object.create(null)
  for (const identifier of builtins) {
    symbols[identifier] = {identifier, isBuiltin: true}
  }
  return visitSequence(ast, symbols, 0)
}

function* visitSequence(sequence, symbols, depth) {
  for (const statement of sequence) {
    yield* visitStatement(statement, symbols, depth)
  }
}

function* visitStatement(statement, symbols, depth) {
  switch (statement.type) {
    case TT.IDENTIFIER:
      yield* call(statement, symbols, depth)
      break

    case TT.IF:
      if (yield* visitExpression(statement.condition, symbols, depth)) {
        yield* visitSequence(statement.sequence, symbols, depth)
      } else if (statement.alternative) {
        yield* visitSequence(statement.alternative, symbols, depth)
      }
      break

    case TT.WHILE:
      while (yield* visitExpression(statement.condition, symbols, depth)) {
        yield* visitSequence(statement.sequence, symbols, depth)
      }
      break

    case TT.REPEAT: {
      // There is currently nothing in the language that could change the
      // result of the limit expression while the loop is running.
      const count = yield* visitExpression(statement.count, symbols, depth)
      for (let i = 0 ; i < count ; i++) {
        yield* visitSequence(statement.sequence, symbols, depth)
      }
      break
    }

    case TT.PROGRAM:
      yield* visitSequence(statement.sequence, symbols, depth)
      break

    case TT.ROUTINE:
      symbols[statement.identifier.toLowerCase()] = statement
      break

    default:
      throw new Exception("error.runtime.unimplemented_statement_type",
        statement.type)
  }
}

function* visitExpression(expression, symbols, depth) {
  switch (expression.type) {
    case TT.INTEGER:
      return +expression.value

    case TT.IDENTIFIER: {
      const identifier = expression.identifier.toLowerCase()
      if (!(identifier in symbols)) {
        throw new Exception("error.runtime.undefined", expression)
      }
      const symbol = symbols[identifier]
      if (symbol.isBuiltin || symbol.type === TT.IDENTIFIER) {
        return yield* call(expression, symbols, depth)
      }
      return symbol
    }

    case TT.NOT:
      return ! (yield* visitExpression(expression.expression, symbols, depth))

    default:
      throw new Exception("error.runtime.unimplemented_expression_type",
        expression.type)
  }
}

/**
 * Call a builtin or user defined routine.
 * @param  {Object} call
 * @param  {Object} symbols lookup table
 * @return {mixed}  return value of the call
 */
function* call(call, symbols, depth) {
  if (depth > MAX_RECURSION_DEPTH) {
    throw new Exception("error.runtime.max_recursion_depth_exceeded",
      MAX_RECURSION_DEPTH)
  }

  const identifier = call.identifier.toLowerCase()
  if (!(identifier in symbols)) {
    throw new Exception("error.runtime.undefined",
      {identifier, line: call.line})
  }

  const args = []
  for (const arg of call.arguments) {
    args.push(yield* visitExpression(arg, symbols, depth))
  }

  const routine = symbols[identifier]
  if (routine.isBuiltin) {
    return yield {identifier, args, line: call.line}
  }

  // Making use of prototype inheritance for simplicity.
  // We could copy the entries instead but would still want Objet.create(null).
  const localSymbols = Object.create(symbols)
  for (let i = 0, len = routine.argNames.length ; i < len ; ++i) {
    localSymbols[routine.argNames[i]] = args[i]
  }
  return yield* visitSequence(routine.sequence, localSymbols, depth + 1)
}
