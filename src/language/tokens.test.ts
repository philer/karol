import {tokenize} from "./tokens"

describe("tokenizer", () => {

  test("empty program", () => {
    expect(Array.from(tokenize("")))
      .toEqual([])
    expect(Array.from(tokenize("", true, true)))
      .toEqual([])
  })

  test("identifiers", () => {
    expect(Array.from(tokenize("ascii")))
      .toEqual([{type: "IDENTIFIER", value: "ascii", line: 1, column: 1}])
    const utf8 = "ÁéèôæçäöüÄÖÜß"
    expect(Array.from(tokenize(utf8)))
      .toEqual([{type: "IDENTIFIER", value: utf8, line: 1, column: 1}])
  })

  test("integers", () => {
    expect(Array.from(tokenize("0")))
      .toEqual([{type: "INTEGER", value: "0", line: 1, column: 1}])
    expect(Array.from(tokenize("1234567890")))
      .toEqual([{type: "INTEGER", value: "1234567890", line: 1, column: 1}])
    expect(Array.from(tokenize("00123")))
      .toEqual([{type: "INTEGER", value: "00123", line: 1, column: 1}])
  })

  test("program 'wall'", () => {
    expect(Array.from(tokenize(code, true, true))).toEqual(tokens)
    expect(Array.from(tokenize(code))).toEqual(
      tokens.filter(({type}) => type !== "WHITESPACE" && type !== "COMMENT"),
    )
  })

  test("returns EOF", () => {
    expect(tokenize("").next())
      .toEqual({done: true, value: {type: "EOF", value: "", line: 1, column: 1}})
  })
})

const code = `{ Build a wall around the world }

routine wall()
    while not isLookingAtEdge() do
        placeBlock(2)
        step()
    *while
*routine

// Stairs
placeBlock()
step()
placeBlock(2)
step()
turnRight() turnRight()
placeBlock()
turnLeft() turnLeft()

wall()
turnLeft()
wall()
turnLeft()
wall()
turnLeft()
wall()
turnLeft()
`

