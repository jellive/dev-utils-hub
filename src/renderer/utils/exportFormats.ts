import type { HistoryEntry } from '../../preload/index.d';

/**
 * Export format types
 */
export type ExportFormat = 'txt' | 'json' | 'csv';

/**
 * Escape CSV field according to RFC 4180
 * - Escape double quotes by doubling them
 * - Replace newlines with spaces
 * - Wrap field in double quotes
 */
function escapeCSV(value: string | undefined): string {
  if (value === undefined || value === null) {
    return '""';
  }

  const stringValue = String(value);

  // Replace newlines with spaces
  const noNewlines = stringValue.replace(/\r?\n/g, ' ');

  // Escape double quotes by doubling them
  const escaped = noNewlines.replace(/"/g, '""');

  // Wrap in double quotes
  return `"${escaped}"`;
}

/**
 * Format timestamp to Korean locale string
 */
function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Convert history entries to plain text format
 */
export function convertToText(
  entries: HistoryEntry[],
  includeMetadata: boolean = false
): string {
  if (entries.length === 0) {
    return '';
  }

  if (!includeMetadata) {
    // Simple format: just input values separated by newlines
    return entries.map(entry => entry.input).join('\n');
  }

  // Format with metadata: "⭐ [input] (date)"
  return entries.map(entry => {
    const favorite = entry.favorite === 1 ? '⭐ ' : '';
    const date = formatDate(entry.created_at);
    return `${favorite}${entry.input}${date ? ` (${date})` : ''}`;
  }).join('\n');
}

/**
 * Convert history entries to JSON format (RFC 8259)
 */
export function convertToJSON(
  entries: HistoryEntry[],
  includeMetadata: boolean = false
): string {
  if (entries.length === 0) {
    return '[]';
  }

  if (!includeMetadata) {
    // Simple format: only input and output
    const simplified = entries.map(entry => ({
      input: entry.input,
      output: entry.output || '',
    }));
    return JSON.stringify(simplified, null, 2);
  }

  // Full format: all HistoryEntry fields
  return JSON.stringify(entries, null, 2);
}

/**
 * Convert history entries to CSV format (RFC 4180)
 */
export function convertToCSV(
  entries: HistoryEntry[],
  includeMetadata: boolean = false
): string {
  if (entries.length === 0) {
    return '';
  }

  if (!includeMetadata) {
    // Simple format: Input,Output
    const header = 'Input,Output\n';
    const rows = entries.map(entry => {
      const input = escapeCSV(entry.input);
      const output = escapeCSV(entry.output);
      return `${input},${output}`;
    }).join('\n');

    return header + rows;
  }

  // Full format: ID,Tool,Input,Output,Favorite,Created At
  const header = 'ID,Tool,Input,Output,Favorite,Created At\n';
  const rows = entries.map(entry => {
    const id = escapeCSV(String(entry.id || ''));
    const tool = escapeCSV(entry.tool);
    const input = escapeCSV(entry.input);
    const output = escapeCSV(entry.output);
    const favorite = escapeCSV(entry.favorite === 1 ? 'Yes' : 'No');
    const createdAt = escapeCSV(formatDate(entry.created_at));

    return `${id},${tool},${input},${output},${favorite},${createdAt}`;
  }).join('\n');

  return header + rows;
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    txt: 'txt',
    json: 'json',
    csv: 'csv',
  };

  return extensions[format];
}

/**
 * Generate default file name for export
 * Format: toolName-export-YYYY-MM-DD.extension
 */
export function generateFileName(toolName: string, format: ExportFormat): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const dateStr = `${year}-${month}-${day}`;
  const extension = getFileExtension(format);

  return `${toolName}-export-${dateStr}.${extension}`;
}

/**
 * Convert history entries to specified format
 */
export function convertToFormat(
  entries: HistoryEntry[],
  format: ExportFormat,
  includeMetadata: boolean = false
): string {
  switch (format) {
    case 'txt':
      return convertToText(entries, includeMetadata);
    case 'json':
      return convertToJSON(entries, includeMetadata);
    case 'csv':
      return convertToCSV(entries, includeMetadata);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
