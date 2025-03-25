"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Attachment,
  ChatRequestBody,
  ContextItem,
  GenericContext,
  Message,
} from "../types";
import { sendMessage } from "../utils/api";
import ChatMessage from "./ChatMessage";
import InputArea from "./InputArea";

interface ChatWindowProps {
  conversationId: string;
  initialMessages?: Message[];
  selectedModel: {
    id: string;
    name: string;
  };
  contextItems?: ContextItem[];
  projectContext?: GenericContext;
  onMessagesUpdate?: (messages: Message[]) => void;
  onCreateCanvas?: (content: string) => void;
}

export default function ChatWindow({
  conversationId,
  initialMessages = [],
  selectedModel,
  contextItems = [],
  projectContext,
  onMessagesUpdate,
  onCreateCanvas,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pendingMessages, setPendingMessages] = useState<Message[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  const prevConversationIdRef = useRef<string>(conversationId);
  const messageContentRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (pendingMessages && onMessagesUpdate) {
      setTimeout(() => {
        onMessagesUpdate(pendingMessages);
      }, 0);
      setPendingMessages(null);
    }
  }, [pendingMessages, onMessagesUpdate]);

  useEffect(() => {
    if (conversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = conversationId;
      setMessages(initialMessages);
    }
  }, [conversationId, initialMessages]);

  useEffect(() => {
    if (conversationId === prevConversationIdRef.current) {
      setMessages(initialMessages);
    }
  }, [initialMessages, conversationId]);

  const handleSendMessage = useCallback(
    async (inputText: string, messageAttachments: Attachment[]) => {
      if ((!inputText.trim() && messageAttachments.length === 0) || isLoading)
        return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: inputText,
        timestamp: new Date().toISOString(),
        attachments:
          messageAttachments.length > 0 ? [...messageAttachments] : undefined,
      };

      const assistantMessageId = Date.now().toString() + "-assistant";
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        model: selectedModel.id,
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      setPendingMessages(updatedMessages);

      setIsLoading(true);
      setStreamingMessageId(assistantMessageId);

      try {
        messageContentRef.current = "";

        const requestBody: ChatRequestBody = {
          message: inputText,
          attachments: messageAttachments,
          contextItems,
          model: selectedModel,
          conversationId,
          projectContext,
        };

        await sendMessage(
          requestBody,
          (chunk) => {
            messageContentRef.current += chunk;
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: messageContentRef.current }
                  : msg
              )
            );
          },
          (error) => {
            console.error("Error sending message:", error);
            const errorContent =
              "Sorry, there was an error processing your request. Please try again.";
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: errorContent }
                  : msg
              )
            );
            setIsLoading(false);
            setStreamingMessageId(null);
          },
          () => {
            setIsLoading(false);
            setStreamingMessageId(null);
          }
        );
      } catch (error) {
        console.error("Error in message handling:", error);
        setIsLoading(false);
        setStreamingMessageId(null);
      }
    },
    [
      messages,
      contextItems,
      conversationId,
      isLoading,
      projectContext,
      selectedModel,
    ]
  );

  const handleDeleteMessage = (id: string) => {
    const updatedMessages = messages.filter((msg) => msg.id !== id);
    setMessages(updatedMessages);
    if (onMessagesUpdate) {
      onMessagesUpdate(updatedMessages);
    }
  };

  const handleSendSelectedAsPrompt = useCallback(
    (selectedText: string, attachments: Attachment[] = []) => {
      if (selectedText.trim()) {
        handleSendMessage(selectedText, attachments);
      } else {
        console.error("Empty selectedText received in ChatWindow");
      }
    },
    [handleSendMessage]
  );

  const handleCreateCanvas = (content: string) => {
    if (onCreateCanvas) {
      onCreateCanvas(content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
            onDeleteMessage={handleDeleteMessage}
            onSendMessage={handleSendSelectedAsPrompt}
            onCreateCanvas={handleCreateCanvas}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t">
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
