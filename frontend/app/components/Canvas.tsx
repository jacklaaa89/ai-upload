'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaEdit, FaSyncAlt, FaCheck, FaCompress, FaExpand, FaThumbtack, FaExpandArrowsAlt } from 'react-icons/fa';
import SyntaxHighlightRenderer from './SyntaxHighlightRenderer';
import LatexRenderer from './LatexRenderer';

interface CanvasProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onRequestRefinement: (content: string, request: string) => void;
  onPin?: (content: string) => void;
  isPinned?: boolean;
  inSplitView?: boolean;
  onToggleSplitView?: () => void;
}

export default function Canvas({ 
  content, 
  isOpen, 
  onClose, 
  onRequestRefinement, 
  onPin, 
  isPinned = false,
  inSplitView = false,
  onToggleSplitView
}: CanvasProps) {
  const [canvasContent, setCanvasContent] = useState(content);
  const [refinementRequest, setRefinementRequest] = useState('');
  const [isEditingRequest, setIsEditingRequest] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isContentEditable, setIsContentEditable] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const requestInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingRequest && requestInputRef.current) {
      requestInputRef.current.focus();
    }
  }, [isEditingRequest]);

  useEffect(() => {
    // When content prop changes, update the canvas content
    setCanvasContent(content);
    setEditedContent(content);
  }, [content]);

  const handleRequestRefinement = () => {
    if (refinementRequest.trim()) {
      onRequestRefinement(isContentEditable ? editedContent : canvasContent, refinementRequest);
      setRefinementRequest('');
      setIsEditingRequest(false);
    }
  };

  const handleEditContent = () => {
    setIsContentEditable(!isContentEditable);
    if (!isContentEditable) {
      // Switch to edit mode - content should be the same as displayed
      setEditedContent(canvasContent);
    } else {
      // Switch from edit mode to display mode - update the canvas content
      setCanvasContent(editedContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && isEditingRequest && !e.shiftKey) {
      e.preventDefault();
      handleRequestRefinement();
    }
  };

  const handlePin = () => {
    if (onPin) {
      onPin(isContentEditable ? editedContent : canvasContent);
    }
  };

  if (!isOpen && !inSplitView) return null;

  // In split view, we always render the component but in a different container
  if (inSplitView) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Canvas</h2>
          <div className="flex space-x-2">
            {onPin && (
              <button
                onClick={handlePin}
                className={`p-2 rounded ${isPinned ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                title={isPinned ? "Unpin from chat" : "Pin to chat"}
              >
                <FaThumbtack size={16} className={isPinned ? "" : "opacity-75"} />
              </button>
            )}
            {onToggleSplitView && (
              <button
                onClick={onToggleSplitView}
                className="p-2 text-gray-500 hover:text-gray-700 rounded"
                title="Exit split view"
              >
                <FaCompress size={16} />
              </button>
            )}
            <button
              onClick={handleEditContent}
              className={`p-2 rounded ${isContentEditable ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
              title={isContentEditable ? "Save edits" : "Edit content"}
            >
              {isContentEditable ? <FaCheck size={16} /> : <FaEdit size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded"
              title="Close canvas"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-4 canvas-container">
          {isContentEditable ? (
            <textarea
              ref={textareaRef}
              className="w-full h-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="prose max-w-none dark:prose-invert">
              {/* Check if content has code blocks or LaTeX */}
              {canvasContent.includes('```') ? (
                <SyntaxHighlightRenderer content={canvasContent} />
              ) : canvasContent.includes('$') ? (
                <LatexRenderer content={canvasContent} />
              ) : (
                <div className="whitespace-pre-wrap">{canvasContent}</div>
              )}
            </div>
          )}
        </div>

        {/* Refinement request area */}
        <div className="border-t p-4">
          <div className="flex items-center">
            {isEditingRequest ? (
              <>
                <input
                  ref={requestInputRef}
                  type="text"
                  className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How would you like me to refine this?"
                  value={refinementRequest}
                  onChange={(e) => setRefinementRequest(e.target.value)}
                  onBlur={() => {
                    if (!refinementRequest.trim()) {
                      setIsEditingRequest(false);
                    }
                  }}
                />
                <button
                  onClick={handleRequestRefinement}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
                  disabled={!refinementRequest.trim()}
                >
                  Send
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditingRequest(true)}
                className="flex items-center justify-center w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
              >
                <FaSyncAlt className="mr-2" size={14} />
                Request refinement
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-6'}`}
      onKeyDown={handleKeyDown}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl flex flex-col ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Canvas</h2>
          <div className="flex space-x-2">
            {onPin && (
              <button
                onClick={handlePin}
                className={`p-2 rounded ${isPinned ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                title={isPinned ? "Unpin from chat" : "Pin to chat"}
              >
                <FaThumbtack size={16} className={isPinned ? "" : "opacity-75"} />
              </button>
            )}
            {onToggleSplitView && (
              <button
                onClick={onToggleSplitView}
                className="p-2 text-gray-500 hover:text-gray-700 rounded"
                title="Split view"
              >
                <FaExpandArrowsAlt size={16} />
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
            </button>
            <button
              onClick={handleEditContent}
              className={`p-2 rounded ${isContentEditable ? 'text-blue-500 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
              title={isContentEditable ? "Save edits" : "Edit content"}
            >
              {isContentEditable ? <FaCheck size={16} /> : <FaEdit size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded"
              title="Close canvas"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-4 canvas-container">
          {isContentEditable ? (
            <textarea
              ref={textareaRef}
              className="w-full h-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="prose max-w-none dark:prose-invert">
              {/* Check if content has code blocks or LaTeX */}
              {canvasContent.includes('```') ? (
                <SyntaxHighlightRenderer content={canvasContent} />
              ) : canvasContent.includes('$') ? (
                <LatexRenderer content={canvasContent} />
              ) : (
                <div className="whitespace-pre-wrap">{canvasContent}</div>
              )}
            </div>
          )}
        </div>

        {/* Refinement request area */}
        <div className="border-t p-4">
          <div className="flex items-center">
            {isEditingRequest ? (
              <>
                <input
                  ref={requestInputRef}
                  type="text"
                  className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How would you like me to refine this?"
                  value={refinementRequest}
                  onChange={(e) => setRefinementRequest(e.target.value)}
                  onBlur={() => {
                    if (!refinementRequest.trim()) {
                      setIsEditingRequest(false);
                    }
                  }}
                />
                <button
                  onClick={handleRequestRefinement}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
                  disabled={!refinementRequest.trim()}
                >
                  Send
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditingRequest(true)}
                className="flex items-center justify-center w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
              >
                <FaSyncAlt className="mr-2" size={14} />
                Request refinement
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 