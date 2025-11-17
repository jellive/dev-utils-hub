import { memo, useCallback, useMemo } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import type { HistoryEntry } from '../../../preload/index.d'

interface HistoryItemProps {
  item: HistoryEntry
  onToggleFavorite: (id: number) => void
  onDelete: (id: number) => void
  onClick: (item: HistoryEntry) => void
  searchQuery?: string
}

export const HistoryItem = memo(function HistoryItem({ item, onToggleFavorite, onDelete, onClick, searchQuery }: HistoryItemProps) {
  // Memoize formatted timestamp to avoid recalculating on every render
  const formattedTime = useMemo(() => {
    if (!item.created_at) return 'Unknown'

    const now = Date.now()
    const diff = now - item.created_at
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`

    return new Date(item.created_at).toLocaleDateString()
  }, [item.created_at])

  // Memoize truncated input
  const truncatedInput = useMemo(() => {
    const maxLength = 100
    if (item.input.length <= maxLength) return item.input
    return item.input.substring(0, maxLength) + '...'
  }, [item.input])

  // Memoize highlighted text
  const displayText = useMemo(() => {
    if (!searchQuery?.trim()) return truncatedInput

    const parts = truncatedInput.split(new RegExp(`(${searchQuery})`, 'gi'))
    return parts.map((part, index) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        return (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-gray-100">
            {part}
          </mark>
        )
      }
      return part
    })
  }, [truncatedInput, searchQuery])

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.id) onToggleFavorite(item.id)
  }, [item.id, onToggleFavorite])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.id) onDelete(item.id)
  }, [item.id, onDelete])

  const handleClick = useCallback(() => {
    onClick(item)
  }, [item, onClick])

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'border border-transparent hover:border-gray-200 dark:hover:border-gray-600',
        item.favorite && 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
      )}
      onClick={handleClick}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 break-all">
          {displayText}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formattedTime}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7',
            item.favorite && 'opacity-100 text-yellow-500 hover:text-yellow-600'
          )}
          onClick={handleToggleFavorite}
          aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={cn('h-4 w-4', item.favorite && 'fill-current')} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={handleDelete}
          aria-label="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
