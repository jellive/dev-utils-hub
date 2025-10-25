import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendButton } from '../SendButton';

describe('SendButton', () => {
  describe('Visual States', () => {
    it('should render in idle state by default', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={false} />);

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should show loading state when loading is true', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={true} />);

      expect(screen.getByText(/sending/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={true} loading={false} />);

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toBeDisabled();
    });

    it('should display loading spinner during loading', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={true} />);

      // Loading spinner should be visible (Loader2 icon)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onSend when clicked in idle state', async () => {
      const user = userEvent.setup();
      const handleSend = vi.fn();

      render(<SendButton onSend={handleSend} onCancel={vi.fn()} disabled={false} loading={false} />);

      const button = screen.getByRole('button', { name: /send/i });
      await user.click(button);

      expect(handleSend).toHaveBeenCalledTimes(1);
    });

    it('should not call onSend when disabled', async () => {
      const user = userEvent.setup();
      const handleSend = vi.fn();

      render(<SendButton onSend={handleSend} onCancel={vi.fn()} disabled={true} loading={false} />);

      const button = screen.getByRole('button', { name: /send/i });
      await user.click(button);

      expect(handleSend).not.toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleCancel = vi.fn();

      render(<SendButton onSend={vi.fn()} onCancel={handleCancel} disabled={false} loading={true} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('should not allow sending while loading', async () => {
      const handleSend = vi.fn();

      render(<SendButton onSend={handleSend} onCancel={vi.fn()} disabled={false} loading={true} />);

      // Send button should not be present during loading
      expect(screen.queryByRole('button', { name: /^send$/i })).not.toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('should show Send icon in idle state', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={false} />);

      // lucide-send icon should be present
      const icon = document.querySelector('.lucide-send');
      expect(icon).toBeInTheDocument();
    });

    it('should show spinning loader during loading', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={true} />);

      // Loader2 icon with animation
      const loader = document.querySelector('.lucide-loader-2.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should show X icon for cancel button', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={true} />);

      // lucide-x icon should be present
      const icon = document.querySelector('.lucide-x');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible name for send button', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={false} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should have accessible name for cancel button', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={true} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should indicate disabled state to screen readers', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={true} loading={false} />);

      const button = screen.getByRole('button', { name: /send/i });
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Layout and Styling', () => {
    it('should render as single button in idle state', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={false} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    it('should render two buttons during loading (sending + cancel)', () => {
      render(<SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={true} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should have proper styling classes', () => {
      const { container } = render(
        <SendButton onSend={vi.fn()} onCancel={vi.fn()} disabled={false} loading={false} />
      );

      // Should have flex gap container
      const wrapper = container.querySelector('.flex.gap-2');
      expect(wrapper).toBeInTheDocument();
    });
  });
});
