import { createElement, type ReactNode } from "react";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import kotlin from "highlight.js/lib/languages/kotlin";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import diff from "highlight.js/lib/languages/diff";
import markdown from "highlight.js/lib/languages/markdown";
import yaml from "highlight.js/lib/languages/yaml";

const highlighter = createLowlight({
  javascript, typescript, kotlin, json, bash, css, xml, diff, markdown, yaml,
});
highlighter.registerAlias({ kotlin: ["kt", "kts"], bash: ["shell"], xml: ["svg"] });

const plainLanguages = new Set(["text", "txt", "plaintext"]);
const maxCodeLength = 20_000;
type Token = ReturnType<typeof highlighter.highlight>["children"][number];

const renderToken = (token: Token, key: number): ReactNode => {
  if (token.type === "text") return token.value;
  if (token.type !== "element") return null;
  const classes = token.properties.className;
  return createElement("span", {
    key,
    className: Array.isArray(classes) ? classes.join(" ") : undefined,
  }, token.children.map(renderToken));
};

export function highlightCode(source: string, language?: string | null): ReactNode {
  const lang = language?.trim().toLowerCase();
  if (!lang || plainLanguages.has(lang) || source.length > maxCodeLength ||
    !highlighter.registered(lang)) return source;
  try {
    return highlighter.highlight(lang, source).children.map(renderToken);
  } catch {
    return source;
  }
}
