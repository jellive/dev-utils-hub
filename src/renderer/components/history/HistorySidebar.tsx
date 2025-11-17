import { useState, useEffect, useMemo } from 'react'
import { X, Search, Clock, XCircle, Star, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '../../lib/utils'
import { useHistory } from '../../hooks/useHistory'
import { HistoryItem } from './HistoryItem'
import type { HistoryEntry } from '../../../preload/index.d'

export interface HistorySidebarProps {
  /** Tool name for filtering history */
  tool: string
  /** Whether the sidebar is open */
  isOpen: boolean
  /** Callback when sidebar open/close state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when a history item is clicked */
  onHistoryItemClick?: (item: HistoryEntry) => void
}

export function HistorySidebar({
  tool,
  isOpen,
  onOpenChange,
  onHistoryItemClick
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const {
    history,
    isLoading,
    error,
    deleteHistory,
    toggleFavorite,
    clearHistory
  } = useHistory({ tool, limit: 50, autoLoad: true })

  // Filter and sort history based on search query and favorites filter
  const filteredHistory = useMemo(() => {
    let filtered = history

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => item.input.toLowerCase().includes(query))
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((item) => item.favorite)
    }

    // Sort: favorites first, then by timestamp
    return filtered.sort((a, b) => {
      // Favorites go to top
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1

      // Then sort by timestamp (newest first)
      return (b.created_at || 0) - (a.created_at || 0)
    })
  }, [history, searchQuery, showFavoritesOnly])

  // Listen for keyboard shortcut (Cmd/Ctrl+H)
  useEffect(() => {
    if (!window.api?.shortcuts) return

    const unsubscribe = window.api.shortcuts.onToggleHistory(() => {
      onOpenChange(!isOpen)
    })

    return unsubscribe
  }, [isOpen, onOpenChange])

  const handleItemClick = (item: HistoryEntry) => {
    if (onHistoryItemClick) {
      onHistoryItemClick(item)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all history for this tool?')) {
      await clearHistory(tool)
    }
  }

  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold">History</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close history sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search bar and filters */}
        <div className="p-4 border-b dark:border-gray-700 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search history..."
              className="pl-10 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Favorites filter toggle */}
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            className="w-full gap-2"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')} />
            {showFavoritesOnly ? 'Show All' : 'Show Favorites Only'}
          </Button>

          {searchQuery && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filteredHistory.length} of {history.length} results
            </p>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  Error loading history
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1 break-words">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History list */}
        <ScrollArea className="flex-1 h-[calc(100%-140px)]">
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3 animate-pulse" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No matching history items' : 'No history items yet'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Your recent operations will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteHistory}
                    onClick={handleItemClick}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-4 border-t dark:border-gray-700">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={history.length === 0}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        </div>
      </div>
    </>
  )
}
