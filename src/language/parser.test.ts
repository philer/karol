import {tokenize} from "./parser"

test("tokenize empty program", () => {
  expect(Array.from(tokenize("")))
    .toEqual([])
  expect(Array.from(tokenize("", true, true)))
    .toEqual([])
})

test("tokenize identifiers", () => {
  expect(Array.from(tokenize("ascii")))
    .toEqual([{type: "IDENTIFIER", value: "ascii", line: 1, column: 1}])
  const utf8 = "ÁéèôæçäöüÄÖÜß"
  expect(Array.from(tokenize(utf8)))
    .toEqual([{type: "IDENTIFIER", value: utf8, line: 1, column: 1}])
})

test("tokenize integers", () => {
  expect(Array.from(tokenize("0")))
    .toEqual([{type: "INTEGER", value: "0", line: 1, column: 1}])
  expect(Array.from(tokenize("1234567890")))
    .toEqual([{type: "INTEGER", value: "1234567890", line: 1, column: 1}])
  expect(Array.from(tokenize("00123")))
    .toEqual([{type: "INTEGER", value: "00123", line: 1, column: 1}])
})

test('tokenize program "mauer"', () => {
  expect(Array.from(tokenize(code, true, true))).toEqual(tokens)
  expect(Array.from(tokenize(code))).toEqual(
    tokens.filter(({type}) => type !== "WHITESPACE" && type !== "COMMENT"),
  )
})

test("tokenizer returns EOF", () => {
  expect(tokenize("").next())
    .toEqual({done: true, value: {type: "EOF", value: "", line: 1, column: 1}})
})

const code = `{ Legt eine Mauer rund um die Welt }

anweisung mauer()
    solange nicht IstWand() tue
        hinlegen(2)
        schritt()
    *solange
*anweisung

// Treppe
hinlegen()
schritt()
hinlegen(2)
schritt()
rechtsDrehen() rechtsDrehen()
hinlegen()
linksDrehen() linksDrehen()

mauer()
linksDrehen()
mauer()
linksDrehen()
mauer()
linksDrehen()
mauer()
linksDrehen()
`

