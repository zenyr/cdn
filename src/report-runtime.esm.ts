import * as React from "react";
import { createRoot } from "react-dom/client";
import htm from "htm";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Code,
  Divider,
  Grid,
  Group,
  List,
  MantineProvider,
  Paper,
  Popover,
  Progress,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "./report-runtime.css";
import "./report-code.css";
import { highlightCode } from "./report-code";
import {
  tableCellProps,
  themeToggleProps,
  type TableAlignment,
} from "./report-runtime-semantics";
import { SafeSvgFigure as SvgFigure } from "./report-svg";
import { ossLicenses } from "./oss-licenses";

type MdxNode = {
  type: string;
  value?: string;
  depth?: number;
  ordered?: boolean;
  checked?: boolean | null;
  url?: string;
  title?: string | null;
  alt?: string;
  lang?: string | null;
  name?: string | null;
  attributes?: { type: string; name?: string; value?: unknown }[];
  align?: TableAlignment[];
  children?: MdxNode[];
};

type RuntimeComponent = React.ComponentType<any>;
type ComponentRegistry = Record<string, RuntimeComponent>;

const html = htm.bind(React.createElement);
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);
const nodeText = (node: MdxNode): string =>
  node.value ?? node.children?.map(nodeText).join("") ?? "";

function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme("light");
  const dark = scheme === "dark";
  const toggle = themeToggleProps(dark);
  return React.createElement(
    Group,
    {
      className: "report-theme-control",
      justify: "flex-end",
      mb: "md",
    },
    React.createElement(
      Tooltip,
      { label: toggle.label },
      React.createElement(
        ActionIcon,
        {
          id: "theme-toggle",
          variant: "default",
          radius: "xl",
          size: "lg",
          onClick: () => setColorScheme(dark ? "light" : "dark"),
          "aria-label": toggle["aria-label"],
          "aria-pressed": toggle["aria-pressed"],
        },
        dark ? "☀" : "☾",
      ),
    ),
  );
}

type DocumentLicense = {
  name: string;
  version: string;
  license: string;
  projectUrl: string;
  use?: string;
};

const diagramDesignLicense: DocumentLicense = {
  name: "diagram-design",
  version: "2.3.1",
  license: "MIT",
  projectUrl: "https://github.com/cathrynlavery/diagram-design",
  use: "Content-source design system for marked SVG figures",
};
const DocumentLicensesContext = React.createContext<readonly DocumentLicense[]>([]);

function OssLicenseFooter() {
  const licenses = React.useContext(DocumentLicensesContext);
  return React.createElement(
    "footer",
    { className: "report-license-footer", "data-zenyr-license-footer": true },
    React.createElement(
      Popover,
      { width: "min(38rem, calc(100vw - 2rem))", position: "top-end", shadow: "md", trapFocus: true },
      React.createElement(
        Popover.Target,
        null,
        React.createElement(Button, { variant: "subtle", size: "compact-xs" }, `Open-source software (${licenses.length})`),
      ),
      React.createElement(
        Popover.Dropdown,
        null,
        React.createElement("h2", { className: "report-license-title" }, "Open-source software"),
        React.createElement(
          "p",
          { className: "report-license-scope" },
          "This lists the complete production dependency closure resolved from bun.lock for the CDN report runtime and bundled fonts, plus content-source notices declared by this document. It excludes development-only tools. Runtime versions and licenses come from installed package metadata; content-source entries describe provenance and do not claim the report content itself is open source.",
        ),
        React.createElement(
          ScrollArea,
          { h: "min(55vh, 28rem)", type: "auto" },
          React.createElement(
            "ul",
            { className: "report-license-list" },
            licenses.map((item) => React.createElement(
              "li",
              { key: `${item.name}-${item.version}` },
              React.createElement("a", { href: item.projectUrl, target: "_blank", rel: "noopener noreferrer" }, item.name),
              ` ${item.version} — ${item.license}${item.use ? ` · ${item.use}` : ""}`,
            )),
          ),
        ),
      ),
    ),
  );
}


const mdxProps = (node: MdxNode) => {
  const props: Record<string, unknown> = {};
  for (const attr of node.attributes ?? []) {
    if (attr.type !== "mdxJsxAttribute" || !attr.name) {
      throw new Error("MDX spread/expression attributes are not supported");
    }
    if (attr.value && typeof attr.value === "object") {
      throw new Error(`MDX expression attribute ${attr.name} is not supported`);
    }
    props[attr.name] = attr.value ?? true;
  }
  return props;
};