const tokens = [
  {type: "COMMENT", value: "{ Build a wall around the world }", line: 1, column: 1},
  {type: "WHITESPACE", value: "\n\n", line: 1, column: 34},
  {type: "ROUTINE", value: "routine", line: 3, column: 1},
  {type: "WHITESPACE", value: " ", line: 3, column: 8},
  {type: "IDENTIFIER", value: "wall", line: 3, column: 9},
  {type: "LPAREN", value: "(", line: 3, column: 13},
  {type: "RPAREN", value: ")", line: 3, column: 14},
  {type: "WHITESPACE", value: "\n    ", line: 3, column: 15},
  {type: "WHILE", value: "while", line: 4, column: 5},
  {type: "WHITESPACE", value: " ", line: 4, column: 10},
  {type: "NOT", value: "not", line: 4, column: 11},
  {type: "WHITESPACE", value: " ", line: 4, column: 14},
  {type: "IDENTIFIER", value: "isLookingAtEdge", line: 4, column: 15},
  {type: "LPAREN", value: "(", line: 4, column: 30},
  {type: "RPAREN", value: ")", line: 4, column: 31},
  {type: "WHITESPACE", value: " ", line: 4, column: 32},
  {type: "DO", value: "do", line: 4, column: 33},
  {type: "WHITESPACE", value: "\n        ", line: 4, column: 35},
  {type: "IDENTIFIER", value: "placeBlock", line: 5, column: 9},
  {type: "LPAREN", value: "(", line: 5, column: 19},
  {type: "INTEGER", value: "2", line: 5, column: 20},
  {type: "RPAREN", value: ")", line: 5, column: 21},
  {type: "WHITESPACE", value: "\n        ", line: 5, column: 22},
  {type: "IDENTIFIER", value: "step", line: 6, column: 9},
  {type: "LPAREN", value: "(", line: 6, column: 13},
  {type: "RPAREN", value: ")", line: 6, column: 14},
  {type: "WHITESPACE", value: "\n    ", line: 6, column: 15},
  {type: "ASTERISC", value: "*", line: 7, column: 5},
  {type: "WHILE", value: "while", line: 7, column: 6},
  {type: "WHITESPACE", value: "\n", line: 7, column: 11},
  {type: "ASTERISC", value: "*", line: 8, column: 1},
  {type: "ROUTINE", value: "routine", line: 8, column: 2},
  {type: "WHITESPACE", value: "\n\n", line: 8, column: 9},
  {type: "COMMENT", value: "// Stairs", line: 10, column: 1},
  {type: "WHITESPACE", value: "\n", line: 10, column: 10},
  {type: "IDENTIFIER", value: "placeBlock", line: 11, column: 1},
  {type: "LPAREN", value: "(", line: 11, column: 11},
  {type: "RPAREN", value: ")", line: 11, column: 12},
  {type: "WHITESPACE", value: "\n", line: 11, column: 13},
  {type: "IDENTIFIER", value: "step", line: 12, column: 1},
  {type: "LPAREN", value: "(", line: 12, column: 5},
  {type: "RPAREN", value: ")", line: 12, column: 6},
  {type: "WHITESPACE", value: "\n", line: 12, column: 7},
  {type: "IDENTIFIER", value: "placeBlock", line: 13, column: 1},
  {type: "LPAREN", value: "(", line: 13, column: 11},
  {type: "INTEGER", value: "2", line: 13, column: 12},
  {type: "RPAREN", value: ")", line: 13, column: 13},
  {type: "WHITESPACE", value: "\n", line: 13, column: 14},
  {type: "IDENTIFIER", value: "step", line: 14, column: 1},
  {type: "LPAREN", value: "(", line: 14, column: 5},
  {type: "RPAREN", value: ")", line: 14, column: 6},
  {type: "WHITESPACE", value: "\n", line: 14, column: 7},
  {type: "IDENTIFIER", value: "turnRight", line: 15, column: 1},
  {type: "LPAREN", value: "(", line: 15, column: 10},
  {type: "RPAREN", value: ")", line: 15, column: 11},
  {type: "WHITESPACE", value: " ", line: 15, column: 12},
  {type: "IDENTIFIER", value: "turnRight", line: 15, column: 13},
  {type: "LPAREN", value: "(", line: 15, column: 22},
  {type: "RPAREN", value: ")", line: 15, column: 23},
  {type: "WHITESPACE", value: "\n", line: 15, column: 24},
  {type: "IDENTIFIER", value: "placeBlock", line: 16, column: 1},
  {type: "LPAREN", value: "(", line: 16, column: 11},
  {type: "RPAREN", value: ")", line: 16, column: 12},
  {type: "WHITESPACE", value: "\n", line: 16, column: 13},
  {type: "IDENTIFIER", value: "turnLeft", line: 17, column: 1},
  {type: "LPAREN", value: "(", line: 17, column: 9},
  {type: "RPAREN", value: ")", line: 17, column: 10},
  {type: "WHITESPACE", value: " ", line: 17, column: 11},
  {type: "IDENTIFIER", value: "turnLeft", line: 17, column: 12},
  {type: "LPAREN", value: "(", line: 17, column: 20},
  {type: "RPAREN", value: ")", line: 17, column: 21},
  {type: "WHITESPACE", value: "\n\n", line: 17, column: 22},
  {type: "IDENTIFIER", value: "wall", line: 19, column: 1},
  {type: "LPAREN", value: "(", line: 19, column: 5},
  {type: "RPAREN", value: ")", line: 19, column: 6},
  {type: "WHITESPACE", value: "\n", line: 19, column: 7},
  {type: "IDENTIFIER", value: "turnLeft", line: 20, column: 1},
  {type: "LPAREN", value: "(", line: 20, column: 9},
  {type: "RPAREN", value: ")", line: 20, column: 10},
  {type: "WHITESPACE", value: "\n", line: 20, column: 11},
  {type: "IDENTIFIER", value: "wall", line: 21, column: 1},
  {type: "LPAREN", value: "(", line: 21, column: 5},
  {type: "RPAREN", value: ")", line: 21, column: 6},
  {type: "WHITESPACE", value: "\n", line: 21, column: 7},
  {type: "IDENTIFIER", value: "turnLeft", line: 22, column: 1},
  {type: "LPAREN", value: "(", line: 22, column: 9},
  {type: "RPAREN", value: ")", line: 22, column: 10},
  {type: "WHITESPACE", value: "\n", line: 22, column: 11},
  {type: "IDENTIFIER", value: "wall", line: 23, column: 1},
  {type: "LPAREN", value: "(", line: 23, column: 5},
  {type: "RPAREN", value: ")", line: 23, column: 6},
  {type: "WHITESPACE", value: "\n", line: 23, column: 7},
  {type: "IDENTIFIER", value: "turnLeft", line: 24, column: 1},
  {type: "LPAREN", value: "(", line: 24, column: 9},
  {type: "RPAREN", value: ")", line: 24, column: 10},
  {type: "WHITESPACE", value: "\n", line: 24, column: 11},
  {type: "IDENTIFIER", value: "wall", line: 25, column: 1},
  {type: "LPAREN", value: "(", line: 25, column: 5},
  {type: "RPAREN", value: ")", line: 25, column: 6},
  {type: "WHITESPACE", value: "\n", line: 25, column: 7},
  {type: "IDENTIFIER", value: "turnLeft", line: 26, column: 1},
  {type: "LPAREN", value: "(", line: 26, column: 9},
  {type: "RPAREN", value: ")", line: 26, column: 10},
  {type: "WHITESPACE", value: "\n", line: 26, column: 11},
]