const tokens = [
  {type: "COMMENT", value: "{ Legt eine Mauer rund um die Welt }", line: 1, column: 1},
  {type: "WHITESPACE", value: "\n\n", line: 1, column: 37},
  {type: "ROUTINE", value: "anweisung", line: 3, column: 1},
  {type: "WHITESPACE", value: " ", line: 3, column: 10},
  {type: "IDENTIFIER", value: "mauer", line: 3, column: 11},
  {type: "LPAREN", value: "(", line: 3, column: 16},
  {type: "RPAREN", value: ")", line: 3, column: 17},
  {type: "WHITESPACE", value: "\n    ", line: 3, column: 18},
  {type: "WHILE", value: "solange", line: 4, column: 5},
  {type: "WHITESPACE", value: " ", line: 4, column: 12},
  {type: "NOT", value: "nicht", line: 4, column: 13},
  {type: "WHITESPACE", value: " ", line: 4, column: 18},
  {type: "IDENTIFIER", value: "IstWand", line: 4, column: 19},
  {type: "LPAREN", value: "(", line: 4, column: 26},
  {type: "RPAREN", value: ")", line: 4, column: 27},
  {type: "WHITESPACE", value: " ", line: 4, column: 28},
  {type: "DO", value: "tue", line: 4, column: 29},
  {type: "WHITESPACE", value: "\n        ", line: 4, column: 32},
  {type: "IDENTIFIER", value: "hinlegen", line: 5, column: 9},
  {type: "LPAREN", value: "(", line: 5, column: 17},
  {type: "INTEGER", value: "2", line: 5, column: 18},
  {type: "RPAREN", value: ")", line: 5, column: 19},
  {type: "WHITESPACE", value: "\n        ", line: 5, column: 20},
  {type: "IDENTIFIER", value: "schritt", line: 6, column: 9},
  {type: "LPAREN", value: "(", line: 6, column: 16},
  {type: "RPAREN", value: ")", line: 6, column: 17},
  {type: "WHITESPACE", value: "\n    ", line: 6, column: 18},
  {type: "ASTERISC", value: "*", line: 7, column: 5},
  {type: "WHILE", value: "solange", line: 7, column: 6},
  {type: "WHITESPACE", value: "\n", line: 7, column: 13},
  {type: "ASTERISC", value: "*", line: 8, column: 1},
  {type: "ROUTINE", value: "anweisung", line: 8, column: 2},
  {type: "WHITESPACE", value: "\n\n", line: 8, column: 11},
  {type: "COMMENT", value: "// Treppe", line: 10, column: 1},
  {type: "WHITESPACE", value: "\n", line: 10, column: 10},
  {type: "IDENTIFIER", value: "hinlegen", line: 11, column: 1},
  {type: "LPAREN", value: "(", line: 11, column: 9},
  {type: "RPAREN", value: ")", line: 11, column: 10},
  {type: "WHITESPACE", value: "\n", line: 11, column: 11},
  {type: "IDENTIFIER", value: "schritt", line: 12, column: 1},
  {type: "LPAREN", value: "(", line: 12, column: 8},
  {type: "RPAREN", value: ")", line: 12, column: 9},
  {type: "WHITESPACE", value: "\n", line: 12, column: 10},
  {type: "IDENTIFIER", value: "hinlegen", line: 13, column: 1},
  {type: "LPAREN", value: "(", line: 13, column: 9},
  {type: "INTEGER", value: "2", line: 13, column: 10},
  {type: "RPAREN", value: ")", line: 13, column: 11},
  {type: "WHITESPACE", value: "\n", line: 13, column: 12},
  {type: "IDENTIFIER", value: "schritt", line: 14, column: 1},
  {type: "LPAREN", value: "(", line: 14, column: 8},
  {type: "RPAREN", value: ")", line: 14, column: 9},
  {type: "WHITESPACE", value: "\n", line: 14, column: 10},
  {type: "IDENTIFIER", value: "rechtsDrehen", line: 15, column: 1},
  {type: "LPAREN", value: "(", line: 15, column: 13},
  {type: "RPAREN", value: ")", line: 15, column: 14},
  {type: "WHITESPACE", value: " ", line: 15, column: 15},
  {type: "IDENTIFIER", value: "rechtsDrehen", line: 15, column: 16},
  {type: "LPAREN", value: "(", line: 15, column: 28},
  {type: "RPAREN", value: ")", line: 15, column: 29},
  {type: "WHITESPACE", value: "\n", line: 15, column: 30},
  {type: "IDENTIFIER", value: "hinlegen", line: 16, column: 1},
  {type: "LPAREN", value: "(", line: 16, column: 9},
  {type: "RPAREN", value: ")", line: 16, column: 10},
  {type: "WHITESPACE", value: "\n", line: 16, column: 11},
  {type: "IDENTIFIER", value: "linksDrehen", line: 17, column: 1},
  {type: "LPAREN", value: "(", line: 17, column: 12},
  {type: "RPAREN", value: ")", line: 17, column: 13},
  {type: "WHITESPACE", value: " ", line: 17, column: 14},
  {type: "IDENTIFIER", value: "linksDrehen", line: 17, column: 15},
  {type: "LPAREN", value: "(", line: 17, column: 26},
  {type: "RPAREN", value: ")", line: 17, column: 27},
  {type: "WHITESPACE", value: "\n\n", line: 17, column: 28},
  {type: "IDENTIFIER", value: "mauer", line: 19, column: 1},
  {type: "LPAREN", value: "(", line: 19, column: 6},
  {type: "RPAREN", value: ")", line: 19, column: 7},
  {type: "WHITESPACE", value: "\n", line: 19, column: 8},
  {type: "IDENTIFIER", value: "linksDrehen", line: 20, column: 1},
  {type: "LPAREN", value: "(", line: 20, column: 12},
  {type: "RPAREN", value: ")", line: 20, column: 13},
  {type: "WHITESPACE", value: "\n", line: 20, column: 14},
  {type: "IDENTIFIER", value: "mauer", line: 21, column: 1},
  {type: "LPAREN", value: "(", line: 21, column: 6},
  {type: "RPAREN", value: ")", line: 21, column: 7},
  {type: "WHITESPACE", value: "\n", line: 21, column: 8},
  {type: "IDENTIFIER", value: "linksDrehen", line: 22, column: 1},
  {type: "LPAREN", value: "(", line: 22, column: 12},
  {type: "RPAREN", value: ")", line: 22, column: 13},
  {type: "WHITESPACE", value: "\n", line: 22, column: 14},
  {type: "IDENTIFIER", value: "mauer", line: 23, column: 1},
  {type: "LPAREN", value: "(", line: 23, column: 6},
  {type: "RPAREN", value: ")", line: 23, column: 7},
  {type: "WHITESPACE", value: "\n", line: 23, column: 8},
  {type: "IDENTIFIER", value: "linksDrehen", line: 24, column: 1},
  {type: "LPAREN", value: "(", line: 24, column: 12},
  {type: "RPAREN", value: ")", line: 24, column: 13},
  {type: "WHITESPACE", value: "\n", line: 24, column: 14},
  {type: "IDENTIFIER", value: "mauer", line: 25, column: 1},
  {type: "LPAREN", value: "(", line: 25, column: 6},
  {type: "RPAREN", value: ")", line: 25, column: 7},
  {type: "WHITESPACE", value: "\n", line: 25, column: 8},
  {type: "IDENTIFIER", value: "linksDrehen", line: 26, column: 1},
  {type: "LPAREN", value: "(", line: 26, column: 12},
  {type: "RPAREN", value: ")", line: 26, column: 13},
  {type: "WHITESPACE", value: "\n", line: 26, column: 14},
]
