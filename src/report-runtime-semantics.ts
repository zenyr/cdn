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
