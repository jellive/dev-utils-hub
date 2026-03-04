import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileJson,
  Key,
  FileCode,
  Link,
  Regex,
  FileDiff,
  Hash,
  Fingerprint,
  Calendar,
  Palette,
  Clock,
  FileText,
  Ruler,
} from 'lucide-react';
import type { ToolType } from '../types';

interface ToolEntry {
  id: ToolType;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolEntry[] = [
  { id: 'json', icon: FileJson },
  { id: 'jwt', icon: Key },
  { id: 'base64', icon: FileCode },
  { id: 'url', icon: Link },
  { id: 'regex', icon: Regex },
  { id: 'diff', icon: FileDiff },
  { id: 'hash', icon: Hash },
  { id: 'uuid', icon: Fingerprint },
  { id: 'timestamp', icon: Calendar },
  { id: 'color-picker', icon: Palette },
  { id: 'cron-parser', icon: Clock },
  { id: 'markdown-preview', icon: FileText },
  { id: 'css-converter', icon: Ruler },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredTools = TOOLS.filter((tool) => {
    if (!query.trim()) return true;
    const name = t(`tools.${tool.id}.name`).toLowerCase();
    const description = t(`tools.${tool.id}.description`).toLowerCase();
    const q = query.toLowerCase();
    return name.includes(q) || description.includes(q);
  });

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened, reset query when closed
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const selectTool = useCallback(
    (id: ToolType) => {
      navigate(`/${id}`);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredTools.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredTools[selectedIndex]) {
            selectTool(filteredTools[selectedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredTools, selectedIndex, selectTool, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t('common.commandPaletteOpen')}
      data-testid="command-palette"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          <FileJson className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-label={t('common.commandPalettePlaceholder')}
            placeholder={t('common.commandPalettePlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-4 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs border rounded text-muted-foreground border-gray-300 dark:border-gray-600">
            Esc
          </kbd>
        </div>

        {/* Results list */}
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Tool results"
          className="max-h-72 overflow-y-auto py-2"
        >
          {filteredTools.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('common.commandPaletteNoResults')}
            </li>
          ) : (
            filteredTools.map((tool, index) => {
              const Icon = tool.icon;
              const name = t(`tools.${tool.id}.name`);
              const description = t(`tools.${tool.id}.description`);
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={tool.id}
                  role="option"
                  aria-selected={isSelected}
                  data-testid={`palette-item-${tool.id}`}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => selectTool(tool.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{description}</p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
