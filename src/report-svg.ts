import * as React from "react";
import { svgFigureA11y } from "./report-runtime-semantics";

export type SvgFigureProps = {
  id: string;
  label: string;
  caption?: string;
  description?: string;
  source?: string;
  mdx?: { text: string };
};

const svgTags = new Set([
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline",
  "polygon", "text", "tspan", "defs", "clipPath", "mask", "linearGradient",
  "radialGradient", "stop", "pattern", "marker", "symbol", "use",
]);
const svgAttributes = new Set([
  "id", "viewBox", "width", "height", "x", "y", "x1", "x2", "y1", "y2",
  "cx", "cy", "r", "rx", "ry", "d", "points", "transform", "fill",
  "fill-opacity", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "stroke-dasharray", "stroke-opacity", "opacity", "font-family", "font-size",
  "font-weight", "text-anchor", "dominant-baseline", "dx", "dy", "offset",
  "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "patternUnits",
  "patternContentUnits", "patternTransform", "markerWidth", "markerHeight",
  "markerUnits", "refX", "refY", "orient", "preserveAspectRatio", "clip-path",
  "marker-start", "marker-mid", "marker-end", "mask", "role", "aria-hidden", "focusable", "href", "xlink:href",
  "xmlns", "xmlns:xlink",
]);
const fragmentReference = /url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g;
const svgNamespace = "http://www.w3.org/2000/svg";
const xlinkNamespace = "http://www.w3.org/1999/xlink";

const constructSvg = (source: Element): SVGSVGElement => {
  const construct = (element: Element): Element => {
    const result = document.createElementNS(svgNamespace, element.localName);
    for (const attribute of [...element.attributes]) {
      if (attribute.name === "xmlns" || attribute.name === "xmlns:xlink") continue;
      if (attribute.name === "xlink:href") {
        result.setAttributeNS(xlinkNamespace, attribute.name, attribute.value);
      } else {
        result.setAttribute(attribute.name, attribute.value);
      }
    }
    for (const child of [...element.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) result.append(construct(child as Element));
      else if (child.nodeType === Node.TEXT_NODE) result.append(document.createTextNode(child.textContent ?? ""));
    }
    return result;
  };
  return construct(source) as SVGSVGElement;
};

export const prepareSvg = ({ id, label, description, source }: SvgFigureProps & { source: string }) => {
  const a11y = svgFigureA11y(id, label, description);
  const parsed = new DOMParser().parseFromString(source.trim(), "image/svg+xml");
  const parseError = parsed.querySelector("parsererror");
  const svg = parsed.documentElement;
  if (parseError || svg.localName !== "svg") throw new Error(`SvgFigure ${id} must contain one valid SVG root`);

  for (const element of [svg, ...svg.querySelectorAll("*")]) {
    if (!svgTags.has(element.localName)) throw new Error(`SvgFigure ${id} contains unsupported <${element.localName}>`);
    for (const attribute of [...element.attributes]) {
      const name = attribute.name;
      if (name.startsWith("on") || !svgAttributes.has(name)) {
        throw new Error(`SvgFigure ${id} contains unsupported attribute ${name}`);
      }
      if ((name === "xmlns" && attribute.value !== svgNamespace) ||
        (name === "xmlns:xlink" && attribute.value !== xlinkNamespace)) {
        throw new Error(`SvgFigure ${id} contains an invalid namespace declaration`);
      }
      if ((name === "href" || name === "xlink:href") && !attribute.value.startsWith("#")) {
        throw new Error(`SvgFigure ${id} contains an external reference`);
      }
      if (/url\(/i.test(attribute.value)) {
        fragmentReference.lastIndex = 0;
        const remainder = attribute.value.replace(fragmentReference, "");
        fragmentReference.lastIndex = 0;
        if (/url\(/i.test(remainder)) {
          throw new Error(`SvgFigure ${id} contains a non-fragment URL`);
        }
      }
    }
  }

  const viewBox = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    throw new Error(`SvgFigure ${id} requires a finite, positive viewBox`);
  }
  const ids = new Map<string, string>();
  for (const element of [svg, ...svg.querySelectorAll("[id]")].filter(element => element.hasAttribute("id"))) {
    const original = element.getAttribute("id")!;
    if (!original || ids.has(original) || original === "title" || original === "description") {
      throw new Error(`SvgFigure ${id} contains a duplicate or reserved id: ${original}`);
    }
    const prefixed = `${id}-${original}`;
    ids.set(original, prefixed);
    element.setAttribute("id", prefixed);
  }
  const reference = (ref: string) => {
    const result = ids.get(ref);
    if (!result) throw new Error(`SvgFigure ${id} references missing id: ${ref}`);
    return result;
  };
  for (const element of [svg, ...svg.querySelectorAll("*")]) {
    for (const attribute of [...element.attributes]) {
      let value = attribute.value.replace(fragmentReference, (_, quote, ref) =>
        `url(#${reference(ref)})`,
      );
      if ((attribute.name === "href" || attribute.name === "xlink:href") && value.startsWith("#")) {
        value = `#${reference(value.slice(1))}`;
      }
      element.setAttribute(attribute.name, value);
    }
  }
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("role", a11y.role);
  svg.setAttribute("aria-labelledby", a11y["aria-labelledby"]);
  svg.setAttribute("focusable", "false");
  const safeSvg = constructSvg(svg);
  const title = document.createElementNS(svgNamespace, "title");
  title.id = `${id}-title`;
  title.textContent = label;
  safeSvg.prepend(title);
  if (description) {
    const desc = document.createElementNS(svgNamespace, "desc");
    desc.id = `${id}-description`;
    desc.textContent = description;
    title.after(desc);
  }
  return safeSvg;
};

export function SvgFigure(props: SvgFigureProps) {
  const host = React.useRef<HTMLDivElement>(null);
  const svg = React.useMemo(() => prepareSvg({ ...props, source: props.mdx?.text ?? "" }), [
    props.id, props.label, props.description, props.mdx?.text,
  ]);
  React.useLayoutEffect(() => {
    if (host.current) host.current.replaceChildren(svg);
  }, [svg]);
  return React.createElement(
    "figure",
    { className: "report-svg-figure" },
    React.createElement("div", { className: "report-svg-canvas", ref: host }),
    props.caption && React.createElement("figcaption", null, props.caption),
  );
}

export class FigureErrorBoundary extends React.Component<React.PropsWithChildren<SvgFigureProps>, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    window.dispatchEvent(new CustomEvent("zenyr:figure-error", { detail: { id: this.props.id, error } }));
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return React.createElement("figure", { className: "report-svg-figure", "data-figure-error": this.props.id },
      React.createElement("p", { role: "status" }, `${this.props.label}: 그림을 표시할 수 없습니다.`),
      this.props.description && React.createElement("p", null, this.props.description),
      this.props.caption && React.createElement("figcaption", null, this.props.caption));
  }
}

export function SafeSvgFigure(props: SvgFigureProps) {
  return React.createElement(FigureErrorBoundary, { ...props, key: `${props.id}:${props.mdx?.text}` },
    React.createElement(SvgFigure, props));
}
