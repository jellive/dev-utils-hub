import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownPreview } from '../MarkdownPreview';

describe('MarkdownPreview', () => {
  beforeEach(() => {
    render(<MarkdownPreview />);
  });

  describe('Initial State', () => {
    it('should render the title', () => {
      const headings = screen.getAllByText('Markdown Preview');
      expect(headings.length).toBeGreaterThanOrEqual(1);
      // The page title h2 has the bold font class
      const titleHeading = headings.find(el => el.className.includes('font-bold') && el.tagName === 'H2');
      expect(titleHeading).toBeInTheDocument();
    });

    it('should render markdown editor textarea', () => {
      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });

    it('should render preview pane', () => {
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('should render Editor label', () => {
      expect(screen.getByText('Markdown Editor')).toBeInTheDocument();
    });

    it('should render Preview label', () => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should pre-fill with initial markdown content', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      expect(editor.value).toContain('Hello World');
    });
  });

  describe('Snippet Toolbar', () => {
    it('should render snippet toolbar buttons', () => {
      expect(screen.getByRole('button', { name: /# H1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\*\*Bold\*\*/i })).toBeInTheDocument();
    });

    it('should insert snippet into editor when toolbar button clicked', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      const initialLength = editor.value.length;
      const boldButton = screen.getByRole('button', { name: /\*\*Bold\*\*/i });
      fireEvent.click(boldButton);
      expect(editor.value.length).toBeGreaterThan(initialLength);
    });
  });

  describe('Live Preview', () => {
    it('should render heading in preview', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: '# My Heading' } });
      const preview = screen.getByTestId('markdown-preview');
      expect(preview.innerHTML).toContain('<h1');
      expect(preview.innerHTML).toContain('My Heading');
    });

    it('should render bold text in preview', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: '**bold**' } });
      const preview = screen.getByTestId('markdown-preview');
      expect(preview.innerHTML).toContain('<strong>bold</strong>');
    });

    it('should render italic text in preview', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: '*italic*' } });
      const preview = screen.getByTestId('markdown-preview');
      expect(preview.innerHTML).toContain('<em>italic</em>');
    });

    it('should render unordered list in preview', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: '- Item 1\n- Item 2' } });
      const preview = screen.getByTestId('markdown-preview');
      expect(preview.innerHTML).toContain('<ul');
      expect(preview.innerHTML).toContain('Item 1');
    });

    it('should render ordered list in preview', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: '1. First\n2. Second' } });
      const preview = screen.getByTestId('markdown-preview');
      expect(preview.innerHTML).toContain('<ol');
      expect(preview.innerHTML).toContain('First');
    });

    it('should render blockquote in preview', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: '> quote text' } });
      const preview = screen.getByTestId('markdown-preview');
      expect(preview.innerHTML).toContain('<blockquote');
    });

    it('should escape HTML in user input', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: '<script>alert("xss")</script>' } });
      const preview = screen.getByTestId('markdown-preview');
      expect(preview.innerHTML).not.toContain('<script>');
      expect(preview.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('Clear Functionality', () => {
    it('should clear the editor when Clear button clicked', () => {
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      expect(editor.value).toBe('');
    });
  });

  describe('Copy Functionality', () => {
    it('should copy HTML when Copy HTML button clicked', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      const copyHtmlButton = screen.getByRole('button', { name: /copy html/i });
      fireEvent.click(copyHtmlButton);

      expect(mockWriteText).toHaveBeenCalled();
      const calledWith = mockWriteText.mock.calls[0][0] as string;
      expect(typeof calledWith).toBe('string');
      expect(calledWith.length).toBeGreaterThan(0);
    });
  });

  describe('Character/Line Count', () => {
    it('should show character count', () => {
      const editor = screen.getByTestId('markdown-editor') as HTMLTextAreaElement;
      fireEvent.change(editor, { target: { value: 'hello' } });
      expect(screen.getByText(/5 characters/i)).toBeInTheDocument();
    });
  });
});
