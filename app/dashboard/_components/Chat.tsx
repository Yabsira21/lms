"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, User } from "lucide-react";
// import { sendLiveClassMessage } from "../actions";
import { format } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";
import { sendLiveClassMessage } from "../liveclass/[slug]/action";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface ChatProps {
  initialMessages: Message[];
  liveClassId: string;
  currentUser: {
    id: string;
    name: string;
    image?: string | null; // Make image optional
  };
}

export function Chat({ initialMessages, liveClassId, currentUser }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/live-class/${liveClassId}/messages`);
        const newMessages = await response.json();
        if (newMessages.length > messages.length) {
          setMessages(newMessages);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [liveClassId, messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const result = await sendLiveClassMessage(liveClassId, newMessage);

    if (result.error) {
      toast.error(result.error);
    } else {
      // Optimistically add message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        createdAt: new Date(),
        user: currentUser,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");
      inputRef.current?.focus();
    }

    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border">
      {/* Chat Header */}
      <div className="border-b p-4">
        <h3 className="font-semibold">Class Group Chat</h3>
        <p className="text-sm text-muted-foreground">
          Chat with all enrolled students and instructors
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="size-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.user.id === currentUser.id;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                {!isCurrentUser && (
                  <div className="flex-shrink-0">
                    {message.user.image ? (
                      <Image
                        src={message.user.image}
                        alt={message.user.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[70%] ${isCurrentUser ? "order-1" : "order-2"}`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {message.user.name}
                    </p>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(message.createdAt), "h:mm a")}
                  </p>
                </div>

                {isCurrentUser && (
                  <div className="flex-shrink-0 order-2">
                    {currentUser.image ? (
                      <Image
                        src={currentUser.image}
                        alt={currentUser.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
