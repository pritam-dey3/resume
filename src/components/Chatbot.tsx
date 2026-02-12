import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  HeadCircuitIcon,
  XIcon,
  PaperPlaneRightIcon,
  ArrowsOutSimpleIcon,
  ChatTextIcon,
} from "@phosphor-icons/react";
import { cn } from "../lib/utils";
import Markdown from 'react-markdown'
import { fetchEventSource } from "@microsoft/fetch-event-source";
import "./Chatbot.css";
import { ScrollSmoother } from "gsap/ScrollSmoother";

type TextStream = {
  type: "TextDelta";
  delta: string;
};

// Tool types
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

type ToolCallStream = {
  type: "ToolCall";
  tool: SearchProject | ShowExperience | ShowProject | ShowSection | ShowOpenSource;
};

type ChatMode = "minimized" | "chat" | "extended-chat";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

interface ChatbotProps {
  smoother: React.MutableRefObject<ScrollSmoother | null>;
}

const respondToUser = async (
  message: string,
  sessionId: string,
  handleResponseObj: (obj: TextStream | ToolCallStream) => void
) => {
  const chatUrl = import.meta.env.VITE_BACKEND_URL + "/chat";
  console.log("Base URL", chatUrl);

  await fetchEventSource(chatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream", // or text/event-stream
    },
    body: JSON.stringify({ user_query: message, session_id: sessionId }),
    onmessage(ev) {
      const data = JSON.parse(ev.data);
      console.log(data);
      handleResponseObj(data);
    },
    onerror(err) {
      console.error(err);
    }
  });

  console.log("function returned");
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

const getElementId = (
  tool: ToolCallStream["tool"]
): { elementId: string; sectionId?: string } | null => {
  switch (tool.name) {
    case "show_experience":
      return {
        elementId: `experience-${tool.arguments.company_name}`,
        sectionId: "experience",
      };
    case "show_project":
      return {
        elementId: `project-${tool.arguments.project_id}`,
        sectionId: "projects",
      };
    case "show_section":
      // eslint-disable-next-line no-case-declarations
      const map: Record<string, string> = {
        about: "about-me",
        publication: "publications",
        blogs: "publications",
        experience: "experience",
        projects: "projects",
        "open-source": "open-source",
      };
      return {
        elementId:
          map[tool.arguments.section_name] || tool.arguments.section_name,
      };
    case "show_open_source":
      return {
        elementId: `opensource-${tool.arguments.project}`,
        sectionId: "open-source",
      };
    case "search_projects":
      return { elementId: "projects-search", sectionId: "projects" };
    default:
      return null;
  }
};

const Chatbot: React.FC<ChatbotProps> = ({ smoother }) => {
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

  const scrollToAndHighlight = useCallback(
    (elementId: string, sectionId?: string, shouldHighlight: boolean = true) => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element with id ${elementId} not found`);
        return;
      }

      const highlight = () => {
        if (!shouldHighlight) return;
        element.classList.add("ai-highlight");
        setTimeout(() => {
          element.classList.remove("ai-highlight");
        }, 3000);
      };

      if (sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
          if (smoother.current) {
            smoother.current.scrollTo(section, true, "center center");
          } else {
            section.scrollIntoView({ behavior: "smooth", block: "center" });
          }

          setTimeout(() => {
            element.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
            highlight();
          }, 1000);
          return;
        }
      }

      if (smoother.current) {
        smoother.current.scrollTo(element, true, "center center");
      } else {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        highlight();
      }, 1000);
    },
    [smoother]
  );

  const handleResponseObj = useCallback(
    (obj: TextStream | ToolCallStream) => {
      if (obj.type === "TextDelta") {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.role === "ai") {
            setGettingResponse(false);
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, text: lastMsg.text + obj.delta },
            ];
          }
          return prev;
        });
      } else if (obj.type === "ToolCall") {
        console.log("Tool call", obj.tool);
        const ids = getElementId(obj.tool);
        if (ids) {
          
          if (obj.tool.name === "search_projects") {
            const element = document.getElementById(
              ids.elementId
            ) as HTMLInputElement | null;
            if (element) {
              // React overrides the native value setter, so we use the prototype setter
              const match = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
              );
              match?.set?.call(element, obj.tool.arguments.query);
              element.dispatchEvent(new Event("input", { bubbles: true }));
            }
          } else {
            scrollToAndHighlight(ids.elementId, ids.sectionId);
          }
        }
      }
    },
    [scrollToAndHighlight]
  );

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
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none flex justify-center">
      <div className="w-full max-w-339 relative">
        <div
          className={cn(
            "absolute grid z-50 transition-all duration-300 ease-in-out font-sans right-4 bottom-4 bg-base-300/15 rounded-xl backdrop-blur-md border-primary items-center pointer-events-auto",
            mode === "minimized" && "",
            (mode === "chat" || mode === "extended-chat") &&
              "p-2 gap-y-2 gap-x-2 grid-rows-[auto_1fr_auto] grid-cols-[1fr_auto] border",
            mode === "chat" && "left-4 md:left-auto w-auto md:w-123",
            mode === "extended-chat" &&
              "fixed inset-0 rounded-none md:absolute md:inset-auto md:right-4 md:bottom-4 md:w-123 md:h-[570px] md:max-h-[calc(100vh-6rem)] md:rounded-xl"
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
      </div>
    </div>
  );
};

export default Chatbot;