const renderNode = (
  node: MdxNode,
  components: ComponentRegistry,
  key: React.Key = 0,
): React.ReactNode => {
  const children = () =>
    node.children?.map((child, index) => renderNode(child, components, index));
  const element = (
    tag: React.ElementType,
    props: Record<string, unknown> = {},
  ) => React.createElement(tag, { ...props, key }, children());

  switch (node.type) {
    case "root":
      return React.createElement(React.Fragment, { key }, children());
    case "text":
      return node.value ?? "";
    case "paragraph":
      return element("p");
    case "heading":
      return element(`h${node.depth}`);
    case "strong":
      return element("strong");
    case "emphasis":
      return element("em");
    case "delete":
      return element("del");
    case "blockquote":
      return element("blockquote");
    case "inlineCode":
      return React.createElement("code", { key }, node.value);
    case "code":
      return React.createElement(
        "pre",
        { key },
        React.createElement(
          "code",
          { className: node.lang ? `language-${node.lang}` : undefined },
          highlightCode(node.value ?? "", node.lang),
        ),
      );
    case "break":
      return React.createElement("br", { key });
    case "thematicBreak":
      return React.createElement("hr", { key });
    case "link":
      return element("a", { href: node.url, title: node.title ?? undefined });
    case "image":
      return React.createElement("img", {
        key,
        src: node.url,
        alt: node.alt ?? "",
        title: node.title ?? undefined,
      });
    case "list":
      return element(node.ordered ? "ol" : "ul");
    case "listItem":
      return element(
        "li",
        node.checked == null ? {} : { "data-checked": node.checked },
      );
    case "table": {
      const [head, ...body] = node.children ?? [];
      const row = (item: MdxNode, Cell: "th" | "td", rowKey: React.Key) =>
        React.createElement(
          "tr",
          { key: rowKey },
          item.children?.map((cell, cellKey) =>
            React.createElement(
              Cell,
              {
                key: cellKey,
                ...tableCellProps(node.align?.[cellKey], Cell === "th"),
              },
              cell.children?.map((child, childKey) =>
                renderNode(child, components, childKey),
              ),
            ),
          ),
        );
      return React.createElement(
        "div",
        { key, className: "scroll-x" },
        React.createElement(
          "table",
          null,
          head && React.createElement("thead", null, row(head, "th", 0)),
          body.length > 0 &&
            React.createElement(
              "tbody",
              null,
              body.map((item, index) => row(item, "td", index)),
            ),
        ),
      );
    }
    case "tableRow":
      return element("tr");
    case "tableCell":
      return element("td");
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement": {
      if (!node.name)
        return React.createElement(React.Fragment, { key }, children());
      const Component = components[node.name];
      if (!Component) throw new Error(`Unknown MDX component: ${node.name}`);
      return React.createElement(
        Component,
        { ...mdxProps(node), key, mdx: { text: nodeText(node), node } },
        children(),
      );
    }
    case "mdxFlowExpression":
    case "mdxTextExpression":
    case "mdxjsEsm":
      throw new Error(`Executable MDX node is not supported: ${node.type}`);
    default:
      throw new Error(`Unsupported MDX node: ${node.type}`);
  }
};

const defaultComponents: ComponentRegistry = { ThemeToggle, SvgFigure, OssLicenseFooter };
const containsComponent = (node: MdxNode, name: string): boolean =>
  ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && node.name === name) ||
  (node.children?.some((child) => containsComponent(child, name)) ?? false);
const hasDiagramDesignFigure = (node: MdxNode): boolean =>
  ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    node.name === "SvgFigure" && mdxProps(node).source === "diagram-design") ||
  (node.children?.some(hasDiagramDesignFigure) ?? false);
const normalizeDocumentLicenses = (items: readonly DocumentLicense[]): DocumentLicense[] => {
  const normalized = items.map((item) => {
    for (const field of ["name", "version", "license", "projectUrl"] as const) {
      if (typeof item[field] !== "string" || !item[field].trim()) {
        throw new Error(`Document license ${field} must be a non-empty string`);
      }
    }
    if (item.use != null && typeof item.use !== "string") throw new Error("Document license use must be a string");
    let url: URL;
    try { url = new URL(item.projectUrl); } catch { throw new Error("Document license projectUrl must be an HTTPS URL"); }
    if (url.protocol !== "https:") throw new Error("Document license projectUrl must be an HTTPS URL");
    return { ...item };
  });
  return [...new Map(normalized.map((item) => [`${item.name}\0${item.version}\0${item.license}\0${item.projectUrl}`, item])).values()];
};
const mergeLicenses = (documentLicenses: readonly DocumentLicense[], diagramDesign: boolean) => {
  const declared = normalizeDocumentLicenses([
    ...(diagramDesign ? [diagramDesignLicense] : []),
    ...documentLicenses,
  ]);
  return [...new Map(
    [...ossLicenses, ...declared].map((item) => [
      `${item.name}\0${item.version}\0${item.license}\0${item.projectUrl}`,
      item,
    ]),
  ).values()];
};

