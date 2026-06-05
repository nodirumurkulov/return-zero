import { after, type NextRequest, NextResponse } from "next/server";
import { handleHugoMention } from "@/lib/hugo";
import { parseSlackEventEnvelope, stripSlackMentions, verifySlackRequest } from "@/lib/slack";

export const dynamic = "force-dynamic";

/**
 * POST /api/slack/events
 * Slack Events API endpoint for the @hugo bot.
 * Handles the URL-verification handshake and `app_mention` events: it acks
 * immediately (within Slack's 3s window) and delegates the reply (chat, data
 * Q&A, or investigate/approve actions) to `@/lib/hugo` in the background via
 * `after()`.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();

  const verified = verifySlackRequest(body, {
    signature: req.headers.get("x-slack-signature"),
    timestamp: req.headers.get("x-slack-request-timestamp"),
  });
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const envelope = parseSlackEventEnvelope(body);
  if (!envelope) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // URL verification handshake performed when the Request URL is saved.
  if (envelope.type === "url_verification") {
    return NextResponse.json({ challenge: envelope.challenge ?? "" });
  }

  // Slack retries on timeout — ignore retries so we never double-reply.
  if (req.headers.get("x-slack-retry-num")) {
    return new NextResponse(null, { status: 200 });
  }

  const event = envelope.event;
  // Only respond to real user @mentions; ignore bot/system messages (no loops).
  if (
    event?.type === "app_mention" &&
    event.channel &&
    event.text &&
    !event.bot_id &&
    event.subtype !== "bot_message"
  ) {
    const channel = event.channel;
    const threadTs = event.thread_ts ?? event.ts;
    const prompt = stripSlackMentions(event.text);

    after(() => handleHugoMention({ channel, threadTs, prompt, userName: event.user }));
  }

  return new NextResponse(null, { status: 200 });
}
