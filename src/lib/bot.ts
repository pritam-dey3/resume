import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { v4 as uuidv4 } from "uuid";

export type BotTextStream = {
  type: "TextDelta";
  delta: string;
};

type SearchProject = {
  name: "search_projects";
  arguments: {
    query: string;
  };
  tool_call_id: string;
};

type ShowExperience = {
  name: "show_experience";
  arguments: {
    company_name: "ai-lens" | "syngenta" | "dr.reddys" | "amgen";
  };
  tool_call_id: string;
};

type ShowProject = {
  name: "show_project";
  arguments: {
    project_id: string;
  };
  tool_call_id: string;
};

type ShowSection = {
  name: "show_section";
  arguments: {
    section_name: "open-source" | "experience" | "publication" | "about" | "blogs";
  };
  tool_call_id: string;
};

type ShowOpenSource = {
  name: "show_open_source";
  arguments: {
    project: "wingmate" | "interact" | "pyautoguide" | "snatch";
  };
  tool_call_id: string;
};

export type BotTool =
  | SearchProject
  | ShowExperience
  | ShowProject
  | ShowSection
  | ShowOpenSource;

export type BotToolCallStream = {
  type: "ToolCall";
  tool: BotTool;
};

export type BotStreamEvent = BotTextStream | BotToolCallStream;

export interface BotMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}

const streamBotResponse = async (
  message: string,
  sessionId: string,
  onEvent: (event: BotStreamEvent) => void
) => {
  const chatUrl = import.meta.env.VITE_BACKEND_URL + "/chat";

  await fetchEventSource(chatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ user_query: message, session_id: sessionId }),
    onmessage(ev) {
      if (!ev.data || ev.data === "[DONE]") return;
      const data = JSON.parse(ev.data) as BotStreamEvent;
      onEvent(data);
    },
    onerror(err) {
      throw err;
    },
  });
};

interface UseBotOptions {
  initialMessages: BotMessage[];
  onToolCall?: (tool: BotTool) => void;
}

interface UseBotResult {
  messages: BotMessage[];
  gettingResponse: boolean;
  sendMessage: (text: string) => Promise<void>;
}

export const useBot = ({ initialMessages, onToolCall }: UseBotOptions): UseBotResult => {
  const [messages, setMessages] = useState<BotMessage[]>(initialMessages);
  const [gettingResponse, setGettingResponse] = useState(false);

  const sessionId = useRef<string>(uuidv4());
  const idCounter = useRef<number>(Date.now());
  const inFlight = useRef(false);

  // useEffect(() => {
  //   fetch("http://ip-api.com/json/")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       console.log("Client IP:", data);
  //     })
  //     .catch((err) => {
  //       if (import.meta.env.DEV) {
  //         console.error("Failed to fetch client IP data:", err);
  //       }
  //     });
  // }, []);

  const createId = () => {
    idCounter.current += 1;
    return idCounter.current.toString();
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText || inFlight.current) return;

      inFlight.current = true;
      const userId = createId();
      const placeholderId = createId();
      let hasReceivedDelta = false;

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text: userText },
        { id: placeholderId, role: "ai", text: "" },
      ]);
      setGettingResponse(true);

      try {
        await streamBotResponse(userText, sessionId.current, (event) => {
          if (event.type === "TextDelta") {
            if (!hasReceivedDelta) {
              hasReceivedDelta = true;
              setGettingResponse(false);
            }

            setMessages((prev) => {
              const placeholderIndex = prev.findIndex((msg) => msg.id === placeholderId);
              if (placeholderIndex === -1) {
                return [...prev, { id: createId(), role: "ai", text: event.delta }];
              }

              const updated = [...prev];
              updated[placeholderIndex] = {
                ...updated[placeholderIndex],
                text: updated[placeholderIndex].text + event.delta,
              };
              return updated;
            });
            return;
          }

          onToolCall?.(event.tool);
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          alert("Bot error: " + (typeof err === "object" && err !== null && "message" in err ? (err as Error).message : String(err)));
        }
        setMessages((prev) => {
          const placeholderIndex = prev.findIndex((msg) => msg.id === placeholderId);
          if (placeholderIndex === -1) {
            return [
              ...prev,
              {
                id: createId(),
                role: "ai",
                text: "Sorry, something went wrong. Please try again.",
              },
            ];
          }

          const updated = [...prev];
          updated[placeholderIndex] = {
            ...updated[placeholderIndex],
            text: "Sorry, something went wrong. Please try again.",
          };
          return updated;
        });
      } finally {
        setGettingResponse(false);
        inFlight.current = false;
      }
    },
    [onToolCall]
  );

  return { messages, gettingResponse, sendMessage };
};
