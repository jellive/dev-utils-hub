import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextDiff } from '../TextDiff';

describe('TextDiff', () => {
  beforeEach(() => {
    render(<TextDiff />);
  });

  describe('Initial State', () => {
    it('should render original text textarea', () => {
      expect(screen.getByPlaceholderText(/original text/i)).toBeInTheDocument();
    });

    it('should render modified text textarea', () => {
      expect(screen.getByPlaceholderText(/modified text/i)).toBeInTheDocument();
    });

    it('should render compare button', () => {
      expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
    });

    it('should render clear button', () => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });
  });

  describe('Text Comparison', () => {
    it('should show no changes for identical texts', () => {
      const originalInput = screen.getByPlaceholderText(/original text/i);
      const modifiedInput = screen.getByPlaceholderText(/modified text/i);
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(originalInput, { target: { value: 'Hello\nWorld' } });
      fireEvent.change(modifiedInput, { target: { value: 'Hello\nWorld' } });
      fireEvent.click(compareButton);

      expect(screen.getAllByText(/no differences/i).length).toBeGreaterThan(0);
    });

    it('should highlight added lines', () => {
      const originalInput = screen.getByPlaceholderText(/original text/i);
      const modifiedInput = screen.getByPlaceholderText(/modified text/i);
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(originalInput, { target: { value: 'Hello' } });
      fireEvent.change(modifiedInput, { target: { value: 'Hello\nWorld' } });
      fireEvent.click(compareButton);

      const diffViewer = screen.getByTestId('diff-viewer');
      expect(diffViewer).toBeInTheDocument();
      expect(diffViewer.textContent).toContain('World');
    });

    it('should highlight deleted lines', () => {
      const originalInput = screen.getByPlaceholderText(/original text/i);
      const modifiedInput = screen.getByPlaceholderText(/modified text/i);
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(originalInput, { target: { value: 'Hello\nWorld' } });
      fireEvent.change(modifiedInput, { target: { value: 'Hello' } });
      fireEvent.click(compareButton);

      const diffViewer = screen.getByTestId('diff-viewer');
      expect(diffViewer).toBeInTheDocument();
      expect(diffViewer.textContent).toContain('World');
    });

    it('should highlight modified lines', () => {
      const originalInput = screen.getByPlaceholderText(/original text/i);
      const modifiedInput = screen.getByPlaceholderText(/modified text/i);
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(originalInput, { target: { value: 'Hello World' } });
      fireEvent.change(modifiedInput, { target: { value: 'Hello Universe' } });
      fireEvent.click(compareButton);

      const diffViewer = screen.getByTestId('diff-viewer');
      expect(diffViewer).toBeInTheDocument();
      expect(diffViewer.textContent).toContain('World');
      expect(diffViewer.textContent).toContain('Universe');
    });

    it('should show line numbers', () => {
      const originalInput = screen.getByPlaceholderText(/original text/i);
      const modifiedInput = screen.getByPlaceholderText(/modified text/i);
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(originalInput, { target: { value: 'Line 1\nLine 2' } });
      fireEvent.change(modifiedInput, { target: { value: 'Line 1\nLine 3' } });
      fireEvent.click(compareButton);

      const diffViewer = screen.getByTestId('diff-viewer');
      expect(diffViewer).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear both inputs and diff results', () => {
      const originalInput = screen.getByPlaceholderText(/original text/i) as HTMLTextAreaElement;
      const modifiedInput = screen.getByPlaceholderText(/modified text/i) as HTMLTextAreaElement;
      const compareButton = screen.getByRole('button', { name: /compare/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      fireEvent.change(originalInput, { target: { value: 'Hello' } });
      fireEvent.change(modifiedInput, { target: { value: 'World' } });
      fireEvent.click(compareButton);

      expect(screen.getByTestId('diff-viewer')).toBeInTheDocument();

      fireEvent.click(clearButton);

      expect(originalInput.value).toBe('');
      expect(modifiedInput.value).toBe('');
      expect(screen.queryByTestId('diff-viewer')).not.toBeInTheDocument();
    });
  });

  describe('Empty Input Handling', () => {
    it('should handle empty original text', () => {
      const modifiedInput = screen.getByPlaceholderText(/modified text/i);
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(modifiedInput, { target: { value: 'Hello\nWorld' } });
      fireEvent.click(compareButton);

      const diffViewer = screen.getByTestId('diff-viewer');
      expect(diffViewer).toBeInTheDocument();
      expect(diffViewer.textContent).toContain('Hello');
      expect(diffViewer.textContent).toContain('World');
    });

    it('should handle empty modified text', () => {
      const originalInput = screen.getByPlaceholderText(/original text/i);
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.change(originalInput, { target: { value: 'Hello\nWorld' } });
      fireEvent.click(compareButton);

      const diffViewer = screen.getByTestId('diff-viewer');
      expect(diffViewer).toBeInTheDocument();
      expect(diffViewer.textContent).toContain('Hello');
      expect(diffViewer.textContent).toContain('World');
    });

    it('should handle both empty texts', () => {
      const compareButton = screen.getByRole('button', { name: /compare/i });

      fireEvent.click(compareButton);

      expect(screen.getAllByText(/no differences/i).length).toBeGreaterThan(0);
    });
  });
});
