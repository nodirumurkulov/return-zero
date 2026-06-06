"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";

type SessionMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type PricingNegotiationChatProps = {
  token: string;
  email: string;
  negotiationStatus: string;
  selectedTier: string | null;
  agreedPriceLabel: string | null;
  initialMessages: SessionMessage[];
  currentOfferCents: number | null;
};

function toUiMessages(messages: SessionMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  }));
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function latestUserMessageText(messages: UIMessage[]): string {
  const latestUser = [...messages].reverse().find((message) => message.role === "user");
  return latestUser ? messageText(latestUser).trim() : "";
}

function formatOffer(cents: number | null): string | null {
  if (cents === null) {
    return null;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function PricingNegotiationChat({
  token,
  email,
  negotiationStatus,
  selectedTier,
  agreedPriceLabel,
  initialMessages,
  currentOfferCents,
}: PricingNegotiationChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/waitlist/pricing/chat",
        prepareSendMessagesRequest({ messages }) {
          return {
            body: {
              token,
              message: latestUserMessageText(messages),
            },
          };
        },
      }),
    [token],
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: toUiMessages(initialMessages),
    onFinish: () => {
      router.refresh();
    },
  });

  const isClosed = negotiationStatus === "accepted" || negotiationStatus === "declined";
  const offerLabel = formatOffer(currentOfferCents);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isClosed || status === "streaming" || status === "submitted") {
      return;
    }
    setInput("");
    void sendMessage({ text });
  };

  if (isClosed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <SectionLabel>Pricing</SectionLabel>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">You&apos;re all set</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {negotiationStatus === "accepted"
            ? `We saved your agreement${selectedTier ? ` for ${selectedTier}` : ""}${agreedPriceLabel ? ` at ${agreedPriceLabel}/month` : ""}. Our team will follow up at ${email}.`
            : "Thanks for chatting with us. We'll stay in touch about early access."}
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/">Back to Hugo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-16 sm:px-6">
      <SectionLabel>Pricing</SectionLabel>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">
        Find your Hugo plan
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Chat with our agent to explore Teams or Enterprise pricing for {email}.
      </p>

      {offerLabel ? (
        <p className="mt-4 rounded-lg border border-primary/30 bg-primary-subtle px-3 py-2 text-sm">
          Current offer: <span className="font-medium">{offerLabel}/month</span>
        </p>
      ) : null}

      <div
        className="mt-6 flex min-h-[24rem] flex-col rounded-lg border border-border bg-card"
        aria-live="polite"
      >
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-8 rounded-lg bg-muted px-3 py-2 text-sm"
                  : "mr-8 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              }
            >
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {message.role === "user" ? "You" : "Hugo"}
              </p>
              <p className="whitespace-pre-wrap">{messageText(message)}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="border-t border-border p-4">
          <div className="space-y-2">
            <Label htmlFor="pricing-chat-input">Your message</Label>
            <div className="flex gap-2">
              <Input
                id="pricing-chat-input"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                }}
                placeholder="Tell us about your team and budget…"
                disabled={status === "streaming" || status === "submitted"}
              />
              <Button
                type="submit"
                disabled={!input.trim() || status === "streaming" || status === "submitted"}
              >
                {status === "streaming" || status === "submitted" ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
