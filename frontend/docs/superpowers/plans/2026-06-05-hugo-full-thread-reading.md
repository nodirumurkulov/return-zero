# Hugo Full Thread Reading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hugo read the current Slack thread before replying so follow-ups like "the second one", "it", "approve that", and "how many days until that stocks out?" resolve from prior thread context.

**Architecture:** Add a Slack Web API thread reader around `conversations.replies`, normalize thread messages into a compact transcript, and feed that transcript into Hugo's intent and data-reply flow. Keep Hugo limited to the current thread, include inventory/stockout context when either the current prompt or thread asks about stock, and fall back cleanly when Slack history scopes are missing.

**Tech Stack:** Next.js route handlers, TypeScript, Slack Web API, AI SDK `generateText`, Vitest integration tests.

---

### File Map

- Modify: `frontend/lib/slack.ts` — add `fetchSlackThreadMessages()` and shared Slack API response typing.
- Modify: `frontend/app/api/slack/events/route.ts` — pass the triggering event `ts` to Hugo so the thread reader can exclude the current prompt when useful.
- Modify: `frontend/lib/hugo/index.ts` — fetch thread transcript, pass it into intent resolution and data replies, and add missing-scope fallback.
- Modify: `frontend/lib/hugo/reply.ts` — add thread-aware prompts for data and chat replies.
- Modify: `frontend/lib/hugo/context.ts` — add deterministic helpers to resolve ordinal/pronoun incident references from thread context and detect inventory/stockout questions from the thread.
- Modify: `frontend/test/integration/api/slack-events.integration.test.ts` — cover full thread reading and graceful missing-scope fallback.
- Modify: `frontend/lib/hugo/context.test.ts` and `frontend/lib/hugo/reply.test.ts` — unit-test transcript normalization and reference resolution.

### Task 1: Slack Thread Reader

**Files:**
- Modify: `frontend/lib/slack.ts`
- Test: `frontend/test/integration/api/slack-events.integration.test.ts`

- [ ] **Step 1: Write failing tests for Slack thread fetch behavior**

Add tests that mock `fetch` and expect Hugo to call `https://slack.com/api/conversations.replies` with `channel` and root `ts`, using `SLACK_BOT_TOKEN`.

Expected assertions:

```ts
expect(fetch).toHaveBeenCalledWith(
  expect.stringContaining("https://slack.com/api/conversations.replies"),
  expect.objectContaining({
    headers: expect.objectContaining({ Authorization: "Bearer xoxb-test" }),
  }),
);
```

- [ ] **Step 2: Run failing test**

Run: `bun run test:integration -- test/integration/api/slack-events.integration.test.ts`

Expected: FAIL because `fetchSlackThreadMessages` does not exist or is not called.

- [ ] **Step 3: Implement thread reader**

Add to `frontend/lib/slack.ts`:

```ts
export type SlackThreadMessage = {
  type?: string;
  user?: string;
  bot_id?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
};

export type SlackThreadReadResult =
  | { ok: true; messages: SlackThreadMessage[] }
  | { ok: false; error: string };

export async function fetchSlackThreadMessages(args: {
  channel: string;
  threadTs: string;
}): Promise<SlackThreadReadResult> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "missing_bot_token" };

  const url = new URL("https://slack.com/api/conversations.replies");
  url.searchParams.set("channel", args.channel);
  url.searchParams.set("ts", args.threadTs);
  url.searchParams.set("limit", "20");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; messages?: SlackThreadMessage[] }
    | null;

  if (!json?.ok) return { ok: false, error: json?.error ?? `http_${res.status}` };
  return { ok: true, messages: json.messages ?? [] };
}
```

- [ ] **Step 4: Run test**

Run: `bun run test:integration -- test/integration/api/slack-events.integration.test.ts`

Expected: PASS for new thread-reader test.

### Task 2: Transcript Normalization

**Files:**
- Modify: `frontend/lib/hugo/context.ts`
- Test: `frontend/lib/hugo/context.test.ts`

- [ ] **Step 1: Write failing transcript tests**

Add tests for converting Slack messages into concise transcript lines, stripping `<@U...>` mentions and ignoring empty messages.

