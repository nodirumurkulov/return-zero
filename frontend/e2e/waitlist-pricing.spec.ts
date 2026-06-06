import { test, expect } from "./fixtures";

test.describe("waitlist pricing negotiation", () => {
  test("joins waitlist and opens pricing chat with seeded opening message", async ({ page, admin }) => {
    const email = `pricing-e2e-${Date.now()}@example.test`;

    await page.goto("/#waitlist");
    await page.getByLabel(/work email/i).fill(email);
    await page.getByRole("button", { name: "Join waitlist" }).click();

    await expect(page).toHaveURL(/\/waitlist\/pricing\?token=/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Find your Hugo plan" })).toBeVisible();
    await expect(page.getByText("Hugo's pricing specialist")).toBeVisible({ timeout: 15_000 });

    const token = new URL(page.url()).searchParams.get("token");
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const signup = await admin
      .from("waitlist_signups")
      .select("id, email, negotiation_status")
      .eq("email", email)
      .single();
    expect(signup.error).toBeNull();
    expect(signup.data?.email).toBe(email);
    expect(signup.data?.negotiation_status).toBe("in_progress");

    const openingMessages = await admin
      .from("waitlist_pricing_messages")
      .select("role, content")
      .eq("waitlist_signup_id", signup.data?.id ?? "")
      .order("created_at", { ascending: true });
    expect(openingMessages.error).toBeNull();
    expect(openingMessages.data?.some((row) => row.role === "assistant")).toBe(true);
  });

  test("persists user messages and saves agreed price for Stripe", async ({ page, admin, request }) => {
    const email = `pricing-deal-${Date.now()}@example.test`;

    const waitlistResponse = await request.post("/api/waitlist", {
      data: { email },
    });
    expect(waitlistResponse.ok()).toBe(true);
    const waitlistBody = (await waitlistResponse.json()) as { pricingToken?: string };
    expect(waitlistBody.pricingToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    await page.goto(`/waitlist/pricing?token=${waitlistBody.pricingToken}`);
    await expect(page.getByRole("heading", { name: "Find your Hugo plan" })).toBeVisible();

    const signup = await admin
      .from("waitlist_signups")
      .select("id")
      .eq("email", email)
      .single();
    expect(signup.error).toBeNull();

    await page.getByLabel(/your message/i).fill("We run 3 Shopify stores with a team of 8.");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("We run 3 Shopify stores with a team of 8.")).toBeVisible();

    await expect
      .poll(
        async () => {
          const messages = await admin
            .from("waitlist_pricing_messages")
            .select("role")
            .eq("waitlist_signup_id", signup.data?.id ?? "");
          if (messages.error) {
            return 0;
          }
          return messages.data?.filter((row) => row.role === "user").length ?? 0;
        },
        { timeout: 15_000 },
      )
      .toBe(1);

    const finalized = await admin
      .from("waitlist_signups")
      .update({
        negotiation_status: "accepted",
        selected_tier: "teams",
        offered_price_cents: 39_900,
        agreed_price_cents: 39_900,
        negotiation_completed_at: new Date().toISOString(),
      })
      .eq("id", signup.data?.id ?? "")
      .select("negotiation_status, selected_tier, agreed_price_cents")
      .single();
    expect(finalized.error).toBeNull();
    expect(finalized.data?.negotiation_status).toBe("accepted");
    expect(finalized.data?.selected_tier).toBe("teams");
    expect(finalized.data?.agreed_price_cents).toBe(39_900);

    await page.reload();
    await expect(page.getByRole("heading", { name: "You're all set" })).toBeVisible();
    await expect(page.getByText("$399")).toBeVisible();

    const closedChat = await request.post("/api/waitlist/pricing/chat", {
      data: {
        token: waitlistBody.pricingToken,
        message: "Can we talk more?",
      },
    });
    expect(closedChat.status()).toBe(409);
  });
});
