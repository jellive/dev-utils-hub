import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OfflineIndicator } from '../OfflineIndicator';
import { useNetworkStore } from '../../store/useNetworkStore';

beforeEach(() => {
  // Reset to online state before each test
  act(() => {
    useNetworkStore.getState().setOnline(true);
  });
});

describe('OfflineIndicator', () => {
  it('renders nothing when online', () => {
    useNetworkStore.getState().setOnline(true);
    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders offline banner when offline', () => {
    act(() => {
      useNetworkStore.getState().setOnline(false);
    });
    render(<OfflineIndicator />);
    expect(screen.getByText('You are currently offline')).toBeInTheDocument();
  });

  it('shows offline description text when offline', () => {
    act(() => {
      useNetworkStore.getState().setOnline(false);
    });
    render(<OfflineIndicator />);
    // offline.description key — "Some features may be limited"
    expect(screen.getByText(/some features may be limited/i)).toBeInTheDocument();
  });

  it('renders the wifi-off SVG icon when offline', () => {
    act(() => {
      useNetworkStore.getState().setOnline(false);
    });
    const { container } = render(<OfflineIndicator />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('updates when network state transitions from online to offline', () => {
    const { rerender } = render(<OfflineIndicator />);
    // Initially online — no banner
    expect(screen.queryByText('You are currently offline')).not.toBeInTheDocument();

    act(() => {
      useNetworkStore.getState().setOnline(false);
    });
    rerender(<OfflineIndicator />);
    expect(screen.getByText('You are currently offline')).toBeInTheDocument();
  });
});
