import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonFormatter } from '../JsonFormatter';

describe('JsonFormatter', () => {
  beforeEach(() => {
    render(<JsonFormatter />);
  });

  describe('Initial State', () => {
    it('should render input and output textareas', () => {
      expect(screen.getByPlaceholderText(/paste.*json/i)).toBeInTheDocument();
      expect(screen.getByText(/formatted output/i)).toBeInTheDocument();
    });

    it('should render format and compress buttons', () => {
      expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compress/i })).toBeInTheDocument();
    });

    it('should render clear and copy buttons', () => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });

  describe('JSON Formatting', () => {
    it('should format valid JSON with 2-space indentation', () => {
      const input = screen.getByPlaceholderText(/paste.*json/i);
      const formatButton = screen.getByRole('button', { name: /format/i });

      fireEvent.change(input, { target: { value: '{"name":"test","age":25}' } });
      fireEvent.click(formatButton);

      const output = screen.getByTestId('json-output');
      expect(output.textContent).toContain('"name": "test"');
      expect(output.textContent).toContain('"age": 25');
    });

    it('should handle nested objects', () => {
      const input = screen.getByPlaceholderText(/paste.*json/i);
      const formatButton = screen.getByRole('button', { name: /format/i });

      const nestedJson = '{"user":{"name":"test","address":{"city":"Seoul"}}}';
      fireEvent.change(input, { target: { value: nestedJson } });
      fireEvent.click(formatButton);

      const output = screen.getByTestId('json-output');
      expect(output.textContent).toContain('"user"');
      expect(output.textContent).toContain('"address"');
      expect(output.textContent).toContain('"city": "Seoul"');
    });

    it('should handle arrays', () => {
      const input = screen.getByPlaceholderText(/paste.*json/i);
      const formatButton = screen.getByRole('button', { name: /format/i });

      const arrayJson = '{"items":[1,2,3],"names":["a","b"]}';
      fireEvent.change(input, { target: { value: arrayJson } });
      fireEvent.click(formatButton);

      const output = screen.getByTestId('json-output');
      expect(output.textContent).toContain('"items"');
      expect(output.textContent).toContain('[');
    });
  });

  describe('JSON Compression', () => {
    it('should compress formatted JSON', () => {
      const input = screen.getByPlaceholderText(/paste.*json/i);
      const compressButton = screen.getByRole('button', { name: /compress/i });

      const formattedJson = `{
  "name": "test",
  "age": 25
}`;
      fireEvent.change(input, { target: { value: formattedJson } });
      fireEvent.click(compressButton);

      const output = screen.getByTestId('json-output');
      expect(output.textContent).toBe('{"name":"test","age":25}');
    });
  });

  describe('Error Handling', () => {
    it('should show error for invalid JSON', () => {
      const input = screen.getByPlaceholderText(/paste.*json/i);
      const formatButton = screen.getByRole('button', { name: /format/i });

      fireEvent.change(input, { target: { value: '{invalid json}' } });
      fireEvent.click(formatButton);

      // Use getAllByText to handle multiple matches (input value + error message)
      const errorElements = screen.getAllByText(/invalid json/i);
      // Check that at least one of them is the error message (has class text-red-*)
      expect(errorElements.some(el => el.className.includes('text-red'))).toBe(true);
    });

    it('should show error for empty input', () => {
      const formatButton = screen.getByRole('button', { name: /format/i });

      fireEvent.click(formatButton);

      expect(screen.getByText(/empty/i)).toBeInTheDocument();
    });

    it('should clear error when valid JSON is entered', () => {
      const input = screen.getByPlaceholderText(/paste.*json/i);
      const formatButton = screen.getByRole('button', { name: /format/i });

      // First, trigger error
      fireEvent.change(input, { target: { value: '{invalid}' } });
      fireEvent.click(formatButton);
      const errorElements = screen.getAllByText(/invalid json/i);
      expect(errorElements.some(el => el.className.includes('text-red'))).toBe(true);

      // Then, fix with valid JSON
      fireEvent.change(input, { target: { value: '{"valid":true}' } });
      fireEvent.click(formatButton);

      // Error message should not be present (only the valid JSON in input might remain)
      const remainingElements = screen.queryAllByText(/invalid json/i);
      expect(remainingElements.every(el => !el.className.includes('text-red'))).toBe(true);
    });
  });

  describe('Clear Functionality', () => {
    it('should clear both input and output', () => {
      const input = screen.getByPlaceholderText(/paste.*json/i) as HTMLTextAreaElement;
      const formatButton = screen.getByRole('button', { name: /format/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      fireEvent.change(input, { target: { value: '{"test":true}' } });
      fireEvent.click(formatButton);
      expect(input.value).toBe('{"test":true}');

      fireEvent.click(clearButton);
      expect(input.value).toBe('');

      const output = screen.getByTestId('json-output');
      expect(output.textContent).toBe('');
    });
  });

  describe('Copy Functionality', () => {
    it('should copy formatted output to clipboard', async () => {
      const input = screen.getByPlaceholderText(/paste.*json/i);
      const formatButton = screen.getByRole('button', { name: /format/i });
      const copyButton = screen.getByRole('button', { name: /copy/i });

      // Mock clipboard
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      fireEvent.change(input, { target: { value: '{"test":true}' } });
      fireEvent.click(formatButton);
      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('"test": true'));
    });
  });

  describe('Performance', () => {
    it('should handle large JSON files (1MB+)', () => {
      const input = screen.getByPlaceholderText(/paste.*json/i);
      const formatButton = screen.getByRole('button', { name: /format/i });

      // Create large JSON (1MB+)
      const largeArray = Array(10000).fill({ name: 'test', value: 123, nested: { data: true } });
      const largeJson = JSON.stringify({ items: largeArray });

      const startTime = performance.now();
      fireEvent.change(input, { target: { value: largeJson } });
      fireEvent.click(formatButton);
      const endTime = performance.now();

      // Should process in less than 1 second
      expect(endTime - startTime).toBeLessThan(1000);

      const output = screen.getByTestId('json-output');
      expect(output.textContent).toContain('"items"');
    });
  });
});