Expected output:

```ts
expect(buildThreadTranscript(messages)).toBe([
  "User: show open incidents",
  "Hugo: 1. Returns spike [abc12345]",
  "User: investigate the first one",
].join("\n"));
```

- [ ] **Step 2: Run failing unit test**

Run: `bun run test -- lib/hugo/context.test.ts`

Expected: FAIL because `buildThreadTranscript` does not exist.

- [ ] **Step 3: Implement transcript helper**

Add to `frontend/lib/hugo/context.ts`:

```ts
import type { SlackThreadMessage } from "@/lib/slack";

export function buildThreadTranscript(messages: SlackThreadMessage[]): string {
  return messages
    .map((message) => {
      const text = (message.text ?? "").replace(/<@[A-Z0-9]+>/g, " ").replace(/\s+/g, " ").trim();
      if (!text) return null;
      const speaker = message.bot_id ? "Hugo" : "User";
      return `${speaker}: ${text}`;
    })
    .filter((line): line is string => Boolean(line))
    .slice(-12)
    .join("\n");
}
```

- [ ] **Step 4: Run unit test**

Run: `bun run test -- lib/hugo/context.test.ts`

Expected: PASS.

### Task 3: Thread-Aware Hugo Prompting

**Files:**
- Modify: `frontend/lib/hugo/reply.ts`
- Modify: `frontend/lib/hugo/index.ts`
- Test: `frontend/lib/hugo/reply.test.ts`

- [ ] **Step 1: Write failing tests for thread prompt inclusion**

Mock `generateText` and assert that `generateDataReply("what about the second one?", context, transcript)` includes both `Live app data:` and `Slack thread so far:` in the user prompt.

- [ ] **Step 2: Run failing unit test**

Run: `bun run test -- lib/hugo/reply.test.ts`

Expected: FAIL because `generateDataReply` only accepts two arguments.

- [ ] **Step 3: Extend reply functions**

Update signatures:

```ts
export async function generateChatReply(userText: string, threadTranscript?: string): Promise<string>
export async function generateDataReply(userText: string, context: string, threadTranscript?: string): Promise<string>
```

When `threadTranscript` is present, include:

```ts
`Slack thread so far:\n${threadTranscript}\n\nLatest question: ${userText}`
```

Also extend the system prompt with:

```ts
"Use the Slack thread to resolve pronouns and ordinal references, but use live app data as the source of truth."
```

- [ ] **Step 4: Fetch transcript in Hugo handler**

In `frontend/lib/hugo/index.ts`, call `fetchSlackThreadMessages()` before classification when `mention.threadTs` exists. If successful, convert with `buildThreadTranscript()` and pass it to reply generation.

When deciding whether to include stock/inventory context, check both `mention.prompt` and `threadTranscript`. If either contains inventory keywords such as `stock`, `inventory`, `stockout`, `units`, `left`, `reorder`, or `days to stockout`, append `buildInventoryContext()` to the live app data.

- [ ] **Step 5: Run tests**

Run: `bun run test -- lib/hugo/reply.test.ts lib/hugo/context.test.ts`

Expected: PASS.

### Task 4: Missing Scope Fallback

**Files:**
- Modify: `frontend/lib/hugo/index.ts`
- Test: `frontend/test/integration/api/slack-events.integration.test.ts`

- [ ] **Step 1: Write failing missing-scope test**

Mock `conversations.replies` returning `{ ok: false, error: "missing_scope" }`, send a follow-up prompt like `investigate the second one`, and assert Hugo posts:

```text
I need Slack thread history access to answer follow-ups like "the second one".
```

- [ ] **Step 2: Run failing integration test**

Run: `bun run test:integration -- test/integration/api/slack-events.integration.test.ts`

Expected: FAIL because Hugo does not special-case missing Slack history scopes.

- [ ] **Step 3: Implement fallback**

In `handleHugoMention`, if the thread read result is `missing_scope`, `not_in_channel`, or `channel_not_found` and the prompt contains pronoun/ordinal references (`/\b(it|that|this|first|second|third|one)\b/i`), post the fallback message and return.

