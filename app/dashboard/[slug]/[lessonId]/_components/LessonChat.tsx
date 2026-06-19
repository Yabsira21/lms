"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LessonChat({ lessonId }: { lessonId: string }) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        lessonId,
      },
    }),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="mt-6 rounded-xl border bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <Bot className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Tutor</h2>
            <p className="text-xs text-muted-foreground">
              Ask questions about this lesson
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-[420px] overflow-y-auto px-4 py-4 space-y-4 bg-muted/20"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <Bot className="size-6 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-foreground">
              Start a conversation
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Ask for explanations, summaries, examples, or help understanding
              this lesson.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-3",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role !== "user" && (
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                  <Bot className="size-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-foreground",
                )}
              >
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wide opacity-70">
                  {m.role === "user" ? "You" : "AI Tutor"}
                </div>

                {m.parts.map((part, i) =>
                  part.type === "text" ? <div key={i}>{part.text}</div> : null,
                )}
              </div>

              {m.role === "user" && (
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading */}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="flex gap-3">
              <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                <Bot className="size-4 text-primary" />
              </div>

              <div className="rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this lesson..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
