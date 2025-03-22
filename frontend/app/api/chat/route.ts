'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';

// Types for request body
interface ChatRequestBody {
  message: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  contextItems?: Array<{
    id: string;
    name: string;
    content: string;
    enabled: boolean;
  }>;
  model: {
    id: string;
    name: string;
  };
  conversationId: string;
  projectContext?: {
    enabled: boolean;
    items: Array<{
      id: string;
      name: string;
      content: string;
      enabled: boolean;
    }>;
  };
}

/**
 * Mock function to generate AI responses.
 * This simulates streaming chunks from an AI model.
 */
async function* generateAIResponse(
  message: string, 
  contextItems: any[] = [], 
  model: any = {},
  attachments: any[] = [],
  projectContext?: any
): AsyncGenerator<string> {
  // Log the input for debugging
  console.log('Generating response for:', { 
    message, 
    contextItemsCount: contextItems.length,
    modelId: model.id,
    attachmentsCount: attachments.length,
    projectContext
  });
  
  // Initial response acknowledging the message
  yield `I've received your message: "${message}"`;
  
  // Small delay to simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Response about context if any is provided
  if (contextItems.length > 0 || (projectContext?.enabled && projectContext?.items?.length > 0)) {
    let contextNames = contextItems.map(item => item.name).join(', ');
    
    // Add project context items if available
    if (projectContext?.enabled && projectContext?.items?.length > 0) {
      const projectItemNames = projectContext.items
        .filter((item: any) => item.enabled)
        .map((item: any) => item.name)
        .join(', ');
      
      if (projectItemNames) {
        contextNames = contextNames 
          ? `${contextNames}, and project items: ${projectItemNames}`
          : `project items: ${projectItemNames}`;
      }
    }
    
    if (contextNames) {
      await new Promise(resolve => setTimeout(resolve, 200));
      yield `\n\nI'm considering the context: ${contextNames}`;
    }
  }
  
  // Response about attachments if any
  if (attachments.length > 0) {
    await new Promise(resolve => setTimeout(resolve, 150));
    yield `\n\nI see you've attached ${attachments.length} file(s).`;
  }
  
  // Main response content with delays to simulate streaming
  await new Promise(resolve => setTimeout(resolve, 300));
  yield `\n\nHere's my response based on your input. This is a simulated streaming response from the API. In a real implementation, this would be replaced with actual AI-generated content.`;
  
  // Add model information
  await new Promise(resolve => setTimeout(resolve, 250));
  yield `\n\nThe model used for this response is ${model.id || 'GPT-3.5 Turbo'}.`;
}

export async function POST(request: NextRequest) {
  try {
    const requestBody: ChatRequestBody = await request.json();
    const { message, attachments = [], contextItems = [], model, conversationId, projectContext } = requestBody;
    
    // Validate request
    if (!message && attachments.length === 0) {
      return NextResponse.json({ error: 'Message or attachments required' }, { status: 400 });
    }
    
    // Use ReadableStream API to create a streamable response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate AI response in chunks
          for await (const chunk of generateAIResponse(message, contextItems, model, attachments, projectContext)) {
            // Encode the chunk as a Uint8Array
            const encoded = new TextEncoder().encode(chunk);
            controller.enqueue(encoded);
          }
          controller.close();
        } catch (error) {
          console.error('Error generating response:', error);
          controller.error(error);
        }
      }
    });
    
    // Return a streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Conversation-ID': conversationId
      }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 