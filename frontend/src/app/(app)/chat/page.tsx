"use client";

import { useEffect, useRef, useState } from "react";
import { FormattedText } from "@/components/ai-response";
import { Icon } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "What causes low hemoglobin?",
  "Explain what a high white blood cell count means.",
  "What are early warning signs of kidney problems?",
  "How is pneumonia usually treated?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const query = text.trim();
    if (!query || busy) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", text: query }]);
    setBusy(true);
    try {
      const res = await api.chat(query);
      setMessages((m) => [...m, { role: "assistant", text: res.response }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the assistant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:h-dvh">
      <div className="border-b border-border px-5 py-4 sm:px-8">
        <h1 className="text-xl font-medium">Health assistant</h1>
        <p className="text-sm text-muted">
          Grounded in a curated medical knowledge base.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8">
          {messages.length === 0 ? (
            <div className="pt-6">
              <span className="grid size-12 place-items-center rounded-[var(--r-md)] bg-primary-soft text-primary-strong">
                <Icon.Chat className="size-6" />
              </span>
              <h2 className="mt-4 font-serif text-2xl font-medium">
                What would you like to understand?
              </h2>
              <p className="mt-2 text-muted measure">
                Ask about symptoms, conditions or test results. Answers are plain
                and calm, and they always point you to professional care.
              </p>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-[var(--r-md)] border border-border bg-surface px-4 py-3 text-left text-sm text-ink transition-colors hover:border-primary/50 hover:bg-surface-2"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "user" ? (
                    <div className="max-w-[85%] rounded-[var(--r-lg)] rounded-br-sm bg-primary px-4 py-2.5 text-on-primary">
                      {m.text}
                    </div>
                  ) : (
                    <div className="max-w-full">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary-strong">
                        <Icon.Spark className="size-4" />
                        CureWise
                      </div>
                      <FormattedText text={m.text} />
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-muted">
                  <Spinner className="size-4" />
                  <span className="text-sm">Thinking…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface/80 px-5 py-4 backdrop-blur sm:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto w-full max-w-3xl"
        >
          {error && <p className="mb-2 text-sm text-danger">{error}</p>}
          <div className="flex items-end gap-2 rounded-[var(--r-lg)] border border-border bg-bg p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/35">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask about a symptom, condition or result…"
              className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-ink outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="grid size-10 shrink-0 place-items-center rounded-[var(--r-md)] bg-primary text-on-primary transition-[filter] hover:brightness-[1.08] disabled:opacity-50"
            >
              <Icon.Send className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            CureWise can be wrong. It informs, and does not diagnose.
          </p>
        </form>
      </div>
    </div>
  );
}
