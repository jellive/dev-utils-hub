import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HashGenerator } from '../../renderer/components/tools/HashGenerator';

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
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock hashUtils so we control the output
vi.mock('../../renderer/utils/hashUtils', () => ({
  generateHash: vi.fn(async (_text: string, algo: string) => {
    const map: Record<string, string> = {
      md5: 'abc123md5hash',
      sha256: 'def456sha256hash',
      sha512: 'ghi789sha512hash',
    };
    return map[algo] ?? 'unknown';
  }),
  generateHMAC: vi.fn(async () => 'hmac-result-value'),
}));

describe('HashGenerator – UI data binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays generated MD5 hash in the output code element', async () => {
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText(/enter text to hash/i);
    fireEvent.change(textarea, { target: { value: 'hello world' } });

    // MD5 is the default algorithm
    fireEvent.click(screen.getByRole('button', { name: /generate hash/i }));

    await waitFor(() => {
      expect(screen.getByTestId('hash-output')).toHaveTextContent('abc123md5hash');
    });
  });

  it('switches to SHA-256 and shows sha256 hash output', async () => {
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText(/enter text to hash/i);
    fireEvent.change(textarea, { target: { value: 'test input' } });

    // Click SHA-256 algorithm button
    const sha256Btn = screen.getByRole('button', { name: /sha-256/i });
    fireEvent.click(sha256Btn);

    fireEvent.click(screen.getByRole('button', { name: /generate hash/i }));

    await waitFor(() => {
      expect(screen.getByTestId('hash-output')).toHaveTextContent('def456sha256hash');
    });
  });

  it('shows "Hashes match!" when comparison hash equals generated hash', async () => {
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText(/enter text to hash/i);
    fireEvent.change(textarea, { target: { value: 'compare me' } });
    fireEvent.click(screen.getByRole('button', { name: /generate hash/i }));

    await waitFor(() => screen.getByTestId('hash-output'));

    const compareInput = screen.getByPlaceholderText(/enter hash to compare/i);
    fireEvent.change(compareInput, { target: { value: 'abc123md5hash' } });

    await waitFor(() => {
      expect(screen.getByText('Hashes match!')).toBeInTheDocument();
    });
  });

  it('shows "Hashes do not match" when comparison differs', async () => {
    render(<HashGenerator />);

    const textarea = screen.getByPlaceholderText(/enter text to hash/i);
    fireEvent.change(textarea, { target: { value: 'some text' } });
    fireEvent.click(screen.getByRole('button', { name: /generate hash/i }));

    await waitFor(() => screen.getByTestId('hash-output'));

    const compareInput = screen.getByPlaceholderText(/enter hash to compare/i);
    fireEvent.change(compareInput, { target: { value: 'completely-different-hash' } });

    await waitFor(() => {
      expect(screen.getByText('Hashes do not match')).toBeInTheDocument();
    });
  });

  it('shows error message when generating hash with empty input', async () => {
    render(<HashGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /generate hash/i }));

    await waitFor(() => {
      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();
    });
  });
});
