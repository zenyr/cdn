# zenyr/cdn

Versioned browser assets for embed compatibility experiments.

## Assets

- `dist/probe.iife.js`: minimal classic-script loading probe
- `dist/probe.esm.js`: minimal standalone ES module loading probe
- `dist/embed-test.iife.js`: React 19 + Mantine 9 external IIFE experiment
- `dist/embed-test.iife.css`: styles for the external IIFE experiment
- `dist/embed-test.esm.js`: same React/Mantine experiment as standalone ESM
- `dist/embed-test.esm.css`: styles for the ESM experiment
- `dist/fonts.css`: IBM Plex Sans KR 400/500/600/700 and IBM Plex Mono 400/500 declarations
- `dist/fonts/`: WOFF2 files split by Unicode range for on-demand browser loading
- `dist/report-runtime.esm.js`: shared React/Mantine runtime for prebaked reports
- `dist/report-runtime.esm.css`: Mantine and report baseline styles

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

Load `fonts.css` before the component stylesheet. Sans KR is the default UI font. The monospace stack uses IBM Plex Mono where glyphs exist and falls back to IBM Plex Sans KR for Korean.


## Mixed reports and static diagrams

The safe MDX walker supports prose, GFM tables, registered chart components, and static editorial SVG figures in one document. `SvgFigure` is built in; no Mermaid parser, dynamic import, worker, fetch, `eval`, or unchecked HTML injection is used.

```mdx
## Request path

<SvgFigure id="request-path" label="Request path"
  description="A request moves from the browser through the edge to the origin."
  caption="The edge serves cache hits before origin fallback.">
```svg
<svg viewBox="0 0 640 160">
  <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" /></marker></defs>
  <rect x="20" y="45" width="150" height="70" rx="8" fill="#e7f5ff" />
  <text x="95" y="85" text-anchor="middle">Browser</text>
  <line x1="170" y1="80" x2="300" y2="80" stroke="currentColor" marker-end="url(#arrow)" />
  <rect x="300" y="45" width="150" height="70" rx="8" fill="#d3f9d8" />
  <text x="375" y="85" text-anchor="middle">Edge</text>
</svg>
```
</SvgFigure>
```

`id` must be document-unique and use letters, digits, `_`, and `-`. `label` is required; use `description` when the visual needs a longer accessible explanation. `caption` is visible context. The SVG is parsed with `DOMParser`, restricted to a presentation/geometry allowlist, stripped of authored dimensions for responsiveness, and has IDs/references prefixed per figure. Scripts, event handlers, foreign content, animation elements, external links/images, styles, and non-fragment URLs are rejected. Keep essential conclusions in prose or the caption rather than encoding them only visually.

`OssLicenseFooter` is also built in. If not authored explicitly, exactly one is appended to the report. Its click-triggered Mantine popover lists the complete production dependency closure resolved from `bun.lock`, including transitive runtime packages and fonts, while explicitly excluding development-only tools and report content. `bun run build` regenerates `src/oss-licenses.ts` from the lockfile and installed package license metadata; do not edit the inventory manually.


### Document content-source notices

Runtime packages and document provenance are distinct. Pass optional `documentLicenses` to `mountDocument`; every field is inert text except `projectUrl`, which must be HTTPS. Entries are merged with and deduplicated against the runtime inventory.

```js
Zenyr.report.mountDocument({
  root: "#root",
  source: "#doc",
  documentLicenses: [{
    name: "Acme icon set",
    version: "2026-08",
    license: "CC-BY-4.0",
    projectUrl: "https://example.com/icons",
    use: "Icons adapted in the service map",
  }],
});
```

`SvgFigure` does **not** imply diagram-design provenance by itself: ordinary hand-authored SVG must not produce a false notice. Mark only figures actually derived from the diagram-design skill or its design system with `source="diagram-design"`. The runtime then adds the built-in `diagram-design` 2.3.1 / MIT content-source notice once, regardless of how many marked figures occur. Reports without a marked figure do not list it. An explicitly authored `<OssLicenseFooter />` still suppresses auto-append, so exactly one footer is rendered.
