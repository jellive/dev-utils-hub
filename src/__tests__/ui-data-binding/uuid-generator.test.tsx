import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UUIDGenerator } from '../../renderer/components/tools/UUIDGenerator';

const MOCK_UUID = '550e8400-e29b-41d4-a716-446655440000';

// Mock crypto.randomUUID to return a deterministic value
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => MOCK_UUID),
});

vi.mock('../../renderer/hooks/useClipboard', () => ({
  useClipboard: () => ({ copy: vi.fn() }),
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
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// window.api is Electron IPC – not available in test env
Object.defineProperty(window, 'api', { value: undefined, writable: true });

describe('UUIDGenerator – UI data binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the generated UUID in the input field after clicking Generate', async () => {
    render(<UUIDGenerator />);

    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      const uuidInput = screen.getByTestId('current-uuid') as HTMLInputElement;
      expect(uuidInput.value).toBe(MOCK_UUID);
    });
  });

  it('UUID format matches RFC 4122 pattern (8-4-4-4-12)', async () => {
    render(<UUIDGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      const uuidInput = screen.getByTestId('current-uuid') as HTMLInputElement;
      expect(uuidInput.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  it('shows version badge "v4 (Random)" after generating', async () => {
    render(<UUIDGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('v4 (Random)')).toBeInTheDocument();
    });
  });

  it('shows RFC 4122 variant badge after generating', async () => {
    render(<UUIDGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('RFC 4122')).toBeInTheDocument();
    });
  });

  it('UUID displayed is exactly 36 characters long', async () => {
    render(<UUIDGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      const uuidInput = screen.getByTestId('current-uuid') as HTMLInputElement;
      expect(uuidInput.value).toHaveLength(36);
    });
  });
});
