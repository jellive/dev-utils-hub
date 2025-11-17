import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthTab } from '../AuthTab';

describe('AuthTab', () => {
  it('should render tabs for authentication modes', () => {
    render(<AuthTab onAuthChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /bearer token/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /basic auth/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /api key/i })).toBeInTheDocument();
  });

  it('should default to Bearer Token tab', () => {
    render(<AuthTab onAuthChange={vi.fn()} />);

    const bearerTab = screen.getByRole('tab', { name: /bearer token/i });
    expect(bearerTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should switch to Basic Auth tab when clicked', async () => {
    const user = userEvent.setup();
    render(<AuthTab onAuthChange={vi.fn()} />);

    const basicAuthTab = screen.getByRole('tab', { name: /basic auth/i });
    await user.click(basicAuthTab);

    expect(basicAuthTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should switch to API Key tab when clicked', async () => {
    const user = userEvent.setup();
    render(<AuthTab onAuthChange={vi.fn()} />);

    const apiKeyTab = screen.getByRole('tab', { name: /api key/i });
    await user.click(apiKeyTab);

    expect(apiKeyTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should render Bearer Token panel content by default', () => {
    render(<AuthTab onAuthChange={vi.fn()} />);

    // Should show Bearer token input
    expect(screen.getByPlaceholderText(/enter bearer token/i)).toBeInTheDocument();
  });

  it('should render Basic Auth panel when selected', async () => {
    const user = userEvent.setup();
    render(<AuthTab onAuthChange={vi.fn()} />);

    const basicAuthTab = screen.getByRole('tab', { name: /basic auth/i });
    await user.click(basicAuthTab);

    // Should show username and password inputs
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('should render API Key panel when selected', async () => {
    const user = userEvent.setup();
    render(<AuthTab onAuthChange={vi.fn()} />);

    const apiKeyTab = screen.getByRole('tab', { name: /api key/i });
    await user.click(apiKeyTab);

    // Should show API key input
    expect(screen.getByPlaceholderText(/enter api key/i)).toBeInTheDocument();
  });

  it('should call onAuthChange when authentication is configured', async () => {
    const user = userEvent.setup();
    const handleAuthChange = vi.fn();
    render(<AuthTab onAuthChange={handleAuthChange} />);

    const tokenInput = screen.getByPlaceholderText(/enter bearer token/i);
    await user.type(tokenInput, 'test-token');

    expect(handleAuthChange).toHaveBeenCalled();
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(<AuthTab onAuthChange={vi.fn()} />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('should maintain state when switching between tabs', async () => {
    const user = userEvent.setup();
    render(<AuthTab onAuthChange={vi.fn()} />);

    // Enter token in Bearer tab
    const tokenInput = screen.getByPlaceholderText(/enter bearer token/i);
    await user.type(tokenInput, 'test-token');

    // Switch to Basic Auth
    const basicAuthTab = screen.getByRole('tab', { name: /basic auth/i });
    await user.click(basicAuthTab);

    // Switch back to Bearer
    const bearerTab = screen.getByRole('tab', { name: /bearer token/i });
    await user.click(bearerTab);

    // Token should still be there
    expect(tokenInput).toHaveValue('test-token');
  });
});
