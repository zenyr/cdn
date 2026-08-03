import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  Card,
  Group,
  MantineProvider,
  Progress,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "./embed-test.css";

const rows = [
  { name: "가", before: 0.897, after: 0.934 },
  { name: "나", before: 0.625, after: 0.719 },
];

function Report() {
  const [mode, setMode] = useState<"before" | "after">("before");
  const [count, setCount] = useState(0);
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme("light");
  const dark = scheme === "dark";

  return (
    <main className="zenyr-embed-main">
      <Group justify="space-between" align="flex-start" mb="xl">
        <div>
          <Badge color="teal" variant="light" mb="sm">
            CDN BUNDLE
          </Badge>
          <Title order={1}>CDN 임베딩 실험</Title>
          <Text c="dimmed" mt={6}>
            React 19 + Mantine 9를 외부 CDN 번들로 불러왔습니다.
          </Text>
        </div>
        <Button
          id="theme-button"
          variant="default"
          onClick={() => setColorScheme(dark ? "light" : "dark")}
        >
          {dark ? "라이트" : "다크"}
        </Button>
      </Group>

      <Stack gap="lg">
        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between">
            <div>
              <Text fw={600}>React 상태 변경</Text>
              <Text size="sm" c="dimmed">
                숫자가 바뀌면 외부 번들이 정상 실행된 것입니다.
              </Text>
            </div>
            <Button
              id="count-button"
              onClick={() => setCount((value) => value + 1)}
            >
              클릭 {count}
            </Button>
          </Group>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" mb="md">
            <Text fw={600}>Mantine 컴포넌트</Text>
            <SegmentedControl
              id="mode-switch"
              value={mode}
              onChange={(value) => setMode(value as "before" | "after")}
              data={[
                { label: "처치 전", value: "before" },
                { label: "처치 후", value: "after" },
              ]}
            />
          </Group>
          <Table>
            <Table.Tbody id="metric-rows">
              {rows.map((row) => (
                <Table.Tr key={row.name}>
                  <Table.Td>{row.name}</Table.Td>
                  <Table.Td>
                    <Progress value={row[mode] * 100} />
                  </Table.Td>
                  <Table.Td ta="right" ff="monospace">
                    {row[mode].toFixed(3)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </main>
  );
}

function App() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <Report />
    </MantineProvider>
  );
}

const root = document.getElementById("zenyr-report-root");
if (!root) throw new Error("#zenyr-report-root not found");
createRoot(root).render(<App />);
window.dispatchEvent(new CustomEvent("zenyr-embed-test-ready"));
