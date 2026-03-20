import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryItem } from '../HistoryItem';
import type { HistoryEntry } from '../../../../preload/index.d';

const now = Date.now();

function makeItem(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 1,
    tool: 'json',
    input: 'test input',
    output: 'test output',
    created_at: now - 5000, // 5 seconds ago
    favorite: false,
    ...overrides,
  } as HistoryEntry;
}

const defaultHandlers = {
  onToggleFavorite: vi.fn(),
  onDelete: vi.fn(),
  onClick: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HistoryItem', () => {
  describe('rendering', () => {
    it('renders item input text', () => {
      render(<HistoryItem item={makeItem({ input: 'hello world' })} {...defaultHandlers} />);
      expect(screen.getByText('hello world')).toBeInTheDocument();
    });

    it('renders "Just now" for items created within 60s', () => {
      render(<HistoryItem item={makeItem({ created_at: now - 5000 })} {...defaultHandlers} />);
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('renders minutes ago for items 1-59 minutes old', () => {
      render(<HistoryItem item={makeItem({ created_at: now - 5 * 60 * 1000 })} {...defaultHandlers} />);
      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });

    it('renders hours ago for items 1-23 hours old', () => {
      render(<HistoryItem item={makeItem({ created_at: now - 3 * 60 * 60 * 1000 })} {...defaultHandlers} />);
      expect(screen.getByText('3h ago')).toBeInTheDocument();
    });

    it('renders days ago for items 1-6 days old', () => {
      render(<HistoryItem item={makeItem({ created_at: now - 2 * 24 * 60 * 60 * 1000 })} {...defaultHandlers} />);
      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });

    it('renders locale date string for items 7+ days old', () => {
      const oldDate = now - 10 * 24 * 60 * 60 * 1000;
      render(<HistoryItem item={makeItem({ created_at: oldDate })} {...defaultHandlers} />);
      expect(screen.getByText(new Date(oldDate).toLocaleDateString())).toBeInTheDocument();
    });

    it('renders "Unknown" when created_at is missing', () => {
      render(<HistoryItem item={makeItem({ created_at: undefined })} {...defaultHandlers} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('truncates long input to 100 characters with ellipsis', () => {
      const longInput = 'a'.repeat(120);
      render(<HistoryItem item={makeItem({ input: longInput })} {...defaultHandlers} />);
      expect(screen.getByText('a'.repeat(100) + '...')).toBeInTheDocument();
    });

    it('does not truncate input at or under 100 characters', () => {
      const input = 'a'.repeat(100);
      render(<HistoryItem item={makeItem({ input })} {...defaultHandlers} />);
      expect(screen.getByText(input)).toBeInTheDocument();
    });

    it('renders Add to favorites aria-label for non-favorite', () => {
      render(<HistoryItem item={makeItem({ favorite: false })} {...defaultHandlers} />);
      expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeInTheDocument();
    });

    it('renders Remove from favorites aria-label for favorite', () => {
      render(<HistoryItem item={makeItem({ favorite: true })} {...defaultHandlers} />);
      expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
    });

    it('renders delete button', () => {
      render(<HistoryItem item={makeItem()} {...defaultHandlers} />);
      expect(screen.getByRole('button', { name: 'Delete item' })).toBeInTheDocument();
    });
  });

  describe('click handlers', () => {
    it('calls onClick when item container is clicked', () => {
      render(<HistoryItem item={makeItem()} {...defaultHandlers} />);
      fireEvent.click(screen.getByText('test input'));
      expect(defaultHandlers.onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('calls onToggleFavorite with item id when favorite button clicked', () => {
      render(<HistoryItem item={makeItem({ id: 42 })} {...defaultHandlers} />);
      fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
      expect(defaultHandlers.onToggleFavorite).toHaveBeenCalledWith(42);
    });

    it('calls onDelete with item id when delete button clicked', () => {
      render(<HistoryItem item={makeItem({ id: 7 })} {...defaultHandlers} />);
      fireEvent.click(screen.getByRole('button', { name: 'Delete item' }));
      expect(defaultHandlers.onDelete).toHaveBeenCalledWith(7);
    });

    it('does not call onClick when favorite button is clicked (stopPropagation)', () => {
      render(<HistoryItem item={makeItem()} {...defaultHandlers} />);
      fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
      expect(defaultHandlers.onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when delete button is clicked (stopPropagation)', () => {
      render(<HistoryItem item={makeItem()} {...defaultHandlers} />);
      fireEvent.click(screen.getByRole('button', { name: 'Delete item' }));
      expect(defaultHandlers.onClick).not.toHaveBeenCalled();
    });
  });

  describe('search highlighting', () => {
    it('renders plain text when no searchQuery', () => {
      render(<HistoryItem item={makeItem({ input: 'hello world' })} {...defaultHandlers} />);
      expect(screen.getByText('hello world')).toBeInTheDocument();
    });

    it('renders plain text when searchQuery is empty', () => {
      render(<HistoryItem item={makeItem({ input: 'hello world' })} {...defaultHandlers} searchQuery="" />);
      expect(screen.getByText('hello world')).toBeInTheDocument();
    });

    it('highlights matching search query text with mark element', () => {
      const { container } = render(
        <HistoryItem item={makeItem({ input: 'hello world' })} {...defaultHandlers} searchQuery="world" />
      );
      const mark = container.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark?.textContent).toBe('world');
    });
  });
});
