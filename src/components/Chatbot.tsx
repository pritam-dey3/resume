import React, { useState, useRef, useEffect } from "react";
import { HeadCircuitIcon, XIcon, PaperPlaneRightIcon, ArrowsOutSimpleIcon, ChatTextIcon } from "@phosphor-icons/react";
import { cn } from "../lib/utils";

type ChatMode = 'minimized' | 'chat' | 'extended-chat';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const Chatbot: React.FC = () => {
  const [mode, setMode] = useState<ChatMode>('minimized');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'Hello! I am your AI assistant. Ask me anything about my projects or experience.' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isInputMode, setIsInputMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (mode === 'extended-chat') {
      scrollToBottom();
    }
  }, [messages, mode]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = { id: Date.now().toString(), role: 'user', text: inputValue };
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    
    // If in chat mode, switch to extended chat to show conversation
    if (mode === 'chat') {
        setMode('extended-chat');
    }

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: "I'm currently a static demo. I'll be connected to a real backend soon!" 
      }]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to get last AI message
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'ai')?.text;

  return (
    <div className={cn(
      "fixed z-50 transition-all duration-300 ease-in-out font-sans",
      mode === 'minimized' && "bottom-6 right-6",
      mode === 'chat' && "bottom-0 right-0 w-full md:w-96 md:bottom-6 md:right-6",
      mode === 'extended-chat' && "bottom-0 right-0 w-full h-full md:w-md md:h-150 md:bottom-6 md:right-6"
    )}>
      {/* Minimized Mode */}
      {mode === 'minimized' && (
        <button
          onClick={() => { setMode('chat'); setIsInputMode(false); }}
          className="btn btn-circle btn-primary w-14 h-14 shadow-lg hover:scale-110 transition-transform"
        >
          <HeadCircuitIcon size={32} weight="fill" />
        </button>
      )}

      {/* Chat Mode (Compact) */}
      {mode === 'chat' && (
        <div className="backdrop-blur-md bg-base-100/80 border border-base-300/50 shadow-2xl rounded-t-xl md:rounded-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 relative">
            {/* Controls (Close & Expand) - Top Right */}
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                 <button onClick={() => setMode('extended-chat')} className="btn btn-ghost btn-xs btn-square hover:bg-base-200/50" title="Expand">
                    <ArrowsOutSimpleIcon size={14} />
                </button>
                <button onClick={() => setMode('minimized')} className="btn btn-ghost btn-xs btn-square hover:bg-base-200/50" title="Close">
                    <XIcon size={14} />
                </button>
            </div>

            <div className="p-4 pt-8 flex flex-row">
                {!isInputMode ? (
                    <>
                        {/* Last AI Message */}
                        <div className="flex gap-3 items-start">
                             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                                <HeadCircuitIcon size={18} weight="fill" />
                            </div>
                            <div className="text-sm text-base-content/90 line-clamp-3 leading-relaxed">
                                {lastAiMessage || "Hello! How can I help you today?"}
                            </div>
                        </div>
                        
                        {/* Reply Button */}
                        <div className="flex justify-end">
                             <button 
                                onClick={() => setIsInputMode(true)}
                                className="btn btn-sm btn-primary btn-ghost gap-2 rounded-full hover:text-primary-content!"
                            >
                                <ChatTextIcon size={16} />
                            </button>
                        </div>
                    </>
                ) : (
                    /* Input Area */
                    <div className="relative animate-in fade-in zoom-in-95 duration-200">
                        <textarea 
                            autoFocus
                            className="textarea textarea-bordered w-full min-h-20 pr-10 resize-none text-sm bg-base-100/50 focus:bg-base-100"
                            placeholder="Type your message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            onBlur={() => {
                                if (!inputValue.trim()) setIsInputMode(false);
                            }}
                        />
                        <button 
                            onClick={handleSendMessage}
                            className="absolute right-2 bottom-2 btn btn-circle btn-xs btn-primary"
                            disabled={!inputValue.trim()}
                        >
                            <PaperPlaneRightIcon size={14} weight="fill" />
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Extended Chat Mode */}
      {mode === 'extended-chat' && (
        <div className="backdrop-blur-md bg-base-100/90 border border-base-300/50 shadow-2xl w-full h-full flex flex-col md:rounded-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 relative">
            {/* Close Button - Top Right */}
            <button 
                onClick={() => setMode('minimized')} 
                className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle z-10 hover:bg-base-200/50"
            >
                <XIcon size={20} />
            </button>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 pt-12 space-y-4 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("chat", msg.role === 'user' ? "chat-end" : "chat-start")}>
                        <div className="chat-image avatar hidden sm:block">
                            <div className="w-8 rounded-full border border-base-300/50 p-1 bg-base-200/50">
                                {msg.role === 'ai' ? (
                                    <HeadCircuitIcon size={24} className="text-primary w-full h-full" weight="fill" />
                                ) : (
                                    <div className="w-full h-full bg-neutral text-neutral-content flex items-center justify-center font-bold text-xs">YOU</div>
                                )}
                            </div>
                        </div>
                        <div className={cn(
                            "chat-bubble shadow-sm text-sm", 
                            msg.role === 'user' ? "chat-bubble-primary text-primary-content" : "bg-base-200/80 text-base-content backdrop-blur-sm"
                        )}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-base-300/30 bg-base-100/30 shrink-0">
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={inputRef}
                        className="textarea textarea-bordered w-full resize-none focus:outline-none focus:border-primary bg-base-100/50 focus:bg-base-100"
                        placeholder="Type your message..."
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ minHeight: '3rem', maxHeight: '8rem' }}
                    />
                    <button 
                        onClick={handleSendMessage}
                        className="btn btn-primary btn-circle shadow-md"
                        disabled={!inputValue.trim()}
                    >
                        <PaperPlaneRightIcon size={20} weight="fill" />
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
