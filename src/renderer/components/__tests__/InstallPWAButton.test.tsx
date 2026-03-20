import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstallPWAButton } from '../InstallPWAButton';

// Mock usePWAInstall hook
vi.mock('../../hooks/usePWAInstall', () => ({
  usePWAInstall: vi.fn(),
}));

import { usePWAInstall } from '../../hooks/usePWAInstall';
const mockUsePWAInstall = vi.mocked(usePWAInstall);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('InstallPWAButton', () => {
  it('renders nothing when canInstall is false', () => {
    mockUsePWAInstall.mockReturnValue({
      canInstall: false,
      isInstalled: false,
      installPWA: vi.fn(),
    });
    const { container } = render(<InstallPWAButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the install button when canInstall is true', () => {
    mockUsePWAInstall.mockReturnValue({
      canInstall: true,
      isInstalled: false,
      installPWA: vi.fn(),
    });
    render(<InstallPWAButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls installPWA when button is clicked', () => {
    const installPWA = vi.fn();
    mockUsePWAInstall.mockReturnValue({
      canInstall: true,
      isInstalled: false,
      installPWA,
    });
    render(<InstallPWAButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(installPWA).toHaveBeenCalledTimes(1);
  });

  it('renders the SVG download icon', () => {
    mockUsePWAInstall.mockReturnValue({
      canInstall: true,
      isInstalled: false,
      installPWA: vi.fn(),
    });
    render(<InstallPWAButton />);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });
});
