const MAX_RECURSION_DEPTH = 10;

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

const WHITESPACE = "WHITESPACE";
const EOF = "EOF";

export const TokenTypes = Object.freeze({
  IDENTIFIER, INTEGER, NOT,
  IF, THEN, ELSE, WHILE, DO, REPEAT, TIMES,
  PROGRAM, ROUTINE,
  LPAREN, RPAREN, DOT, ASTERISC,
  WHITESPACE, EOF,
});

class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
  toString() {
    return this.type + "(" + this.value + ")";
  }
}

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
};
const keywords = Object.keys(keywordTokenTypes);

const symbolTokenTypes = {
  "(": LPAREN,
  ")": RPAREN,
  ".": DOT,
  "*": ASTERISC,
};
const symbols = Object.keys(symbolTokenTypes);



const reSpace = /\s/;
const reDigit = /[0-9]/;
const reLetter = /[A-Za-z_]/i;

/**
 * Iterable lexer
 */
export class TokenIterator {

  constructor(text, includeWhitespace=false) {
    this.text = text;
    this.includeWhitespace = includeWhitespace;
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }

  /**
   * @return {Iterator} this
   */
  [Symbol.iterator]() {
    return this;
  }

  /**
   * Implement iterator protocol
   * @return {Object}
   */
  next() {
    const token = this.nextToken();
    if (token.type === EOF) {
      return {done: true};
    }
    return {value: token, done: false};
  }

  /**
   * Read the next token, forwarding the internal position
   * accordingly.
   * @return {Token}
   */
  nextToken() {
    // eat whitespace, stop when we're done.
    let whitespace = "";
    while (this.position < this.text.length
           && reSpace.test(this.text[this.position])) {
      whitespace += this.text[this.position];
      if (this.text[this.position] === "\n") {
        this.column = 0;
        this.line++;
      }
      this.position++; this.column++;
    }
    if (whitespace.length && this.includeWhitespace) {
      return new Token(WHITESPACE, whitespace, this.line, this.column);
    }

    // read special character token
    const symbol = this.text[this.position];
    if (symbols.includes(symbol)) {
      this.position++; this.column++;
      return new Token(symbolTokenTypes[symbol], symbol, this.line, this.column);
    }

    // read integer token
    let integer = "";
    while (this.position < this.text.length
           && reDigit.test(this.text[this.position])) {
      integer += this.text[this.position];
      this.position++; this.column++;
    }
    if (integer.length) {
      return new Token(INTEGER, +integer, this.line, this.column);
    }

    // read word token
    let word = "";
    while (this.position < this.text.length
           && reLetter.test(this.text[this.position])) {
      word += this.text[this.position];
      this.position++; this.column++;
    }
    if (word.length) {
      const lowercase = word.toLowerCase();
      if (keywords.includes(lowercase)) {
        return new Token(keywordTokenTypes[lowercase], word, this.line, this.column);
      } else {
        return new Token(IDENTIFIER, word, this.line, this.column);
      }
    }

    // end of file
    if (this.position >= this.text.length) {
      return new Token(EOF, "", this.line, this.column);
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
    this.depth = 0;
    this.forward();
  }

  forward() {
    this.currentToken = this.tokens.nextToken();
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
      line: this.currentToken.line,
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
    this.depth++;
    while (!endTokens.includes(this.currentToken.type)) {
      statements.push(this.readStatement());
    }
    this.depth--;
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
        if (this.depth > 1) {
          throw new Error("Parse Error on line "
                          + this.tokens.line
                          + ": Can't define program in nested context.");
        }
        this.forward();
        statement.sequence = this.readSequence();
        this.eat(ASTERISC);
        this.eat(PROGRAM);
        return statement;

      case ROUTINE:
        if (this.depth > 1) {
          throw new Error("Parse Error on line "
                          + this.tokens.line
                          + ": Can't define routine in nested context.");
        }
        this.forward();
        statement.identifier = this.readToken(IDENTIFIER);
        statement.sequence = this.readSequence();
        this.eat(ASTERISC);
        this.eat(ROUTINE);
        return statement;
    }
    throw new Error("Parse Error on line "
                    + this.tokens.line
                    + " while parsing token "
                    + this.currentToken
                    + ": I have no idea what happened.");
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
   */
  constructor(runtime) {
    this.runtime = runtime;
    this.routines = Object.create(null);
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
        if (statement.identifier in this.routines) {
          if (this.depth > MAX_RECURSION_DEPTH) {
            throw new Error("RunTime Error: Maximum recursion depth (" + MAX_RECURSION_DEPTH + ") exceeded.");
          }
          await this.visitSequence(
                        this.routines[statement.identifier]);
        } else {
          await this.runtime.execute(statement.identifier, false, statement.line);
        }
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

      case PROGRAM:
        await this.visitSequence(statement.sequence);
        break;

      case ROUTINE:
        this.routines[statement.identifier] = statement.sequence;
        break;

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
