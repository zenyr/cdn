import { expect, test } from "bun:test";
import {
  tableCellProps,
  themeToggleProps,
} from "./src/report-runtime-semantics";

const read = (path: string) => Bun.file(`${import.meta.dir}/${path}`).text();

test("GFM table cells preserve alignment and identify column headers", async () => {
  expect(tableCellProps("center", true)).toEqual({
    style: { textAlign: "center" },
    scope: "col",
  });
  expect(tableCellProps("right", false)).toEqual({
    style: { textAlign: "right" },
  });
  expect(tableCellProps(null, false)).toEqual({});

  const runtime = await read("src/report-runtime.esm.ts");
  expect(runtime).toContain(
    "tableCellProps(node.align?.[cellKey], Cell === \"th\")",
  );
});

test("theme toggle exposes its current state and next action", () => {
  expect(themeToggleProps(false)).toEqual({
    label: "다크 모드로 전환",
    "aria-label": "다크 모드로 전환",
    "aria-pressed": false,
  });
  expect(themeToggleProps(true)).toEqual({
    label: "라이트 모드로 전환",
    "aria-label": "라이트 모드로 전환",
    "aria-pressed": true,
  });
});

test("report CSS sets relaxed reading rhythm and a conservative print baseline", async () => {
  const css = await read("src/report-runtime.css");
  expect(css).toMatch(/main\s*{[^}]*line-height:\s*1\.65;/s);

  const print = css.match(/@media print\s*{([\s\S]*)}\s*$/)?.[1] ?? "";
  expect(print).toMatch(/\.report-theme-control\s*{[^}]*display:\s*none !important;/s);
  expect(print).toMatch(/main\.report-document\s*{[^}]*padding:\s*0;/s);
  expect(print).toContain("--mantine-color-body: #fff;");
  expect(print).toContain("--mantine-color-text: #000;");
  expect(print).toMatch(/tr,[^}]*break-inside:\s*avoid;/s);
  expect(print).toMatch(/figure,[^}]*break-inside:\s*avoid;/s);
  expect(print).toContain(".mantine-Card-root");
});
