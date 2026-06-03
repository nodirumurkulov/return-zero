import clsx from "clsx";
import ReactMarkdown from "react-markdown";

interface Props {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

export default function ChatBubble({ role, content, loading }: Props) {
  const isUser = role === "user";

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[88%] px-3 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-pf-black text-white rounded-2xl rounded-br-sm"
            : "bg-gray-100 text-pf-black rounded-2xl rounded-bl-sm"
        )}
      >
        {loading ? (
          <div className="flex items-center gap-1 px-1 py-0.5">
            <div className="chat-dot" />
            <div className="chat-dot" />
            <div className="chat-dot" />
          </div>
        ) : isUser ? (
          content
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              strong: ({ children }) => (
                <strong className="font-semibold text-pf-black">{children}</strong>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
