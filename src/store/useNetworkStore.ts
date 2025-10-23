import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: navigator.onLine,
  setOnline: (online: boolean) => set({ isOnline: online }),
}));

// Initialize network status listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useNetworkStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useNetworkStore.getState().setOnline(false);
  });
}
