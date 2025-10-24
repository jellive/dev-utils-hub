import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPanel } from '../HistoryPanel';

describe('HistoryPanel', () => {
  it('should render with history title', () => {
    render(<HistoryPanel />);

    expect(screen.getByText(/history/i)).toBeInTheDocument();
  });

  it('should be collapsible', async () => {
    const user = userEvent.setup();
    render(<HistoryPanel />);

    // Find collapse/expand button
    const toggleButton = screen.getByRole('button', { name: /^(collapse|expand) history$/i });
    expect(toggleButton).toBeInTheDocument();

    // Initially expanded or collapsed, click to toggle
    await user.click(toggleButton);

    // Should toggle the collapsed state
    expect(toggleButton).toBeInTheDocument();
  });

  it('should display history count badge', () => {
    render(<HistoryPanel />);

    // Should show count (0 initially with no history)
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render children content when provided', () => {
    render(
      <HistoryPanel>
        <div>History Items</div>
      </HistoryPanel>
    );

    expect(screen.getByText('History Items')).toBeInTheDocument();
  });

  it('should start in expanded state by default', () => {
    render(
      <HistoryPanel>
        <div data-testid="content">Content</div>
      </HistoryPanel>
    );

    // Content should be visible
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should hide content when collapsed', async () => {
    const user = userEvent.setup();
    render(
      <HistoryPanel>
        <div data-testid="content">Content</div>
      </HistoryPanel>
    );

    // Find and click toggle button
    const toggleButton = screen.getByRole('button', { name: /^(collapse|expand) history$/i });
    await user.click(toggleButton);

    // Content should not be visible
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('should display custom history count', () => {
    render(<HistoryPanel count={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should have clear history button', () => {
    render(<HistoryPanel />);

    expect(screen.getByRole('button', { name: /clear|delete|remove/i })).toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();

    render(<HistoryPanel count={3} onClear={handleClear} />);

    const clearButton = screen.getByRole('button', { name: /clear|delete|remove/i });
    await user.click(clearButton);

    expect(handleClear).toHaveBeenCalled();
  });

  it('should disable clear button when count is 0', () => {
    render(<HistoryPanel count={0} onClear={vi.fn()} />);

    const clearButton = screen.getByRole('button', { name: /clear|delete|remove/i });
    expect(clearButton).toBeDisabled();
  });

  it('should enable clear button when count > 0', () => {
    render(<HistoryPanel count={3} onClear={vi.fn()} />);

    const clearButton = screen.getByRole('button', { name: /clear|delete|remove/i });
    expect(clearButton).not.toBeDisabled();
  });
});
