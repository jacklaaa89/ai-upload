'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import Sidebar from './Sidebar';
import ModelSelector from './ModelSelector';
import ContextEditor from './ContextEditor';
import ProjectManager from './ProjectManager';
import Canvas from './Canvas';
import PinnedCanvas from './PinnedCanvas';
import { Message, Attachment, AIModel, GenericContext, ContextItem, Project, ChatRequestBody } from '../types';
import { availableModels, defaultModel } from '../utils/models';
import { FaExpandArrowsAlt, FaCompress, FaSlidersH } from 'react-icons/fa';
import { sendMessage } from '../utils/api';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Hello! How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{ id: string; name: string; projectId?: string }[]>([
    { id: 'default', name: 'New Conversation' },
  ]);
  const [activeConversation, setActiveConversation] = useState('default');
  const [currentModel, setCurrentModel] = useState<AIModel>(defaultModel);
  const [genericContext, setGenericContext] = useState<GenericContext>({
    enabled: false,
    items: [],
  });
  
  // Project-related state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  
  const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map to store messages by conversation ID
  const [messagesByConversation, setMessagesByConversation] = useState<{
    [key: string]: Message[];
  }>({
    default: [
      {
        id: '1',
        role: 'system',
        content: 'Hello! How can I help you today?',
        timestamp: new Date().toISOString(),
      },
    ],
  });

  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasContent, setCanvasContent] = useState('');
  const [pinnedCanvases, setPinnedCanvases] = useState<{id: string, content: string}[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [isSplitView, setIsSplitView] = useState(false);
  const [splitPosition, setSplitPosition] = useState(100); // Split position as percentage
  const [isDragging, setIsDragging] = useState(false);
  const splitDividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When active conversation changes, update the messages
  useEffect(() => {
    // First save current messages if needed
    if (messages.length > 0) {
      setMessagesByConversation(prev => {
        // Only update if the messages for the previous conversation have changed
        const currentConversationMessages = prev[activeConversation];
        if (!currentConversationMessages || 
            JSON.stringify(currentConversationMessages) !== JSON.stringify(messages)) {
          return {
            ...prev,
            [activeConversation]: [...messages]
          };
        }
        return prev;
      });
    }
    
    // Then load messages for the new active conversation
    if (messagesByConversation[activeConversation]) {
      setMessages(messagesByConversation[activeConversation]);
    } else {
      // Initialize with welcome message if no messages exist for this conversation
      const initialMessage: Message = {
        id: '1',
        role: 'system',
        content: 'Hello! How can I help you today?',
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMessage]);
      setMessagesByConversation(prev => ({
        ...prev,
        [activeConversation]: [initialMessage]
      }));
    }
  }, [activeConversation]);

  // When messages are updated from the ChatWindow
  const handleMessagesUpdate = (newMessages: Message[]) => {
    // Prevent empty updates or invalid conversation IDs
    if (!newMessages.length || !activeConversation) return;
    
    // First store the active conversation ID to prevent race conditions
    const currentConversationId = activeConversation;
    
    // Update the current messages
    setMessages(newMessages);
    
    // Update conversation name if it's still the default name and has a user message
    const currentConversation = conversations.find(c => c.id === currentConversationId);
    if (currentConversation && currentConversation.name === 'New Conversation') {
      // Find the first user message
      const firstUserMessage = newMessages.find(msg => msg.role === 'user');
      if (firstUserMessage && firstUserMessage.content) {
        // Generate a short name from the message content
        const messageText = firstUserMessage.content;
        const words = messageText.split(' ');
        // Create name from first few words or truncate if too long
        const conversationName = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
        
        // Update the conversation name
        setConversations(prev => 
          prev.map(c => 
            c.id === currentConversationId ? { ...c, name: conversationName } : c
          )
        );
      }
    }
    
    // Update the messages in the conversation map
    setMessagesByConversation(prev => {
      // Create a deep copy to avoid reference issues
      const updatedMap = {...prev};
      updatedMap[currentConversationId] = [...newMessages];
      return updatedMap;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get active project from ID
  const getActiveProject = (): Project | undefined => {
    return projects.find(p => p.id === activeProjectId);
  };

  // Get active context items that will be applied to the conversation
  const getActiveContextItems = (): ContextItem[] => {
    // Start with global context items
    let contextItems: ContextItem[] = [];
    
    if (genericContext.enabled) {
      contextItems = [...genericContext.items.filter(item => item.enabled)];
    }
    
    // Add project context items if there's an active project
    const activeProject = getActiveProject();
    if (activeProject && activeProject.context.enabled) {
      // Add project context items, potentially overriding global ones with the same name
      const projectItems = activeProject.context.items.filter(item => item.enabled);
      
      // For items with the same name, prefer project-specific ones
      projectItems.forEach(projectItem => {
        const existingIndex = contextItems.findIndex(item => item.name === projectItem.name);
        if (existingIndex >= 0) {
          contextItems[existingIndex] = projectItem;
        } else {
          contextItems.push(projectItem);
        }
      });
    }
    
    return contextItems;
  };

  // Helper to create a context summary for display
  const getContextSummary = (): string => {
    const activeItems = getActiveContextItems();
    if (activeItems.length === 0) return "";
    
    if (activeItems.length === 1) {
      return activeItems[0].name;
    }
    
    if (activeItems.length === 2) {
      return `${activeItems[0].name} and ${activeItems[1].name}`;
    }
    
    return `${activeItems[0].name}, ${activeItems[1].name}, and ${activeItems.length - 2} more`;
  };

  const handleContextChange = (newContext: GenericContext) => {
    const wasEnabled = genericContext.enabled;
    const wasPreviouslyEmpty = genericContext.items.filter(item => item.enabled).length === 0;
    
    setGenericContext(newContext);
    
    const hasEnabledItems = newContext.items.some(item => item.enabled);
    const isNowEnabled = newContext.enabled && hasEnabledItems;
    const wasPreviouslyEnabled = wasEnabled && !wasPreviouslyEmpty;
    
    // If context was previously disabled and now enabled with items, show a system message
    if ((!wasEnabled || wasPreviouslyEmpty) && isNowEnabled) {
      const activeItems = newContext.items.filter(item => item.enabled);
      const contextMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `Custom context enabled with ${activeItems.length} item${activeItems.length !== 1 ? 's' : ''}: ${activeItems.map(item => item.name).join(', ')}`,
        timestamp: new Date().toISOString(),
      };
      
      const updatedMessages = [...messages, contextMessage];
      setMessages(updatedMessages);
      
      // Update messages in the conversation map
      setMessagesByConversation(prev => ({
        ...prev,
        [activeConversation]: updatedMessages
      }));
    }
    // If context was previously enabled and now disabled or has no enabled items, show a system message
    else if (wasPreviouslyEnabled && (!newContext.enabled || !hasEnabledItems)) {
      const contextMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: 'Custom context disabled.',
        timestamp: new Date().toISOString(),
      };
      
      const updatedMessages = [...messages, contextMessage];
      setMessages(updatedMessages);
      
      // Update messages in the conversation map
      setMessagesByConversation(prev => ({
        ...prev,
        [activeConversation]: updatedMessages
      }));
    }
    // If context is still enabled but the enabled items have changed, show a message
    else if (wasEnabled && newContext.enabled && hasEnabledItems) {
      const oldActiveItems = genericContext.items.filter(item => item.enabled);
      const newActiveItems = newContext.items.filter(item => item.enabled);
      
      // Check if the active items have changed (simple length comparison for demo)
      if (oldActiveItems.length !== newActiveItems.length) {
        const contextMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: `Context updated: ${newActiveItems.length} item${newActiveItems.length !== 1 ? 's' : ''} active`,
          timestamp: new Date().toISOString(),
        };
        
        const updatedMessages = [...messages, contextMessage];
        setMessages(updatedMessages);
        
        // Update messages in the conversation map
        setMessagesByConversation(prev => ({
          ...prev,
          [activeConversation]: updatedMessages
        }));
      }
    }
  };

  const handleModelChange = (model: AIModel) => {
    setCurrentModel(model);
    
    // Add a system message indicating the model change
    const modelChangeMessage: Message = {
      id: Date.now().toString(),
      role: 'system',
      content: `Switching to ${model.name}. ${model.description}`,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, modelChangeMessage];
    setMessages(updatedMessages);
    
    // Update messages in the conversation map
    setMessagesByConversation(prev => ({
      ...prev,
      [activeConversation]: updatedMessages
    }));
  };

  const handleNewConversation = () => {
    const newId = Date.now().toString();
    
    // First ensure current conversation messages are saved
    if (messages.length > 0) {
      setMessagesByConversation(prev => ({
        ...prev,
        [activeConversation]: messages
      }));
    }
    
    // Create initial message for new conversation
    const initialMessage: Message = {
      id: '1',
      role: 'system',
      content: 'Hello! How can I help you today?',
      timestamp: new Date().toISOString(),
    };
    
    // Create a new conversation with the active project if one is selected
    setConversations(prev => [
      ...prev, 
      { 
        id: newId, 
        name: 'New Conversation',
        projectId: activeProjectId
      }
    ]);
    
    // Set up messages for new conversation
    setMessagesByConversation(prev => ({
      ...prev,
      [newId]: [initialMessage]
    }));
    
    // Set messages before changing active conversation
    setMessages([initialMessage]);
    setActiveConversation(newId);
  };

  const handleDeleteMessage = (id: string) => {
    const updatedMessages = messages.filter(msg => msg.id !== id);
    setMessages(updatedMessages);
    
    // Update the messages in the conversation map
    setMessagesByConversation(prev => ({
      ...prev,
      [activeConversation]: updatedMessages
    }));
  };

  const handleDeleteConversation = (id: string) => {
    // If we're deleting the active conversation, switch to another one first
    if (id === activeConversation) {
      const remainingConversations = conversations.filter(c => c.id !== id);
      if (remainingConversations.length > 0) {
        setActiveConversation(remainingConversations[0].id);
      } else {
        // If no conversations left, create a new one
        handleNewConversation();
        return; // Exit early as handleNewConversation will update the state
      }
    }
    
    // Remove the conversation from the list
    setConversations(prev => prev.filter(c => c.id !== id));
    
    // Remove messages for this conversation
    setMessagesByConversation(prev => {
      const newMap = { ...prev };
      delete newMap[id];
      return newMap;
    });
  };

  const handleRenameConversation = (id: string, newName: string) => {
    setConversations(prev => 
      prev.map(c => 
        c.id === id ? { ...c, name: newName } : c
      )
    );
  };

  // Project-related handlers
  const handleCreateProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const handleUpdateProject = (project: Project) => {
    setProjects(prev => 
      prev.map(p => p.id === project.id ? project : p)
    );
  };

  const handleDeleteProject = (projectId: string) => {
    // Remove project
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // If the deleted project is active, clear the active project
    if (activeProjectId === projectId) {
      setActiveProjectId(undefined);
      
      // Notify the user with a system message
      const projectMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: 'Project has been removed from this conversation.',
        timestamp: new Date().toISOString(),
      };
      
      const updatedMessages = [...messages, projectMessage];
      setMessages(updatedMessages);
      
      // Update messages in the conversation map
      setMessagesByConversation(prev => ({
        ...prev,
        [activeConversation]: updatedMessages
      }));
    }
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    
    // Update current conversation to associate with this project
    setConversations(prev => 
      prev.map(c => 
        c.id === activeConversation ? { ...c, projectId } : c
      )
    );
    
    // Find the project
    const selectedProject = projects.find(p => p.id === projectId);
    if (selectedProject) {
      // Add a system message about the project selection
      const projectMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `Project selected: ${selectedProject.name}. ${selectedProject.description || ''}`,
        timestamp: new Date().toISOString(),
      };
      
      const updatedMessages = [...messages, projectMessage];
      setMessages(updatedMessages);
      
      // Update messages in the conversation map
      setMessagesByConversation(prev => ({
        ...prev,
        [activeConversation]: updatedMessages
      }));
    }
  };

  const activeProject = getActiveProject();

  // Handler for creating a canvas from selected text
  const handleCreateCanvas = (content: string) => {
    setCanvasContent(content);
    setIsCanvasOpen(true);
    setActiveCanvasId(null); // New canvas is not pinned yet
  };
  
  // Toggle between modal and split view
  const toggleCanvasView = () => {
    if (!isCanvasOpen) {
      // If canvas is not open, open it in the preferred view
      setIsCanvasOpen(true);
    }
    // Toggle the view mode
    setIsSplitView(!isSplitView);
  };

  // Update canvas content and open it in the current view mode
  const openCanvas = (content: string) => {
    setCanvasContent(content);
    setIsCanvasOpen(true);
  };
  
  // Handler for pinning a canvas
  const handlePinCanvas = (content: string) => {
    if (activeCanvasId) {
      // Update existing pinned canvas
      setPinnedCanvases(prev =>
        prev.map(canvas =>
          canvas.id === activeCanvasId
            ? { ...canvas, content }
            : canvas
        )
      );
    } else {
      // Add new pinned canvas
      const newId = Date.now().toString();
      setPinnedCanvases(prev => [...prev, { id: newId, content }]);
      setActiveCanvasId(newId);
    }
  };
  
  // Handler for removing a pinned canvas
  const handleRemovePinnedCanvas = (id: string) => {
    setPinnedCanvases(prev => prev.filter(canvas => canvas.id !== id));
    if (activeCanvasId === id) {
      setActiveCanvasId(null);
    }
  };
  
  // Handler for requesting refinements to canvas content
  const handleCanvasRefinement = (content: string, request: string) => {
    // Create a ChatWindow with the refinement request as the initial message
    const refinementPrompt = `Please refine this content based on my request:\n\n${content}\n\nRefinement request: ${request}`;
    
    // Create a new message with the refinement request in the current conversation
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: refinementPrompt,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Update messages in the conversation map
    setMessagesByConversation(prev => ({
      ...prev,
      [activeConversation]: updatedMessages
    }));
  };

  // Handle mouse down event on the divider
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  // Handle mouse move event
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const container = splitDividerRef.current?.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Limit the position between 20% and 80%
      const limitedPosition = Math.min(Math.max(newPosition, 20), 80);
      setSplitPosition(limitedPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Sidebar - fixed width */}
      <Sidebar 
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        activeProjectId={activeProjectId}
        activeProjectName={activeProject?.name}
      />
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-col overflow-hidden flex-1">
          {/* Main chat interface */}
          <div className={`flex flex-col overflow-hidden flex-1 ${
            isSplitView && isCanvasOpen ? 'flex-row' : ''
          }`}>
            {/* Chat column */}
            <div 
              className={`flex flex-col overflow-hidden transition-all duration-300 ${
                isSplitView && isCanvasOpen 
                  ? '' 
                  : 'flex-1'
              }`}
              style={isSplitView && isCanvasOpen ? { width: `${splitPosition}%` } : undefined}
            >
              {/* Header with title, model selector and context */}
              <div className="bg-white border-b p-3 flex justify-between items-center z-10 sticky top-0">
                <h2 className="text-lg font-medium">{conversations.find(c => c.id === activeConversation)?.name || 'New Conversation'}</h2>
                
                <div className="flex items-center space-x-3">
                  {isCanvasOpen && (
                    <button
                      onClick={toggleCanvasView}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                      title={isSplitView ? "Full screen chat" : "Split view with canvas"}
                    >
                      {isSplitView ? <FaCompress size={14} /> : <FaExpandArrowsAlt size={14} />}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsContextEditorOpen(true)}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
                      getActiveContextItems().length > 0
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                    title="Configure AI context that applies to all conversations"
                  >
                    <FaSlidersH className="mr-2" size={14} />
                    {getActiveContextItems().length > 0 
                      ? `Context: ${getContextSummary()}`
                      : 'Context: Off'}
                  </button>
                  
                  <ModelSelector
                    models={availableModels}
                    selectedModel={currentModel}
                    onSelectModel={handleModelChange}
                  />
                </div>
              </div>
              
              {/* Chat area with ChatWindow */}
              <div className="flex-1 h-full overflow-hidden">
                <ChatWindow 
                  conversationId={activeConversation}
                  initialMessages={messages}
                  selectedModel={{
                    id: currentModel.id,
                    name: currentModel.name
                  }}
                  contextItems={getActiveContextItems()}
                  projectContext={activeProject?.context}
                  onMessagesUpdate={handleMessagesUpdate}
                  onCreateCanvas={handleCreateCanvas}
                />
              </div>
            </div>

            {/* Resizable divider for split view */}
            {isSplitView && isCanvasOpen && (
              <div 
                ref={splitDividerRef}
                className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize relative group resize-handle-vertical ${isDragging ? 'is-resizing-width' : ''}`}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500 opacity-0 group-hover:opacity-20"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Editor Modal */}
      {isContextEditorOpen && (
        <ContextEditor
          context={genericContext}
          onContextChange={handleContextChange}
          isOpen={isContextEditorOpen}
          onClose={() => setIsContextEditorOpen(false)}
        />
      )}
      
      {/* Project Manager Modal */}
      {isProjectManagerOpen && (
        <ProjectManager
          projects={projects}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onSelectProject={handleSelectProject}
          isOpen={isProjectManagerOpen}
          onClose={() => setIsProjectManagerOpen(false)}
        />
      )}
    </div>
  );
}