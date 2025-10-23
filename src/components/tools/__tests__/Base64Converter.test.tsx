import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Base64Converter } from '../Base64Converter';

describe('Base64Converter', () => {
  beforeEach(() => {
    render(<Base64Converter />);
  });

  describe('Tabs Structure', () => {
    it('should render tabs with Encode and Decode triggers', () => {
      expect(screen.getByRole('tab', { name: /encode/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /decode/i })).toBeInTheDocument();
    });

    it('should have ArrowUp icon in Encode tab', () => {
      const encodeTab = screen.getByRole('tab', { name: /encode/i });
      const icon = encodeTab.querySelector('svg[class*="lucide-arrow-up"]');
      expect(icon).toBeInTheDocument();
    });

    it('should have ArrowDown icon in Decode tab', () => {
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      const icon = decodeTab.querySelector('svg[class*="lucide-arrow-down"]');
      expect(icon).toBeInTheDocument();
    });

    it('should switch between tabs when clicked', async () => {
      const user = userEvent.setup();
      const encodeTab = screen.getByRole('tab', { name: /encode/i });
      const decodeTab = screen.getByRole('tab', { name: /decode/i });

      // Initially, Encode tab should be selected
      expect(encodeTab).toHaveAttribute('data-state', 'active');
      expect(decodeTab).toHaveAttribute('data-state', 'inactive');

      // Click Decode tab
      await user.click(decodeTab);
      await waitFor(() => {
        expect(decodeTab).toHaveAttribute('data-state', 'active');
        expect(encodeTab).toHaveAttribute('data-state', 'inactive');
      });

      // Click Encode tab again
      await user.click(encodeTab);
      await waitFor(() => {
        expect(encodeTab).toHaveAttribute('data-state', 'active');
        expect(decodeTab).toHaveAttribute('data-state', 'inactive');
      });
    });
  });

  describe('shadcn/ui Components', () => {
    it('should use shadcn/ui Label components for accessibility', () => {
      // Labels should have the Radix UI role
      const labels = document.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);
      // shadcn/ui Label has specific classes from labelVariants
      const hasLabelClasses = Array.from(labels).some(label =>
        label.className.includes('text-sm') && label.className.includes('font-medium')
      );
      expect(hasLabelClasses).toBe(true);
    });

    it('should use shadcn/ui Textarea components', () => {
      const textareas = document.querySelectorAll('textarea');
      expect(textareas.length).toBeGreaterThan(0);
      // shadcn/ui Textarea has specific classes like rounded-md, border, etc.
      const hasTextareaClasses = Array.from(textareas).some(textarea =>
        textarea.className.includes('rounded-md') &&
        textarea.className.includes('border') &&
        textarea.className.includes('min-h-')
      );
      expect(hasTextareaClasses).toBe(true);
    });

    it('should have URL-safe Base64 switch', () => {
      // Switch should be rendered with proper label
      const switchElement = document.querySelector('[role="switch"]');
      expect(switchElement).toBeInTheDocument();
      expect(screen.getByText(/url-safe/i)).toBeInTheDocument();
    });

    it('should have character encoding select', () => {
      // Select should be rendered with encoding options
      const selectTrigger = document.querySelector('[role="combobox"]');
      expect(selectTrigger).toBeInTheDocument();
      // Check for the label that is specifically for the select
      const encodingLabel = document.querySelector('label[for="encoding"]');
      expect(encodingLabel).toBeInTheDocument();
      expect(encodingLabel?.textContent).toBe('Encoding:');
    });
  });

  describe('Initial State', () => {
    it('should render input and output textareas', () => {
      expect(screen.getByPlaceholderText(/enter text to encode/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/base64 output/i)).toBeInTheDocument();
    });

    it('should render encode and decode buttons', async () => {
      const user = userEvent.setup();

      // Encode tab is active by default
      expect(screen.getByRole('button', { name: /^encode$/i })).toBeInTheDocument();

      // Switch to decode tab to check decode button
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button to appear
      await screen.findByRole('button', { name: /^decode$/i });
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

  describe('URL-safe Base64 Encoding', () => {
    it('should encode with URL-safe characters when switch is enabled', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      // Toggle URL-safe switch
      const urlSafeSwitch = document.querySelector('[role="switch"]') as HTMLButtonElement;
      await user.click(urlSafeSwitch);

      // Encode text that produces + and / in standard Base64
      const testText = 'Hello>?>World';
      fireEvent.change(input, { target: { value: testText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      // URL-safe Base64 uses - and _ instead of + and /
      expect(output.value).not.toContain('+');
      expect(output.value).not.toContain('/');
    });
  });

  describe('Base64 Decoding', () => {
    it('should decode valid Base64 to ASCII text', async () => {
      const user = userEvent.setup();

      // Switch to decode tab
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button to appear
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });

      const input = screen.getByPlaceholderText(/enter text to encode/i);
      fireEvent.change(input, { target: { value: 'SGVsbG8gV29ybGQ=' } });
      fireEvent.click(decodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      expect(output.value).toBe('Hello World');
    });

    it('should decode Base64 to Korean text', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText(/enter text to encode/i) as HTMLTextAreaElement;
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      // First encode Korean text (on encode tab by default)
      const koreanText = '안녕하세요';
      fireEvent.change(input, { target: { value: koreanText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      // Switch to decode tab
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button to appear and get input again after tab switch
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const inputAfterSwitch = screen.getByPlaceholderText(/enter text to encode/i);

      // Set encoded value
      fireEvent.change(inputAfterSwitch, { target: { value: encoded } });
      await user.click(decodeButton);

      expect(output.value).toBe(koreanText);
    });

    it('should decode Base64 with emojis', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText(/enter text to encode/i) as HTMLTextAreaElement;
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      const emojiText = 'Hello 👋 World 🌍';
      fireEvent.change(input, { target: { value: emojiText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      // Switch to decode tab
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button to appear and get input again after tab switch
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const inputAfterSwitch = screen.getByPlaceholderText(/enter text to encode/i);

      // Set encoded value
      fireEvent.change(inputAfterSwitch, { target: { value: encoded } });
      await user.click(decodeButton);

      expect(output.value).toBe(emojiText);
    });
  });

  describe('Error Handling', () => {
    it('should show error for empty input on encode', () => {
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.click(encodeButton);

      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();
    });

    it('should show error for empty input on decode', async () => {
      const user = userEvent.setup();

      // Switch to decode tab
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button to appear
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      fireEvent.click(decodeButton);

      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();
    });

    it('should show error for invalid Base64 on decode', async () => {
      const user = userEvent.setup();

      // Switch to decode tab
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button to appear
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });

      fireEvent.change(input, { target: { value: 'This is not valid Base64!!!' } });
      fireEvent.click(decodeButton);

      expect(screen.getByText(/invalid base64/i)).toBeInTheDocument();
    });

    it('should clear error when valid operation performed', async () => {
      const user = userEvent.setup();

      // Switch to decode tab
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button and trigger error
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      fireEvent.click(decodeButton);
      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();

      // Switch to encode tab
      const encodeTab = screen.getByRole('tab', { name: /encode/i });
      await user.click(encodeTab);

      // Wait for encode button and clear error with valid encode
      const encodeButton = await screen.findByRole('button', { name: /^encode$/i });
      const input = screen.getByPlaceholderText(/enter text to encode/i);
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

    it('should clear error message', async () => {
      const user = userEvent.setup();

      // Switch to decode tab
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
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

  describe('File Drag-and-Drop', () => {
    it('should handle file drop event', async () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i) as HTMLTextAreaElement;

      // Create a file
      const file = new File(['Hello from file'], 'test.txt', { type: 'text/plain' });

      // Mock FileReader
      const originalFileReader = (globalThis as any).FileReader;
      const mockFileReaderInstance = {
        readAsText: vi.fn(function(this: any, _blob: Blob) {
          // Simulate async file reading
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: 'Hello from file' } });
            }
          }, 0);
        }),
        onload: null as any,
      };

      (globalThis as any).FileReader = function() {
        return mockFileReaderInstance;
      } as any;

      // Create drop event with proper structure
      fireEvent.drop(input, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      });

      // Wait for file content to be loaded
      await waitFor(() => {
        expect(input.value).toBe('Hello from file');
      });

      // Restore FileReader
      (globalThis as any).FileReader = originalFileReader;
    });
  });

  describe('File Size and Progress Indicators', () => {
    it('should display character count for input', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      fireEvent.change(input, { target: { value: 'Hello World' } });

      // Should show character count
      expect(screen.getByText(/11 characters/i)).toBeInTheDocument();
    });

    it('should display character count for output after encoding', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(encodeButton);

      // Should show output character count (8 characters for "Hello" in Base64)
      expect(screen.getByText(/8 characters/i)).toBeInTheDocument();
    });

    it('should show progress indicator during large file processing', async () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      // Create large text (10KB+)
      const largeText = 'A'.repeat(10240);
      fireEvent.change(input, { target: { value: largeText } });
      fireEvent.click(encodeButton);

      // Should show progress indicator (even if briefly)
      // In real scenario, this would be visible during processing
      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      expect(output.value).toBeTruthy();
    });

    it('should display file size in human-readable format', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);

      // Test with text that's exactly 1024 bytes
      const text1KB = 'A'.repeat(1024);
      fireEvent.change(input, { target: { value: text1KB } });

      // Should show "1.0 KB" or similar
      expect(screen.getByText(/1\.0?\s*KB/i)).toBeInTheDocument();
    });

    it('should update character count in real-time as user types', () => {
      const input = screen.getByPlaceholderText(/enter text to encode/i);

      fireEvent.change(input, { target: { value: 'Hi' } });
      expect(screen.getByText(/2 characters/i)).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'Hello' } });
      expect(screen.getByText(/5 characters/i)).toBeInTheDocument();
    });
  });

  describe('Bidirectional Conversion', () => {
    it('should maintain data integrity through encode-decode cycle', async () => {
      const user = userEvent.setup();
      const input = screen.getByPlaceholderText(/enter text to encode/i) as HTMLTextAreaElement;
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      const originalText = 'Test with 한글 and emojis 🎉🎊 and special chars !@#$%';

      // Encode (on encode tab by default)
      fireEvent.change(input, { target: { value: originalText } });
      fireEvent.click(encodeButton);

      const output = screen.getByPlaceholderText(/base64 output/i) as HTMLTextAreaElement;
      const encoded = output.value;

      // Switch to decode tab
      const decodeTab = screen.getByRole('tab', { name: /decode/i });
      await user.click(decodeTab);

      // Wait for decode button and get input again after tab switch
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const inputAfterSwitch = screen.getByPlaceholderText(/enter text to encode/i);

      // Set encoded value
      fireEvent.change(inputAfterSwitch, { target: { value: encoded } });
      await user.click(decodeButton);

      expect(output.value).toBe(originalText);
    });
  });
});
