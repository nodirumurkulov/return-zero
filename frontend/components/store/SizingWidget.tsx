"use client";
import { useState, useRef, useEffect } from "react";
import ChatBubble from "@/components/ui/ChatBubble";
import { sendSizingMessage } from "@/lib/api";
import type { ProductDetail } from "@/lib/api";

interface Props {
  product: ProductDetail;
}

function makeOpeningMessage(product: ProductDetail): string {
  const { title, sizing_return_rate, size_bias, size_too_small, size_too_large } = product;

  if (sizing_return_rate > 10) {
    const directionLine =
      size_bias === "runs_small"
        ? `${size_too_small} of those customers found it too small.`
        : size_bias === "runs_large"
        ? `${size_too_large} of those customers found it too large.`
        : `Returns are split between too small and too large.`;

    return `Hi! The **${title}** has a **${sizing_return_rate}% sizing return rate** — our highest. ${directionLine} What size do you normally wear, and in which brand?`;
  }

  return `Hi! I can help you find the right size for the **${title}**. What's your usual size, or which brand do you normally wear?`;
}

type Message = { role: "user" | "assistant"; content: string };

export default function SizingWidget({ product }: Props) {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  // greeting is displayed but never sent to the API
  const greeting                = makeOpeningMessage(product);
  const [apiMessages, setApiMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Auto-open on Grade F products after 3 seconds
  useEffect(() => {
    if (product.fit_score === "F") {
      const t = setTimeout(() => setOpen(true), 3000);
      return () => clearTimeout(t);
    }
  }, [product.fit_score]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Scroll to bottom on new messages / loading state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [apiMessages, loading]);

  // All displayed messages = static greeting + real API turns
  const displayed: Message[] = [
    { role: "assistant", content: greeting },
    ...apiMessages,
  ];

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...apiMessages, userMsg];
    setApiMessages(next);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendSizingMessage(next, product.product_id);
      setApiMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setApiMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2
                     bg-pf-black text-white text-sm font-medium
                     px-5 py-3.5 rounded-full shadow-xl
                     hover:-translate-y-0.5 hover:shadow-2xl
                     transition-all duration-150 animate-slide-up"
          style={{ animationDelay: "600ms" }}
        >
          <span className="text-base">📏</span>
          Find My Size
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[340px] flex flex-col
                     bg-white rounded-2xl shadow-2xl border border-gray-100
                     overflow-hidden animate-scale-in"
          style={{ maxHeight: "min(480px, 80vh)" }}
        >
          {/* Header */}
          <div className="bg-pf-black text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide">
                Pretty Fly Sizing
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                Powered by return data
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white transition-colors text-xl leading-none w-7 h-7
                         flex items-center justify-center rounded"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {displayed.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}
            {loading && <ChatBubble role="assistant" content="" loading />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-pf-dust p-3 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="e.g. I'm a UK9 in Nike Air Max…"
              className="flex-1 text-sm border border-pf-dust rounded-lg px-3 py-2.5
                         focus:outline-none focus:border-pf-charcoal transition-colors
                         placeholder:text-gray-300"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-pf-black text-white
                         rounded-lg disabled:opacity-30 hover:bg-pf-charcoal transition-colors
                         text-lg flex-shrink-0"
              aria-label="Send"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
