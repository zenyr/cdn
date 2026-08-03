# zenyr/cdn

Versioned browser assets for embed compatibility experiments.

## Assets

- `dist/probe.iife.js`: minimal classic-script loading probe
- `dist/probe.esm.js`: minimal standalone ES module loading probe
- `dist/embed-test.iife.js`: React 19 + Mantine 9 external IIFE experiment
- `dist/embed-test.iife.css`: styles for the external IIFE experiment
- `dist/embed-test.esm.js`: same React/Mantine experiment as standalone ESM
- `dist/embed-test.esm.css`: styles for the ESM experiment

Build with Bun:

```sh
bun install
bun run build
```

GitHub-backed jsDelivr URL format:

```text
https://cdn.jsdelivr.net/gh/zenyr/cdn@<commit>/dist/probe.iife.js
```

Pin production consumers to a commit SHA. Do not use `main` for stable reports.

The probe ships in classic IIFE and ESM formats because embed hosts may apply different CSP rules to each. Choose the runtime format only after testing the target host; jsDelivr itself supports both.
