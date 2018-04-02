import {TokenIterator, TokenTypes as TT} from "./interpreter.js";

const tokenTypeClassNames = {

  [TT.IDENTIFIER]: "identifier",

  [TT.INTEGER]: "number",

  [TT.NOT]: "keyword",
  [TT.IF]: "keyword",
  [TT.THEN]: "keyword",
  [TT.ELSE]: "keyword",
  [TT.WHILE]: "keyword",
  [TT.DO]: "keyword",
  [TT.REPEAT]: "keyword",
  [TT.TIMES]: "keyword",
  [TT.PROGRAM]: "keyword",
  [TT.ROUTINE]: "keyword",

  [TT.LPAREN]: "punctuation",
  [TT.RPAREN]: "punctuation",
  [TT.DOT]: "punctuation",
  [TT.ASTERISC]: "punctuation",
  [TT.WHITESPACE]: null,
  [TT.EOF]: null,
};

export default function highlight(text) {
  let html = "";
  const tokens = new TokenIterator(text, true);
  let token = tokens.next();
  while (!token.done) {
    const className = tokenTypeClassNames[token.type];
    if (className) {
      html += `<span class="token ${className}">${token.value}</span>`;
    } else {
      html += token.value;
    }
    token = tokens.next();
  }
  return html;
}
