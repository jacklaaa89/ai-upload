'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Attachment, ChatRequestBody, ContextItem, GenericContext } from '../types';
import { sendMessage } from '../utils/api';
import { FiPaperclip, FiSend } from 'react-icons/fi';
import ChatMessage from './ChatMessage';
import InputArea from './InputArea';

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
  onCreateCanvas
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
  // Track the conversation ID to detect changes
  const prevConversationIdRef = useRef<string>(conversationId);
  const messageContentRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // When conversation changes, reset local state to match initialMessages
  useEffect(() => {
    if (conversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = conversationId;
      setMessages(initialMessages);
    }
  }, [conversationId, initialMessages]);

  // One-way sync: Update local messages when initialMessages change for the same conversation
  useEffect(() => {
    // Only update local state if this is not from a local change
    if (conversationId === prevConversationIdRef.current) {
      setMessages(initialMessages);
    }
  }, [initialMessages, conversationId]);
  
  // Handle sending a message
  const handleSendMessage = useCallback(async (inputText: string, messageAttachments: Attachment[]) => {
    if ((!inputText.trim() && messageAttachments.length === 0) || isLoading) return;
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
      attachments: messageAttachments.length > 0 ? [...messageAttachments] : undefined,
    };
    
    // Create initial assistant message
    const assistantMessageId = Date.now().toString() + '-assistant';
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      model: selectedModel.id,
    };
    
    // Update local state with both messages
    const updatedMessages = [...messages, userMessage, assistantMessage];
    setMessages(updatedMessages);
    
    // Immediately notify parent of the update
    if (onMessagesUpdate) {
      onMessagesUpdate(updatedMessages);
    }
    
    // Set loading state
    setIsLoading(true);
    setStreamingMessageId(assistantMessageId);
    
    try {
      // Reset content reference for streaming
      messageContentRef.current = '';
      
      // Prepare request
      const requestBody: ChatRequestBody = {
        message: inputText,
        attachments: messageAttachments,
        contextItems,
        model: selectedModel,
        conversationId,
        projectContext
      };
      
      // Start streaming
      await sendMessage(
        requestBody,
        (chunk) => {
          // Update content ref immediately
          messageContentRef.current += chunk;
          
          // Update message with new content in a single state update
          setMessages(prevMessages => {
            const updatedMessages = prevMessages.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: messageContentRef.current } 
                : msg
            );
            
            // Notify parent of the update
            if (onMessagesUpdate) {
              onMessagesUpdate(updatedMessages);
            }
            
            return updatedMessages;
          });
        },
        (error) => {
          // Handle error
          console.error('Error sending message:', error);
          const errorContent = 'Sorry, there was an error processing your request. Please try again.';
          
          // Update local message
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: errorContent } 
                : msg
            )
          );
          
          // Notify parent of the update with error
          if (onMessagesUpdate) {
            onMessagesUpdate([...messages.filter(m => m.id !== assistantMessageId), 
              {...assistantMessage, content: errorContent}]);
          }
          
          // Reset states
          setIsLoading(false);
          setStreamingMessageId(null);
        },
        () => {
          // Final content
          const finalContent = messageContentRef.current;
          
          // Update local message with final content
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: finalContent } 
                : msg
            )
          );
          
          // Create final message list using the current messages state
          if (onMessagesUpdate) {
            // Update current messages in parent component with the final content
            setMessages(prevMessages => {
              const updatedMessages = prevMessages.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: finalContent } 
                  : msg
              );
              
              // Notify parent with updated messages
              onMessagesUpdate(updatedMessages);
              
              return updatedMessages;
            });
          }
          
          // Reset states
          setIsLoading(false);
          setStreamingMessageId(null);
        }
      );
    } catch (error) {
      console.error('Error in message handling:', error);
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, [messages, contextItems, conversationId, isLoading, projectContext, selectedModel, onMessagesUpdate]);
  
  // Delete a message
  const handleDeleteMessage = (id: string) => {
    const updatedMessages = messages.filter(msg => msg.id !== id);
    setMessages(updatedMessages);
    
    // Notify parent of the update
    if (onMessagesUpdate) {
      onMessagesUpdate(updatedMessages);
    }
  };

  // Handle sending a message from text selection
  const handleSendSelectedAsPrompt = useCallback((selectedText: string, attachments: Attachment[] = []) => {
    console.log("ChatWindow received selectedText prompt:", selectedText);
    if (selectedText.trim()) {
      handleSendMessage(selectedText, attachments);
    } else {
      console.error("Empty selectedText received in ChatWindow");
    }
  }, [handleSendMessage]);

  // Create a canvas from selected text
  const handleCreateCanvas = (content: string) => {
    if (onCreateCanvas) {
      onCreateCanvas(content);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
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
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area with rich features */}
      <div className="border-t">
        <InputArea 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
} 