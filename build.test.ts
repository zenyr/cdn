import { expect, test } from "bun:test";

const read = (path: string) => Bun.file(`${import.meta.dir}/${path}`).text();

test("build emits expected CDN assets", async () => {
  for (const path of [
    "dist/probe.iife.js",
    "dist/probe.esm.js",
    "dist/embed-test.iife.js",
    "dist/embed-test.iife.css",
  ]) {
    expect(await Bun.file(`${import.meta.dir}/${path}`).exists()).toBe(true);
  }
});

test("browser assets avoid restricted runtime APIs", async () => {
  const source = `${await read("dist/probe.iife.js")}\n${await read("dist/probe.esm.js")}\n${await read("dist/embed-test.iife.js")}`;
  expect(source).not.toMatch(/\beval\s*\(/);
  expect(source).not.toMatch(/\bnew\s+(?:Function|Worker)\b/);
  expect(source).not.toMatch(/\b(?:fetch|createObjectURL)\s*\(/);
  expect(source).not.toMatch(/\bimport\s*\(/);
});

test("local example references built assets", async () => {
  const html = await read("examples/embed-test.html");
  expect(html).toContain("../dist/embed-test.iife.css");
  expect(html).toContain("../dist/embed-test.iife.js");
});
