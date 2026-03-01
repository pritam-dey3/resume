import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  HeadCircuitIcon,
  XIcon,
  PaperPlaneRightIcon,
  ArrowsOutSimpleIcon,
  ChatTextIcon,
} from "@phosphor-icons/react";
import { cn } from "../lib/utils";
import { useBot, type BotTool } from "../lib/bot";
import Markdown from 'react-markdown'
import "./Chatbot.css";
import { ScrollSmoother } from "gsap/ScrollSmoother";

type ChatMode = "minimized" | "chat" | "extended-chat";

interface ChatbotProps {
  smoother: React.MutableRefObject<ScrollSmoother | null>;
}

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
  tool: BotTool
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
  const [isExpandingToExtended, setIsExpandingToExtended] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isInputMode, setIsInputMode] = useState(false);
  const [showAutoTooltip, setShowAutoTooltip] = useState(false);
  const hasShownAutoTooltip = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  const handleToolCall = useCallback(
    (tool: BotTool) => {
      const ids = getElementId(tool);
      if (!ids) return;

      if (tool.name === "search_projects") {
        const element = document.getElementById(
          ids.elementId
        ) as HTMLInputElement | null;
        if (element) {
          const match = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          );
          match?.set?.call(element, tool.arguments.query);
          element.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return;
      }

      scrollToAndHighlight(ids.elementId, ids.sectionId);
    },
    [scrollToAndHighlight]
  );

  const { messages: botMessages, gettingResponse, sendMessage } = useBot({
    initialMessages: [
      {
        id: "1",
        role: "ai",
        text: "Hello! I am your AI assistant. Ask me anything about Pritam's projects or experience.",
      },
    ],
    onToolCall: handleToolCall,
  });

  useEffect(() => {
    if (mode === "extended-chat") {
      scrollToBottom();
    }
  }, [botMessages, mode]);

  useEffect(() => {
    if (isInputMode || mode === "extended-chat") {
      inputRef.current?.focus();
    }
  }, [isInputMode, mode]);

  useEffect(() => {
    if (mode === "chat" && !hasShownAutoTooltip.current) {
      hasShownAutoTooltip.current = true;
      const showTimer = setTimeout(() => setShowAutoTooltip(true), 0);
      const hideTimer = setTimeout(() => setShowAutoTooltip(false), 1000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [mode]);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;
    setInputValue("");

    if (mode === "chat") {
      setIsInputMode(false);
    }

    await sendMessage(trimmedInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContainerTransitionEnd = (
    e: React.TransitionEvent<HTMLDivElement>
  ) => {
    if (!isExpandingToExtended) return;
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "height" && e.propertyName !== "max-height") return;
    setMode("extended-chat");
    setIsExpandingToExtended(false);
  };

  // Get last AI message for chat mode display
  const lastAiMessage = [...botMessages]
    .reverse()
    .find((m) => m.role === "ai")?.text;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none flex justify-center">
      <div className="w-full max-w-339 relative">
        <div
          onTransitionEnd={handleContainerTransitionEnd}
          className={cn(
            "absolute grid z-50 transition-[width,height,max-height] duration-300 ease-in-out font-sans right-4 bottom-4 bg-base-300/15 backdrop-blur-md border border-transparent items-center pointer-events-auto",
            mode === "minimized" &&
              "w-12 h-12 rounded-full justify-items-center",
            (mode === "chat" || mode === "extended-chat" || isExpandingToExtended) &&
              "rounded-xl p-2 gap-y-2 gap-x-2 grid-rows-[auto_1fr_auto] grid-cols-[1fr_auto] border-primary",
            mode === "chat" &&
              !isExpandingToExtended &&
              "left-4 md:left-auto w-auto md:w-123 h-28 overflow-hidden",
            (mode === "extended-chat" || isExpandingToExtended) &&
              "fixed inset-x-0 bottom-0 h-dvh rounded-none md:absolute md:inset-auto md:right-4 md:bottom-4 md:w-123 md:h-[570px] md:max-h-[calc(100vh-6rem)] md:rounded-xl"
          )}
        >
          {/* Control buttons */}
          {(mode == "chat" || mode == "extended-chat") && (
        <div
          className={cn(
            "col-span-2 flex flex-row gap-2 w-full justify-end px-4 md:px-3",
            mode === "extended-chat" && "pt-3 md:pt-0"
          )}
        >
          <button
            aria-label={mode === "chat" ? "Expand chat" : "Collapse chat"}
            className="btn btn-ghost btn-xs btn-circle"
            onClick={() => {
              if (mode === "chat") {
                setIsExpandingToExtended(true);
                return;
              }
              setMode("chat");
              setIsExpandingToExtended(false);
              setIsInputMode(false);
            }}
          >
            <ArrowsOutSimpleIcon size={15} />
          </button>
          <button
            aria-label="Close chat"
            className="btn btn-ghost btn-xs btn-circle"
            onClick={() => {
              setMode("minimized");
              setIsExpandingToExtended(false);
            }}
          >
            <XIcon size={15} />
          </button>
        </div>
      )}
      {/* Extended Chat */}
      {mode === "extended-chat" && (
        <div className="col-span-2 min-h-0 h-full">
          {/* Messages */}
          <div className="overflow-y-auto p-2 md:p-4 pt-12 h-full space-y-4 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
            {botMessages.map((msg) => (
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
            aria-label="Open chatbot"
            className="btn btn-primary btn-circle shadow-md"
            onClick={() => {
              setMode("chat");
              setIsInputMode(false);
            }}
          >
            <HeadCircuitIcon size={20} weight="fill" />
          </button>
        )}
        {((mode == "chat" && isInputMode) || mode == "extended-chat") && (
          <button
            aria-label="Send message"
            className="btn btn-primary btn-circle btn-sm shadow-md"
            onClick={handleSendMessage}
          >
            <PaperPlaneRightIcon size={15} weight="fill" />
          </button>
        )}
        {mode == "chat" && !isInputMode && (
          <div
            className={cn("tooltip tooltip-left", showAutoTooltip && "tooltip-open")}
            data-tip="Start chatting"
          >
            <button
              aria-label="Start chatting"
              className="btn btn-primary btn-circle btn-sm shadow-md"
              onClick={() => setIsInputMode(true)}
            >
              <ChatTextIcon size={15} weight="fill" />
            </button>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
};

export default Chatbot;
