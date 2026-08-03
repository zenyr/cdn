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
  return React.createElement(
    Group,
    { justify: "flex-end", mb: "md" },
    React.createElement(
      Tooltip,
      { label: dark ? "라이트 모드" : "다크 모드" },
      React.createElement(
        ActionIcon,
        {
          id: "theme-toggle",
          variant: "default",
          radius: "xl",
          size: "lg",
          onClick: () => setColorScheme(dark ? "light" : "dark"),
          "aria-label": "색상 모드 전환",
        },
        dark ? "☀" : "☾",
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
          node.value,
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
              { key: cellKey },
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

const defaultComponents: ComponentRegistry = { ThemeToggle };

function ReportDocument({ content }: { content: React.ReactNode }) {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("zenyr:rendered"));
  }, []);
  return React.createElement("main", null, content);
}

const mountDocument = ({
  root,
  source,
  components = {},
}: {
  root: string | HTMLElement;
  source: string | HTMLElement;
  components?: ComponentRegistry;
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
