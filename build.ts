import { mkdir, rm } from "node:fs/promises";
import "./generate-oss-licenses";

await rm(`${import.meta.dir}/dist`, { recursive: true, force: true });

const fontSources = [
  {
    package: "@fontsource/ibm-plex-sans-kr",
    files: ["400.css", "500.css", "600.css", "700.css"],
  },
  {
    package: "@fontsource/ibm-plex-mono",
    files: ["latin-400.css", "latin-500.css"],
  },
];
let fontCss = "";
const fontFiles = new Map<string, string>();
for (const font of fontSources) {
  for (const file of font.files) {
    const source = await Bun.file(
      `${import.meta.dir}/node_modules/${font.package}/${file}`,
    ).text();
    fontCss += source
      .replace(/,\s*url\([^)]*\.woff\)\s*format\(["']woff["']\)/g, "")
      .replace(/url\(\.\/files\/([^)]*\.woff2)\)/g, (_, name) => {
        fontFiles.set(
          name,
          `${import.meta.dir}/node_modules/${font.package}/files/${name}`,
        );
        return `url(./fonts/${name})`;
      });
  }
}

const iife = await Bun.build({
  entrypoints: [
    `${import.meta.dir}/src/probe.iife.ts`,
    `${import.meta.dir}/src/embed-test.iife.tsx`,
  ],
  outdir: `${import.meta.dir}/dist`,
  naming: "[name].[ext]",
  format: "iife",
  target: "browser",
  minify: true,
  sourcemap: "external",
  define: { "process.env.NODE_ENV": '"production"' },
});

const esm = await Bun.build({
  entrypoints: [
    `${import.meta.dir}/src/probe.esm.ts`,
    `${import.meta.dir}/src/embed-test.esm.tsx`,
    `${import.meta.dir}/src/report-mermaid-renderer.esm.ts`,
  ],
  outdir: `${import.meta.dir}/dist`,
  naming: "[name].[ext]",
  format: "esm",
  target: "browser",
  minify: true,
  sourcemap: "external",
  define: { "process.env.NODE_ENV": '"production"' },
});

const reports = await Bun.build({
  entrypoints: [
    `${import.meta.dir}/src/report-runtime.esm.ts`,
    `${import.meta.dir}/src/report-mdxcn-renderer.esm.ts`,
  ],
  outdir: `${import.meta.dir}/dist`,
  naming: {
    entry: "[name].[ext]",
    chunk: "report-shared-[hash].[ext]",
    asset: "[name].[ext]",
  },
  format: "esm",
  splitting: true,
  banner: "/*! mdxcn · Copyright (c) 2026 Keshav Bagaade · MIT · see mdxcn-LICENSE.txt */",
  target: "browser",
  minify: true,
  sourcemap: "external",
  define: { "process.env.NODE_ENV": '"production"' },
});

for (const result of [iife, esm, reports]) {
  if (!result.success) throw new AggregateError(result.logs, "Browser asset build failed");
}

const tailwind = Bun.spawn([
  "bun", "x", "--no-install", "tailwindcss",
  "-i", "src/report-mdxcn.tailwind.css",
  "-o", "dist/report-mdxcn.css", "--minify",
], { cwd: import.meta.dir, stdout: "inherit", stderr: "inherit" });
if (await tailwind.exited !== 0) throw new Error("mdxcn CSS build failed");
await Bun.write(`${import.meta.dir}/dist/mdxcn-LICENSE.txt`, Bun.file(`${import.meta.dir}/src/vendor/mdxcn/LICENSE`));
const runtimeCss = `${import.meta.dir}/dist/report-runtime.esm.css`;
await Bun.write(runtimeCss, `${await Bun.file(runtimeCss).text()}\n${await Bun.file(`${import.meta.dir}/dist/report-mdxcn.css`).text()}`);

for (const result of [iife, esm, reports]) {
  for (const output of result.outputs) {
    console.log(
      `${output.path.replace(`${import.meta.dir}/`, "")} ${output.size} B`,
    );
  }
}

await mkdir(`${import.meta.dir}/dist/fonts`, { recursive: true });
await Bun.write(`${import.meta.dir}/dist/fonts.css`, fontCss);
for (const [name, source] of fontFiles) {
  await Bun.write(`${import.meta.dir}/dist/fonts/${name}`, Bun.file(source));
}
console.log(
  `dist/fonts.css ${fontCss.length} B · ${fontFiles.size} WOFF2 files`,
);
