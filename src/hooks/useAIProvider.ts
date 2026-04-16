import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenAIProvider } from '@/lib/ai/openai-provider';
import { OllamaProvider } from '@/lib/ai/ollama-provider';
import { GoogleProvider } from '@/lib/ai/google-provider';
import type { AIProvider } from '@/lib/ai/ai-provider';

export type ProviderType = 'openai' | 'ollama' | 'google';

interface AIProviderState {
  providerType: ProviderType;
  openaiApiKey: string;
  googleApiKey: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  setProviderType: (type: ProviderType) => void;
  setOpenAIApiKey: (key: string) => void;
  setGoogleApiKey: (key: string) => void;
  setOllamaBaseUrl: (url: string) => void;
  setOllamaModel: (model: string) => void;
}

export const useAIProviderStore = create<AIProviderState>()(
  persist(
    set => ({
      providerType: 'openai',
      openaiApiKey: '',
      googleApiKey: '',
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      setProviderType: type => set({ providerType: type }),
      setOpenAIApiKey: key => set({ openaiApiKey: key }),
      setGoogleApiKey: key => set({ googleApiKey: key }),
      setOllamaBaseUrl: url => set({ ollamaBaseUrl: url }),
      setOllamaModel: model => set({ ollamaModel: model }),
    }),
    { name: 'ai-provider-storage' }
  )
);

export function useAIProvider(): AIProvider | null {
  const { providerType, openaiApiKey, googleApiKey, ollamaBaseUrl, ollamaModel } =
    useAIProviderStore();

  if (providerType === 'openai') {
    if (!openaiApiKey) return null;
    return new OpenAIProvider(openaiApiKey);
  }

  if (providerType === 'google') {
    if (!googleApiKey) return null;
    return new GoogleProvider(googleApiKey);
  }

  return new OllamaProvider(ollamaBaseUrl, ollamaModel);
}
