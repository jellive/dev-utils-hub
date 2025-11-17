import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryList } from '../HistoryList';
import type { HistoryItem } from '../../hooks/useHistory';

const mockHistoryItems: HistoryItem[] = [
  {
    id: '1',
    timestamp: Date.now() - 1000,
    method: 'GET',
    url: 'https://api.example.com/users',
    headers: {},
    body: '',
    response: {
      status: 200,
      statusText: 'OK',
      body: '{"data": []}',
      headers: { 'content-type': 'application/json' },
      time: 150
    }
  },
  {
    id: '2',
    timestamp: Date.now() - 2000,
    method: 'POST',
    url: 'https://api.example.com/users',
    headers: {},
    body: '{"name": "John"}',
    response: {
      status: 201,
      statusText: 'Created',
      body: '{"id": 1}',
      headers: { 'content-type': 'application/json' },
      time: 200
    }
  },
  {
    id: '3',
    timestamp: Date.now() - 3000,
    method: 'GET',
    url: 'https://api.example.com/posts',
    headers: {},
    body: '',
    error: 'Network error'
  }
];

describe('HistoryList', () => {
  it('should render empty state when no items', () => {
    render(<HistoryList items={[]} />);

    expect(screen.getByText(/no history items/i)).toBeInTheDocument();
  });

  it('should render all history items', () => {
    render(<HistoryList items={mockHistoryItems} />);

    const usersElements = screen.getAllByText(/users/i);
    const postsElement = screen.getByText(/posts/i);

    expect(usersElements.length).toBeGreaterThan(0);
    expect(postsElement).toBeInTheDocument();
  });

  it('should display request method for each item', () => {
    render(<HistoryList items={mockHistoryItems} />);

    const getMethods = screen.getAllByText('GET').filter(el => el.tagName === 'DIV');
    const postMethod = screen.getAllByText('POST').filter(el => el.tagName === 'DIV');

    expect(getMethods).toHaveLength(2);
    expect(postMethod).toHaveLength(1);
  });

  it('should display response status when available', () => {
    render(<HistoryList items={mockHistoryItems} />);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('201')).toBeInTheDocument();
  });

  it('should display error indicator for failed requests', () => {
    render(<HistoryList items={mockHistoryItems} />);

    const errorBadges = screen.getAllByText(/error/i).filter(el => el.tagName === 'DIV');
    expect(errorBadges.length).toBeGreaterThan(0);
  });

  it('should have search input', () => {
    render(<HistoryList items={mockHistoryItems} />);

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('should filter items by search query', async () => {
    const user = userEvent.setup();
    render(<HistoryList items={mockHistoryItems} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'posts');

    // Should only show posts item
    expect(screen.getByText(/posts/i)).toBeInTheDocument();
    expect(screen.queryByText(/users/i)).not.toBeInTheDocument();
  });

  it('should have method filter dropdown', () => {
    render(<HistoryList items={mockHistoryItems} />);

    expect(screen.getByRole('combobox', { name: /method/i })).toBeInTheDocument();
  });

  it('should filter items by method', async () => {
    const user = userEvent.setup();
    render(<HistoryList items={mockHistoryItems} />);

    const methodFilter = screen.getByRole('combobox', { name: /method/i });
    await user.selectOptions(methodFilter, 'POST');

    // Should only show POST items
    const postElements = screen.getAllByText('POST').filter(el => el.tagName === 'DIV');
    const getElements = screen.queryAllByText('GET').filter(el => el.tagName === 'DIV');

    expect(postElements).toHaveLength(1);
    expect(getElements).toHaveLength(0);
  });

  it('should have status filter dropdown', () => {
    render(<HistoryList items={mockHistoryItems} />);

    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
  });

  it('should filter items by status (success/error)', async () => {
    const user = userEvent.setup();
    render(<HistoryList items={mockHistoryItems} />);

    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    await user.selectOptions(statusFilter, 'error');

    // Should only show error items
    const errorBadges = screen.getAllByText(/error/i).filter(el => el.tagName === 'DIV');
    expect(errorBadges.length).toBeGreaterThan(0);
    expect(screen.queryByText('200')).not.toBeInTheDocument();
  });

  it('should call onRestore when item is clicked', async () => {
    const user = userEvent.setup();
    const handleRestore = vi.fn();

    render(<HistoryList items={mockHistoryItems} onRestore={handleRestore} />);

    const items = screen.getAllByRole('button');
    const firstItem = items.find(item =>
      within(item).queryByText(/users/i)
    );

    if (firstItem) {
      await user.click(firstItem);
      expect(handleRestore).toHaveBeenCalledWith(mockHistoryItems[0]);
    }
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();

    render(<HistoryList items={mockHistoryItems} onDelete={handleDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(handleDelete).toHaveBeenCalledWith(mockHistoryItems[0].id);
  });

  it('should display relative timestamps', () => {
    render(<HistoryList items={mockHistoryItems} />);

    // Should show relative time like "1 second ago", "2 seconds ago"
    const timestamps = screen.getAllByText(/ago/i);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('should combine search and filters', async () => {
    const user = userEvent.setup();
    render(<HistoryList items={mockHistoryItems} />);

    // Apply method filter
    const methodFilter = screen.getByRole('combobox', { name: /method/i });
    await user.selectOptions(methodFilter, 'GET');

    // Apply search
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'users');

    // Should show only GET requests to users
    expect(screen.getByText(/users/i)).toBeInTheDocument();
    expect(screen.queryByText(/posts/i)).not.toBeInTheDocument();
  });

  it('should show no results message when filters match nothing', async () => {
    const user = userEvent.setup();
    render(<HistoryList items={mockHistoryItems} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});
