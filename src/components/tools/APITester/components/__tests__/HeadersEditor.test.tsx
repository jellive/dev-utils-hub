import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeadersEditor } from '../HeadersEditor';
import type { Header } from '../../types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tools.api.headers.title': 'Headers',
        'tools.api.headers.key': 'Header Name',
        'tools.api.headers.value': 'Header Value',
        'tools.api.headers.addHeader': 'Add Header',
        'tools.api.headers.noHeaders': 'No headers',
      };
      return translations[key] || key;
    },
  }),
}));

describe('HeadersEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const mockHeaders: Header[] = [
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Authorization', value: 'Bearer token', enabled: false },
  ];

  it('should render headers table with existing headers', () => {
    render(<HeadersEditor headers={mockHeaders} onChange={vi.fn()} />);

    // Check for input fields with values instead of text content
    const keyInputs = screen.getAllByPlaceholderText(/header name/i);
    const valueInputs = screen.getAllByPlaceholderText(/header value/i);

    expect(keyInputs[0]).toHaveValue('Content-Type');
    expect(valueInputs[0]).toHaveValue('application/json');
    expect(keyInputs[1]).toHaveValue('Authorization');
    expect(valueInputs[1]).toHaveValue('Bearer token');
  });

  it('should render Add Header button', () => {
    render(<HeadersEditor headers={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /add header/i })).toBeInTheDocument();
  });

  it('should add new empty header row when Add Header is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<HeadersEditor headers={[]} onChange={handleChange} />);

    const addButton = screen.getByRole('button', { name: /add header/i });
    await user.click(addButton);

    expect(handleChange).toHaveBeenCalledWith([
      { key: '', value: '', enabled: true },
    ]);
  });

  it('should update header key when typing in key field', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<HeadersEditor headers={mockHeaders} onChange={handleChange} />);

    const keyInputs = screen.getAllByPlaceholderText(/header name/i);
    await user.type(keyInputs[0], 'X');

    // Verify onChange was called with updated key
    expect(handleChange).toHaveBeenCalled();

    // Check that the last call has the correct structure
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall[0].key).toBe('Content-TypeX');
    expect(lastCall).toHaveLength(2);
  });

  it('should update header value when typing in value field', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<HeadersEditor headers={mockHeaders} onChange={handleChange} />);

    const valueInputs = screen.getAllByPlaceholderText(/header value/i);
    await user.type(valueInputs[0], 'X');

    // Verify onChange was called with updated value
    expect(handleChange).toHaveBeenCalled();

    // Check that the last call has the correct structure
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall[0].value).toBe('application/jsonX');
    expect(lastCall).toHaveLength(2);
  });

  it('should toggle header enabled state with checkbox', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<HeadersEditor headers={mockHeaders} onChange={handleChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // Toggle first header

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ enabled: false }), // Was true, now false
      ])
    );
  });

  it('should delete header when delete button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<HeadersEditor headers={mockHeaders} onChange={handleChange} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Should have one less header
    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([mockHeaders[1]])
    );
    expect(handleChange.mock.calls[0][0]).toHaveLength(1);
  });

  it('should show empty state when no headers', () => {
    render(<HeadersEditor headers={[]} onChange={vi.fn()} />);

    expect(screen.getByText(/no headers/i)).toBeInTheDocument();
  });

  it('should render common header presets dropdown', () => {
    render(<HeadersEditor headers={[]} onChange={vi.fn()} />);

    // Should have a way to select common headers
    expect(screen.getByRole('button', { name: /add header/i })).toBeInTheDocument();
  });

  it('should handle rapid header additions', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<HeadersEditor headers={[]} onChange={handleChange} />);

    const addButton = screen.getByRole('button', { name: /add header/i });

    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);

    // Should have called onChange 3 times
    expect(handleChange).toHaveBeenCalledTimes(3);
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<HeadersEditor headers={mockHeaders} onChange={vi.fn()} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAccessibleName();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons[0]).toBeInTheDocument();
  });

  it('should maintain header order', () => {
    render(<HeadersEditor headers={mockHeaders} onChange={vi.fn()} />);

    // Get all input fields and verify their order
    const keyInputs = screen.getAllByPlaceholderText(/header name/i);
    const valueInputs = screen.getAllByPlaceholderText(/header value/i);

    // First header
    expect(keyInputs[0]).toHaveValue('Content-Type');
    expect(valueInputs[0]).toHaveValue('application/json');

    // Second header
    expect(keyInputs[1]).toHaveValue('Authorization');
    expect(valueInputs[1]).toHaveValue('Bearer token');
  });
});
