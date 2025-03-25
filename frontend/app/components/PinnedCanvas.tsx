"use client";

import { useState } from "react";
import {
  FaCompress,
  FaEdit,
  FaExpand,
  FaThumbtack,
  FaTimes,
} from "react-icons/fa";
import Canvas from "./Canvas";
import LatexRenderer from "./LatexRenderer";
import SyntaxHighlightRenderer from "./SyntaxHighlightRenderer";

interface PinnedCanvasProps {
  id: string;
  content: string;
  onRemove: (id: string) => void;
  onRequestRefinement: (content: string, request: string) => void;
}

export default function PinnedCanvas({
  id,
  content,
  onRemove,
  onRequestRefinement,
}: PinnedCanvasProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullCanvas, setIsFullCanvas] = useState(false);

  // Simplified content rendering for the preview
  const renderContent = () => {
    // Check if content has code blocks or LaTeX
    if (content.includes("```")) {
      return <SyntaxHighlightRenderer content={content} />;
    } else if (content.includes("$")) {
      return <LatexRenderer content={content} />;
    } else {
      return <div className="whitespace-pre-wrap text-sm">{content}</div>;
    }
  };

  return (
    <>
      <div className="sticky top-4 mt-4 mb-8 rounded-md border border-blue-200 bg-blue-50 shadow-sm overflow-hidden pinned-canvas">
        <div className="flex items-center justify-between bg-blue-100 px-3 py-2">
          <h3 className="text-sm font-medium text-blue-700 flex items-center">
            <FaThumbtack size={12} className="mr-2" />
            Pinned Canvas
          </h3>
          <div className="flex space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-blue-500 hover:text-blue-700 rounded"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <FaExpand size={12} /> : <FaCompress size={12} />}
            </button>
            <button
              onClick={() => setIsFullCanvas(true)}
              className="p-1 text-blue-500 hover:text-blue-700 rounded"
              title="Open in full canvas"
            >
              <FaEdit size={12} />
            </button>
            <button
              onClick={() => onRemove(id)}
              className="p-1 text-blue-500 hover:text-blue-700 rounded"
              title="Remove pinned canvas"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-3 max-h-96 overflow-auto canvas-container">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {isFullCanvas && (
        <Canvas
          content={content}
          isOpen={true}
          onClose={() => setIsFullCanvas(false)}
          onRequestRefinement={onRequestRefinement}
          isPinned={true}
        />
      )}
    </>
  );
}
