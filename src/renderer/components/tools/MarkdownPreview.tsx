import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const INITIAL_MARKDOWN = `# Hello World

## Markdown Preview

This is a **bold** text and this is *italic* text.

### Lists

- Item 1
- Item 2
  - Nested item
- Item 3

### Ordered List

1. First
2. Second
3. Third

### Code

Inline \`code\` and a code block:

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

### Blockquote

> This is a blockquote.

### Link

[Visit Example](https://example.com)

### Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

### Horizontal Rule

---

Done!
`;

const SNIPPETS = [
  { label: '# H1', insert: '# Heading 1\n' },
  { label: '## H2', insert: '## Heading 2\n' },
  { label: '**Bold**', insert: '**bold text**' },
  { label: '*Italic*', insert: '*italic text*' },
  { label: '`Code`', insert: '`code`' },
  { label: '```Block```', insert: '```\ncode block\n```\n' },
  { label: '- List', insert: '- Item 1\n- Item 2\n- Item 3\n' },
  { label: '1. Ordered', insert: '1. First\n2. Second\n3. Third\n' },
  { label: '> Quote', insert: '> blockquote\n' },
  { label: '[Link]()', insert: '[link text](https://example.com)' },
  { label: '| Table |', insert: '| Col 1 | Col 2 |\n|-------|-------|\n| A     | B     |\n' },
  { label: '---', insert: '\n---\n' },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm font-mono">$1</code>'
    )
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const trimmed = url.trim();
      const isSafe = /^(https?|mailto|ftp):/i.test(trimmed);
      const safeUrl = isSafe ? trimmed : '#';
      return `<a href="${safeUrl}" class="text-blue-600 dark:text-blue-400 underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
}

/**
 * Converts user-typed Markdown to safe HTML.
 * All user input is HTML-escaped via escapeHtml() before any markup is applied,
 * so dangerouslySetInnerHTML is safe here — the HTML is generated from the
 * sanitized result of this function, not from untrusted external sources.
 */
function parseMarkdown(md: string): string {
  const lines = md.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = escapeHtml(line.slice(3).trim());
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      result.push(
        `<pre class="bg-gray-100 dark:bg-gray-900 rounded p-3 overflow-x-auto my-2">` +
          `<code${lang ? ` class="language-${lang}"` : ''}>${codeLines.join('\n')}</code></pre>`
      );
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = inlineFormat(headingMatch[2]);
      const sizes: Record<number, string> = {
        1: 'text-3xl font-bold mt-4 mb-2',
        2: 'text-2xl font-bold mt-4 mb-2',
        3: 'text-xl font-semibold mt-3 mb-1',
        4: 'text-lg font-semibold mt-3 mb-1',
        5: 'text-base font-semibold mt-2 mb-1',
        6: 'text-sm font-semibold mt-2 mb-1',
      };
      result.push(`<h${level} class="${sizes[level] || ''}">${text}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      result.push('<hr class="my-4 border-gray-300 dark:border-gray-600" />');
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(inlineFormat(lines[i].slice(2)));
        i++;
      }
      result.push(
        `<blockquote class="border-l-4 border-gray-400 dark:border-gray-500 pl-4 my-2 text-gray-600 dark:text-gray-400 italic">` +
          quoteLines.join('<br/>') +
          `</blockquote>`
      );
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\|[\s|:-]+\|/.test(lines[i + 1])) {
      const headers = line
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map(h => h.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i]
          .split('|')
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map(c => c.trim());
        rows.push(cells);
        i++;
      }
      const headerHtml = headers
        .map(
          h =>
            `<th class="px-3 py-2 text-left border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-semibold">${inlineFormat(h)}</th>`
        )
        .join('');
      const rowsHtml = rows
        .map(
          row =>
            `<tr>${row.map(c => `<td class="px-3 py-2 border border-gray-300 dark:border-gray-600">${inlineFormat(c)}</td>`).join('')}</tr>`
        )
        .join('');
      result.push(
        `<div class="overflow-x-auto my-2"><table class="w-full border-collapse text-sm">` +
          `<thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`
      );
      continue;
    }

    // Unordered list
    if (/^(\s*)-\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(\s*)-\s/.test(lines[i])) {
        const indent = lines[i].match(/^(\s*)/)?.[1].length ?? 0;
        const text = inlineFormat(lines[i].replace(/^\s*-\s/, ''));
        items.push(`<li style="margin-left:${indent * 8}px" class="my-0.5">${text}</li>`);
        i++;
      }
      result.push(`<ul class="list-disc list-inside my-2 space-y-0.5">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = inlineFormat(lines[i].replace(/^\d+\.\s/, ''));
        items.push(`<li class="my-0.5">${text}</li>`);
        i++;
      }
      result.push(`<ol class="list-decimal list-inside my-2 space-y-0.5">${items.join('')}</ol>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      result.push('<div class="my-1"></div>');
      i++;
      continue;
    }

    // Paragraph
    result.push(`<p class="my-1">${inlineFormat(line)}</p>`);
    i++;
  }

  return result.join('\n');
}

export function MarkdownPreview() {
  const { t } = useTranslation();
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const previewRef = useRef<HTMLDivElement>(null);

  // All HTML is generated from escapeHtml-sanitized input (see parseMarkdown JSDoc)
  const rendered = parseMarkdown(markdown);

  const insertSnippet = useCallback((snippet: string) => {
    setMarkdown(prev => prev + snippet);
  }, []);

  const copyHtml = () => {
    navigator.clipboard.writeText(rendered);
    toast.success(t('tools.markdownPreview.htmlCopied'));
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    toast.success(t('common.copied'));
  };

  const handleClear = () => {
    setMarkdown('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('tools.markdownPreview.title')}
      </h2>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {SNIPPETS.map(s => (
          <button
            key={s.label}
            onClick={() => insertSnippet(s.insert)}
            className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title={`Insert: ${s.insert}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Editor + Preview */}
      <div className="grid grid-cols-2 gap-4">
        {/* Editor */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('tools.markdownPreview.editor')}</Label>
            <div className="flex gap-2">
              <button
                onClick={copyMarkdown}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                {t('common.copy')}
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                {t('common.clear')}
              </button>
            </div>
          </div>
          <Textarea
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            placeholder={t('tools.markdownPreview.placeholder')}
            className="font-mono text-sm resize-none min-h-[420px]"
            data-testid="markdown-editor"
          />
          <div className="text-xs text-muted-foreground text-right">
            {markdown.length} {t('tools.markdownPreview.characters')} ·{' '}
            {markdown.split('\n').length} {t('tools.markdownPreview.lines')}
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('tools.markdownPreview.preview')}</Label>
            <button
              onClick={copyHtml}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              {t('tools.markdownPreview.copyHtml')}
            </button>
          </div>
          {/* Safe: all content is HTML-escaped by parseMarkdown before rendering */}
          <div
            ref={previewRef}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-auto min-h-[420px] text-gray-900 dark:text-gray-100"
            data-testid="markdown-preview"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </div>
      </div>
    </div>
  );
}
