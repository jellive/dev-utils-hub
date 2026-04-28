import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { diagnose, KoreanDpiTester, type ProbeRow } from '../KoreanDpiTester';

const mockedInvoke = vi.mocked(invoke);

function row(client: ProbeRow['client'], opts: Partial<ProbeRow> = {}): ProbeRow {
  const labels = {
    browser: 'Browser fetch (Chromium)',
    native: 'Native (Rust + rustls)',
    curl: 'curl (system)',
  };
  return {
    client,
    label: labels[client],
    status: opts.status ?? 200,
    total_ms: opts.total_ms ?? 100,
    error: opts.error ?? null,
    error_kind: opts.error_kind ?? null,
  };
}

describe('diagnose', () => {
  it('returns ok when all clients succeed', () => {
    const result = diagnose([row('browser'), row('native'), row('curl')]);
    expect(result.kind).toBe('ok');
  });

  it('returns unreachable when all clients fail', () => {
    const result = diagnose([
      row('browser', { error: 'fail', status: null, error_kind: 'fetch' }),
      row('native', { error: 'fail', status: null, error_kind: 'connect' }),
      row('curl', { error: 'fail', status: null, error_kind: 'curl_failure' }),
    ]);
    expect(result.kind).toBe('unreachable');
  });

  it('flags DPI when browser succeeds but native fails', () => {
    const result = diagnose([
      row('browser'),
      row('native', { error: 'TLS handshake', status: null, error_kind: 'connect' }),
      row('curl'),
    ]);
    expect(result.kind).toBe('dpi');
    expect(result.message.toLowerCase()).toContain('dpi');
  });

  it('returns partial when some clients fail without DPI signature', () => {
    // Browser fails (not DPI signature), native succeeds
    const result = diagnose([
      row('browser', { error: 'CORS', status: null, error_kind: 'fetch' }),
      row('native'),
      row('curl'),
    ]);
    expect(result.kind).toBe('partial');
  });
});

describe('KoreanDpiTester component', () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
    render(
      <MemoryRouter>
        <KoreanDpiTester />
      </MemoryRouter>
    );
  });

  it('renders the heading and probe button', () => {
    expect(screen.getByText('Korean DPI Tester')).toBeInTheDocument();
    expect(screen.getByTestId('dpi-probe-button')).toBeInTheDocument();
  });

  it('runs probes and renders results when probe clicked', async () => {
    mockedInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'probe_native') {
        return { status: 200, total_ms: 80, error: null, error_kind: null };
      }
      if (cmd === 'probe_curl') {
        return { status: 200, total_ms: 50, error: null, error_kind: null };
      }
      throw new Error(`unexpected command ${cmd}`);
    });

    // Mock browser fetch
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 } as unknown as Response));

    const user = userEvent.setup();
    const button = screen.getByTestId('dpi-probe-button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('dpi-results-table')).toBeInTheDocument();
      expect(screen.getByTestId('dpi-row-browser')).toBeInTheDocument();
      expect(screen.getByTestId('dpi-row-native')).toBeInTheDocument();
      expect(screen.getByTestId('dpi-row-curl')).toBeInTheDocument();
    });

    expect(screen.getByTestId('dpi-diagnosis').textContent?.toLowerCase()).toContain(
      'no dpi block detected'
    );

    vi.unstubAllGlobals();
  });

  it('flags DPI suspicion when native fails but browser succeeds', async () => {
    mockedInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'probe_native') {
        return {
          status: null,
          total_ms: 9500,
          error: 'TLS handshake timeout',
          error_kind: 'connect',
        };
      }
      if (cmd === 'probe_curl') {
        return { status: 200, total_ms: 50, error: null, error_kind: null };
      }
      throw new Error(`unexpected command ${cmd}`);
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 } as unknown as Response));

    const user = userEvent.setup();
    const button = screen.getByTestId('dpi-probe-button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('dpi-diagnosis')).toBeInTheDocument();
    });

    const diagnosis = screen.getByTestId('dpi-diagnosis');
    expect(diagnosis.textContent?.toLowerCase()).toContain('dpi');

    vi.unstubAllGlobals();
  });

  it('disables probe button when URL is empty', async () => {
    const input = screen.getByTestId('dpi-url') as HTMLInputElement;
    const user = userEvent.setup();
    await user.clear(input);
    const button = screen.getByTestId('dpi-probe-button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
