/**
 * Basic premise:
 * Convert (compile/transpile) player code into safely executable JS.
 */

// token types
const IDENTIFIER = "IDENTIFIER";
const INTEGER = "INTEGER";
const NOT = "NOT";

const IF = "IF";
const THEN = "THEN";
const ELSE = "ELSE";
const WHILE = "WHILE";
const DO = "DO";
const REPEAT = "REPEAT";
const TIMES = "TIMES";
const PROGRAM = "PROGRAM";
const ROUTINE = "ROUTINE";

const LPAREN = "LPAREN";
const RPAREN = "RPAREN";
const DOT = "DOT";
const ASTERISC = "ASTERISC";

const EOF = "EOF";

class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
  toString() {
    return this.type + "(" + this.value + ")";
  }
}

const keywordTokens = {
  "wenn":       new Token(IF, "wenn"),
  "if":         new Token(IF, "if"),
  "dann":       new Token(THEN, "dann"),
  "then":       new Token(THEN, "then"),
  "sonst":      new Token(ELSE, "sonst"),
  "else":       new Token(ELSE, "else"),
  "solange":    new Token(WHILE, "solange"),
  "while":      new Token(WHILE, "while"),
  "tue":        new Token(DO, "tue"),
  "do":         new Token(DO, "do"),
  "nicht":      new Token(NOT, "nicht"),
  "not":        new Token(NOT, "not"),
  "wiederhole": new Token(REPEAT, "wiederhole"),
  "repeat":     new Token(REPEAT, "repeat"),
  "mal":        new Token(TIMES, "mal"),
  "times":      new Token(TIMES, "times"),
  "programm":   new Token(PROGRAM, "programm"),
  "program":    new Token(PROGRAM, "program"),
  "anweisung":  new Token(ROUTINE, "anweisung"),
  "routine":    new Token(ROUTINE, "routine"),
};
const keywords = Object.keys(keywordTokens);

const symbolTokens = {
  "(": new Token(LPAREN, "("),
  ")": new Token(RPAREN, ")"),
  ".": new Token(DOT, "."),
  "*": new Token(ASTERISC, "*"),
};
const symbols = Object.keys(symbolTokens);



const reSpace = /\s/;
const reDigit = /[0-9]/;
const reLetter = /[A-Za-z_]/;

/**
 * Iterable lexer
 */
export class TokenIterator {

  constructor(text) {
    this.text = text.toLowerCase();   // case insensitive -.-
    this.position = 0;
    this.line = 1;
  }

  // [Symbol.iterator]() {
  //   return this;
  // }

  next() {
    // eat whitespace, stop when we're done.
    while (this.position < this.text.length
           && reSpace.test(this.text[this.position])) {
      if (this.text[this.position] === "\n") {
        this.line++;
      }
      this.position++;
    }

    // read special character token
    const symbol = this.text[this.position];
    if (symbols.includes(symbol)) {
      this.position++;
      return symbolTokens[symbol];
    }

    // read integer token
    let integer = "";
    while (this.position < this.text.length
           && reDigit.test(this.text[this.position])) {
      integer += this.text[this.position];
      this.position++;
    }
    if (integer.length) {
      return new Token(INTEGER, +integer);
    }

    // read word token
    let word = "";
    while (this.position < this.text.length
           && reLetter.test(this.text[this.position])) {
      word += this.text[this.position];
      this.position++;
    }
    if (word.length) {
      if (keywords.includes(word)) {
        return keywordTokens[word];
      } else {
        return new Token(IDENTIFIER, word);
      }
    }

    // end of file
    if (this.position >= this.text.length) {
      const eof = new Token(EOF, "");
      eof.done = true;
      return eof;
    }

    // found nothing useful
    throw new Error("Syntax Error on line "
                    + this.line
                    + ": Could not read next token at offset "
                    + this.position);
  }
}


