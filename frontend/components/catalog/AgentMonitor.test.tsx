import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { KpiThreshold } from "@/lib/catalog";
import AgentMonitor from "./AgentMonitor";

const thresholds: KpiThreshold[] = [
  {
    id: "t1",
    product_id: "11111111-1111-4111-8111-111111111111",
    metric_definition_id: "22222222-2222-4222-8222-222222222221",
    metric_key: "return_rate",
    threshold: 10,
    direction: "above",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

describe("AgentMonitor", () => {
  it("shows Hugo monitor copy and KPI count", () => {
    render(<AgentMonitor kpis={thresholds} />);
    expect(screen.getByText("Hugo is watching this product")).toBeInTheDocument();
    expect(screen.getByText(/1 KPI/)).toBeInTheDocument();
    expect(screen.getByText("return rate")).toBeInTheDocument();
  });
});
