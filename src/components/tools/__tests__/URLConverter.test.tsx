import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { URLConverter } from '../URLConverter';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('URLConverter', () => {
  beforeEach(() => {
    render(<URLConverter />);
  });

  describe('Initial State', () => {
    it('should render input textarea with URL placeholder', () => {
      expect(screen.getByPlaceholderText(/enter url here/i)).toBeInTheDocument();
    });

    it('should render encode button in encode tab', () => {
      expect(screen.getByRole('button', { name: /encode/i })).toBeInTheDocument();
    });

    it('should render clear button', () => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should render encode and decode tabs', () => {
      expect(screen.getByRole('tab', { name: /encode/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /decode/i })).toBeInTheDocument();
    });
  });

  describe('URL Encoding', () => {
    it('should encode plain text with spaces', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea).toBeTruthy();
        expect(outputTextarea?.value).toContain('Hello');
      });
    });

    it('should encode Korean text', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '안녕하세요' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value).toContain('%');
      });
    });

    it('should encode emojis', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '👋🌍' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value).toContain('%');
      });
    });

    it('should encode special characters', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '!@#$%^&*()' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value.length).toBeGreaterThan(0);
      });
    });

    it('should encode URL with query parameters', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'name=John Doe&city=New York' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value.length).toBeGreaterThan(0);
      });
    });

    it('should not encode unreserved characters', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'abc123' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value).toContain('abc123');
      });
    });
  });

  describe('URL Decoding', () => {
    it('should decode URL encoded text', async () => {
      const user = userEvent.setup();
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      fireEvent.change(input, { target: { value: 'Hello%20World' } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value).toBe('Hello World');
      });
    });

    it('should decode plus signs as spaces', async () => {
      const user = userEvent.setup();
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      fireEvent.change(input, { target: { value: 'Hello+World' } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value).toBe('Hello World');
      });
    });

    it('should decode URL encoded Korean text', async () => {
      const user = userEvent.setup();
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      fireEvent.change(input, { target: { value: '%EC%95%88%EB%85%95%ED%95%98%EC%84%B8%EC%9A%94' } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value).toBe('안녕하세요');
      });
    });

    it('should decode URL encoded emojis', async () => {
      const user = userEvent.setup();

      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '👋🌍' } });
      fireEvent.click(encodeButton);

      let encoded = '';
      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        encoded = outputTextarea?.value ?? '';
        expect(encoded.length).toBeGreaterThan(0);
      });

      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const decodeInput = screen.getByPlaceholderText(/enter url here/i);
      fireEvent.change(decodeInput, { target: { value: encoded } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value).toBe('👋🌍');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast for empty input on encode', async () => {
      const { toast } = await import('sonner');
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.click(encodeButton);

      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/input is empty/i));
    });

    it('should show error toast for empty input on decode', async () => {
      const { toast } = await import('sonner');
      const user = userEvent.setup();

      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      fireEvent.click(decodeButton);

      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/input is empty/i));
    });

    it('should show error for malformed URL encoding on decode', async () => {
      const { toast } = await import('sonner');
      const user = userEvent.setup();

      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      fireEvent.change(input, { target: { value: '%ZZ%XX' } });
      fireEvent.click(decodeButton);

      expect(toast.error).toHaveBeenCalled();
    });

    it('should clear when clear button is clicked after operation', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i) as HTMLTextAreaElement;
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        expect(document.querySelector('textarea[readonly]')).toBeTruthy();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(input.value).toBe('');
      expect(document.querySelector('textarea[readonly]')).toBeNull();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear both input and output', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i) as HTMLTextAreaElement;
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        expect(document.querySelector('textarea[readonly]')).toBeTruthy();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(input.value).toBe('');
      expect(document.querySelector('textarea[readonly]')).toBeNull();
    });

    it('should clear error message on clear', async () => {
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);
      // After clear, no validation alert should be shown
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('Copy Functionality', () => {
    it('should copy output to clipboard', async () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  describe('Bidirectional Conversion', () => {
    it('should maintain data integrity through encode-decode cycle', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      const originalText = 'name=홍길동&city=서울';
      fireEvent.change(input, { target: { value: originalText } });
      fireEvent.click(encodeButton);

      let encoded = '';
      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        encoded = outputTextarea?.value ?? '';
        expect(encoded.length).toBeGreaterThan(0);
      });

      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const decodeInput = screen.getByPlaceholderText(/enter url here/i);
      fireEvent.change(decodeInput, { target: { value: encoded } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
        expect(outputTextarea?.value).toBe(originalText);
      });
    });
  });
});