- [ ] **Step 4: Run integration test**

Run: `bun run test:integration -- test/integration/api/slack-events.integration.test.ts`

Expected: PASS.

### Task 5: Ordinal Incident Reference Resolution

**Files:**
- Modify: `frontend/lib/hugo/context.ts`
- Modify: `frontend/lib/hugo/index.ts`
- Test: `frontend/lib/hugo/context.test.ts`

- [ ] **Step 1: Write failing ordinal tests**

Given a transcript containing Hugo's prior numbered list, assert:

```ts
expect(resolveThreadIncidentReference("investigate the second one", transcript)).toBe("abc12345");
```

- [ ] **Step 2: Run failing unit test**

Run: `bun run test -- lib/hugo/context.test.ts`

Expected: FAIL because `resolveThreadIncidentReference` does not exist.

- [ ] **Step 3: Implement ordinal parser**

Parse prior Hugo transcript lines matching either `1. ... [shortid]` or `- [shortid] ...`; map `first`, `second`, `third`, and numeric references to the short id. Return `null` if no unambiguous match exists.

- [ ] **Step 4: Use parser before `resolveIncident`**

In `handleHugoMention`, when `intent.incident_reference` is empty or ordinal/pronoun-like, call `resolveThreadIncidentReference(mention.prompt, threadTranscript)`. If it returns a short id, use that as the incident reference.

- [ ] **Step 5: Run unit test**

Run: `bun run test -- lib/hugo/context.test.ts`

Expected: PASS.

### Task 6: Block Kit Buttons For Hugo Incident Replies

**Files:**
- Modify: `frontend/lib/slack.ts`
- Modify: `frontend/lib/hugo/index.ts`
- Test: `frontend/test/integration/api/slack-events.integration.test.ts`

- [ ] **Step 1: Write failing button post test**

For a data query returning open incidents, assert `chat.postMessage` receives `blocks` with `Investigate`, `Approve low-risk`, and `Open in app` buttons for at least the first incident.

- [ ] **Step 2: Run failing integration test**

Run: `bun run test:integration -- test/integration/api/slack-events.integration.test.ts`

Expected: FAIL because `postSlackMessage` only sends text.

- [ ] **Step 3: Extend `postSlackMessage`**

Allow optional `blocks?: object[]` and include it in the `chat.postMessage` body:

```ts
body: JSON.stringify({
  channel: args.channel,
  text: args.text,
  ...(args.threadTs ? { thread_ts: args.threadTs } : {}),
  ...(args.blocks ? { blocks: args.blocks } : {}),
})
```

- [ ] **Step 4: Add Block Kit builder**

Add a Hugo incident card builder that creates action buttons with existing `approve_low_risk` action ids and new `hugo_investigate` action ids. Keep `Open in app` as a URL button.

- [ ] **Step 5: Run integration test**

Run: `bun run test:integration -- test/integration/api/slack-events.integration.test.ts`

Expected: PASS.

### Task 7: Verification

**Files:**
- No new files.

- [ ] **Step 1: Run focused Hugo tests**

Run: `bun run test -- lib/hugo lib/slack.test.ts`

Expected: PASS.

- [ ] **Step 2: Run Slack integration tests**

Run: `bun run test:integration -- test/integration/api/slack-events.integration.test.ts test/integration/api/slack-webhook.integration.test.ts`

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`

Expected: PASS.

- [ ] **Step 4: Run lint**

Run: `bun run lint`

Expected: PASS.

- [ ] **Step 5: Manual production setup**

In Slack app OAuth scopes, add `channels:history` and `groups:history`, reinstall the app to the workspace, then deploy the code. Test in Slack:

```text
@hugo show open incidents
@hugo investigate the second one
```

Expected: Hugo reads the thread and investigates the second incident from the prior list.

### Self-Review

- Spec coverage: full thread reading, limited current-thread access, missing-scope fallback, ordinal/pronoun resolution, and Block Kit buttons are covered.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: `SlackThreadMessage`, `SlackThreadReadResult`, `buildThreadTranscript`, and `resolveThreadIncidentReference` are introduced before use.
