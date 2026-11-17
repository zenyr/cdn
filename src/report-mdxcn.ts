import * as React from "react";

type Registry = Record<string, React.ComponentType<any>>;
let renderer: Promise<{ mdxcnComponents: Registry }> | undefined;
const loadRenderer = () => renderer ??= import(
  new URL("./report-mdxcn-renderer.esm.js", import.meta.url).href
);

class FigureBoundary extends React.Component<{
  name: string;
  fallback: React.ReactNode;
  children?: React.ReactNode;
}, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    window.dispatchEvent(new CustomEvent("zenyr:mdxcn-error", { detail: { name: this.props.name } }));
  }
  render() {
    return this.state.failed
      ? React.createElement("div", { "data-mdxcn-error": this.props.name }, this.props.fallback)
      : this.props.children;
  }
}

const numericAttributes: Record<string, readonly string[]> = {
  GraphCalendar: ["year", "month", "today", "weekStartsOn"],
  GraphActivity: ["weekStartsOn"],
};
const normalizeProps = (name: string, props: Record<string, unknown>) => {
  const normalized = { ...props };
  for (const key of numericAttributes[name] ?? []) {
    const value = normalized[key];
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) normalized[key] = Number(value);
  }
  return normalized;
};

const scalarText = (props: Record<string, unknown>) => Object.entries(props)
  .filter(([key, value]) => key !== "className" && (typeof value === "string" || typeof value === "number"))
  .map(([, value]) => value)
  .join(" · ");

const figure = (name: string) => {
  const Component = React.lazy(() => loadRenderer().then(module => ({ default: module.mdxcnComponents[name] })));
  return function MdxcnFigure({ mdx, ...props }: { mdx?: { text: string }; children?: React.ReactNode }) {
    const fallback = React.createElement("div", null,
      React.Children.count(props.children) ? props.children : mdx?.text || scalarText(props),
    );
    return React.createElement(
      FigureBoundary,
      { name, fallback },
      React.createElement(
        React.Suspense,
        { fallback: React.createElement("div", { "data-mdxcn-loading": name }, fallback) },
        React.createElement(Component, normalizeProps(name, props)),
      ),
    );
  };
};

const item = (name: string) => Object.assign(
  ({ children, mdx, ...props }: { children?: React.ReactNode; mdx?: unknown }) => React.createElement(
    "div", null,
    scalarText(props),
    children,
  ),
  { graphItem: name, displayName: name },
);

export const mdxcnComponents: Registry = {
  Graph: figure("Graph"),
  GraphArrow: figure("GraphArrow"),
  GraphBody: figure("GraphBody"),
  GraphCorners: figure("GraphCorners"),
  GraphFrameProvider: figure("GraphFrameProvider"),
  GraphProse: figure("GraphProse"),
  GraphRule: figure("GraphRule"),
  GraphRuleY: figure("GraphRuleY"),
  GraphTick: figure("GraphTick"),
  GraphTitle: figure("GraphTitle"),
  GraphTrack: figure("GraphTrack"),
  Callout: figure("Callout"),
  Quote: figure("Quote"),
  Steps: figure("Steps"),
  Terminal: figure("Terminal"),
  Changelog: figure("Changelog"),
  Annotate: figure("Annotate"),
  Decision: figure("Decision"),
  Chat: figure("Chat"),
  Env: figure("Env"),
  Endpoint: figure("Endpoint"),
  Keys: figure("Keys"),
  Faq: figure("Faq"),
  GraphTable: figure("GraphTable"),
  GraphSheet: figure("GraphSheet"),
  GraphFlow: figure("GraphFlow"),
  GraphBars: figure("GraphBars"),
  GraphRank: figure("GraphRank"),
  GraphCells: figure("GraphCells"),
  GraphMeter: figure("GraphMeter"),
  GraphSpark: figure("GraphSpark"),
  GraphTree: figure("GraphTree"),
  GraphTimeline: figure("GraphTimeline"),
  GraphCheck: figure("GraphCheck"),
  GraphStack: figure("GraphStack"),
  GraphFunnel: figure("GraphFunnel"),
  GraphGantt: figure("GraphGantt"),
  GraphBoard: figure("GraphBoard"),
  GraphPlot: figure("GraphPlot"),
  GraphWaffle: figure("GraphWaffle"),
  GraphDiff: figure("GraphDiff"),
  GraphInvoice: figure("GraphInvoice"),
  GraphCompare: figure("GraphCompare"),
  GraphMatrix: figure("GraphMatrix"),
  GraphStat: figure("GraphStat"),
  GraphKpi: figure("GraphKpi"),
  GraphSpec: figure("GraphSpec"),
  GraphActivity: figure("GraphActivity"),
  GraphHeatmap: figure("GraphHeatmap"),
  GraphCalendar: figure("GraphCalendar"),
  GraphWaterfall: figure("GraphWaterfall"),
  GraphUptime: figure("GraphUptime"),
  GraphSlope: figure("GraphSlope"),
  GraphBullet: figure("GraphBullet"),
  GraphScore: figure("GraphScore"),
  GraphTimer: figure("GraphTimer"),
  GraphCountdown: figure("GraphCountdown"),
  Step: item("Step"),
  Change: item("Change"),
  Cell: item("Cell"),
  Foot: item("Foot"),
  Head: item("Head"),
  Row: item("Row"),
  Section: item("Section"),
  Path: item("Path"),
  Series: item("Series"),
  Rank: item("Rank"),
  Grid: item("Grid"),
  Node: item("Node"),
  Event: item("Event"),
  Task: item("Task"),
  Bar: item("Bar"),
  Segment: item("Segment"),
  Stage: item("Stage"),
  Span: item("Span"),
  Line: item("Line"),
  From: item("From"),
  Item: item("Item"),
  Meta: item("Meta"),
  To: item("To"),
  Total: item("Total"),
  Col: item("Col"),
  Stat: item("Stat"),
  Field: item("Field"),
  Delta: item("Delta"),
  Slope: item("Slope"),
  Target: item("Target"),
};

export const isMdxcnItem = (name: string) =>
  Object.hasOwn(mdxcnComponents, name) && Object.hasOwn(mdxcnComponents[name], "graphItem");
