import * as React from "react";

type SectionProps = {
  title?: string;
  label?: string;
  summary?: string;
  id?: string;
  children?: React.ReactNode;
};

export function ReportSection({ title, label, summary, id, children }: SectionProps) {
  const headingId = `report-section-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return React.createElement(
    "section",
    { id, className: "report-section", "aria-labelledby": title ? headingId : undefined },
    (title || label || summary) && React.createElement(
      "header",
      { className: "report-section-heading" },
      label && React.createElement("div", { className: "report-section-label" }, label),
      title && React.createElement("h2", { id: headingId }, title),
      summary && React.createElement("p", null, summary),
    ),
    React.createElement("div", { className: "report-section-body" }, children),
  );
}

export function ReportGrid({ children }: { children?: React.ReactNode }) {
  return React.createElement("div", { className: "report-section-grid" }, children);
}
