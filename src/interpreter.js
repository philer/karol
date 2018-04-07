import {Exception} from "./localization.js";

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
const LBRACKET = "LBRACKET";
const RBRACKET = "RBRACKET";
const LBRACE = "LBRACE";
const RBRACE = "RBRACE";
const LESS = "LESS";
const GREATER = "GREATER";
const EQUALS = "EQUALS";
const ASTERISC = "ASTERISC";
const SLASH = "SLASH";
const HYPHENMINUS = "HYPHENMINUS";
const PLUS = "PLUS";
const DOT = "DOT";
const COMMA = "COMMA";
const COLON = "COLON";
const SEMI = "SEMI";
const SINGLEQUOTE = "SINGLEQUOTE";
const DOUBLEQUOTE = "DOUBLEQUOTE";

const WHITESPACE = "WHITESPACE";
const COMMENT = "COMMENT";
const EOF = "EOF";

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
const symbolTokenTypes = {
  "(": LPAREN,
  ")": RPAREN,
  "[": LBRACKET,
  "]": RBRACKET,
  "{": LBRACE,
  "}": RBRACE,
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
};
const symbols = new Set(Object.keys(symbolTokenTypes));


const reSpace = /\s/;
const reDigit = /[0-9]/;
const reLetter = /[a-z0-9_]/i;

/**
 * Iterable lexer
 */
export class TokenIterator {

  constructor(text, yieldWhitespace=false, yieldComments=false) {
    this.text = text;
    this.yieldWhitespace = yieldWhitespace;
    this.yieldComments = yieldComments;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.eof = false;
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
    return {value: token, done: token.type === EOF};
  }

  /**
   * Read the next token, forwarding the internal position
   * accordingly.
   * @return {Token}
   */
  nextToken() {
    let token, start;

    // eat optional tokens
    do {
      const {column, line} = this;
      start = this.position;
      token = "";

      // whitespace
      while (this.position < this.text.length
             && reSpace.test(this.text[this.position])) {
        token += this.text[this.position];
        if (this.text[this.position] === "\n") {
          this.column = 0;
          this.line++;
        }
        this.position++; this.column++;
      }
      if (token.length) {
        if (this.yieldWhitespace) {
          return new Token(WHITESPACE, token, line, column);
        }
        continue;
      }

      token = this.text[this.position];

      // single-line comment
      if (token + this.text[start + 1] === "//") {
        this.position = this.text.indexOf("\n", start);
        this.column += this.position - start;
        if (this.yieldComments) {
          return new Token(COMMENT, this.text.slice(start, this.position),
                           line, column);
        }
        continue;
      }
      // multi-line comment
      if (token === "{") {
        this.position = this.text.indexOf("}", start) + 1;
        if (this.position < start) { // open comment
          this.position = this.text.length;
        }
        this.column += this.position - start;
        if (this.yieldComments) {
          return new Token(COMMENT, this.text.slice(start, this.position),
                           line, column);
        }
        continue;
      }
    } while (start < this.position);

    const {column, line} = this;

    // special character
    token = this.text[this.position];
    if (symbols.has(token)) {
      this.position++; this.column++;
      return new Token(symbolTokenTypes[token], token, line, column);
    }

    // integer
    token = this.readWhile(reDigit);
    if (token.length) {
      return new Token(INTEGER, +token, line, column);
    }

    // word (identifier / keyword)
    token = this.readWhile(reLetter);
    if (token.length) {
      return new Token(keywordTokenTypes[token.toLowerCase()] || IDENTIFIER,
                       token, line, column);
    }

    // end of file
    if (this.position >= this.text.length) {
      return new Token(EOF, "", line, column);
    }

    // found nothing useful
    throw new Exception("error.parser.token_read", {line, column});
  }

  readWhile(regex) {
    let token = "";
    while (this.position < this.text.length
           && regex.test(this.text[this.position])) {
      token += this.text[this.position];
      this.position++; this.column++;
    }
    return token;
  }

  get remainingText() {
    return this.text.slice(this.position);
  }
}


export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.depth = 0;
    this.forward();
  }

  forward() {
    this.currentToken = this.tokens.next().value;
  }

  eat(...types) {
    if (types.includes(this.currentToken.type)) {
      const type = this.currentToken.type;
      this.forward();
      return type;
    } else {
      throw new Exception("error.parser.unexpected_token_instead", {
        token: this.currentToken,
        line: this.currentToken.line,
        column: this.currentToken.column,
        expected: types,
      });
    }
  }

  maybeEat(...types) {
    if (types.includes(this.currentToken.type)) {
      const type = this.currentToken.type;
      this.forward();
      return type;
    }
    return false;
  }

  readToken(...types) {
    if (types.includes(this.currentToken.type)) {
      const value = this.currentToken.value;
      this.forward();
      return value;
    }
    throw new Exception("error.parser.unexpected_token_instead", {
        token: this.currentToken,
        line: this.currentToken.line,
        column: this.currentToken.column,
        expected: types,
      });
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
      arguments: [],
      line: this.currentToken.line,
    };
    this.forward();
    if (this.maybeEat(LPAREN)) {
      if (!this.maybeEat(RPAREN)) {
        call.arguments.push(this.readExpression());
        while (this.eat(RPAREN, COMMA) === COMMA) {
          call.arguments.push(this.readExpression());
        }
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
          throw new Exception("error.parser.nested_program_definition",
                              this.tokens.line);
        }
        this.forward();
        statement.sequence = this.readSequence();
        this.eat(ASTERISC);
        this.eat(PROGRAM);
        return statement;

      case ROUTINE:
        if (this.depth > 1) {
          throw new Exception("error.parser.nested_program_definition",
                              this.tokens.line);
        }
        this.forward();
        statement.identifier = this.readToken(IDENTIFIER);
        if (this.maybeEat(LPAREN)) {
          // TODO implement routine arguments
          this.eat(RPAREN);
        }
        statement.sequence = this.readSequence();
        this.eat(ASTERISC);
        this.eat(ROUTINE);
        return statement;
    }
    throw new Exception("error.parser.unexpected_token", {
      token: this.currentToken,
      line: this.currentToken.line,
      column: this.currentToken.column,
    });
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

  get interrupted() {
    return this._interrupted;
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
        throw new Exception("error.runtime.unimplemented_statement_type",
                            statement.type);
    }
  }

  async visitExpression(expression) {
    switch (expression.type) {
      case INTEGER:
        return +expression.value;

      case IDENTIFIER:
        return this.runtime.evaluate(expression.identifier,
                                     expression.arguments);

      case NOT:
        return ! await this.visitExpression(expression.expression);

      default:
        throw new Exception("error.runtime.unimplemented_expression_type",
                            expression.type);
    }
  }
}
