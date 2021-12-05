import {clsx, css, flattenKeys, flipObject, mapObject} from "./index"

describe("flattenKeys", () => {
  test("empty", () => {
    expect(flattenKeys({})).toEqual({})
  })

  test("already flat", () => {
    const obj = {
      zero: 0,
      someNumber: 1337,
      null: null as null,
      undefined: undefined as undefined,
      emptyArray: [] as [],
      tuple: ["foo", 42],
    }
    expect(flattenKeys(obj)).toEqual(obj)
  })

  test("nested", () => {
    expect(flattenKeys({
      key1: "value1",
      key2: {
        key21: "value21",
        key22: {
          key221: "value221",
        },
        key23: "value22",
      },
      key3: "value3",
      key4: ["value4.1", "value4.2"],
    })).toEqual({
      "key1": "value1",
      "key2.key21": "value21",
      "key2.key22.key221": "value221",
      "key2.key23": "value22",
      "key3": "value3",
      "key4": ["value4.1", "value4.2"],
    })
  })
})


describe("mapObject", () => {
  test("empty", () => {
    expect(mapObject(
      () => {throw new Error("should never be called")},
      {},
    )).toEqual({})
  })

  test("simple", () => {
    expect(mapObject(
      (key, value) => [key.toUpperCase(), value * 10],
      {a: 1, b: 2},
    )).toEqual({A: 10, B: 20})
  })
})


describe("flipObject", () => {
  test("empty", () => {
    expect(flipObject({})).toEqual({})
  })

  test("simple", () => {
    expect(flipObject({a: "foo", b: "bar"})).toEqual({foo: "a", bar: "b"})
  })
})


test("clsx", () => {
  expect(clsx("button", null, true && "yes", false && "no", undefined, "thing"))
    .toEqual("button yes thing")
})


test("css", () => {
  expect(css({position: "absolute", top: "0", border: "1px solid #fff"}))
    .toEqual("position:absolute;top:0;border:1px solid #fff")
})
