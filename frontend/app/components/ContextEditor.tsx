"use client";

import React, { useEffect, useState } from "react";
import {
  FaCheck,
  FaEdit,
  FaInfoCircle,
  FaPlus,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { ContextItem, GenericContext } from "../types";

interface ContextEditorProps {
  context: GenericContext;
  onContextChange: (newContext: GenericContext) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContextEditor({
  context,
  onContextChange,
  isOpen,
  onClose,
}: ContextEditorProps) {
  const [localContext, setLocalContext] = useState<GenericContext>(context);
  const [showTooltip, setShowTooltip] = useState(false);
  const [editingItem, setEditingItem] = useState<ContextItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemContent, setNewItemContent] = useState("");

  // Update local state when context prop changes
  useEffect(() => {
    setLocalContext(context);
  }, [context]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContextChange(localContext);
    onClose();
  };

  // Toggle global enabled state
  const handleToggleEnabled = () => {
    setLocalContext((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  // Toggle individual context item enabled state
  const handleToggleItemEnabled = (id: string) => {
    setLocalContext((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      ),
    }));
  };

  // Add new context item
  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemContent.trim()) return;

    const newItem: ContextItem = {
      id: Date.now().toString(),
      name: newItemName,
      content: newItemContent,
      enabled: true,
    };

    setLocalContext((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    // Reset form
    setNewItemName("");
    setNewItemContent("");
  };

  // Delete context item
  const handleDeleteItem = (id: string) => {
    setLocalContext((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));

    // If currently editing this item, clear the editing state
    if (editingItem && editingItem.id === id) {
      setEditingItem(null);
    }
  };

  // Start editing an item
  const handleStartEdit = (item: ContextItem) => {
    setEditingItem(item);
  };

  // Save edited item
  const handleSaveEdit = () => {
    if (!editingItem || !editingItem.name.trim() || !editingItem.content.trim())
      return;

    setLocalContext((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === editingItem.id ? editingItem : item
      ),
    }));

    setEditingItem(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  // Update editing item name
  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, name: e.target.value });
  };

  // Update editing item content
  const handleEditContentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, content: e.target.value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Context Manager</h2>
            <button
              className="ml-2 text-gray-500 hover:text-gray-700"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <FaInfoCircle size={16} />
              {showTooltip && (
                <div className="absolute mt-2 ml-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg max-w-xs z-10">
                  Add multiple context items that will be provided to the AI in
                  all conversations. Each context can be enabled or disabled
                  individually.
                </div>
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="p-4 flex-1 overflow-auto">
            <div className="mb-4 flex items-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={localContext.enabled}
                    onChange={handleToggleEnabled}
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition ${
                      localContext.enabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
                      localContext.enabled ? "translate-x-4" : ""
                    }`}
                  ></div>
                </div>
                <span className="ml-2 text-gray-700 font-medium">
                  {localContext.enabled
                    ? "Context Enabled"
                    : "Context Disabled"}
                </span>
              </label>
            </div>

            {/* List of existing context items */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Your Context Items
              </h3>

              {localContext.items.length === 0 ? (
                <div className="text-gray-500 text-sm italic">
                  No context items added yet. Add your first context below.
                </div>
              ) : (
                <div className="space-y-3">
                  {localContext.items.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3 ${
                        editingItem?.id === item.id
                          ? "border-blue-400 bg-blue-50"
                          : item.enabled
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {editingItem?.id === item.id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={handleEditNameChange}
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                              placeholder="Context name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Content
                            </label>
                            <textarea
                              value={editingItem.content}
                              onChange={handleEditContentChange}
                              rows={4}
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                              placeholder="Context content"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="px-2 py-1 text-xs text-white bg-blue-600 rounded flex items-center"
                            >
                              <FaCheck className="mr-1" size={10} /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <h4 className="font-medium text-gray-800">
                                {item.name}
                              </h4>
                              <div className="ml-2">
                                <label className="flex items-center cursor-pointer">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={item.enabled}
                                      onChange={() =>
                                        handleToggleItemEnabled(item.id)
                                      }
                                    />
                                    <div
                                      className={`w-8 h-5 rounded-full transition ${
                                        item.enabled
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    ></div>
                                    <div
                                      className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition transform ${
                                        item.enabled ? "translate-x-3" : ""
                                      }`}
                                    ></div>
                                  </div>
                                </label>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit context"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete context"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {item.content.length > 100
                              ? `${item.content.substring(0, 100)}...`
                              : item.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new context form */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Add New Context Item
              </h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="newItemName"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="newItemName"
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="E.g., 'Personality', 'Technical Knowledge', 'Language Style'"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newItemContent"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Content
                  </label>
                  <textarea
                    id="newItemContent"
                    rows={4}
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Enter the instructions or context information..."
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newItemName.trim() || !newItemContent.trim()}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      !newItemName.trim() || !newItemContent.trim()
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <FaPlus className="mr-2" size={12} /> Add Context Item
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save All Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
