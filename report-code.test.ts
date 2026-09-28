import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { highlightCode } from "./src/report-code";
import { withBrowserPage } from "./test-support/browser";

const render = (source: string, language?: string) =>
  renderToStaticMarkup(createElement("code", null, highlightCode(source, language)));

test("selected grammars and aliases produce tokens without changing source text", () => {
  const samples = [
    [["js", "javascript"], "const x = 42;"],
    [["ts", "typescript"], "const x: number = 42;"],
    [["kt", "kts", "kotlin"], "val x = 42"],
    [["json"], '{"x": 42}'],
    [["bash", "sh", "shell"], 'echo "$HOME"'],
    [["css"], "body { color: red; }"],
    [["xml", "html", "svg"], '<svg width="42"></svg>'],
    [["diff", "patch"], "-old\n+new"],
    [["md", "markdown"], "# Heading\n**bold**"],
    [["yaml", "yml"], "enabled: true"],
  ] as const;
  for (const [aliases, source] of samples) {
    for (const alias of aliases) {
      const result = render(source, alias);
      expect(result).toContain('class="hljs-');
      expect(result.replace(/<\/?span[^>]*>/g, "")).toBe(
        renderToStaticMarkup(createElement("code", null, source)),
      );
      expect(result).toBe(render(source, aliases[0]));
    }
  }
  expect(render("const x = 1", " TS ")).toBe(render("const x = 1", "ts"));
});

test("plain, absent, unknown and oversized code bypasses highlighting", () => {
  for (const lang of [undefined, "", "text", "txt", "plaintext", "unknown", "constructor", "__proto__"]) {
    expect(highlightCode("const x = 1;", lang)).toBe("const x = 1;");
  }
  const large = "const x = 1;\n".repeat(2000);
  expect(highlightCode(large, "js")).toBe(large);
});

test("HTML and script-like input stays escaped text", () => {
  const source = '<script>alert("x")</script><img src=x onerror=alert(1)>';
  for (const lang of ["xml", "js", "plaintext", "unknown"]) {
    const output = render(source, lang);
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("<img");
    expect(output.replace(/<\/?span[^>]*>/g, "")).toBe(
      renderToStaticMarkup(createElement("code", null, source)),
    );
  }
});

test("browser tokens inherit Mantine colors and survive color scheme changes", async () => {
  await withBrowserPage(new URL("./examples/code-highlight-test.html", import.meta.url), async page => {
    await page.locator('body[data-code-verified="true"]').waitFor();
    for (const attribute of ["scheme-colors", "same-token", "plain", "languages", "inherits-token"]) {
      expect(await page.locator("body").getAttribute(`data-${attribute}`)).toBe("true");
    }
  });
}, 15_000);