const targetHighlightMs = 2400;
let targetHighlightTimer: number | undefined;
const highlightRenderedTarget = () => {
  const target = location.hash && document.querySelector<HTMLElement>(":target");
  if (!target) return;
  const expected = location.hash;
  document.querySelector(".report-target-highlight")?.remove();
  window.clearTimeout(targetHighlightTimer);
  target.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "center",
  });
  const bounds = target.getBoundingClientRect();
  const highlight = document.createElement("div");
  highlight.className = "report-target-highlight";
  Object.assign(highlight.style, {
    top: `${bounds.top + scrollY - 3}px`,
    left: `${bounds.left + scrollX - 5}px`,
    width: `${bounds.width + 10}px`,
    height: `${bounds.height + 6}px`,
  });
  document.body.append(highlight);
  targetHighlightTimer = window.setTimeout(() => {
    highlight.remove();
    if (location.hash === expected && document.querySelector(":target") === target) {
      try {
        history.replaceState(history.state, "", `${location.pathname}${location.search}`);
      } catch {
        // Some file:// and sandboxed hosts reject History API writes. Retain the hash safely.
      }
    }
  }, targetHighlightMs);
};

function ReportDocument({ content, appendLicenseFooter, licenses }: { content: React.ReactNode; appendLicenseFooter: boolean; licenses: readonly DocumentLicense[] }) {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("zenyr:rendered"));
    highlightRenderedTarget();
    window.addEventListener("hashchange", highlightRenderedTarget);
    return () => {
      window.removeEventListener("hashchange", highlightRenderedTarget);
      window.clearTimeout(targetHighlightTimer);
      document.querySelector(".report-target-highlight")?.remove();
    };
  }, []);
  return React.createElement(
    DocumentLicensesContext.Provider,
    { value: licenses },
    React.createElement(
      "main",
      { className: "report-document" },
      content,
      appendLicenseFooter && React.createElement(OssLicenseFooter),
    ),
  );
}

const mountDocument = ({
  root,
  source,
  components = {},
  documentLicenses = [],
}: {
  root: string | HTMLElement;
  source: string | HTMLElement;
  components?: ComponentRegistry;
  documentLicenses?: readonly DocumentLicense[];
}) => {
  const rootElement =
    typeof root === "string" ? document.querySelector<HTMLElement>(root) : root;
  const sourceElement =
    typeof source === "string"
      ? document.querySelector<HTMLElement>(source)
      : source;
  if (!rootElement) throw new Error("MDX root not found");
  if (!sourceElement) throw new Error("MDX source not found");
  const tree = parser.parse(sourceElement.textContent ?? "") as MdxNode;
  createRoot(rootElement).render(
    React.createElement(
      MantineProvider,
      { defaultColorScheme: "auto" },
      React.createElement(ReportDocument, {
        content: renderNode(tree, { ...defaultComponents, ...components }),
        appendLicenseFooter: !containsComponent(tree, "OssLicenseFooter"),
        licenses: mergeLicenses(documentLicenses, hasDiagramDesignFigure(tree)),
      }),
    ),
  );
};

const runtime = {
  React,
  html,
  createRoot,
  mountDocument,
  nodeText,
  defaultComponents,
  Mantine: {
    ActionIcon,
    Anchor,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Code,
    Divider,
    Grid,
    Group,
    List,
    MantineProvider,
    Paper,
    Popover,
    Progress,
    ScrollArea,
    SegmentedControl,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
    ThemeIcon,
    Title,
    Tooltip,
    useComputedColorScheme,
    useMantineColorScheme,
  },
};

declare global {
  interface Window {
    Zenyr?: { report?: typeof runtime };
  }
}

const namespace = (window.Zenyr ??= {});
namespace.report = runtime;
window.dispatchEvent(new CustomEvent("zenyr:ready", { detail: runtime }));
