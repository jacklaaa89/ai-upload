"use client";

import "prismjs/themes/prism-okaidia.css";
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

// Define props interface
interface SyntaxHighlightRendererProps {
  content: string;
  className?: string;
}

export default function SyntaxHighlightRenderer({
  content,
  className = "",
}: SyntaxHighlightRendererProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Function to copy code to clipboard
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Show copied indicator
        setCopiedIndex(index);
        // Reset after 2 seconds
        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  // Check if content contains code blocks with ```
  if (!content.includes("```")) {
    return <span className={className}>{content}</span>;
  }

  // Map language aliases
  const languageMap: { [key: string]: string } = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    golang: "go",
    rs: "rust",
    md: "markdown",
    html: "html",
    css: "css",
    scss: "scss",
    sql: "sql",
    json: "json",
    jsx: "jsx",
    tsx: "tsx",
    "": "text", // Default language
  };

  // Apply syntax highlighting after component mounts
  useEffect(() => {
    if (!codeRef.current || isHighlighted) return;

    let isMounted = true;

    const highlightCode = async () => {
      if (typeof window === "undefined") return;

      try {
        // Dynamically import Prism
        const Prism = (await import("prismjs")).default;

        // Import core styles directly via JavaScript
        // This is to ensure styles are applied correctly
        const style = document.createElement("style");
        style.textContent = `
          /* Override any inline styles with !important */
          code[class*="language-"] {
            color: #f8f8f2 !important;
            text-shadow: 0 1px rgba(0, 0, 0, 0.3) !important;
          }
          
          .token.comment { color: #8292a2 !important; }
          .token.punctuation { color: #f8f8f2 !important; }
          .token.property, .token.tag { color: #f92672 !important; }
          .token.boolean, .token.number { color: #ae81ff !important; }
          .token.selector, .token.string { color: #a6e22e !important; }
          .token.operator { color: #f8f8f2 !important; }
          .token.function { color: #e6db74 !important; }
          .token.keyword { color: #66d9ef !important; font-style: italic !important; }
          .token.regex { color: #fd971f !important; }
        `;
        document.head.appendChild(style);

        // Only load languages that are actually used in the content
        const languagesToLoad = [];
        const codeBlockRegex = /```([\w-]*)/g;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
          const lang = match[1] ? languageMap[match[1]] || match[1] : "text";
          if (lang !== "text" && languagesToLoad.indexOf(lang) === -1) {
            languagesToLoad.push(lang);
          }
        }

        // Load required language components
        await Promise.all(
          languagesToLoad.map(async (lang) => {
            try {
              // Use dynamic import with error handling
              // @ts-ignore - TypeScript doesn't know about these dynamic imports
              await import(`prismjs/components/prism-${lang}`);
              console.log(`Loaded language: ${lang}`);
            } catch (e) {
              console.warn(`Failed to load language: ${lang}`, e);
            }
          })
        );

        // Apply highlighting after a short delay to ensure DOM is updated
        setTimeout(() => {
          if (isMounted && codeRef.current) {
            // Force Prism to apply highlighting to each code block
            const codeBlocks = codeRef.current.querySelectorAll("pre code");
            codeBlocks.forEach((block) => {
              Prism.highlightElement(block);
            });
            console.log(
              "Applied syntax highlighting to",
              codeBlocks.length,
              "blocks"
            );
            setIsHighlighted(true);
          }
        }, 100);
      } catch (error) {
        console.error("Failed to load Prism:", error);
      }
    };

    highlightCode();

    return () => {
      isMounted = false;
    };
  }, [content, isHighlighted]);

  // Extract and render code blocks
  try {
    const parts = content.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g);

    return (
      <div ref={codeRef} className={`syntax-wrapper ${className}`}>
        {parts.map((part, index) => {
          // Check if this part is a code block
          const codeBlockMatch = part.match(
            /```((?:[\w-]+)?)\n([\s\S]*?)\n```/
          );

          if (codeBlockMatch) {
            const language = codeBlockMatch[1] || "";
            const code = codeBlockMatch[2];

            // Map the language
            const mappedLanguage = languageMap[language] || language || "text";

            return (
              <div
                key={index}
                className="code-block my-3 overflow-hidden rounded-md shadow-md"
              >
                <div className="code-header px-4 py-2 text-xs bg-gray-800 text-gray-200 flex items-center justify-between">
                  <span className="font-medium">
                    {mappedLanguage !== "text"
                      ? mappedLanguage.toUpperCase()
                      : "TEXT"}
                  </span>
                  <div className="flex items-center">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700 mr-2">
                      CODE
                    </span>
                    <button
                      className="flex items-center justify-center p-1 hover:bg-gray-700 rounded transition-colors"
                      onClick={() => copyToClipboard(code, index)}
                      aria-label="Copy code to clipboard"
                      title="Copy code to clipboard"
                    >
                      {copiedIndex === index ? (
                        <FiCheck className="text-green-400" size={14} />
                      ) : (
                        <FiCopy
                          className="text-gray-300 hover:text-white"
                          size={14}
                        />
                      )}
                    </button>
                  </div>
                </div>
                {/* Add a custom background color to ensure visibility */}
                <pre
                  className={`language-${mappedLanguage}`}
                  style={{
                    margin: 0,
                    padding: "1rem",
                    background: "#272822",
                    borderRadius: "0 0 0.375rem 0.375rem",
                    overflow: "auto",
                  }}
                >
                  <code className={`language-${mappedLanguage}`}>{code}</code>
                </pre>
              </div>
            );
          }

          // Regular text
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  } catch (error) {
    console.error("Error rendering code blocks:", error);
    // Fallback to plain text if rendering fails
    return <div className={className}>{content}</div>;
  }
}