export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.forward();
  }

  forward() {
    this.currentToken = this.tokens.next();
  }

  eat(type) {
    if (this.currentToken.type !== type) {
      throw new Error("Syntax Error on line "
                      + this.tokens.line
                      + ": Unexpected token " + this.currentToken
                      + ", was expecting " + type + ".");
    }
    this.forward();
  }

  readToken(...validTypes) {
    if (validTypes.includes(this.currentToken.type)) {
      const value = this.currentToken.value;
      this.forward();
      return value;
    }
    throw new Error("Syntax Error on line "
                    + this.tokens.line
                    + ": Unexpected token "
                    + this.currentToken
                    + ". Expected any of " + validTypes);
  }

  readExpression() {
    switch (this.currentToken.type) {

      case IDENTIFIER: {
        return this.readCall();
      }
      case INTEGER: {
        const value = +this.currentToken.value;
        this.forward();
        return {type: INTEGER, value};
      }
      case NOT: {
        this.forward();
        return {type: NOT, expression: this.readExpression()};
      }
      case LPAREN: {
        const expr = this.readExpression();
        this.eat(RPAREN);
        return expr;
      }
    }
  }

  readCall() {
    const call = {
      type: IDENTIFIER,
      identifier: this.currentToken.value,
    };
    this.forward();
    if (this.currentToken.type === LPAREN) {
      this.forward();
      if (this.currentToken.type === RPAREN) {
        this.forward();
      } else {
        call.argument = this.readExpression();
        this.eat(RPAREN);
      }
    }
    return call;
  }

  readSequence() {
    const statements = [];
    const endTokens = [ASTERISC, ELSE, EOF];
    while (!endTokens.includes(this.currentToken.type)) {
      statements.push(this.readStatement());
    }
    return statements;
  }

  readStatement() {
    const statement = {type: this.currentToken.type};
    switch (this.currentToken.type) {
      case IDENTIFIER:
        return this.readCall();

      case IF:
        this.forward();
        statement.condition = this.readExpression();
        this.eat(THEN);
        statement.sequence = this.readSequence();
        if (this.currentToken.type === ELSE) {
          this.forward();
          statement.alternative = this.readSequence();
        }
        this.eat(ASTERISC);
        this.eat(IF);
        return statement;

      case WHILE:
        this.forward();
        statement.condition = this.readExpression();
        this.eat(DO);
        statement.sequence = this.readSequence();
        this.eat(ASTERISC);
        this.eat(WHILE);
        return statement;

      case REPEAT:
        this.forward();
        if (this.currentToken.type === WHILE) {
          statement.type = WHILE;
          this.forward();
          statement.condition = this.readExpression();
        } else {
          statement.count = this.readExpression();
          this.eat(TIMES);
        }
        statement.sequence = this.readSequence();
        this.eat(ASTERISC);
        this.eat(REPEAT);
        return statement;

      case PROGRAM:
        this.forward();
        statement.sequence = this.readSequence();
        this.eat(ASTERISC);
        this.eat(PROGRAM);
        return statement;

      case ROUTINE:
        this.forward();
        statement.identifier = this.readToken(IDENTIFIER);
        statement.sequence = this.readSequence();
        this.eat(ASTERISC);
        this.eat(ROUTINE);
        return statement;
    }
    throw new Error("Error while parsing on line "
                    + this.tokens.line
                    + ". I have no idea what happened.");
  }
}


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
   * @param  {Object} nativeSymbols mapping of identifiers to functions
   */
  constructor(runtime) {
    this.runtime = runtime;
  }

  interrupt() {
    this._interrupted = true;
  }

  async run(text) {
    const tokens = new TokenIterator(text);
    const parser = new Parser(tokens);
    const ast = parser.readSequence();
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
      case IDENTIFIER:
        if (this._interrupted) {
          return;
        }
        await this.runtime.execute(statement.identifier);
        break;

      case IF:
        if (await this.visitExpression(statement.condition)) {
          await this.visitSequence(statement.sequence);
        } else if (statement.alternative) {
          await this.visitSequence(statement.alternative);
        }
        break;

      case WHILE:
        while (await this.visitExpression(statement.condition)) {
          await this.visitSequence(statement.sequence);
        }
        break;

      case REPEAT: {
        const count = await this.visitExpression(statement.count);
        for (let i = 0 ; i < count ; i++) {
          await this.visitSequence(statement.sequence);
        }
        break;
      }

      default:
        throw new Error(`Unimplemented statement type ${statement.type}`);
    }
  }

  async visitExpression(expression) {
    switch (expression.type) {
      case INTEGER:
        return +expression.value;

      case IDENTIFIER:
        return this.runtime.evaluate(expression.identifier);

      case NOT:
        return ! await this.visitExpression(expression.expression);

      default:
        throw new Error("Unimplemented expression type");
    }
  }
}
