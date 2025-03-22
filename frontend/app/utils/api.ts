import { Message, Attachment, ContextItem, ChatRequestBody, UploadFilesResponse } from '../types';

// Base API URL - change this to match your backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Type definitions for API requests
interface SendMessageRequest extends ChatRequestBody {}

/**
 * Upload files to the server
 */
export async function uploadFiles(files: File[]): Promise<Attachment[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload files');
  }
  
  const data = await response.json() as UploadFilesResponse;
  
  // Convert server response to Attachment objects
  return data.files.map(file => ({
    id: file.id,
    name: file.name,
    type: file.type,
    url: file.url,
    previewUrl: file.type.startsWith('image/') ? file.url : undefined,
  }));
}

/**
 * Send a message to the AI and stream the response
 */
export async function sendMessage(
  request: SendMessageRequest,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> {
  try {
    // Process attachments if they have file objects
    const processedAttachments = await Promise.all(
      (request.attachments || []).map(async (attachment) => {
        // If there's a file object, upload it first
        if ('file' in attachment && attachment.file) {
          const [uploadedFile] = await uploadFiles([attachment.file]);
          return {
            id: uploadedFile.id,
            name: uploadedFile.name,
            type: uploadedFile.type,
            url: uploadedFile.url
          };
        }
        
        // Otherwise, just use the attachment as is
        return {
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          url: attachment.url
        };
      })
    );
    
    // Convert context items to the format expected by the API
    const contextItems = (request.contextItems || []).map(item => ({
      id: item.id,
      name: item.name,
      content: item.content,
      enabled: item.enabled
    }));
    
    // Make the API request
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        attachments: processedAttachments,
        contextItems
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Server error: ${response.status}`);
    }
    
    // Get the response as a readable stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not available as a stream');
    }
    
    // Read the stream chunk by chunk
    const decoder = new TextDecoder();
    let done = false;
    
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = decoder.decode(value, { stream: !done });
        onChunk(chunk);
      }
    }
    
    onComplete();
    
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

/**
 * Get conversation history
 */
export async function getConversations(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/conversations`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    return [];
  }
} 