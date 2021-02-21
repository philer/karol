import {clsx, css, flattenKeys} from "./index"

test("flattenkeys", () => {
  expect(flattenKeys({
    "key1": "value1",
    "key2": {
      "key21": "value21",
      "key22": {
        "key221": "value221",
      },
      "key23": "value22",
    },
    "key3": "value3",
    "key4": ["value4.1", "value4.2"],
  })).toEqual({
    "key1": "value1",
    "key2.key21": "value21",
    "key2.key22.key221": "value221",
    "key2.key23": "value22",
    "key3": "value3",
    "key4": ["value4.1", "value4.2"],
  })
})

test("flattenkeys empty", () => {
  expect(flattenKeys({})).toEqual({})
})

test("flattenkeys already flat", () => {
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

test("clsx", () => {
  expect(clsx("button", null, true && "yes", false && "no", undefined, "thing"))
    .toEqual("button yes thing")
})

test("css", () => {
  expect(css({position: "absolute", top: "0", border: "1px solid #fff"}))
    .toEqual("position:absolute;top:0;border:1px solid #fff")
})
