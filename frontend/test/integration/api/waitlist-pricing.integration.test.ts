import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getPricingSessionMock, runPricingNegotiationTurnMock } = vi.hoisted(() => ({
  getPricingSessionMock: vi.fn(),
  runPricingNegotiationTurnMock: vi.fn(),
}));

vi.mock("@/lib/waitlist-pricing", async () => {
  const actual = await vi.importActual("@/lib/waitlist-pricing");
  return {
    ...actual,
    getPricingSession: getPricingSessionMock,
    runPricingNegotiationTurn: runPricingNegotiationTurnMock,
  };
});

import { POST } from "@/app/api/waitlist/pricing/chat/route";
import { GET } from "@/app/api/waitlist/pricing/session/route";

const TOKEN = "550e8400-e29b-41d4-a716-446655440000";

describe("GET /api/waitlist/pricing/session", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid token", async () => {
    const res = await GET(new NextRequest("http://localhost/api/waitlist/pricing/session?token=bad"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when session is missing", async () => {
    getPricingSessionMock.mockResolvedValue(null);
    const res = await GET(
      new NextRequest(`http://localhost/api/waitlist/pricing/session?token=${TOKEN}`),
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/waitlist/pricing/chat", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/waitlist/pricing/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "bad" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(runPricingNegotiationTurnMock).not.toHaveBeenCalled();
  });

  it("returns 409 when negotiation is closed", async () => {
    getPricingSessionMock.mockResolvedValue({
      signup: {
        id: "signup-1",
        email: "lead@example.test",
        confirmation_token: TOKEN,
        confirmed_at: new Date().toISOString(),
        negotiation_status: "accepted",
        selected_tier: "teams",
        offered_price_cents: 39_900,
        agreed_price_cents: 39_900,
        negotiation_completed_at: new Date().toISOString(),
      },
      messages: [],
      state: null,
    });

    const res = await POST(
      new NextRequest("http://localhost/api/waitlist/pricing/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: TOKEN,
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "hello" }],
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(409);
  });

  it("delegates open negotiations to the agent stream", async () => {
    getPricingSessionMock.mockResolvedValue({
      signup: {
        id: "signup-1",
        email: "lead@example.test",
        confirmation_token: TOKEN,
        confirmed_at: new Date().toISOString(),
        negotiation_status: "in_progress",
        selected_tier: null,
        offered_price_cents: null,
        agreed_price_cents: null,
        negotiation_completed_at: null,
      },
      messages: [],
      state: null,
    });

    runPricingNegotiationTurnMock.mockReturnValue({
      toUIMessageStreamResponse: () => new Response("stream", { status: 200 }),
    });

    const res = await POST(
      new NextRequest("http://localhost/api/waitlist/pricing/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: TOKEN,
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "We have 3 stores" }],
            },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(runPricingNegotiationTurnMock).toHaveBeenCalledOnce();
  });
});
