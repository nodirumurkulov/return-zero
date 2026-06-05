import { describe, expect, it, vi } from "vitest";
import type { OrderFeedItem } from "@/types/orders";
import { renderWithProviders, screen } from "@/test/test-utils";
import { OrdersFeed } from "./OrdersFeed";

const mutateAsync = vi.fn();

vi.mock("@/hooks/stores/analytics/replay", () => ({
  useAdvanceReplay: () => ({
    mutateAsync,
    isPending: false,
  }),
  useReplayOrders: () => vi.fn(),
}));

const initialOrders: OrderFeedItem[] = [
  {
    order_id: "ord_1",
    order_number: "1001",
    created_at: "2024-06-01T10:00:00Z",
    financial_status: "paid",
    utm_campaign: null,
    country: null,
    total_price: 99,
    items: [{ title: "Court Trainer", quantity: 1, price: 99 }],
  },
];

describe("OrdersFeed", () => {
  it("renders idle state with start control", () => {
    renderWithProviders(
      <OrdersFeed startDate="2024-01-01" dataEnd="2024-12-31" initialOrders={initialOrders} />,
    );
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });
});
