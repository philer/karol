import {Exception} from "./localization.js";
import {TokenTypes as TT, textToAst} from "./parser.js";

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
  constructor(runtime) {
    this.runtime = runtime;
    this.routines = Object.create(null);
  }

  get interrupted() {
    return this._interrupted;
  }

  interrupt() {
    this._interrupted = true;
  }

  async run(text) {
    const ast = textToAst(text);
    this._interrupted = false;
    await this.visitSequence(ast);
  }

  async visitSequence(sequence) {
    for (const statement of sequence) {
      await this.visitStatement(statement);
    }
  }

  async visitStatement(statement) {
    switch (statement.type) {
      case TT.IDENTIFIER:
        if (this._interrupted) {
          return;
        }
        if (statement.identifier in this.routines) {
          if (this.depth > MAX_RECURSION_DEPTH) {
            throw new Exception("error.runtime.max_recursion_depth_exceeded",
                                MAX_RECURSION_DEPTH);
          }
          await this.visitSequence(
                        this.routines[statement.identifier]);
        } else {
          const args = await Promise.all(statement.arguments.map(arg =>
                          this.visitExpression(arg)));
          await this.runtime.execute(statement.identifier, args, statement.line);
        }
        break;

      case TT.IF:
        if (await this.visitExpression(statement.condition)) {
          await this.visitSequence(statement.sequence);
        } else if (statement.alternative) {
          await this.visitSequence(statement.alternative);
        }
        break;

      case TT.WHILE:
        while (await this.visitExpression(statement.condition)) {
          await this.visitSequence(statement.sequence);
        }
        break;

      case TT.REPEAT: {
        const count = await this.visitExpression(statement.count);
        for (let i = 0 ; i < count ; i++) {
          await this.visitSequence(statement.sequence);
        }
        break;
      }

      case TT.PROGRAM:
        await this.visitSequence(statement.sequence);
        break;

      case TT.ROUTINE:
        this.routines[statement.identifier] = statement.sequence;
        break;

      default:
        throw new Exception("error.runtime.unimplemented_statement_type",
                            statement.type);
    }
  }

  async visitExpression(expression) {
    switch (expression.type) {
      case TT.INTEGER:
        return +expression.value;

      case TT.IDENTIFIER:
        return this.runtime.evaluate(expression.identifier,
                                     expression.arguments);

      case TT.NOT:
        return ! await this.visitExpression(expression.expression);

      default:
        throw new Exception("error.runtime.unimplemented_expression_type",
                            expression.type);
    }
  }
}
