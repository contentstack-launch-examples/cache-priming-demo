import { parse } from "yaml";

const OPEN = "---";
const CLOSE = "\n---";
const COMMENT_LINES = /^\s*#[^\n]+/gm;

export type FrontMatter = {
  data: Record<string, unknown>;
  content: string;
};

// Splits a leading `---` YAML block off a markdown string. Mirrors the
// delimiter handling this app previously got from gray-matter, but only ever
// parses YAML: gray-matter's code-evaluating front-matter engines (the source
// of SNYK-JS-GRAYMATTER-20532010) are deliberately not supported.
export default function parseFrontMatter(input: string): FrontMatter {
  let str = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  if (!str.startsWith(OPEN) || str.charAt(OPEN.length) === "-") {
    return { data: {}, content: str };
  }

  str = str.slice(OPEN.length);

  const eol = str.search(/\r?\n/);
  const language = eol === -1 ? "" : str.slice(0, eol);
  if (language.trim() !== "") {
    if (language.trim().toLowerCase() !== "yaml") {
      throw new Error(`Unsupported front matter language: ${language.trim()}`);
    }
    str = str.slice(language.length);
  }

  const closeIndex = str.indexOf(CLOSE);
  const block = (closeIndex === -1 ? str : str.slice(0, closeIndex)).replace(
    /\r$/,
    ""
  );

  const data =
    block.replace(COMMENT_LINES, "").trim() === "" ? {} : toRecord(parse(block));

  if (closeIndex === -1) {
    return { data, content: "" };
  }

  let content = str.slice(closeIndex + CLOSE.length);
  if (content[0] === "\r") content = content.slice(1);
  if (content[0] === "\n") content = content.slice(1);

  return { data, content };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
