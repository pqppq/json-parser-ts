const JSON_QUOTE = '"';
const JSON_COMMA = ",";
const JSON_COLON = ":";
const JSON_LEFTBRACKET = "[";
const JSON_RIGHTBRACKET = "]";
const JSON_LEFTBRACE = "{";
const JSON_RIGHTBRACE = "}";
const JSON_WHITE_SPACE = [" ", "\t", "\b", "\n", "\r"];
const JSON_SYNTAX = [
  JSON_COMMA,
  JSON_COLON,
  JSON_LEFTBRACE,
  JSON_RIGHTBRACE,
  JSON_LEFTBRACKET,
  JSON_RIGHTBRACKET,
];

type Token = string | number | boolean | null;
type Tokens = Token[];

export function lex(input: string): Tokens {
  const tokens: Tokens = [];
  let rest = input;
  while (rest.length) {
    let [jsonStr, restStr] = lexString(rest);
    if (jsonStr !== undefined) {
      tokens.push(jsonStr);
      rest = restStr;
      continue;
    }

    let [jsonNum, restNum] = lexNumber(rest);
    if (jsonNum !== undefined) {
      tokens.push(jsonNum);
      rest = restNum;
      continue;
    }

    let [jsonBoolean, restBoolean] = lexBoolean(rest);
    if (jsonBoolean !== undefined) {
      tokens.push(jsonBoolean);
      rest = restBoolean;
      continue;
    }

    let [jsonNull, restNull] = lexNull(rest);
    if (jsonNull !== undefined) {
      tokens.push(jsonNull);
      rest = restNull;
      continue;
    }

    const char = rest.charAt(0);
    if (JSON_WHITE_SPACE.includes(char)) {
      rest = rest.substring(1); // ignore whitespace
    } else if (JSON_SYNTAX.includes(char)) {
      tokens.push(char);
      rest = rest.substring(1);
    } else {
      throw new Error(`Unexpected character: ${char}.`);
    }
  }
  return tokens;
}

function lexString(input: string): [string | undefined, string] {
  if (input.charAt(0) !== JSON_QUOTE) {
    return [undefined, input];
  }

  let rest = input.substring(1);
  let jsonStr = "";
  for (const char of rest) {
    if (char !== JSON_QUOTE) {
      jsonStr += char;
    } else {
      return [jsonStr, rest.substring(jsonStr.length + 1)];
    }
  }
  throw new Error("Expected end-of-string quote.");
}

function lexNumber(input: string): [number | undefined, string] {
  const numChar = "0123456789" + "-e.";
  let jsonNum = "";
  let rest = input;
  for (const char of input) {
    if (numChar.includes(char)) {
      jsonNum += char;
      rest = rest.substring(1);
    } else {
      break;
    }
  }
  if (jsonNum.match(/^-?\d+(\.\d+)?([-+]?e\d+)?$/)) {
    return [Number(jsonNum), rest];
  } else {
    return [undefined, input];
  }
}

function lexBoolean(input: string): [boolean | undefined, string] {
  if (input.match(/^true.*$/)) {
    return [true, input.substring("true".length)];
  }
  if (input.match(/^false.*$/)) {
    return [false, input.substring("false".length)];
  }
  return [undefined, input];
}

function lexNull(input: string): [null | undefined, string] {
  if (input.match(/^null.*$/)) {
    return [null, input.substring("null".length)];
  }
  return [undefined, input];
}

function parseObject(tokens: Tokens): [object, Tokens] {
  const jsonObject = {};

  if (tokens[0] === JSON_RIGHTBRACE) {
    tokens.shift(); // skip "{"
    return [jsonObject, tokens];
  }

  while (tokens.length) {
    const jsonKey = tokens[0];
    if (typeof jsonKey === "string") {
      tokens.shift();
    } else {
      throw new Error(`Expected string key, but got ${typeof jsonKey}.`);
    }

    if (tokens[0] !== JSON_COLON) {
      throw new Error(
        `Expected colon after key in object, but got ${tokens[0]}.`
      );
    }
    tokens.shift(); // skip ":"
    const [jsonValue, rest] = parse(tokens);
    jsonObject[jsonKey] = jsonValue;

    if (rest[0] === JSON_RIGHTBRACE) {
      rest.shift(); // skip "}"
      return [jsonObject, rest];
    } else if (rest[0] !== JSON_COMMA) {
      throw new Error(
        `Expected comma after pair in object, but got ${rest[0]}`
      );
    }
    tokens = rest.slice(1);
  }
  throw new Error(`Expected end-of-object bracket.`);
}

function parseArray(tokens: Tokens): [(Token | object)[], Tokens] {
  const jsonArray: (Token | object)[] = [];

  if (tokens[0] === JSON_RIGHTBRACKET) {
    tokens.shift(); // skip "]"
    return [jsonArray, tokens];
  }

  while (tokens.length) {
    const [json, rest] = parse(tokens);
    jsonArray.push(json);

    const token = rest[0];
    if (token === JSON_RIGHTBRACKET) {
      rest.shift(); // skip "]"
      return [jsonArray, rest];
    } else if (token !== JSON_COMMA) {
      throw new Error("Expected comma after object in array.");
    }
    tokens = rest.slice(1);
  }
  throw new Error("Expected end-of-array bracket.");
}

export function parse(
  tokens: Tokens,
  isRoot = false
): [Token | object, Tokens] {
  if (isRoot && tokens[0] !== JSON_LEFTBRACKET) {
    throw new Error("Root must be an object.");
  }
  const token = tokens.shift();
  if (token === JSON_LEFTBRACE) {
    return parseObject(tokens);
  } else if (token === JSON_LEFTBRACKET) {
    return parseArray(tokens);
  } else {
    return [token, tokens];
  }
}
