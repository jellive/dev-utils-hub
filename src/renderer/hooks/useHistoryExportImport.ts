import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { HistoryEntry } from '../../preload/index.d';
import type { ExportOptions } from '../components/dialogs/ExportDialog';
import type { ImportOptions } from '../components/dialogs/ImportDialog';
import {
  convertToFormat,
  generateFileName,
  type ExportFormat,
} from '../utils/exportFormats';

/**
 * Hook options
 */
export interface UseHistoryExportImportOptions {
  /** Tool identifier (e.g., 'uuid', 'json', 'base64') */
  tool: string;
  /** Display name for the tool (e.g., 'UUID Generator') */
  toolDisplayName: string;
  /** Custom import data parser (optional) */
  parseImportData?: (content: string, format: ExportFormat) => Array<{ input: string; output?: string }>;
}

/**
 * Hook return type
 */
export interface UseHistoryExportImportReturn {
  isExporting: boolean;
  isImporting: boolean;
  showExportDialog: boolean;
  showImportDialog: boolean;
  setShowExportDialog: (show: boolean) => void;
  setShowImportDialog: (show: boolean) => void;
  handleExport: (options: ExportOptions) => Promise<void>;
  handleImport: (options: ImportOptions) => Promise<void>;
}

/**
 * Detect file format from extension
 */
function detectFormat(filePath: string): ExportFormat {
  const extension = filePath.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'txt':
      return 'txt';
    default:
      return 'txt';
  }
}

/**
 * Default import data parser
 */
function defaultParseImportData(
  content: string,
  format: ExportFormat
): Array<{ input: string; output?: string }> {
  switch (format) {
    case 'json': {
      try {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
          throw new Error('JSON must be an array');
        }
        return data.map((item: any) => ({
          input: String(item.input || ''),
          output: item.output ? String(item.output) : undefined,
        }));
      } catch (error) {
        throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
      }
    }

    case 'csv': {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return [];
      }

      // Skip header row
      const dataLines = lines.slice(1);

      return dataLines.map(line => {
        // Simple CSV parsing (assumes no escaped commas in data)
        const values = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));
        return {
          input: values[0] || '',
          output: values[1] || undefined,
        };
      });
    }

    case 'txt': {
      const lines = content.split('\n').filter(line => line.trim());
      return lines.map(line => ({
        input: line.trim(),
        output: undefined,
      }));
    }

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Custom hook for history export/import functionality
 */
export function useHistoryExportImport(
  options: UseHistoryExportImportOptions
): UseHistoryExportImportReturn {
  const { tool, parseImportData = defaultParseImportData } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  /**
   * Handle export operation
   */
  const handleExport = useCallback(async (exportOptions: ExportOptions) => {
    if (!window.api?.history) {
      toast.error('히스토리 API를 사용할 수 없습니다');
      return;
    }

    if (!window.api?.file) {
      toast.error('파일 시스템 API를 사용할 수 없습니다');
      return;
    }

    setIsExporting(true);

    try {
      // Get history entries
      const { count, format, includeMetadata } = exportOptions;

      let entries: HistoryEntry[];

      if (count === 'all') {
        entries = await window.api.history.get(tool);
      } else {
        entries = await window.api.history.get(tool, count);
      }

      if (entries.length === 0) {
        toast.error('내보낼 히스토리가 없습니다');
        return;
      }

      // Convert to specified format
      const content = convertToFormat(entries, format, includeMetadata);

      // Generate file name
      const defaultFileName = generateFileName(tool, format);

      // Save file
      const filters = [
        { name: `${format.toUpperCase()} Files`, extensions: [format] },
        { name: 'All Files', extensions: ['*'] },
      ];

      const result = await window.api.file.save(content, defaultFileName, filters);

      if (result.success) {
        toast.success(`${entries.length}개의 항목을 내보냈습니다`);
        setShowExportDialog(false);
      } else if (result.error?.code !== 'CANCELLED') {
        throw new Error(result.error?.message || '파일 저장 실패');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`내보내기 실패: ${(error as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  }, [tool]);

  /**
   * Handle import operation
   */
  const handleImport = useCallback(async (importOptions: ImportOptions) => {
    if (!window.api?.history) {
      toast.error('히스토리 API를 사용할 수 없습니다');
      return;
    }

    if (!window.api?.file) {
      toast.error('파일 시스템 API를 사용할 수 없습니다');
      return;
    }

    setIsImporting(true);

    try {
      const { skipDuplicates, replaceExisting } = importOptions;

      // Open file
      const filters = [
        { name: 'Supported Files', extensions: ['json', 'csv', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ];

      const result = await window.api.file.open(filters);

      if (!result.success || !result.content || !result.filePath) {
        if (result.error?.code !== 'CANCELLED') {
          throw new Error(result.error?.message || '파일 열기 실패');
        }
        return;
      }

      // Detect format from file extension
      const format = detectFormat(result.filePath);

      // Parse import data
      const parsedData = parseImportData(result.content, format);

      if (parsedData.length === 0) {
        toast.error('가져올 데이터가 없습니다');
        return;
      }

      // Replace existing data if requested
      if (replaceExisting) {
        await window.api.history.clear(tool);
      }

      // Get existing entries for duplicate check
      let existingInputs = new Set<string>();
      if (skipDuplicates) {
        const existing = await window.api.history.get(tool);
        existingInputs = new Set(existing.map(e => e.input));
      }

      // Save data
      let savedCount = 0;
      let skippedCount = 0;

      for (const item of parsedData) {
        if (skipDuplicates && existingInputs.has(item.input)) {
          skippedCount++;
          continue;
        }

        await window.api.history.save(tool, item.input, item.output);
        savedCount++;
      }

      // Show success message
      const message = skipDuplicates && skippedCount > 0
        ? `${savedCount}개 항목을 가져왔습니다 (${skippedCount}개 건너뜀)`
        : `${savedCount}개 항목을 가져왔습니다`;

      toast.success(message);
      setShowImportDialog(false);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`가져오기 실패: ${(error as Error).message}`);
    } finally {
      setIsImporting(false);
    }
  }, [tool, parseImportData]);

  return {
    isExporting,
    isImporting,
    showExportDialog,
    showImportDialog,
    setShowExportDialog,
    setShowImportDialog,
    handleExport,
    handleImport,
  };
}
