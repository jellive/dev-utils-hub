import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutDialog } from '../AboutDialog';

beforeEach(() => {
  // @ts-ignore
  delete window.api;
});

describe('AboutDialog', () => {
  it('renders nothing when closed', () => {
    render(<AboutDialog open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText(/dev utils hub/i)).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(<AboutDialog open={true} onOpenChange={vi.fn()} />);
    // Should render some content — the dialog title
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders app name when open', () => {
    render(<AboutDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText('Dev Utils Hub')).toBeInTheDocument();
  });

  it('renders N/A for platform info when window.api is unavailable', async () => {
    render(<AboutDialog open={true} onOpenChange={vi.fn()} />);
    // Without window.api, platform info defaults to N/A
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('fetches platform info when window.api.getPlatformInfo is available', async () => {
    // @ts-ignore
    window.api = {
      getPlatformInfo: vi.fn().mockResolvedValue({
        versions: { electron: '25.0.0', chrome: '114.0', node: '18.0.0' },
      }),
    };
    render(<AboutDialog open={true} onOpenChange={vi.fn()} />);
    // @ts-ignore
    expect(window.api.getPlatformInfo).toHaveBeenCalled();
  });
});
