import { useState, useEffect } from 'react';

export interface HistoryItem {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  response?: {
    status: number;
    statusText: string;
    body: string;
    headers: Record<string, string>;
    time: number;
  };
  error?: string;
}

const STORAGE_KEY = 'api-tester-history';
const MAX_HISTORY_ITEMS = 20;

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      // Handle corrupted data gracefully
      console.error('Failed to load history from localStorage:', error);
    }
    return [];
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      if (items.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
    }
  }, [items]);

  const saveToHistory = (request: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...request,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now()
    };

    setItems(prevItems => {
      // Add new item at the beginning (most recent first)
      const updatedItems = [newItem, ...prevItems];
      // Limit to 20 items
      return updatedItems.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const deleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setItems([]);
  };

  return {
    items,
    saveToHistory,
    deleteItem,
    clearHistory
  };
}
