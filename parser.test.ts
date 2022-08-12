import { lex, parse } from "./parser";

describe("tokenize", () => {
  test("tokenize test", () => {
    const input = '{"a": [1, 2, {"b": 2}, true, false,null	]}';
    const expected = [
      "{",
      "a",
      ":",
      "[",
      1,
      ",",
      2,
      ",",
      "{",
      "b",
      ":",
      2,
      "}",
      ",",
      true,
      ",",
      false,
      ",",
      null,
      "]",
      "}",
    ];
    const actual = lex(input);
    expect(actual).toStrictEqual(expected);
  });
});

describe("parse", () => {
  test("parse token test", () => {
    const input =
      '{"a": [1, 2, {"b": 2}, true, false,null	], "c": {"d":[-1, 2, 3]}}';
    const expected = {
      a: [1, 2, { b: 2 }, true, false, null],
      c: {
        d: [-1, 2, 3],
      },
    };
    const actual = parse(lex(input))[0];
    expect(actual).toStrictEqual(expected);
  });
});
