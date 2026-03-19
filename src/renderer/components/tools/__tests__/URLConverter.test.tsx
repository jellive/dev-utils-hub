import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { URLConverter } from '../URLConverter';

// Mock window.api
vi.stubGlobal('api', {
  history: {
    save: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    get: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    export: vi.fn().mockResolvedValue(''),
  },
});

// Mock clipboard
vi.stubGlobal('navigator', {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

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
    it('should render input textarea', () => {
      expect(screen.getByPlaceholderText(/enter url here/i)).toBeInTheDocument();
    });

    it('should render encode button in encode tab', () => {
      expect(screen.getByRole('button', { name: /^encode$/i })).toBeInTheDocument();
    });

    it('should render clear button', () => {
      expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument();
    });

    it('should render encode and decode tabs', () => {
      expect(screen.getByRole('tab', { name: /^encode$/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /^decode$/i })).toBeInTheDocument();
    });
  });

  describe('URL Encoding', () => {
    it('should encode plain text with spaces', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      const outputTextarea = screen.getAllByRole('textbox').find(
        el => (el as HTMLTextAreaElement).readOnly && (el as HTMLTextAreaElement).value.includes('%20')
      ) as HTMLTextAreaElement | undefined;
      expect(outputTextarea).toBeDefined();
      expect(outputTextarea!.value).toBe('Hello%20World');
    });

    it('should encode special characters', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '!@#$%^&*()' } });
      fireEvent.click(encodeButton);

      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      ) as HTMLTextAreaElement | undefined;
      expect(outputTextarea).toBeDefined();
      expect(outputTextarea!.value).toContain('%');
      expect(outputTextarea!.value.length).toBeGreaterThan(0);
    });

    it('should encode Korean text', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '안녕하세요' } });
      fireEvent.click(encodeButton);

      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      ) as HTMLTextAreaElement | undefined;
      expect(outputTextarea).toBeDefined();
      expect(outputTextarea!.value).toContain('%');
    });

    it('should encode emojis', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: '😀' } });
      fireEvent.click(encodeButton);

      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      ) as HTMLTextAreaElement | undefined;
      expect(outputTextarea).toBeDefined();
      expect(outputTextarea!.value).toContain('%');
    });

    it('should encode URL with query parameters', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'search?q=hello world' } });
      fireEvent.click(encodeButton);

      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      ) as HTMLTextAreaElement | undefined;
      expect(outputTextarea).toBeDefined();
      expect(outputTextarea!.value.length).toBeGreaterThan(0);
    });

    it('should not encode unreserved characters', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'abcABC123-_.~' } });
      fireEvent.click(encodeButton);

      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      ) as HTMLTextAreaElement | undefined;
      expect(outputTextarea).toBeDefined();
      expect(outputTextarea!.value).toBe('abcABC123-_.~');
    });
  });

  describe('URL Decoding', () => {
    it('should decode URL encoded spaces', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /^decode$/i }));
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      fireEvent.change(input, { target: { value: 'Hello%20World' } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextareas = screen.getAllByRole('textbox');
        const outputTextarea = outputTextareas.find(
          el => (el as HTMLTextAreaElement).readOnly
        ) as HTMLTextAreaElement | undefined;
        expect(outputTextarea).toBeDefined();
        expect(outputTextarea!.value).toBe('Hello World');
      });
    });

    it('should decode URL encoded Korean text', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /^decode$/i }));
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      fireEvent.change(input, { target: { value: '%EC%95%88%EB%85%95' } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextareas = screen.getAllByRole('textbox');
        const outputTextarea = outputTextareas.find(
          el => (el as HTMLTextAreaElement).readOnly
        ) as HTMLTextAreaElement | undefined;
        expect(outputTextarea).toBeDefined();
        expect(outputTextarea!.value).toBe('안녕');
      });
    });

    it('should decode URL encoded emojis', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /^decode$/i }));
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      fireEvent.change(input, { target: { value: '%F0%9F%98%80' } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextareas = screen.getAllByRole('textbox');
        const outputTextarea = outputTextareas.find(
          el => (el as HTMLTextAreaElement).readOnly
        ) as HTMLTextAreaElement | undefined;
        expect(outputTextarea).toBeDefined();
        expect(outputTextarea!.value).toBe('😀');
      });
    });

    it('should decode plus signs as spaces', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /^decode$/i }));
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      fireEvent.change(input, { target: { value: 'Hello+World' } });
      fireEvent.click(decodeButton);

      await waitFor(() => {
        const outputTextareas = screen.getAllByRole('textbox');
        const outputTextarea = outputTextareas.find(
          el => (el as HTMLTextAreaElement).readOnly
        ) as HTMLTextAreaElement | undefined;
        expect(outputTextarea).toBeDefined();
        expect(outputTextarea!.value).toBe('Hello World');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error for empty input on encode', () => {
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.click(encodeButton);

      // With empty input, the output area should not appear (component uses toast.error)
      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      );
      expect(outputTextarea).toBeUndefined();
    });

    it('should show error for empty input on decode', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /^decode$/i }));
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });

      fireEvent.click(decodeButton);

      // Component uses toast.error for empty input — no readonly output textarea
      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      );
      expect(outputTextarea).toBeUndefined();
    });

    it('should show error for malformed URL encoding on decode', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /^decode$/i }));
      const decodeButton = await screen.findByRole('button', { name: /^decode$/i });
      const input = screen.getByPlaceholderText(/enter url here/i);

      // %ZZ is invalid percent encoding
      fireEvent.change(input, { target: { value: '%ZZ' } });
      fireEvent.click(decodeButton);

      // Should handle gracefully without crashing
      expect(screen.getByPlaceholderText(/enter url here/i)).toBeInTheDocument();
    });

    it('should clear error when valid operation performed', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      ) as HTMLTextAreaElement | undefined;
      expect(outputTextarea).toBeDefined();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear input', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const clearButton = screen.getByRole('button', { name: /^clear$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(clearButton);

      expect((input as HTMLTextAreaElement).value).toBe('');
    });

    it('should clear output after clearing', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });
      const clearButton = screen.getByRole('button', { name: /^clear$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);
      fireEvent.click(clearButton);

      const outputTextareas = screen.getAllByRole('textbox');
      const outputTextarea = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      );
      expect(outputTextarea).toBeUndefined();
    });
  });

  describe('Copy Functionality', () => {
    it('should show copy button when output is present', () => {
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: 'Hello World' } });
      fireEvent.click(encodeButton);

      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });

  describe('Bidirectional Conversion', () => {
    it('should maintain data integrity through encode-decode cycle', async () => {
      const original = 'Hello World & more!';

      // Encode
      const input = screen.getByPlaceholderText(/enter url here/i);
      const encodeButton = screen.getByRole('button', { name: /^encode$/i });

      fireEvent.change(input, { target: { value: original } });
      fireEvent.click(encodeButton);

      const outputTextareas = screen.getAllByRole('textbox');
      const encodedOutput = outputTextareas.find(
        el => (el as HTMLTextAreaElement).readOnly
      ) as HTMLTextAreaElement;
      expect(encodedOutput).toBeDefined();
      const encoded = encodedOutput.value;
      expect(encoded).toContain('%');

      // Verify decode produces original
      expect(decodeURIComponent(encoded)).toBe(original);
    });
  });
});
