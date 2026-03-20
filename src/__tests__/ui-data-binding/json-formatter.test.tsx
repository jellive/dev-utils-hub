import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JsonFormatter } from '../../renderer/components/tools/JsonFormatter';

// Mock hooks that touch Electron IPC
vi.mock('../../renderer/hooks/useHistoryAutoSave', () => ({
  useHistoryAutoSave: () => vi.fn(),
}));
vi.mock('../../renderer/hooks/useHistoryExportImport', () => ({
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
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ state: null }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('JsonFormatter – UI data binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats valid JSON and shows formatted output in the output textarea', () => {
    render(<JsonFormatter />);

    const input = screen.getByLabelText(/input json/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '{"name":"Alice","age":30}' } });

    const formatBtn = screen.getByRole('button', { name: /format/i });
    fireEvent.click(formatBtn);

    const output = screen.getByLabelText(/Formatted Output/i) as HTMLTextAreaElement;
    expect(output.value).toContain('"name": "Alice"');
    expect(output.value).toContain('"age": 30');
  });

  it('shows Valid badge after successfully formatting JSON', () => {
    render(<JsonFormatter />);

    const input = screen.getByLabelText(/input json/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '{"key":"value"}' } });
    fireEvent.click(screen.getByRole('button', { name: /format/i }));

    expect(screen.getByText('Valid')).toBeInTheDocument();
  });

  it('shows Invalid badge and error message for malformed JSON', () => {
    render(<JsonFormatter />);

    const input = screen.getByLabelText(/input json/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '{bad json' } });
    fireEvent.click(screen.getByRole('button', { name: /format/i }));

    expect(screen.getByText('Invalid')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('compress button minifies JSON into single line in output', () => {
    render(<JsonFormatter />);

    const input = screen.getByLabelText(/input json/i) as HTMLTextAreaElement;
    fireEvent.change(input, {
      target: { value: '{"a":1,"b":2}' },
    });
    fireEvent.click(screen.getByRole('button', { name: /compress/i }));

    const output = screen.getByLabelText(/Formatted Output/i) as HTMLTextAreaElement;
    expect(output.value).toBe('{"a":1,"b":2}');
  });

  it('clear button resets both input and output to empty', () => {
    render(<JsonFormatter />);

    const input = screen.getByLabelText(/input json/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '{"x":1}' } });
    fireEvent.click(screen.getByRole('button', { name: /format/i }));
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(input.value).toBe('');
    const output = screen.getByLabelText(/Formatted Output/i) as HTMLTextAreaElement;
    expect(output.value).toBe('');
  });
});
