import React, { useState, useRef, useEffect } from "react";
import {
  HeadCircuitIcon,
  XIcon,
  PaperPlaneRightIcon,
  ArrowsOutSimpleIcon,
  ChatTextIcon,
} from "@phosphor-icons/react";
import { cn } from "../lib/utils";
import Markdown from 'react-markdown'
import "./Chatbot.css";

type TextStream = {
  type: "text";
  delta: string;
};
type ToolCallStream = {
  type: "tool_call";
  tool_call: {
    tool_name: string;
    arguments: object;
  };
};
type ChatMode = "minimized" | "chat" | "extended-chat";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

const respondToUser = async (
  message: string,
  sessionId: string,
  handleResponseObj: (obj: TextStream | ToolCallStream) => void
) => {
  const chatUrl = import.meta.env.VITE_BACKEND_URL + "/chat";
  console.log("Base URL", chatUrl);

  const res = await fetch(chatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson", // or text/event-stream
    },
    body: JSON.stringify({ user_query: message, session_id: sessionId }),
  });

  if (!res.ok || !res.body) {
    throw new Error("Stream failed");
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += value;

      while (true) {
        const idx = buffer.indexOf("\n");
        if (idx === -1) break;

        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);

        if (!line) continue;

        try {
          const obj = JSON.parse(line);
          handleResponseObj(obj);
        } catch (e) {
          console.error("Error parsing JSON line:", e);
        }
      }
    }
  } catch (error) {
    console.error("Error reading stream:", error);
    throw error;
  } finally {
    reader.releaseLock();
  }

  return "Streaming finished";
};

const LoadingMessage = () => {
  return (
    <div className="three-body">
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
    </div>
  );
};

const TextArea = ({
  inputRef,
  inputValue,
  setInputValue,
  handleKeyDown,
  setIsInputMode,
}: {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setIsInputMode: (value: boolean) => void;
}) => {
  return (
    <textarea
      ref={inputRef}
      className="textarea textarea-bordered w-full resize-none focus:outline-none focus:border-primary focus:bg-base-100 text-sm min-h-0 h-auto py-2"
      placeholder="Type your message..."
      rows={1}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        if (!inputValue.trim()) {
          setIsInputMode(false);
        }
      }}
    />
  );
};

const Chatbot: React.FC = () => {
  const [mode, setMode] = useState<ChatMode>("minimized");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: "Hello! I am your AI assistant. Ask me anything about my projects or experience.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isInputMode, setIsInputMode] = useState(false);
  const [gettingResponse, setGettingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sessionId = useRef<string>(crypto.randomUUID());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (mode === "extended-chat") {
      scrollToBottom();
    }
  }, [messages, mode]);

  useEffect(() => {
    if (isInputMode || mode === "extended-chat") {
      inputRef.current?.focus();
    }
  }, [isInputMode, mode]);

  // Reset input mode when going back to chat from minimized
  useEffect(() => {
    if (mode === "chat") {
      setIsInputMode(false);
    }
  }, [mode]);

  const handleResponseObj = (obj: TextStream | ToolCallStream) => {
    if (obj.type === "text") {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === "ai") {
          if (gettingResponse){
            setGettingResponse(false);
          }
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, text: lastMsg.text + obj.delta },
          ];
        }
        return prev;
      });
    } else if (obj.type === "tool_call") {
      console.log("Tool call", obj.tool_call);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: inputValue,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    if (mode === "chat") {
      setIsInputMode(false);
    }

    // get assistant response
    setGettingResponse(true);
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "",
      },
    ]);
    try {
      await respondToUser(inputValue, sessionId.current, handleResponseObj);
    } catch (error) {
      console.error("Failed to get response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setGettingResponse(false);
      console.log("messages", messages);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get last AI message for chat mode display
  const lastAiMessage = [...messages]
    .reverse()
    .find((m) => m.role === "ai")?.text;

  return (
    <div
      className={cn(
        "fixed grid z-50 m-3 md:m-6 transition-all duration-300 ease-in-out font-sans right-0 bottom-0 bg-base-300/15 rounded-xl backdrop-blur-md border-primary items-center",
        mode === "minimized" && "",
        (mode === "chat" || mode === "extended-chat") &&
          "p-2 gap-y-2 gap-x-2 grid-rows-[auto_1fr_auto] grid-cols-[1fr_auto] border",
        mode === "chat" && "left-0 md:left-auto w-auto md:w-123",
        mode === "extended-chat" &&
          "left-0 top-0 md:left-auto md:top-auto md:w-123 md:h-[570px] md:max-h-[calc(100vh-6rem)]"
      )}
    >
      {/* Control buttons */}
      {(mode == "chat" || mode == "extended-chat") && (
        <div className="col-span-2 flex flex-row gap-2 w-full justify-end px-4 md:px-3">
          <ArrowsOutSimpleIcon
            size={15}
            onClick={() =>
              mode === "chat" ? setMode("extended-chat") : setMode("chat")
            }
          />
          <XIcon size={15} onClick={() => setMode("minimized")} />
        </div>
      )}
      {/* Extended Chat */}
      {mode === "extended-chat" && (
        <div className="col-span-2 min-h-0 h-full">
          {/* Messages */}
          <div className="overflow-y-auto p-2 md:p-4 pt-12 h-full space-y-4 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "chat",
                  msg.role === "user" ? "chat-end" : "chat-start"
                )}
              >
                {msg.role === "ai" && (
                  <div className="chat-image avatar">
                    <div className="rounded-full border border-primary p-1 bg-base-300">
                      <HeadCircuitIcon
                        size={24}
                        className="text-primary w-full h-full"
                        weight="fill"
                      />
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "chat-bubble text-sm shadow-xl",
                    msg.role === "user"
                      ? "chat-bubble-primary text-primary-content"
                      : "bg-base-300 text-base-content border border-primary/40 before:border-b before:border-primary/40"
                  )}
                >
                  <div className="markdown">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {gettingResponse && <LoadingMessage />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Chat */}
      {((mode === "chat" && isInputMode) || mode === "extended-chat") && (
        <div>
          <TextArea
            inputRef={inputRef}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleKeyDown={handleKeyDown}
            setIsInputMode={setIsInputMode}
          />
        </div>
      )}
      {mode === "chat" && !isInputMode && (
        <div className="flex flex-row gap-2 items-center">
          <HeadCircuitIcon size={30} className="text-primary" weight="fill" />
          {!gettingResponse ? (
            <div className="overflow-y-auto max-h-24 flex-1">
              <div className="markdown">
                <Markdown>{lastAiMessage}</Markdown>
              </div>
            </div>
          ) : (
            <LoadingMessage />
          )}
        </div>
      )}

      {/* Button */}
      <div>
        {mode == "minimized" && (
          <button
            className="btn btn-primary btn-circle shadow-md"
            onClick={() => setMode("chat")}
          >
            <HeadCircuitIcon size={20} weight="fill" />
          </button>
        )}
        {((mode == "chat" && isInputMode) || mode == "extended-chat") && (
          <button
            className="btn btn-primary btn-circle btn-sm shadow-md"
            onClick={handleSendMessage}
          >
            <PaperPlaneRightIcon size={15} weight="fill" />
          </button>
        )}
        {mode == "chat" && !isInputMode && (
          <button
            className="btn btn-primary btn-circle btn-sm shadow-md"
            onClick={() => setIsInputMode(true)}
          >
            <ChatTextIcon size={15} weight="fill" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
