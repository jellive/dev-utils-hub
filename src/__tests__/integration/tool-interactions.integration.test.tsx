/**
 * Integration tests: data flow between tools and shared state/navigation.
 * These run in a jsdom environment and test component interactions end-to-end.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { JsonFormatter } from '@/renderer/components/tools/JsonFormatter';
import { Base64Converter } from '@/renderer/components/tools/Base64Converter';
import { URLConverter } from '@/renderer/components/tools/URLConverter';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

// ─── JsonFormatter ───────────────────────────────────────────────────────────

describe('JsonFormatter — integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats valid JSON and preserves round-trip fidelity', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JsonFormatter />);

    // Label is "Input JSON" (i18n key tools.json.input)
    const input = screen.getByRole('textbox', { name: /input json/i });
    const formatBtn = screen.getByRole('button', { name: /^format$/i });

    const original = { name: 'Jell', tools: ['json', 'base64'], active: true };
    await user.click(input);
    await user.paste(JSON.stringify(original));
    await user.click(formatBtn);

    // Output textarea has aria-label="Formatted Output"
    const output = screen.getByRole('textbox', { name: /formatted output/i });
    expect(JSON.parse((output as HTMLTextAreaElement).value)).toEqual(original);
  });

  it('shows validation error for malformed JSON', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JsonFormatter />);

    const input = screen.getByRole('textbox', { name: /input json/i });
    const formatBtn = screen.getByRole('button', { name: /^format$/i });

    await user.click(input);
    await user.paste('{ bad json }');
    await user.click(formatBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('compress produces single-line JSON', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JsonFormatter />);

    const input = screen.getByRole('textbox', { name: /input json/i });
    const compressBtn = screen.getByRole('button', { name: /compress/i });

    const data = { a: 1, b: [2, 3] };
    fireEvent.change(input, { target: { value: JSON.stringify(data, null, 2) } });
    await user.click(compressBtn);

    const output = screen.getByRole('textbox', { name: /formatted output/i });
    const compressed = (output as HTMLTextAreaElement).value;
    expect(compressed).not.toContain('\n');
    expect(JSON.parse(compressed)).toEqual(data);
  });

  it('clear button resets input and output', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JsonFormatter />);

    const input = screen.getByRole('textbox', { name: /input json/i });
    const formatBtn = screen.getByRole('button', { name: /^format$/i });
    const clearBtn = screen.getByRole('button', { name: /clear/i });

    fireEvent.change(input, { target: { value: '{"x":1}' } });
    await user.click(formatBtn);
    await user.click(clearBtn);

    expect((input as HTMLTextAreaElement).value).toBe('');
    expect(
      (screen.getByRole('textbox', { name: /formatted output/i }) as HTMLTextAreaElement).value
    ).toBe('');
  });
});

// ─── Base64Converter ─────────────────────────────────────────────────────────

describe('Base64Converter — integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encode → decode round-trip produces original text', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Base64Converter />);

    const original = 'Hello, World!';

    // Encode
    const encodeTab = screen.getByRole('tab', { name: /encode/i });
    await user.click(encodeTab);
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: original } });
    await user.click(screen.getByRole('button', { name: /^encode$/i }));

    const encoded = (screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value;
    expect(encoded).toBe('SGVsbG8sIFdvcmxkIQ==');

    // Decode
    const decodeTab = screen.getByRole('tab', { name: /decode/i });
    await user.click(decodeTab);
    const decodeTextareas = screen.getAllByRole('textbox');
    fireEvent.change(decodeTextareas[0], { target: { value: encoded } });
    await user.click(screen.getByRole('button', { name: /^decode$/i }));

    expect((screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value).toBe(original);
  });

  it('encode empty input shows inline error message', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Base64Converter />);

    await user.click(screen.getByRole('tab', { name: /encode/i }));
    await user.click(screen.getByRole('button', { name: /^encode$/i }));

    await waitFor(() => {
      expect(screen.getByText(/input is empty/i)).toBeInTheDocument();
    });
  });

  it('URL-safe switch produces no + / = in output', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Base64Converter />);

    await user.click(screen.getByRole('tab', { name: /encode/i }));

    const urlSafeSwitch = screen.getByRole('switch');
    await user.click(urlSafeSwitch);

    const textareas = screen.getAllByRole('textbox');
    // 'subjects?_d=1' produces + and / in standard base64
    fireEvent.change(textareas[0], { target: { value: 'subjects?_d=1' } });
    await user.click(screen.getByRole('button', { name: /^encode$/i }));

    const output = (screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value;
    expect(output).not.toMatch(/[+/=]/);
  });
});

// ─── URLConverter ─────────────────────────────────────────────────────────────

describe('URLConverter — integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encodes URL containing spaces', async () => {
    const user = userEvent.setup();
    renderWithRouter(<URLConverter />);

    await user.click(screen.getByRole('tab', { name: /encode/i }));
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'hello world' } });
    await user.click(screen.getByRole('button', { name: /^encode$/i }));

    const output = (screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value;
    expect(output).toContain('%20');
    expect(output).not.toContain(' ');
  });

  it('decodes percent-encoded string back to original', async () => {
    const user = userEvent.setup();
    renderWithRouter(<URLConverter />);

    await user.click(screen.getByRole('tab', { name: /decode/i }));
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'hello%20world' } });
    await user.click(screen.getByRole('button', { name: /^decode$/i }));

    expect((screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value).toBe('hello world');
  });

  it('encode → decode round-trip restores original string', async () => {
    const user = userEvent.setup();
    renderWithRouter(<URLConverter />);

    const original = 'https://example.com/path?q=hello world&x=1';

    await user.click(screen.getByRole('tab', { name: /encode/i }));
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: original } });
    await user.click(screen.getByRole('button', { name: /^encode$/i }));
    const encoded = (screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value;

    await user.click(screen.getByRole('tab', { name: /decode/i }));
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: encoded } });
    await user.click(screen.getByRole('button', { name: /^decode$/i }));

    expect((screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value).toBe(original);
  });
});
