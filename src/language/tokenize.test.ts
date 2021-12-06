import {mapObject} from "../util"
import {Exception} from "../exception"
import {tokenize} from "./tokenize"
import {LanguageSpecification, defaultSpec} from "./specification"

describe("tokenizer", () => {

  test("empty program", () => {
    expect([...tokenize("", defaultSpec)])
      .toEqual([])
    expect([...tokenize("", defaultSpec, true, true)])
      .toEqual([])
  })

  test("identifiers", () => {
    expect([...tokenize("ascii", defaultSpec)]).toEqual([{
      type: "IDENTIFIER", line: 1, column: 1,
      value: "ascii",
      isBuiltin: false,
    }])
    const utf8 = "ÁéèôæçäöüÄÖÜß"
    expect([...tokenize(utf8, defaultSpec)]).toEqual([{
      type: "IDENTIFIER", line: 1, column: 1,
      value: utf8,
      isBuiltin: false,
    }])
  })

  test("normalization", () => {
    type Kws = LanguageSpecification["keywords"]
    type Bltns = LanguageSpecification["builtins"]
    const spec: LanguageSpecification = {
      keywords: {
        ...defaultSpec.keywords,
        ...mapObject<Kws, Kws>((trans, tt) => [trans.toLowerCase(), tt], defaultSpec.keywords),
      },
      builtins: {
        ...defaultSpec.builtins,
        ...mapObject<Bltns, Bltns>((trans, cmd) => [trans.toLowerCase(), cmd], defaultSpec.builtins),
      },
      normalizeKeyword: str => str.toLowerCase(),
      normalizeIdentifier: str => str.toLowerCase(),
    }
    expect([...tokenize("while", spec)]).toEqual([{
      type: "WHILE", line: 1, column: 1,
      value: "while",
      isBuiltin: false,
    }])
    expect([...tokenize("wHiLe", spec)]).toEqual([{
      type: "WHILE", line: 1, column: 1,
      value: "wHiLe",
      isBuiltin: false,
    }])
    expect([...tokenize("isEdge", spec)]).toEqual([{
      type: "IDENTIFIER", line: 1, column: 1,
      value: "isEdge",
      isBuiltin: true,
    }])
    expect([...tokenize("isedge", spec)]).toEqual([{
      type: "IDENTIFIER", line: 1, column: 1,
      value: "isedge",
      isBuiltin: true,
    }])
    expect([...tokenize("custom", spec)]).toEqual([{
      type: "IDENTIFIER", line: 1, column: 1,
      value: "custom",
      isBuiltin: false,
    }])
  })

  test("integers", () => {
    expect([...tokenize("0", defaultSpec)])
      .toEqual([{type: "INTEGER", value: "0", line: 1, column: 1}])
    expect([...tokenize("1234567890", defaultSpec)])
      .toEqual([{type: "INTEGER", value: "1234567890", line: 1, column: 1}])
    expect([...tokenize("00123", defaultSpec)])
      .toEqual([{type: "INTEGER", value: "00123", line: 1, column: 1}])
  })

  test("program 'wall'", () => {
    expect([...tokenize(code, defaultSpec, true, true)]).toMatchSnapshot()
    expect([...tokenize(code, defaultSpec)]).toMatchSnapshot()
  })

  test("returns EOF", () => {
    expect(tokenize("", defaultSpec).next())
      .toEqual({done: true, value: {type: "EOF", value: "", line: 1, column: 1}})
  })

  test("unknown characters", () => {
    expect(() => [...tokenize("·", defaultSpec)]).toThrow(Exception)
  })
})

const code = `{ Build a wall around the world }

routine wall()
    while not isEdge() do
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
