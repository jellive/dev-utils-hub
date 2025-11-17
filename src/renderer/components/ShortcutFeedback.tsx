import { useState, useEffect } from 'react'

interface ShortcutFeedbackProps {
  shortcut: string
  description: string
  onAnimationEnd: () => void
}

export function ShortcutFeedback({ shortcut, description, onAnimationEnd }: ShortcutFeedbackProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start exit animation after 1.8 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 1800)

    // Call onAnimationEnd after full animation (2s total)
    const endTimer = setTimeout(() => {
      onAnimationEnd()
    }, 2000)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(endTimer)
    }
  }, [onAnimationEnd])

  return (
    <div
      className={`fixed bottom-8 right-8 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 transition-all duration-200 ${
        isExiting
          ? 'opacity-0 -translate-y-5 scale-90'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <kbd className="px-2 py-1 bg-gray-800 dark:bg-gray-200 rounded text-sm font-mono">
        {shortcut}
      </kbd>
      <span className="text-sm font-medium">{description}</span>
    </div>
  )
}

export function useShortcutFeedback() {
  const [feedback, setFeedback] = useState<{ shortcut: string; description: string } | null>(null)

  const showFeedback = (shortcut: string, description: string) => {
    setFeedback({ shortcut, description })
  }

  const handleAnimationEnd = () => {
    setFeedback(null)
  }

  return {
    feedback,
    showFeedback,
    FeedbackComponent: feedback ? (
      <ShortcutFeedback
        shortcut={feedback.shortcut}
        description={feedback.description}
        onAnimationEnd={handleAnimationEnd}
      />
    ) : null
  }
}
