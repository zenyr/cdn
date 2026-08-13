export type TableAlignment = "left" | "center" | "right" | null;

export const tableCellProps = (
  alignment: TableAlignment | undefined,
  header: boolean,
) => ({
  ...(alignment ? { style: { textAlign: alignment } } : {}),
  ...(header ? { scope: "col" as const } : {}),
});

export const themeToggleProps = (dark: boolean) => {
  const label = dark ? "라이트 모드로 전환" : "다크 모드로 전환";
  return {
    label,
    "aria-label": label,
    "aria-pressed": dark,
  };
};

export const svgFigureA11y = (id: string, label: string, description?: string) => {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) {
    throw new Error("SvgFigure id must start with a letter and contain only letters, numbers, _ or -");
  }
  if (!label.trim()) throw new Error("SvgFigure label is required");
  return {
    role: "img" as const,
    "aria-labelledby": `${id}-title${description ? ` ${id}-description` : ""}`,
  };
};
