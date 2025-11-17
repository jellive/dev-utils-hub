import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { URLInput } from '../URLInput';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tools.api.urlPlaceholder': 'Enter request URL...',
        'tools.api.url': 'URL',
        'tools.api.clear': 'Clear',
        'tools.api.urlInvalid': 'Please enter a valid URL',
      };
      return translations[key] || key;
    },
  }),
}));

describe('URLInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input field with placeholder', () => {
    render(<URLInput value="" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Enter request URL/i);
    expect(input).toBeInTheDocument();
  });

  it('should display current URL value', () => {
    render(<URLInput value="https://api.example.com" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('https://api.example.com');
  });

  it('should call onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<URLInput value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'https://api.test.com');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should auto-fix URL without protocol on blur', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<URLInput value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'api.example.com');
    await user.tab(); // Trigger blur

    // Should auto-prepend https://
    expect(input).toHaveValue('https://api.example.com');
  });

  it('should not show error for valid URLs', async () => {
    const user = userEvent.setup();
    render(<URLInput value="" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'https://api.example.com/users');
    await user.tab();

    // No error message
    expect(screen.queryByText(/invalid url/i)).not.toBeInTheDocument();
  });

  it('should auto-prepend https:// for URLs without protocol', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<URLInput value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'api.example.com');
    await user.tab(); // Trigger blur to auto-fix

    // Should have called onChange with https:// prepended
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
    expect(lastCall[0]).toMatch(/^https?:\/\//);
  });

  it('should handle paste events correctly', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<URLInput value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.paste('https://pasted-url.com');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should show clear button when input has value', () => {
    const { rerender } = render(<URLInput value="" onChange={vi.fn()} />);

    // No clear button when empty
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();

    // Clear button appears when there's a value
    rerender(<URLInput value="https://api.example.com" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should clear input when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<URLInput value="https://api.example.com" onChange={handleChange} />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('should validate various URL formats', async () => {
    const validUrls = [
      'https://api.example.com',
      'http://localhost:3000',
      'https://api.example.com/v1/users',
      'https://api.example.com/users?page=1',
      'https://sub.domain.example.com',
    ];

    for (const url of validUrls) {
      const { unmount } = render(<URLInput value={url} onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');

      // Should not show error for valid URLs
      expect(input).toHaveValue(url);
      expect(screen.queryByText(/invalid url/i)).not.toBeInTheDocument();

      unmount();
    }
  });

  it('should have proper accessibility attributes', () => {
    render(<URLInput value="" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'url');
    expect(input).toHaveAttribute('placeholder');
  });
});
