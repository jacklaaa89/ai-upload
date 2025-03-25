"use client";

import { useEffect, useRef, useState } from "react";
import { FaEllipsisV, FaRobot, FaTrash, FaUser } from "react-icons/fa";
import { FiCheck, FiCopy } from "react-icons/fi";
import { RiRobot2Line } from "react-icons/ri";
import { Attachment, Message } from "../types";
import FilePreview from "./FilePreview";
import LatexRenderer from "./LatexRenderer";
import SyntaxHighlightRenderer from "./SyntaxHighlightRenderer";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onDeleteMessage?: (id: string) => void;
  onSendMessage?: (content: string, attachments: Attachment[]) => void;
  onCreateCanvas?: (content: string) => void;
}

export default function ChatMessage({
  message,
  isStreaming = false,
  onDeleteMessage,
  onSendMessage,
  onCreateCanvas,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [displayedContent, setDisplayedContent] = useState(message.content);
  const [isTyping, setIsTyping] = useState(!isUser && isStreaming);
  const typingRef = useRef<HTMLDivElement>(null);
  const [showOptions, setShowOptions] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [copyButtonPosition, setCopyButtonPosition] = useState({
    top: 0,
    left: 0,
  });
  const [isCopied, setIsCopied] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [promptSent, setPromptSent] = useState(false);
  const [canvasSent, setCanvasSent] = useState(false);
  const isMountedRef = useRef(true);
  const [timeString, setTimeString] = useState("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize or update displayed content when message changes
  useEffect(() => {
    setDisplayedContent(message.content);
    setIsTyping(isStreaming && !isUser && !message.content);
  }, [message.content, isUser, isStreaming]);

  // Handle streaming display of content for AI messages
  useEffect(() => {
    if (isUser) return;

    if (isStreaming && typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [message.content, isUser, isStreaming]);

  // Format time consistently across server and client
  useEffect(() => {
    // Only run this on the client after hydration
    setTimeString(
      new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [message.timestamp]);

  // CSS for animating the typing dots
  const typingAnimationCSS = `
    @keyframes blink {
      0% { opacity: 0.3; }
      50% { opacity: 1; }
      100% { opacity: 0.3; }
    }
    
    .dot {
      display: inline-block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      margin-right: 3px;
      background: currentColor;
      animation: blink 1.4s infinite both;
    }
    
    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }
  `;

  // Handle text selection for AI responses
  useEffect(() => {
    if (isUser) return; // Only for AI responses

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || "";

      if (
        selectedText &&
        selection?.rangeCount &&
        contentRef.current?.contains(selection.anchorNode)
      ) {
        setSelectedText(selectedText);

        // Get selection coordinates to position copy button
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position the button above the selection
        setCopyButtonPosition({
          top: rect.top - 35, // 35px above selection
          left: rect.left + rect.width / 2 - 20, // Centered horizontally
        });

        setShowCopyButton(true);
      } else {
        // Don't hide immediately so the button can be clicked
        if (showCopyButton && !isCopied && !promptSent && !canvasSent) {
          // Use a timeout to allow clicking the copy button
          setTimeout(() => {
            if (
              isMountedRef.current &&
              !isCopied &&
              !promptSent &&
              !canvasSent
            ) {
              setShowCopyButton(false);
            }
          }, 200);
        }
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
    };
  }, [isUser, showCopyButton, isCopied, promptSent, canvasSent]);

  // Function to copy selected text
  const copySelectedText = () => {
    if (selectedText) {
      // Hide menu immediately
      setShowCopyButton(false);

      navigator.clipboard.writeText(selectedText).then(
        () => {
          setIsCopied(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsCopied(false);
            }
          }, 1500);
        },
        (err) => {
          console.error("Could not copy text: ", err);
        }
      );
    }
  };

  // Function to send selected text as a new prompt
  const sendAsPrompt = () => {
    if (selectedText && onSendMessage) {
      console.log("Sending selected text as prompt:", selectedText);

      // Capture current selected text before setting state
      const textToSend = selectedText;

      // Hide menu immediately
      setShowCopyButton(false);

      // Update UI state
      setPromptSent(true);

      // Send the captured text
      onSendMessage(textToSend, []);

      // Reset UI state after delay
      setTimeout(() => {
        if (isMountedRef.current) {
          setPromptSent(false);
        }
      }, 1500);
    } else {
      console.error(
        "Cannot send as prompt: selectedText or onSendMessage is missing",
        { hasSelectedText: !!selectedText, hasOnSendMessage: !!onSendMessage }
      );
    }
  };

  // Function to create canvas from selected text
  const createCanvas = () => {
    if (selectedText && onCreateCanvas) {
      // Hide menu immediately
      setShowCopyButton(false);

      onCreateCanvas(selectedText);
      setCanvasSent(true);
      setTimeout(() => {
        if (isMountedRef.current) {
          setCanvasSent(false);
        }
      }, 1500);
    }
  };

  const handleDelete = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id);
    }
    setShowOptions(false);
  };

  // Function to render content with appropriate rendering based on content type
  const renderContent = () => {
    // For streaming content, use a simpler approach
    if (isTyping) {
      return (
        <>
          <span>{displayedContent}</span>
          <span className="typing-indicator ml-1 inline-flex">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
        </>
      );
    }

    try {
      // Check for potential code blocks in the message
      const hasCodeBlocks = displayedContent.includes("```");

      // Check for potential LaTeX content
      const hasPotentialLatex = displayedContent.includes("$");

      // If the content is very simple text, just render as plain text
      if (!hasCodeBlocks && !hasPotentialLatex) {
        return displayedContent;
      }

      // First, process code blocks
      const processedContent = hasCodeBlocks ? (
        <SyntaxHighlightRenderer content={displayedContent} />
      ) : (
        displayedContent
      );

      // Then, if there's LaTeX, process that
      if (hasPotentialLatex) {
        return <LatexRenderer content={displayedContent} />;
      }

      // If only code blocks, return the code-processed content
      return processedContent;
    } catch (error) {
      console.error("Error rendering message content:", error);
      // Fallback to plain text if rendering fails
      return displayedContent;
    }
  };

  return (
    <div className={`flex my-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <style jsx>{typingAnimationCSS}</style>
      <div
        className={`flex max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        } relative group`}
      >
        <div
          className={`flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 ${
            isUser ? "bg-blue-500 ml-3" : "bg-green-500 mr-3"
          }`}
        >
          {isUser ? (
            <FaUser className="text-white" size={14} />
          ) : (
            <RiRobot2Line className="text-white" size={16} />
          )}
        </div>

        <div
          className={`
            py-4 px-5 rounded-2xl shadow-sm
            ${
              isUser
                ? "bg-blue-100 rounded-tr-none text-gray-800"
                : "bg-green-100 rounded-tl-none text-gray-800"
            } 
            relative
          `}
        >
          {onDeleteMessage && (
            <button
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowOptions(!showOptions)}
            >
              <FaEllipsisV
                className="text-gray-400 hover:text-gray-600"
                size={12}
              />
            </button>
          )}

          {showOptions && (
            <div className="absolute top-8 right-2 bg-white shadow-lg rounded-md py-1 z-50">
              <button
                className="flex items-center px-3 py-2 text-sm text-red-500 hover:bg-gray-100 w-full text-left"
                onClick={handleDelete}
              >
                <FaTrash className="mr-2" size={12} /> Delete
              </button>
            </div>
          )}

          {showOptions && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowOptions(false)}
            />
          )}

          <div
            ref={contentRef}
            className={`whitespace-pre-wrap mb-2 ${
              isUser ? "text-base leading-relaxed" : "text-base leading-relaxed"
            }`}
          >
            {renderContent()}
            <div ref={typingRef} className="h-0 w-0" aria-hidden="true"></div>
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {message.attachments.map((attachment) => (
                <FilePreview key={attachment.id} attachment={attachment} />
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
            <span suppressHydrationWarning>
              {timeString ||
                new Date(message.timestamp).toISOString().substring(11, 16)}
            </span>
            {message.model && !isUser && (
              <span className="flex items-center ml-2 bg-gray-200 px-2 py-0.5 rounded-full">
                <FaRobot className="mr-1" size={10} />
                {message.model}
              </span>
            )}
          </div>
        </div>
      </div>

      {showCopyButton && !isUser && (
        <div
          className="fixed z-50 shadow-lg rounded-md bg-gray-800 py-1 transition-opacity"
          style={{
            top: `${copyButtonPosition.top}px`,
            left: `${copyButtonPosition.left}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex flex-col min-w-[120px]">
            <button
              className="flex items-center text-white text-xs font-medium px-3 py-2 hover:bg-gray-700"
              onClick={copySelectedText}
              title="Copy to clipboard"
            >
              {isCopied ? (
                <>
                  <FiCheck className="mr-2" size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="mr-2" size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>

            {onSendMessage && (
              <button
                className="flex items-center text-white text-xs font-medium px-3 py-2 hover:bg-gray-700"
                onClick={sendAsPrompt}
                title="Send as new prompt"
              >
                {promptSent ? (
                  <>
                    <FiCheck className="mr-2" size={14} />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 12L18 4L14 22L10 14L2 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Send as prompt</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
