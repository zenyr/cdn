import { rm } from "node:fs/promises";

await rm(`${import.meta.dir}/dist`, { recursive: true, force: true });

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
  entrypoints: [`${import.meta.dir}/src/probe.esm.ts`],
  outdir: `${import.meta.dir}/dist`,
  naming: "[name].[ext]",
  format: "esm",
  target: "browser",
  minify: true,
  sourcemap: "external",
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
