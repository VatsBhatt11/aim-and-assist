import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { streamChat, type Msg } from "@/lib/streamChat";
import { toast } from "sonner";

interface Step {
  step: number;
  action: string;
  explanation: string;
  tools: string[];
  time?: string;
}

function parseSteps(content: string): Step[] | null {
  try {
    // Try to find JSON array in the content
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].action) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

const Index = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setHasStarted(true);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <Zap className="h-5 w-5 text-accent-gold" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            WorkFaster
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-1 flex-col items-center justify-center px-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gold/10"
              >
                <Zap className="h-8 w-8 text-accent-gold" />
              </motion.div>
              <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Turn your goal into a<br />clear action plan
              </h1>
              <p className="mb-8 max-w-md text-center text-muted-foreground">
                Type any goal and get a structured step-by-step plan with tool
                suggestions — powered by AI.
              </p>
              <div className="w-full max-w-xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What do you want to achieve?"
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-xl bg-accent-gold text-background hover:bg-accent-gold/90"
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6"
            >
              <div className="flex-1 space-y-6">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} isLoading={isLoading && i === messages.length - 1 && msg.role === "assistant"} />
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating your plan...</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom input when in chat mode */}
      {hasStarted && (
        <div className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mx-auto flex max-w-3xl gap-2 px-4 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Refine your plan or ask a follow-up..."
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="lg"
              className="rounded-xl bg-accent-gold text-background hover:bg-accent-gold/90"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

function MessageBubble({ msg, isLoading }: { msg: Msg; isLoading: boolean }) {
  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-accent-gold px-4 py-3 text-background">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  const steps = parseSteps(msg.content);

  if (steps) {
    return (
      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold/15 text-xs font-bold text-accent-gold">
                {step.step}
              </span>
              <h3 className="font-semibold text-foreground">{step.action}</h3>
              {step.time && (
                <Badge variant="outline" className="ml-auto shrink-0 rounded-md border-accent-gold/30 text-xs text-accent-gold">
                  ⏱ {step.time}
                </Badge>
              )}
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {step.explanation}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {step.tools.map((tool) => (
                <Badge
                  key={tool}
                  variant="secondary"
                  className="rounded-md text-xs"
                >
                  {tool}
                </Badge>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Streaming / raw text fallback
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
        {msg.content}
        {isLoading && <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-accent-gold" />}
      </pre>
    </motion.div>
  );
}

export default Index;
