import * as React from "react";
import "./report-mermaid.css";

type Renderer = typeof import("./report-mermaid-renderer.esm");
let renderer: Promise<Renderer> | undefined;
const loadRenderer = () => renderer ??= import(
  new URL("./report-mermaid-renderer.esm.js", import.meta.url).href
);

export function MermaidBlock({ source }: { source: string }) {
  const host = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [status, setStatus] = React.useState<"loading" | "ready" | "failed">("loading");
  const failed = status === "failed";

  React.useLayoutEffect(() => {
    if (!host.current) return;
    let active = true;
    let destroy: (() => void) | undefined;
    setStatus("loading");
    const fail = () => {
      if (!active) return;
      setStatus("failed");
      window.dispatchEvent(new CustomEvent("zenyr:mermaid-error", { detail: { id } }));
    };
    loadRenderer().then(({ mountDiagram }) => {
      if (!active || !host.current) return;
      destroy = mountDiagram(host.current, source, `mermaid-${id}-`, fail);
      setStatus(current => current === "failed" ? current : "ready");
    }).catch(fail);
    return () => {
      active = false;
      destroy?.();
    };
  }, [source, id]);

  return React.createElement("figure", {
    className: "report-mermaid-figure",
    "data-mermaid-error": failed ? id : undefined,
    "aria-busy": status === "loading",
  },
  React.createElement("div", {
    ref: host,
    className: "report-mermaid-canvas",
    hidden: failed,
    role: "img",
    "aria-label": "Mermaid 다이어그램",
  }),
  React.createElement("details", { open: status !== "ready" },
    React.createElement("summary", null, failed ? "다이어그램을 표시할 수 없습니다. 원문 보기" : status === "loading" ? "다이어그램 로딩 중 · 원문 보기" : "다이어그램 원문 보기"),
    React.createElement("pre", null, React.createElement("code", { className: "language-mermaid" }, source)),
  ));
}
