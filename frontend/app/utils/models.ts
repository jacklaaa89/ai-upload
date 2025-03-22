import { AIModel } from '../types';

// Define available AI models
export const availableModels: AIModel[] = [
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Optimized for chat at 1/10th the cost of GPT-4.',
    maxLength: 16000,
    maxTokens: 4096,
    capabilities: ['Natural language processing', 'Chat completions', 'Text generation'],
    isAvailable: true,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Our most advanced model, optimized for chat.',
    maxLength: 24000,
    maxTokens: 8192,
    capabilities: ['Advanced reasoning', 'Complex instructions', 'Expert knowledge'],
    isAvailable: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Our latest GPT-4 model with improved performance.',
    maxLength: 128000,
    maxTokens: 128000,
    capabilities: ['Advanced reasoning', 'Complex instructions', 'Up-to-date knowledge'],
    isAvailable: true,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Anthropic\'s most powerful model for highly complex tasks.',
    maxLength: 200000,
    maxTokens: 200000,
    capabilities: ['Sophisticated reasoning', 'Advanced coding', 'Detailed analysis'],
    isAvailable: true,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Anthropic\'s balanced model for performance and efficiency.',
    maxLength: 180000,
    maxTokens: 180000,
    capabilities: ['Strong reasoning', 'Detailed responses', 'Balanced performance'],
    isAvailable: true,
  },
  {
    id: 'llama-3',
    name: 'Llama 3',
    description: 'Meta\'s latest open-source large language model.',
    maxLength: 8192,
    maxTokens: 8192,
    capabilities: ['General purpose', 'Open source', 'Efficient performance'],
    isAvailable: true,
  }
];

// Default model
export const defaultModel = availableModels[0]; 