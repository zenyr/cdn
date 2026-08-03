import { mkdir, rm } from "node:fs/promises";

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
  ],
  outdir: `${import.meta.dir}/dist`,
  naming: "[name].[ext]",
  format: "esm",
  target: "browser",
  minify: true,
  sourcemap: "external",
  define: { "process.env.NODE_ENV": '"production"' },
});

for (const result of [iife, esm]) {
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
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
