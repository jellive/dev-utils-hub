import { useState, useEffect } from 'react'
import { X, Search, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '../../lib/utils'

export interface HistorySidebarProps {
  /** Tool name for filtering history */
  tool: string
  /** Whether the sidebar is open */
  isOpen: boolean
  /** Callback when sidebar open/close state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when a history item is clicked */
  onHistoryItemClick?: (item: any) => void
}

export function HistorySidebar({
  tool: _tool,
  isOpen,
  onOpenChange,
  onHistoryItemClick: _onHistoryItemClick
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Listen for keyboard shortcut (Cmd/Ctrl+H)
  useEffect(() => {
    if (!window.api?.shortcuts) return

    const unsubscribe = window.api.shortcuts.onToggleHistory(() => {
      onOpenChange(!isOpen)
    })

    return unsubscribe
  }, [isOpen, onOpenChange])

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

        {/* Search bar */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search history..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* History list */}
        <ScrollArea className="flex-1 h-[calc(100%-140px)]">
          <div className="p-4">
            {/* Empty state */}
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No history items yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Your recent operations will appear here
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-4 border-t dark:border-gray-700">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled
          >
            Clear All
          </Button>
        </div>
      </div>
    </>
  )
}
