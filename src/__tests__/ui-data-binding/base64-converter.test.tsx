import { render, screen, fireEvent, act as _act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Base64Converter } from '../../renderer/components/tools/Base64Converter';

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
vi.mock('@/utils/sentryContext', () => ({
  setCurrentFeature: vi.fn(),
  addInteractionBreadcrumb: vi.fn(),
  addConversionBreadcrumb: vi.fn(),
  addErrorBreadcrumb: vi.fn(),
  FEATURES: { DATA_CONVERSION: 'data-conversion' },
  INTERACTION_TYPES: { CLICK: 'click', COPY: 'copy' },
  TOOLS: { BASE64_CONVERTER: 'base64-converter' },
}));

Object.defineProperty(window, 'api', { value: undefined, writable: true });

describe('Base64Converter – UI data binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encodes plain text to Base64 and shows result in output', () => {
    render(<Base64Converter />);

    const textarea = screen.getByLabelText(/input text/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: /encode/i }));

    const output = screen.getByLabelText(/^output$/i) as HTMLTextAreaElement;
    expect(output.value).toBe('aGVsbG8=');
  });

  it('decodes Base64 back to original text and shows in output', async () => {
    const user = userEvent.setup();
    const { container } = render(<Base64Converter />);

    // Switch to decode tab using userEvent for full pointer event sequence
    await user.click(screen.getByRole('tab', { name: /decode/i }));

    // After tab switch, #decode-input is mounted in the DOM
    const textarea = container.querySelector('#decode-input') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    fireEvent.change(textarea, { target: { value: 'aGVsbG8=' } });
    const decodeBtn = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Decode' && btn.getAttribute('role') !== 'tab'
    )!;
    fireEvent.click(decodeBtn);

    const output = screen.getByLabelText(/^output$/i) as HTMLTextAreaElement;
    expect(output.value).toBe('hello');
  });

  it('encodes "Base64 Test" correctly to expected Base64 string', () => {
    render(<Base64Converter />);

    const textarea = screen.getByLabelText(/input text/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Base64 Test' } });
    fireEvent.click(screen.getByRole('button', { name: /encode/i }));

    const output = screen.getByLabelText(/^output$/i) as HTMLTextAreaElement;
    expect(output.value).toBe('QmFzZTY0IFRlc3Q=');
  });

  it('shows error message when encoding empty input', () => {
    render(<Base64Converter />);
    fireEvent.click(screen.getByRole('button', { name: /encode/i }));

    expect(screen.getByText(/input is empty/i)).toBeInTheDocument();
  });

  it('shows error when decoding invalid Base64 input', async () => {
    const user = userEvent.setup();
    const { container } = render(<Base64Converter />);

    await user.click(screen.getByRole('tab', { name: /decode/i }));

    const textarea = container.querySelector('#decode-input') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    fireEvent.change(textarea, { target: { value: '!!!not-base64!!!' } });
    const decodeBtn = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Decode' && btn.getAttribute('role') !== 'tab'
    )!;
    fireEvent.click(decodeBtn);

    expect(screen.getByText(/invalid base64 format/i)).toBeInTheDocument();
  });

  it('output shows character count after encoding', () => {
    render(<Base64Converter />);

    const textarea = screen.getByLabelText(/input text/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: /encode/i }));

    // btoa('hi') = 'aGk=' — 4 chars
    expect(screen.getByText(/4 characters/i)).toBeInTheDocument();
  });
});
