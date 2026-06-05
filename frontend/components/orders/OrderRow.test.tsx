import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OrderFeedItem } from "@/lib/orders/types";
import { OrderRow } from "./OrderRow";

const order: OrderFeedItem = {
  order_id: "ord_1",
  order_number: "1001",
  created_at: "2024-06-01T12:00:00Z",
  financial_status: "paid",
  utm_campaign: null,
  country: null,
  total_price: 120,
  items: [{ title: "Court Trainer", quantity: 2, price: 60 }],
};

describe("OrderRow", () => {
  it("renders order number and line items", () => {
    render(<OrderRow order={order} />);
    expect(screen.getByText(/#1001/)).toBeInTheDocument();
    expect(screen.getByText(/Court Trainer ×2/)).toBeInTheDocument();
  });
});
