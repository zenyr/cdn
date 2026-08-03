import * as React from "react";
import { createRoot } from "react-dom/client";
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

const runtime = {
  React,
  createRoot,
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
    ZenyrReportRuntime: typeof runtime;
  }
}

window.ZenyrReportRuntime = runtime;
window.dispatchEvent(
  new CustomEvent("zenyr-report-runtime-ready", { detail: runtime }),
);
