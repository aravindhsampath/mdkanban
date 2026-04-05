import type { SectionName } from "../../../shared/types";

export const SECTION_CONFIG: Record<
  SectionName,
  { label: string; color: string; icon: string }
> = {
  TODO: {
    label: "Todo",
    color: "var(--section-todo)",
    icon: "○",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "var(--section-in-progress)",
    icon: "◐",
  },
  DONE: {
    label: "Done",
    color: "var(--section-done)",
    icon: "●",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "var(--section-cancelled)",
    icon: "⊘",
  },
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  high: { label: "High", color: "var(--accent-orange)", icon: "▲" },
  medium: { label: "Medium", color: "var(--accent-blue)", icon: "■" },
  low: { label: "Low", color: "var(--accent-gray)", icon: "▼" },
};
