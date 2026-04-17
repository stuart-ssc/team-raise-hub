import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SuggestionPrompt from "./SuggestionPrompt";
import ImageUploadPrompt from "./ImageUploadPrompt";

export interface ChatSuggestions {
  type?: "choice" | "image_upload";
  field: string;
  label?: string;
  options: { label: string; value: string }[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: ChatSuggestions | null;
}

interface AIChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
  campaignId?: string | null;
  onImageUploaded?: (url: string) => void;
  onImageSkipped?: () => void;
  onItemImageUploaded?: (url: string) => void;
  onItemImageSkipped?: () => void;
}

export default function AIChatPanel({
  messages,
  isLoading,
  onSend,
  campaignId,
  onImageUploaded,
  onImageSkipped,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const [dismissedTurnStart, setDismissedTurnStart] = useState<number>(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const handleSend = (overrideText?: string) => {
    const rawText = (overrideText ?? input).trim();
    if (!rawText || isLoading) return;
    const text = overrideText !== undefined ? rawText : maybeMapNumericInput(rawText);
    onSend(text);
    if (overrideText === undefined) {
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find the start index of the latest assistant turn (contiguous run of assistant messages at the end)
  let latestTurnStart = -1;
  let latestTurnEnd = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      if (latestTurnEnd === -1) latestTurnEnd = i;
      latestTurnStart = i;
    } else if (latestTurnEnd !== -1) {
      break;
    }
  }

  // Pick suggestions from any message in the latest turn (prefer the last one that has them)
  let turnSuggestions: ChatSuggestions | null = null;
  if (latestTurnStart !== -1) {
    for (let i = latestTurnEnd; i >= latestTurnStart; i--) {
      const s = messages[i]?.suggestions;
      if (s) {
        turnSuggestions = s;
        break;
      }
    }
  }

  const showTurnPrompt =
    !isLoading &&
    latestTurnStart !== -1 &&
    latestTurnStart !== dismissedTurnStart &&
    !!turnSuggestions;

  const activeSuggestions =
    showTurnPrompt && turnSuggestions?.type === "choice" ? turnSuggestions : null;

  const maybeMapNumericInput = (raw: string): string => {
    const trimmed = raw.trim();
    if (!activeSuggestions) return trimmed;
    if (!/^[1-9]$/.test(trimmed)) return trimmed;
    const idx = parseInt(trimmed, 10) - 1;
    const opt = activeSuggestions.options[idx];
    return opt ? opt.label : trimmed;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">AI Campaign Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary/40" />
            <p>Tell me about the campaign you'd like to create!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLastOfTurn = i === latestTurnEnd;
          const promptType = turnSuggestions?.type ?? "choice";

          return (
            <div
              key={i}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {showTurnPrompt && isLastOfTurn && promptType === "image_upload" && campaignId && (
                <div className="mt-3 w-full">
                  <ImageUploadPrompt
                    campaignId={campaignId}
                    disabled={isLoading}
                    onUploaded={(url) => onImageUploaded?.(url)}
                    onSkip={() => onImageSkipped?.()}
                    onDismiss={() => setDismissedTurnStart(latestTurnStart)}
                  />
                </div>
              )}

              {showTurnPrompt && isLastOfTurn && promptType === "choice" && turnSuggestions!.options.length > 0 && (
                <div className="mt-3 w-full">
                  <SuggestionPrompt
                    label={turnSuggestions!.label}
                    options={turnSuggestions!.options}
                    disabled={isLoading}
                    onSelect={(label) => handleSend(label)}
                    onDismiss={() => setDismissedTurnStart(latestTurnStart)}
                  />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your campaign..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
