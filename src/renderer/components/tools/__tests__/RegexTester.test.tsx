import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegexTester } from '../RegexTester';

describe('RegexTester', () => {
  beforeEach(() => {
    render(<RegexTester />);
  });

  describe('Initial State', () => {
    it('should render pattern input field', () => {
      expect(screen.getByPlaceholderText(/enter regex pattern/i)).toBeInTheDocument();
    });

    it('should render test string textarea', () => {
      expect(screen.getByPlaceholderText(/enter test string/i)).toBeInTheDocument();
    });

    it('should render flag checkboxes', () => {
      expect(screen.getByLabelText(/global/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/case insensitive/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/multiline/i)).toBeInTheDocument();
    });

    it('should render test button', () => {
      expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument();
    });

    it('should render clear button', () => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should render preset examples dropdown', () => {
      expect(screen.getByRole('combobox', { name: /preset examples/i })).toBeInTheDocument();
    });
  });

  describe('Preset Examples', () => {
    it('should load email validation preset', () => {
      const presetSelect = screen.getByRole('combobox', { name: /preset examples/i });

      fireEvent.change(presetSelect, { target: { value: 'email' } });

      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i) as HTMLInputElement;
      const testInput = screen.getByPlaceholderText(/enter test string/i) as HTMLTextAreaElement;

      expect(patternInput.value).toContain('@');
      expect(testInput.value).toContain('example.com');
    });

    it('should load phone number preset', () => {
      const presetSelect = screen.getByRole('combobox', { name: /preset examples/i });

      fireEvent.change(presetSelect, { target: { value: 'phone' } });

      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i) as HTMLInputElement;
      const testInput = screen.getByPlaceholderText(/enter test string/i) as HTMLTextAreaElement;

      expect(patternInput.value).toContain('\\d');
      expect(testInput.value).toContain('010');
    });

    it('should load URL preset', () => {
      const presetSelect = screen.getByRole('combobox', { name: /preset examples/i });

      fireEvent.change(presetSelect, { target: { value: 'url' } });

      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i) as HTMLInputElement;
      const testInput = screen.getByPlaceholderText(/enter test string/i) as HTMLTextAreaElement;

      expect(patternInput.value).toContain('https?');
      expect(testInput.value).toContain('http');
    });

    it('should load capture groups preset', () => {
      const presetSelect = screen.getByRole('combobox', { name: /preset examples/i });

      fireEvent.change(presetSelect, { target: { value: 'capture' } });

      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i) as HTMLInputElement;

      expect(patternInput.value).toContain('(');
      expect(patternInput.value).toContain(')');
    });

    it('should set appropriate flags for email preset', () => {
      const presetSelect = screen.getByRole('combobox', { name: /preset examples/i });

      fireEvent.change(presetSelect, { target: { value: 'email' } });

      const globalFlag = screen.getByLabelText(/global/i) as HTMLInputElement;
      expect(globalFlag.checked).toBe(true);
    });
  });

  describe('Pattern Validation', () => {
    it('should show error for invalid regex pattern', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: '[invalid' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid.*regex/i)).toBeInTheDocument();
      });
    });

    it('should show error for unclosed group', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: '(unclosed' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid.*regex/i)).toBeInTheDocument();
      });
    });

    it('should accept valid regex pattern', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: '\\d+' } });
      fireEvent.change(testInput, { target: { value: 'test 123' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.queryByText(/invalid.*regex/i)).not.toBeInTheDocument();
      });
    });

    it('should show error for empty pattern', async () => {
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(testInput, { target: { value: 'test' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/pattern.*empty/i)).toBeInTheDocument();
      });
    });
  });

  describe('Regex Matching', () => {
    it('should find matches with simple pattern', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: 'test' } });
      fireEvent.change(testInput, { target: { value: 'this is a test string' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/1 match/i)).toBeInTheDocument();
      });
    });

    it('should find multiple matches with global flag', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const globalFlag = screen.getByLabelText(/global/i) as HTMLInputElement;
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: 'test' } });
      fireEvent.change(testInput, { target: { value: 'test test test' } });
      fireEvent.click(globalFlag);
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/3 match/i)).toBeInTheDocument();
      });
    });

    it('should match case-insensitive with i flag', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const caseFlag = screen.getByLabelText(/case insensitive/i) as HTMLInputElement;
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: 'TEST' } });
      fireEvent.change(testInput, { target: { value: 'test Test TEST' } });
      fireEvent.click(caseFlag);
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/1 match/i)).toBeInTheDocument();
      });
    });

    it('should handle multiline flag', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const multilineFlag = screen.getByLabelText(/multiline/i) as HTMLInputElement;
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: '^test' } });
      fireEvent.change(testInput, { target: { value: 'line1\ntest\nline3' } });
      fireEvent.click(multilineFlag);
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/1 match/i)).toBeInTheDocument();
      });
    });

    it('should show no matches when pattern does not match', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: 'xyz' } });
      fireEvent.change(testInput, { target: { value: 'abc def ghi' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/0 match|no match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Capture Groups', () => {
    it('should display capture groups from pattern', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /^test$/i });

      fireEvent.change(patternInput, { target: { value: '(\\w+)@(\\w+)\\.(\\w+)' } });
      fireEvent.change(testInput, { target: { value: 'user@domain.org' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/group 1/i)).toBeInTheDocument();
        expect(screen.getByText(/^user$/)).toBeInTheDocument();
        expect(screen.getByText(/group 2/i)).toBeInTheDocument();
        expect(screen.getByText(/^domain$/)).toBeInTheDocument();
        expect(screen.getByText(/group 3/i)).toBeInTheDocument();
        expect(screen.getByText(/^org$/)).toBeInTheDocument();
      });
    });

    it('should handle named capture groups', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: '(?<user>\\w+)@(?<domain>\\w+)' } });
      fireEvent.change(testInput, { target: { value: 'test@example' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/user/i)).toBeInTheDocument();
        expect(screen.getByText(/domain/i)).toBeInTheDocument();
      });
    });
  });

  describe('Match Highlighting', () => {
    it('should highlight matched text', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: 'test' } });
      fireEvent.change(testInput, { target: { value: 'this is a test string' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        const highlightedArea = screen.getByTestId('highlighted-text');
        expect(highlightedArea).toBeInTheDocument();
        expect(highlightedArea.innerHTML).toContain('test');
      });
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all inputs and results', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i) as HTMLInputElement;
      const testInput = screen.getByPlaceholderText(/enter test string/i) as HTMLTextAreaElement;
      const testButton = screen.getByRole('button', { name: /test/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      fireEvent.change(patternInput, { target: { value: 'test' } });
      fireEvent.change(testInput, { target: { value: 'test string' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/1 match/i)).toBeInTheDocument();
      });

      fireEvent.click(clearButton);

      expect(patternInput.value).toBe('');
      expect(testInput.value).toBe('');
      expect(screen.queryByText(/1 match/i)).not.toBeInTheDocument();
    });

    it('should clear error messages', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testButton = screen.getByRole('button', { name: /test/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      fireEvent.change(patternInput, { target: { value: '[invalid' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid.*regex/i)).toBeInTheDocument();
      });

      fireEvent.click(clearButton);

      expect(screen.queryByText(/invalid.*regex/i)).not.toBeInTheDocument();
    });
  });

  describe('Common Regex Patterns', () => {
    it('should match email addresses', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' } });
      fireEvent.change(testInput, { target: { value: 'Contact us at test@example.com or info@test.org' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/1 match/i)).toBeInTheDocument();
      });
    });

    it('should match phone numbers', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const globalFlag = screen.getByLabelText(/global/i) as HTMLInputElement;
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: '\\d{3}-\\d{4}-\\d{4}' } });
      fireEvent.change(testInput, { target: { value: 'Call 010-1234-5678 or 010-9876-5432' } });
      fireEvent.click(globalFlag);
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/2 match/i)).toBeInTheDocument();
      });
    });

    it('should match URLs', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      fireEvent.change(patternInput, { target: { value: 'https?://[^\\s]+' } });
      fireEvent.change(testInput, { target: { value: 'Visit https://example.com for more info' } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/1 match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large text efficiently', async () => {
      const patternInput = screen.getByPlaceholderText(/enter regex pattern/i);
      const testInput = screen.getByPlaceholderText(/enter test string/i);
      const testButton = screen.getByRole('button', { name: /test/i });

      const largeText = 'test '.repeat(1000);

      const startTime = performance.now();
      fireEvent.change(patternInput, { target: { value: 'test' } });
      fireEvent.change(testInput, { target: { value: largeText } });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText(/1 match/i)).toBeInTheDocument();
      }, { timeout: 1000 });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
