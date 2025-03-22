export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  model?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  previewUrl?: string;
  file?: File;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  projectId?: string; // Reference to associated project
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxLength: number;
  capabilities: string[];
  maxTokens: number;
  isAvailable: boolean;
}

export interface ContextItem {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
}

export interface GenericContext {
  enabled: boolean;
  items: ContextItem[];
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  url: string;
  content?: string; // File content if applicable
  previewUrl?: string;
  size: number;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  context: GenericContext; // Project-specific context
  files: ProjectFile[]; // Files associated with this project
}

// API Types
export interface ChatRequestBody {
  message: string;
  attachments?: Attachment[];
  contextItems?: ContextItem[];
  model: {
    id: string;
    name: string;
  };
  conversationId: string;
  projectContext?: GenericContext;
}

export interface UploadResponseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface UploadFilesResponse {
  files: UploadResponseFile[];
} 