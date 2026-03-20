import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimestampConverter } from '../TimestampConverter';

// Mock hooks that depend on window.api
vi.mock('../../hooks/useHistoryAutoSave', () => ({
  useHistoryAutoSave: () => vi.fn(),
}));

vi.mock('../../hooks/useHistoryExportImport', () => ({
  useHistoryExportImport: () => ({
    isExporting: false,
    isImporting: false,
    showExportDialog: false,
    showImportDialog: false,
    setShowExportDialog: vi.fn(),
    setShowImportDialog: vi.fn(),
    handleExport: vi.fn(),
    handleImport: vi.fn(),
  }),
}));

// Mock dialogs
vi.mock('../../dialogs/ExportDialog', () => ({
  ExportDialog: () => null,
}));

vi.mock('../../dialogs/ImportDialog', () => ({
  ImportDialog: () => null,
}));

beforeEach(() => {
  // @ts-ignore
  window.api = {
    history: {
      count: vi.fn().mockResolvedValue(0),
      save: vi.fn().mockResolvedValue(1),
    },
  };
});

describe('TimestampConverter', () => {
  describe('Initial State', () => {
    it('renders the title', () => {
      render(<TimestampConverter />);
      expect(screen.getByText('Timestamp Converter')).toBeInTheDocument();
    });

    it('renders timestamp-to-date tab', () => {
      render(<TimestampConverter />);
      expect(screen.getByText('Timestamp to Date')).toBeInTheDocument();
    });

    it('renders date-to-timestamp tab', () => {
      render(<TimestampConverter />);
      expect(screen.getByText('Date to Timestamp')).toBeInTheDocument();
    });

    it('renders Now button', () => {
      render(<TimestampConverter />);
      expect(screen.getByRole('button', { name: /now/i })).toBeInTheDocument();
    });

    it('renders unit selector with milliseconds default', () => {
      render(<TimestampConverter />);
      expect(screen.getByText('Milliseconds')).toBeInTheDocument();
    });

    it('shows current time information', () => {
      render(<TimestampConverter />);
      expect(screen.getByText(/current time/i)).toBeInTheDocument();
    });
  });

  describe('Timestamp Input', () => {
    it('shows date formats when a valid millisecond timestamp is entered', () => {
      render(<TimestampConverter />);
      // Use a known timestamp: 2024-01-01T00:00:00Z = 1704067200000ms
      const input = screen.getByPlaceholderText(/enter timestamp/i);
      fireEvent.change(input, { target: { value: '1704067200000' } });
      // ISO 8601 card should appear
      expect(screen.getByText('ISO 8601')).toBeInTheDocument();
    });

    it('shows relative time when timestamp entered', () => {
      render(<TimestampConverter />);
      const input = screen.getByPlaceholderText(/enter timestamp/i);
      fireEvent.change(input, { target: { value: '1704067200000' } });
      expect(screen.getByText('Relative Time')).toBeInTheDocument();
    });

    it('shows date components (Year, Month, Day) when timestamp entered', () => {
      render(<TimestampConverter />);
      const input = screen.getByPlaceholderText(/enter timestamp/i);
      fireEvent.change(input, { target: { value: '1704067200000' } });
      expect(screen.getByText('Year')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
    });

    it('does not show date formats for empty input', () => {
      render(<TimestampConverter />);
      expect(screen.queryByText('ISO 8601')).not.toBeInTheDocument();
    });
  });

  describe('Now button', () => {
    it('populates timestamp field with current time', () => {
      render(<TimestampConverter />);
      const nowBtn = screen.getByRole('button', { name: /now/i });
      fireEvent.click(nowBtn);
      const input = screen.getByPlaceholderText(/enter timestamp/i) as HTMLInputElement;
      expect(input.value).not.toBe('');
      expect(Number(input.value)).toBeGreaterThan(0);
    });
  });

  describe('Date to Timestamp tab', () => {
    it('renders the date to timestamp tab trigger', () => {
      render(<TimestampConverter />);
      // Tab trigger is always present in the DOM
      const tab = screen.getByRole('tab', { name: /date to timestamp/i });
      expect(tab).toBeInTheDocument();
    });

    it('renders the timestamp to date tab trigger', () => {
      render(<TimestampConverter />);
      const tab = screen.getByRole('tab', { name: /timestamp to date/i });
      expect(tab).toBeInTheDocument();
    });
  });
});
