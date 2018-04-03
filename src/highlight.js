import {TokenIterator, TokenTypes as TT} from "./interpreter.js";

/**
 * Map TokenTypes to css class names
 */
const ttClasses = Object.create(null);

ttClasses[TT.IDENTIFIER] = "identifier";
ttClasses[TT.INTEGER] =  "number";
[
  TT.NOT,
  TT.IF,
  TT.THEN,
  TT.ELSE,
  TT.WHILE,
  TT.DO,
  TT.REPEAT,
  TT.TIMES,
  TT.PROGRAM,
  TT.ROUTINE,
].forEach(tt => ttClasses[tt] = "keyword");
[
  TT.LPAREN,
  TT.RPAREN,
  TT.DOT,
  TT.ASTERISC,
].forEach(tt => ttClasses[tt] = "punctuation");


/**
 * Add syntax highlighting HTML tags to given code snippet.
 * @param  {String} text code
 * @return {String}      code with tokens wrapped in HTML tags
 */
export default function highlight(text) {
  let html = "";
  let lineno = 1;
  for (const token of new TokenIterator(text, true)) {
    if (token.type in ttClasses) {
      html += `<span class="token ${ttClasses[token.type]}">${token.value}</span>`;
    } else {
      html += token.value.replace(/\n/g, function() {
        return `</span></span><span class="line"><span class="lineno">${++lineno}</span><span>`;
      });
    }
  }
  return `<span class="line"><span class="lineno">1</span><span>${html}</span></span>`;
}
