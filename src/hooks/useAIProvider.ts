import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenAIProvider } from '@/lib/ai/openai-provider';
import { OllamaProvider } from '@/lib/ai/ollama-provider';
import type { AIProvider } from '@/lib/ai/ai-provider';

type ProviderType = 'openai' | 'ollama';

interface AIProviderState {
  providerType: ProviderType;
  openaiApiKey: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  setProviderType: (type: ProviderType) => void;
  setOpenAIApiKey: (key: string) => void;
  setOllamaBaseUrl: (url: string) => void;
  setOllamaModel: (model: string) => void;
}

export const useAIProviderStore = create<AIProviderState>()(
  persist(
    set => ({
      providerType: 'openai',
      openaiApiKey: '',
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      setProviderType: type => set({ providerType: type }),
      setOpenAIApiKey: key => set({ openaiApiKey: key }),
      setOllamaBaseUrl: url => set({ ollamaBaseUrl: url }),
      setOllamaModel: model => set({ ollamaModel: model }),
    }),
    { name: 'ai-provider-storage' }
  )
);

export function useAIProvider(): AIProvider | null {
  const { providerType, openaiApiKey, ollamaBaseUrl, ollamaModel } = useAIProviderStore();

  if (providerType === 'openai') {
    if (!openaiApiKey) return null;
    return new OpenAIProvider(openaiApiKey);
  }

  return new OllamaProvider(ollamaBaseUrl, ollamaModel);
}
