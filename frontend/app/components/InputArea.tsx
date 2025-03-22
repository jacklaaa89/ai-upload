'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { FaPaperPlane, FaFile, FaTimes, FaCode, FaSquareRootAlt } from 'react-icons/fa';
import { MdFunctions } from 'react-icons/md';
import { Attachment } from '../types';

interface InputAreaProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

export default function InputArea({ onSendMessage, isLoading }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMathMenu, setShowMathMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const codeMenuRef = useRef<HTMLButtonElement>(null);
  const mathMenuRef = useRef<HTMLButtonElement>(null);
  const formatMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const mathMenuContainerRef = useRef<HTMLDivElement>(null);
  const [languageMenuPosition, setLanguageMenuPosition] = useState<'right' | 'left'>('right');
  const [mathMenuPosition, setMathMenuPosition] = useState<'right' | 'left'>('right');

  // Calculate menu positions
  useEffect(() => {
    const calculatePosition = () => {
      // Check code menu position
      if (codeMenuRef.current) {
        const rect = codeMenuRef.current.getBoundingClientRect();
        const parentRect = codeMenuRef.current.closest('.absolute')?.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // If parent menu is already close to right edge, position language menu to the left
        if (parentRect && (viewportWidth - parentRect.right < 200)) {
          setLanguageMenuPosition('left');
        } else {
          // Otherwise check the remaining space
          const remainingRight = viewportWidth - rect.right;
          setLanguageMenuPosition(remainingRight < 170 ? 'left' : 'right');
        }
      }
      
      // Check math menu position
      if (mathMenuRef.current) {
        const rect = mathMenuRef.current.getBoundingClientRect();
        const parentRect = mathMenuRef.current.closest('.absolute')?.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // If parent menu is already close to right edge, position math menu to the left
        if (parentRect && (viewportWidth - parentRect.right < 200)) {
          setMathMenuPosition('left');
        } else {
          // Otherwise check the remaining space
          const remainingRight = viewportWidth - rect.right;
          setMathMenuPosition(remainingRight < 200 ? 'left' : 'right');
        }
      }
    };
    
    // Calculate immediately when menus change
    calculatePosition();
    
    if (showFormatMenu || showLanguageMenu || showMathMenu) {
      window.addEventListener('resize', calculatePosition);
    }
    
    return () => {
      window.removeEventListener('resize', calculatePosition);
    };
  }, [showFormatMenu, showLanguageMenu, showMathMenu]);

  // Adjust menu positions after they render if they exceed viewport boundaries
  useLayoutEffect(() => {
    const adjustMenuPositions = () => {
      // Adjust format menu
      if (formatMenuRef.current) {
        const rect = formatMenuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Fix right edge overflow
        if (rect.right > viewportWidth) {
          formatMenuRef.current.style.right = '0';
          formatMenuRef.current.style.left = 'auto';
        }
        
        // Fix bottom edge overflow
        if (rect.bottom > viewportHeight) {
          formatMenuRef.current.style.bottom = 'calc(100% + 5px)';
          formatMenuRef.current.style.top = 'auto';
        }
      }
      
      // Adjust language menu
      if (languageMenuRef.current) {
        const rect = languageMenuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // If menu exceeds right edge, position it to the left
        if (rect.right > viewportWidth) {
          setLanguageMenuPosition('left');
        }
        
        // If menu exceeds left edge, position it to the right
        if (rect.left < 0) {
          setLanguageMenuPosition('right');
        }
      }
      
      // Adjust math menu
      if (mathMenuContainerRef.current) {
        const rect = mathMenuContainerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // If menu exceeds right edge, position it to the left
        if (rect.right > viewportWidth) {
          setMathMenuPosition('left');
        }
        
        // If menu exceeds left edge, position it to the right
        if (rect.left < 0) {
          setMathMenuPosition('right');
        }
      }
    };
    
    // Only run adjustment if menus are open
    if (showFormatMenu || showLanguageMenu || showMathMenu) {
      // Wait for the DOM to update
      requestAnimationFrame(adjustMenuPositions);
    }
  }, [showFormatMenu, showLanguageMenu, showMathMenu, languageMenuPosition, mathMenuPosition]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Setup drag and drop event listeners
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer?.files) {
        handleFiles(e.dataTransfer.files);
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleFiles = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
      const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
      
      return isImage || isPdf || isText || isCsv;
    });

    if (validFiles.length > 0) {
      const newAttachments = validFiles.map(file => {
        // Create a URL for the file preview if it's an image
        const isImage = file.type.startsWith('image/');
        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
        
        return {
          id: `temp-${Date.now()}-${file.name}`,
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
          previewUrl,
          file
        };
      });
      
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setShowFileUpload(false);
  };

  const handleSendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const filtered = prev.filter(a => a.id !== id);
      
      // Revoke the URLs to avoid memory leaks
      const attachment = prev.find(a => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.url);
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
      
      return filtered;
    });
  };

  const triggerFileInput = () => {
    setShowFileUpload(!showFileUpload);
  };

  const insertCodeBlock = (language = '') => {
    const codeBlock = `\`\`\`${language}\n// Your code here\n\`\`\``;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      
      const textBefore = message.substring(0, startPos);
      const textAfter = message.substring(endPos);
      
      // Add newlines for better formatting
      const newText = textBefore + 
        (textBefore.endsWith('\n') || textBefore === '' ? '' : '\n') + 
        codeBlock + 
        (textAfter.startsWith('\n') || textAfter === '' ? '' : '\n') + 
        textAfter;
      
      setMessage(newText);
      
      // Focus and set cursor position after added code block
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = textBefore.length + 
          (textBefore.endsWith('\n') || textBefore === '' ? 0 : 1) + 
          4 + language.length; // Position after "```language\n"
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    
    setShowFormatMenu(false);
    setShowLanguageMenu(false);
  };
  
  const insertMathExpression = (expression: string, isBlock = false) => {
    if (isBlock) {
      const mathBlock = `$$\n${expression}\n$$`;
      const textarea = textareaRef.current;
      
      if (textarea) {
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        
        const textBefore = message.substring(0, startPos);
        const textAfter = message.substring(endPos);
        
        // Add newlines for better formatting
        const newText = textBefore + 
          (textBefore.endsWith('\n') || textBefore === '' ? '' : '\n') + 
          mathBlock + 
          (textAfter.startsWith('\n') || textAfter === '' ? '' : '\n') + 
          textAfter;
        
        setMessage(newText);
        
        // Focus and set cursor position within the expression
        setTimeout(() => {
          textarea.focus();
          const newCursorPos = textBefore.length + 
            (textBefore.endsWith('\n') || textBefore === '' ? 0 : 1) + 
            3 + Math.floor(expression.length / 2); // Position roughly in the middle of the expression
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    } else {
      // Inline math
      const mathTemplate = `$${expression}$`;
      const textarea = textareaRef.current;
      
      if (textarea) {
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        
        const textBefore = message.substring(0, startPos);
        const textAfter = message.substring(endPos);
        
        // If text is selected, use it in the expression
        if (startPos !== endPos) {
          const selectedText = message.substring(startPos, endPos);
          const newText = textBefore + `$${expression.replace('x', selectedText)}$` + textAfter;
          setMessage(newText);
        } else {
          const newText = textBefore + mathTemplate + textAfter;
          setMessage(newText);
          
          // Place cursor in the middle of the expression
          setTimeout(() => {
            textarea.focus();
            const newCursorPos = startPos + 1 + Math.floor(expression.length / 2);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);
        }
      }
    }
    
    setShowFormatMenu(false);
    setShowMathMenu(false);
  };
  
  const insertBlockMath = () => {
    insertMathExpression('y = x^2', true);
  };

  return (
    <div className="relative">
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-70 border-2 border-dashed border-blue-400 rounded-md z-50 flex items-center justify-center">
          <p className="text-lg font-medium text-blue-600">Drop files to upload</p>
        </div>
      )}
      
      {/* File upload modal */}
      {showFileUpload && (
        <div className="absolute bottom-full mb-2 right-0 w-80 bg-white rounded-md shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Upload Files</h3>
            <button 
              onClick={() => setShowFileUpload(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>
          
          <div 
            ref={dropAreaRef}
            className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 mb-3"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dropAreaRef.current) {
                dropAreaRef.current.classList.add('border-blue-400', 'bg-blue-50');
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dropAreaRef.current) {
                dropAreaRef.current.classList.remove('border-blue-400', 'bg-blue-50');
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dropAreaRef.current) {
                dropAreaRef.current.classList.remove('border-blue-400', 'bg-blue-50');
              }
              if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
              }
            }}
          >
            <FaFile className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-600 mb-1">Drag files here or click to browse</p>
            <p className="text-xs text-gray-500">Accepts images, PDFs, text files, and CSVs</p>
          </div>
          
          <button
            onClick={() => setShowFileUpload(false)}
            className="w-full py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* File attachments display */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border-t border-l border-r rounded-t bg-gray-50">
          {attachments.map(attachment => (
            <div 
              key={attachment.id} 
              className="flex items-center bg-white border rounded px-2 py-1 pr-1"
            >
              {attachment.previewUrl && attachment.type.startsWith('image/') ? (
                <img 
                  src={attachment.previewUrl} 
                  alt={attachment.name}
                  className="h-6 w-6 object-cover rounded mr-2"
                />
              ) : (
                <FaFile className="text-gray-500 mr-2" size={12} />
              )}
              <span className="text-sm truncate max-w-[120px]">{attachment.name}</span>
              <button 
                className="ml-2 text-gray-500 hover:text-red-500"
                onClick={() => handleRemoveAttachment(attachment.id)}
              >
                <FaTimes size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className={`flex items-end border rounded-md shadow-sm bg-white ${attachments.length > 0 ? 'rounded-t-none border-t-0' : ''}`}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-3 max-h-40 resize-none focus:outline-none"
          placeholder="Type a message..."
          rows={1}
          disabled={isLoading}
        />
        
        <div className="flex p-2 space-x-1">
          <div className="relative">
            <button
              onClick={() => {
                setShowFormatMenu(!showFormatMenu);
                setShowLanguageMenu(false);
                setShowMathMenu(false);
                
                // Calculate position for format menu before showing
                requestAnimationFrame(() => {
                  const button = document.activeElement as HTMLElement;
                  if (button && formatMenuRef.current) {
                    const buttonRect = button.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    // Check if button is near right edge of screen
                    if (viewportWidth - buttonRect.right < 180) {
                      formatMenuRef.current.style.right = '0';
                      formatMenuRef.current.style.left = 'auto';
                    }
                    
                    // Check if button is near bottom of screen
                    if (viewportHeight - buttonRect.bottom < 200) {
                      formatMenuRef.current.style.bottom = 'auto';
                      formatMenuRef.current.style.top = '0';
                    }
                  }
                });
              }}
              className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
              disabled={isLoading}
              title="Format options"
            >
              <FaCode />
            </button>
            
            {showFormatMenu && (
              <div 
                ref={formatMenuRef}
                className="absolute bottom-12 right-0 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[180px] z-50"
                style={{
                  maxWidth: 'calc(100vw - 20px)',
                  maxHeight: 'calc(100vh - 100px)',
                  overflow: 'auto'
                }}
              >
                <div className="relative">
                  <button
                    ref={codeMenuRef}
                    onClick={() => {
                      setShowLanguageMenu(!showLanguageMenu);
                      setShowMathMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center hover:bg-gray-100 justify-between"
                  >
                    <div className="flex items-center">
                      <FaCode className="mr-2 text-gray-600" />
                      <span>Code Block</span>
                    </div>
                    <span className="text-gray-400">▶</span>
                  </button>
                  
                  {showLanguageMenu && (
                    <div 
                      ref={languageMenuRef}
                      className={`absolute ${languageMenuPosition === 'right' ? 'left-full' : 'right-full'} top-0 bg-white rounded-md shadow-xl border border-gray-200 py-1 w-[150px] max-h-[300px] overflow-y-auto z-[60]`}
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        marginLeft: languageMenuPosition === 'right' ? '1px' : '',
                        marginRight: languageMenuPosition === 'left' ? '1px' : '',
                        transform: languageMenuPosition === 'right' 
                          ? 'translateX(0)' 
                          : 'translateX(0)',
                        maxWidth: 'calc(100vw - 20px)',
                        maxHeight: 'calc(100vh - 200px)'
                      }}
                    >
                      <button
                        onClick={() => {
                          insertCodeBlock('');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Plain
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('js');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        JavaScript
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('ts');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        TypeScript
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('python');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Python
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('java');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Java
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('go');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Go
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('rust');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Rust
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('cpp');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        C++
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('html');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        HTML
                      </button>
                      <button
                        onClick={() => {
                          insertCodeBlock('css');
                          setShowLanguageMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        CSS
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <button
                    ref={mathMenuRef}
                    onClick={() => {
                      setShowMathMenu(!showMathMenu);
                      setShowLanguageMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center hover:bg-gray-100 justify-between"
                  >
                    <div className="flex items-center">
                      <MdFunctions className="mr-2 text-gray-600" />
                      <span>Inline Math</span>
                    </div>
                    <span className="text-gray-400">▶</span>
                  </button>
                  
                  {showMathMenu && (
                    <div 
                      ref={mathMenuContainerRef}
                      className={`absolute ${mathMenuPosition === 'right' ? 'left-full' : 'right-full'} top-0 bg-white rounded-md shadow-xl border border-gray-200 py-1 w-[180px] max-h-[300px] overflow-y-auto z-[60]`}
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        marginLeft: mathMenuPosition === 'right' ? '1px' : '',
                        marginRight: mathMenuPosition === 'left' ? '1px' : '',
                        transform: mathMenuPosition === 'right' 
                          ? 'translateX(0)' 
                          : 'translateX(0)',
                        maxWidth: 'calc(100vw - 20px)',
                        maxHeight: 'calc(100vh - 200px)'
                      }}
                    >
                      <button
                        onClick={() => {
                          insertMathExpression('x^2');
                          setShowMathMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Power: x²
                      </button>
                      <button
                        onClick={() => {
                          insertMathExpression('\\frac{x}{y}');
                          setShowMathMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Fraction: x/y
                      </button>
                      <button
                        onClick={() => {
                          insertMathExpression('\\sqrt{x}');
                          setShowMathMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Square Root: √x
                      </button>
                      <button
                        onClick={() => {
                          insertMathExpression('\\sum_{i=1}^{n} x_i');
                          setShowMathMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Sum: Σx
                      </button>
                      <button
                        onClick={() => {
                          insertMathExpression('\\int_{a}^{b} f(x) dx');
                          setShowMathMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Integral: ∫f(x)dx
                      </button>
                      <button
                        onClick={() => {
                          insertMathExpression('\\lim_{x \\to \\infty} f(x)');
                          setShowMathMenu(false);
                          setShowFormatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        Limit: lim f(x)
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    insertBlockMath();
                    setShowFormatMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm flex items-center hover:bg-gray-100"
                >
                  <FaSquareRootAlt className="mr-2 text-gray-600" />
                  <span>Math Block</span>
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={triggerFileInput}
            className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
            disabled={isLoading}
            title="Add file"
          >
            <FaFile />
          </button>
          
          <button
            onClick={handleSendMessage}
            className={`p-2 rounded-full ${
              message.trim() || attachments.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
            disabled={(!message.trim() && attachments.length === 0) || isLoading}
          >
            <FaPaperPlane />
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.csv"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
      
      {/* Close format menu when clicking outside */}
      {(showFormatMenu || showLanguageMenu || showMathMenu || showFileUpload) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFormatMenu(false);
            setShowLanguageMenu(false);
            setShowMathMenu(false);
            setShowFileUpload(false);
          }}
        />
      )}
    </div>
  );
} 