import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { URLConverter } from '../URLConverter';

describe('URLConverter', () => {
  beforeEach(() => {
    render(<URLConverter />);
  });

  describe('Initial State', () => {
    it('should render input and output textareas', () => {
      expect(screen.getByPlaceholderText(/enter text to encode/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/url.*output/i)).toBeInTheDocument();
    });

    it('should render encode and decode buttons', () => {
      expect(screen.getByRole('button', { name: /^encode$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^decode$/i })).toBeInTheDocument();
    });

    it('should render clear and copy buttons', () => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });

  describe('URL Encoding', () => {
    it('should encode plain text with spaces', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      expect(output.value).toBe('Hello%20World');
    });

    it('should encode special characters', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '!@#$%^&*()' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      expect(output.value).toContain('%');
      expect(output.value.length).toBeGreaterThan(0);
    });

    it('should encode Korean text', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '안녕하세요' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      expect(output.value).toContain('%');
      expect(output.value.length).toBeGreaterThan(0);
    });

    it('should encode emojis', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '👋🌍' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      expect(output.value).toContain('%');
    });

    it('should encode URL with query parameters', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'name=John Doe&city=New York' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      expect(output.value).toContain('John%20Doe');
      expect(output.value).toContain('New%20York');
    });

    it('should not encode unreserved characters', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'abc123-._~' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      // These characters should remain unencoded
      expect(output.value).toContain('abc123');
      expect(output.value).toContain('-');
      expect(output.value).toContain('.');
      expect(output.value).toContain('_');
      expect(output.value).toContain('~');
    });
  });

  describe('URL Decoding', () => {
    it('should decode URL encoded spaces', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      fireEvent.change(input, { target: { value: 'Hello%20World' } });
      fireEvent.click(decodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      expect(output.value).toBe('Hello World');
    });

    it('should decode URL encoded Korean text', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      const koreanText = '안녕하세요';
      fireEvent.change(input, { target: { value: koreanText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      fireEvent.change(input, { target: { value: encoded } });
      fireEvent.click(decodeButton);

      expect(output.value).toBe(koreanText);
    });

    it('should decode URL encoded emojis', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      const emojiText = '👋🌍';
      fireEvent.change(input, { target: { value: emojiText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      fireEvent.change(input, { target: { value: encoded } });
      fireEvent.click(decodeButton);

      expect(output.value).toBe(emojiText);
    });

    it('should decode plus signs as spaces', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      fireEvent.change(input, { target: { value: 'Hello+World' } });
      fireEvent.click(decodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      expect(output.value).toBe('Hello World');
    });
  });

  describe('Error Handling', () => {
    it('should show error for empty input on encode', () => {
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.click(encodeButton);

      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();
    });

    it('should show error for empty input on decode', () => {
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      fireEvent.click(decodeButton);

      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();
    });

    it('should show error for malformed URL encoding on decode', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      fireEvent.change(input, { target: { value: '%ZZ%XX' } });
      fireEvent.click(decodeButton);

      expect(screen.getByText(/invalid.*url/i)).toBeInTheDocument();
    });

    it('should clear error when valid operation performed', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.click(decodeButton);
      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(encodeButton);

      expect(screen.queryByText(/input is empty/i)).not.toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear both input and output', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i) as HTMLTextAreaElement;
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      expect(input.value).toBe('Hello World');
      expect(output.value).toBeTruthy();

      fireEvent.click(clearButton);

      expect(input.value).toBe('');
      expect(output.value).toBe('');
    });

    it('should clear error message', () => {
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      fireEvent.click(decodeButton);
      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(screen.queryByText(/input is empty/i)).not.toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should copy output to clipboard', async () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const copyButton = screen.getByRole('button', { name: /copy/i });

      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(encoded);
    });
  });

  describe('Bidirectional Conversion', () => {
    it('should maintain data integrity through encode-decode cycle', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      const originalText = 'name=홍길동&city=서울&emoji=🎉';

      fireEvent.change(input, { target: { value: originalText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/url.*output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      fireEvent.change(input, { target: { value: encoded } });
      fireEvent.click(decodeButton);

      expect(output.value).toBe(originalText);
    });
  });
});
