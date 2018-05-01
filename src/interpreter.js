import {Exception} from "./localization.js";
import {TokenTypes as TT, textToAst} from "./parser.js";
import {assignEntries, zip} from "./util.js";

const MAX_RECURSION_DEPTH = 10;

/**
 * Run a program upon the world simulation.
 * More specifically, interpret a given AST and
 * yield actions for each step that may be executed
 * in their own time by a RunTime.
 *
 * TODO runtime/scopes
 */
export class Interpreter {

  /**
   * Create a new program iteration
   * @param  {RunTime} runtime  simulated machine/world
   */
  constructor(runtime, builtinNames) {
    this.runtime = runtime;
    this.builtins = Object.create(null);
    for (const [identifier, name] of Object.entries(builtinNames)) {
      this.builtins[identifier.toLowerCase()] = {name, isBuiltin: true};
    }
    this._interrupted = false;
    this._depth = 0;
  }

  get interrupted() {
    return this._interrupted;
  }

  interrupt() {
    this._interrupted = true;
  }

  run(text) {
    const ast = textToAst(text);
    const symbolTable = Object.create(this.builtins);
    this._interrupted = false;
    return this.visitSequence(ast, symbolTable);
  }

  async visitSequence(sequence, symbols) {
    for (const statement of sequence) {
      await this.visitStatement(statement, symbols);
    }
  }

  async visitStatement(statement, symbols) {
    switch (statement.type) {
      case TT.IDENTIFIER:
        if (this._interrupted) {
          return;
        }
        return this.call(statement, symbols);

      case TT.IF:
        if (this.visitExpression(statement.condition, symbols)) {
          return this.visitSequence(statement.sequence, symbols);
        } else if (statement.alternative) {
          return this.visitSequence(statement.alternative, symbols);
        }
        break;

      case TT.WHILE:
        while (this.visitExpression(statement.condition, symbols)) {
          await this.visitSequence(statement.sequence, symbols);
        }
        break;

      case TT.REPEAT: {
        // There is currently nothing in the language that could change the
        // result of the limit expression while the loop is running.
        const count = this.visitExpression(statement.count, symbols);
        for (let i = 0 ; i < count ; i++) {
          await this.visitSequence(statement.sequence, symbols);
        }
        break;
      }

      case TT.PROGRAM:
        return this.visitSequence(statement.sequence, symbols);

      case TT.ROUTINE:
        symbols[statement.identifier.toLowerCase()] = statement;
        break;

      default:
        throw new Exception("error.runtime.unimplemented_statement_type",
                            statement.type);
    }
  }

  visitExpression(expression, symbols) {
    switch (expression.type) {
      case TT.INTEGER:
        return +expression.value;

      case TT.IDENTIFIER: {
        const identifier = expression.identifier.toLowerCase();
        if (!(identifier in symbols)) {
          throw new Exception("error.runtime.undefined",
                              {identifier, line: expression.line});
        }
        const symbol = symbols[expression.identifier];
        if (symbol.isBuiltin || symbol.type === TT.IDENTIFIER) {
          return this.call(expression, symbols);
        }
        return symbol;
      }

      case TT.NOT:
        return !this.visitExpression(expression.expression, symbols);

      default:
        throw new Exception("error.runtime.unimplemented_expression_type",
                            expression.type);
    }
  }

  /**
   * Call a builtin or user defined routine.
   * @param  {Object} call
   * @param  {Object} symbols lookup table
   * @return {mixed}  return value of the call
   */
  call(call, symbols) {
    const identifier = call.identifier.toLowerCase();
    if (!(identifier in symbols)) {
      throw new Exception("error.runtime.undefined",
                          {identifier, line: call.line});
    }
    this._depth++;
    if (this._depth > MAX_RECURSION_DEPTH) {
      throw new Exception("error.runtime.max_recursion_depth_exceeded",
                          MAX_RECURSION_DEPTH);
    }
    const routine = symbols[identifier];
    const args = call.arguments.map(arg => this.visitExpression(arg, symbols));
    let result;
    if (routine.isBuiltin) {
      result = this.runtime.execute(symbols[identifier].name,
                                          args, call.line);
    } else {
      const localSymbols = assignEntries(Object.create(symbols),
                                         zip(routine.argNames, args));
      result = this.visitSequence(routine.sequence, localSymbols);
    }
    this._depth--;
    return result;
  }
}
