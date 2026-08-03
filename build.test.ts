import { expect, test } from "bun:test";

const read = (path: string) => Bun.file(`${import.meta.dir}/${path}`).text();

test("build emits expected CDN assets", async () => {
  for (const path of [
    "dist/probe.iife.js",
    "dist/probe.esm.js",
    "dist/embed-test.esm.js",
    "dist/embed-test.esm.css",
    "dist/report-runtime.esm.js",
    "dist/report-runtime.esm.css",
    "dist/embed-test.iife.js",
    "dist/embed-test.iife.css",
    "dist/fonts.css",
  ]) {
    expect(await Bun.file(`${import.meta.dir}/${path}`).exists()).toBe(true);
  }
});

test("browser assets avoid restricted runtime APIs", async () => {
  const source = `${await read("dist/probe.iife.js")}\n${await read("dist/probe.esm.js")}\n${await read("dist/embed-test.iife.js")}\n${await read("dist/embed-test.esm.js")}\n${await read("dist/report-runtime.esm.js")}`;
  expect(source).not.toMatch(/\beval\s*\(/);
  expect(source).not.toMatch(/\bnew\s+(?:Function|Worker)\b/);
  expect(source).not.toMatch(/\b(?:fetch|createObjectURL)\s*\(/);
  expect(source).not.toMatch(/\bimport\s*\(/);
});

test("local example references built assets", async () => {
  const html = await read("examples/embed-test.html");
  expect(html).toContain("../dist/fonts.css");
  expect(html).toContain("../dist/embed-test.iife.css");
  expect(html).toContain("../dist/embed-test.iife.js");
});

test("runtime example references hosted runtime assets", async () => {
  const html = await read("examples/runtime-test.html");
  expect(html).toContain("../dist/report-runtime.esm.css");
  expect(html).toContain("../dist/report-runtime.esm.js");
});

test("font CSS keeps unicode ranges and external WOFF2 assets", async () => {
  const css = await read("dist/fonts.css");
  expect(css).toContain("unicode-range:");
  expect(css).toContain("url(./fonts/");
  expect(css).not.toContain("format('woff')");
  expect(
    await Bun.file(
      `${import.meta.dir}/dist/fonts/ibm-plex-sans-kr-0-400-normal.woff2`,
    ).exists(),
  ).toBe(true);
  expect(
    await Bun.file(
      `${import.meta.dir}/dist/fonts/ibm-plex-mono-latin-500-normal.woff2`,
    ).exists(),
  ).toBe(true);
});
