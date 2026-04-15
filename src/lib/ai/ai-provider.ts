export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIProvider {
  name: string;
  chat(messages: ChatMessage[], options?: AIOptions): Promise<string>;
  stream(messages: ChatMessage[], options?: AIOptions): AsyncIterable<string>;
}
