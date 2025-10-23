import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Base64Converter } from '../Base64Converter';

describe('Base64Converter', () => {
  beforeEach(() => {
    render(<Base64Converter />);
  });

  describe('Initial State', () => {
    it('should render input and output textareas', () => {
      expect(screen.getByPlaceholderText(/enter text to encode/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/base64 output/i)).toBeInTheDocument();
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

  describe('Base64 Encoding', () => {
    it('should encode plain ASCII text', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      expect(output.value).toBe('SGVsbG8gV29ybGQ=');
    });

    it('should encode Korean text (UTF-8)', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '안녕하세요' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      // UTF-8 encoded Korean text
      expect(output.value).toBeTruthy();
      expect(output.value.length).toBeGreaterThan(0);
    });

    it('should encode text with emojis', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello 👋 World 🌍' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      expect(output.value).toBeTruthy();
      expect(output.value.length).toBeGreaterThan(0);
    });

    it('should encode special characters', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '!@#$%^&*()_+-=[]{}|;:,.<>?' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      expect(output.value).toBeTruthy();
    });

    it('should handle multiline text', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      const multilineText = 'Line 1\nLine 2\nLine 3';
      fireEvent.change(input, { target: { value: multilineText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      expect(output.value).toBeTruthy();
    });
  });

  describe('Base64 Decoding', () => {
    it('should decode valid Base64 to ASCII text', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      fireEvent.change(input, { target: { value: 'SGVsbG8gV29ybGQ=' } });
      fireEvent.click(decodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      expect(output.value).toBe('Hello World');
    });

    it('should decode Base64 to Korean text', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      // First encode Korean text
      const koreanText = '안녕하세요';
      fireEvent.change(input, { target: { value: koreanText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      // Then decode it back
      fireEvent.change(input, { target: { value: encoded } });
      fireEvent.click(decodeButton);

      expect(output.value).toBe(koreanText);
    });

    it('should decode Base64 with emojis', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      const emojiText = 'Hello 👋 World 🌍';
      fireEvent.change(input, { target: { value: emojiText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      fireEvent.change(input, { target: { value: encoded } });
      fireEvent.click(decodeButton);

      expect(output.value).toBe(emojiText);
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

    it('should show error for invalid Base64 on decode', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      fireEvent.change(input, { target: { value: 'This is not valid Base64!!!' } });
      fireEvent.click(decodeButton);

      expect(screen.getByText(/invalid base64/i)).toBeInTheDocument();
    });

    it('should clear error when valid operation performed', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      // Trigger error
      fireEvent.click(decodeButton);
      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();

      // Clear error with valid encode
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

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
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

      // Mock clipboard
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(encoded);
    });
  });

  describe('Performance', () => {
    it('should handle large text (10KB+)', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      // Create 10KB+ text
      const largeText = 'Hello World! '.repeat(1000);

      const startTime = performance.now();
      fireEvent.change(input, { target: { value: largeText } });
      fireEvent.click(encodeButton);
      const endTime = performance.now();

      // Should process in less than 500ms
      expect(endTime - startTime).toBeLessThan(500);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      expect(output.value).toBeTruthy();
    });
  });

  describe('Bidirectional Conversion', () => {
    it('should maintain data integrity through encode-decode cycle', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const decodeButton = screen.getByRole('button', { name: /^decode$/i });

      const originalText = 'Test with 한글 and emojis 🎉🎊 and special chars !@#$%';

      // Encode
      fireEvent.change(input, { target: { value: originalText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      // Decode
      fireEvent.change(input, { target: { value: encoded } });
      fireEvent.click(decodeButton);

      expect(output.value).toBe(originalText);
    });
  });
});
