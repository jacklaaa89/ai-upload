'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { FaFolderOpen } from 'react-icons/fa6';

interface SidebarProps {
  conversations: { id: string; name: string }[];
  activeConversation: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newName: string) => void;
  onOpenProjectManager: () => void;
  activeProjectId?: string;
  activeProjectName?: string;
}

export default function Sidebar({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenProjectManager,
  activeProjectId,
  activeProjectName
}: SidebarProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle clicking outside the menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(prev => (prev === id ? null : id));
  };

  const startEditing = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(name);
    setMenuOpenId(null);
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editingName.trim()) {
      onRenameConversation(editingId, editingName);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setMenuOpenId(null);
  };

  return (
    <div className="w-64 bg-gray-800 text-white h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNewConversation}
          className="w-full py-2 px-3 border border-gray-600 rounded-md hover:bg-gray-700 flex items-center justify-center"
        >
          <FaPlus className="mr-2" size={12} />
          New Conversation
        </button>
      </div>
      
      {/* Active Project Section */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Current Project</div>
        <div 
          className="flex items-center justify-between bg-gray-700 rounded-md p-2 cursor-pointer hover:bg-gray-600"
          onClick={onOpenProjectManager}
        >
          <div className="flex items-center overflow-hidden">
            <FaFolderOpen className="mr-2 text-blue-400 flex-shrink-0" size={16} />
            <span className="truncate">
              {activeProjectName || 'No Project Selected'}
            </span>
          </div>
          <button 
            className="text-gray-400 hover:text-white p-1" 
            onClick={(e) => {
              e.stopPropagation();
              onOpenProjectManager();
            }}
          >
            <FaEdit size={12} />
          </button>
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Conversations</div>
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="relative group">
              {editingId === conversation.id ? (
                <form onSubmit={handleRename} className="pr-8">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleRename}
                    className="w-full py-2 px-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </form>
              ) : (
                <div
                  className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer ${
                    activeConversation === conversation.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <span className="truncate">{conversation.name}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                    onClick={(e) => toggleMenu(conversation.id, e)}
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                  {menuOpenId === conversation.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-8 top-0 w-48 bg-gray-700 rounded-md shadow-lg z-10"
                    >
                      <div className="py-1">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center"
                          onClick={(e) => startEditing(conversation.id, conversation.name, e)}
                        >
                          <FaEdit className="mr-2" size={12} />
                          Rename
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center"
                          onClick={(e) => handleDelete(conversation.id, e)}
                        >
                          <FaTrash className="mr-2" size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Projects Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onOpenProjectManager}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center"
        >
          <FaFolderOpen className="mr-2" size={14} />
          Manage Projects
        </button>
      </div>
    </div>
  );
} 