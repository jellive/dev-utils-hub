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

export function HistoryItem({ item, onToggleFavorite, onDelete, onClick, searchQuery }: HistoryItemProps) {
  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return 'Unknown'

    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`

    return new Date(timestamp).toLocaleDateString()
  }

  const truncateInput = (input: string, maxLength = 100): string => {
    if (input.length <= maxLength) return input
    return input.substring(0, maxLength) + '...'
  }

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-gray-100">
            {part}
          </mark>
        )
      }
      return part
    })
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.id) onToggleFavorite(item.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.id) onDelete(item.id)
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'border border-transparent hover:border-gray-200 dark:hover:border-gray-600',
        item.favorite && 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
      )}
      onClick={() => onClick(item)}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 break-all">
          {searchQuery ? highlightText(truncateInput(item.input), searchQuery) : truncateInput(item.input)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatTimestamp(item.created_at)}
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
}
