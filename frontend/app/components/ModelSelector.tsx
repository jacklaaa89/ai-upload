"use client";

import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaInfoCircle } from "react-icons/fa";
import { AIModel } from "../types";

interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export default function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center space-x-2 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          Model: <span className="font-medium">{selectedModel.name}</span>
        </span>
        <FaChevronDown
          size={12}
          className={`transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="fixed right-0 mt-1 w-72 bg-white rounded-md shadow-lg border border-gray-200 flex flex-col z-50"
          style={{
            top: dropdownRef.current
              ? dropdownRef.current.getBoundingClientRect().bottom +
                window.scrollY
              : 0,
            right:
              window.innerWidth -
              (dropdownRef.current
                ? dropdownRef.current.getBoundingClientRect().right
                : 0),
          }}
        >
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 sticky top-0 bg-white z-10">
            Select a model
          </div>
          <div className="max-h-80 overflow-y-auto">
            {models.map((model) => (
              <div key={model.id} className="relative">
                <button
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                    selectedModel.id === model.id
                      ? "bg-blue-50 text-blue-600"
                      : ""
                  }`}
                  onClick={() => {
                    onSelectModel(model);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setShowTooltip(model.id)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{model.name}</span>
                    <FaInfoCircle
                      size={14}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {model.description}
                  </div>
                </button>

                {showTooltip === model.id && (
                  <div
                    className="fixed z-50 bg-gray-800 text-white text-xs rounded-md shadow-lg p-3 w-64"
                    style={{
                      left: dropdownRef.current
                        ? dropdownRef.current.getBoundingClientRect().right + 10
                        : 0,
                      top:
                        (
                          document.activeElement as HTMLElement
                        )?.getBoundingClientRect().top || 0,
                    }}
                  >
                    <div className="font-bold mb-1">{model.name}</div>
                    <div className="mb-2">{model.description}</div>
                    <div className="mb-1 font-semibold">Capabilities:</div>
                    <ul className="list-disc pl-4 mb-2">
                      {model.capabilities.map((capability, index) => (
                        <li key={index}>{capability}</li>
                      ))}
                    </ul>
                    <div className="text-gray-300">
                      <span className="font-semibold">Max tokens:</span>{" "}
                      {model.maxTokens.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
