import { after, type NextRequest, NextResponse } from "next/server";

import { handleHugoMention } from "@/lib/hugo";
import { verifySlackRequest } from "@/lib/slack";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const verified = verifySlackRequest(body, {
    signature: req.headers.get("x-slack-signature"),
    timestamp: req.headers.get("x-slack-request-timestamp"),
  });
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const prompt = (params.get("text") ?? "status").trim() || "status";
  const channel = params.get("channel_id");
  const userId = params.get("user_id");

  if (!channel) {
    return NextResponse.json({ error: "Missing channel_id" }, { status: 400 });
  }

  after(() =>
    handleHugoMention({
      channel,
      prompt,
      userName: userId ?? undefined,
      userId: userId ?? undefined,
      teamId: params.get("team_id") ?? undefined,
    }),
  );

  return NextResponse.json({
    response_type: "ephemeral",
    text: "Working on it...",
  });
}
