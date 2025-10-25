import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message');
  const mockResetError = vi.fn();

  describe('Rendering', () => {
    it('should render error icon', () => {
      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      // AlertCircle icon should be present
      const icon = document.querySelector('.lucide-alert-circle');
      expect(icon).toBeInTheDocument();
    });

    it('should display user-friendly error title', () => {
      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should show reload button', () => {
      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });

    it('should show go home button', () => {
      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call resetError when reload button is clicked', async () => {
      const user = userEvent.setup();
      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      await user.click(reloadButton);

      expect(mockResetError).toHaveBeenCalledTimes(1);
    });

    it('should reload page when reload button is clicked', async () => {
      const user = userEvent.setup();
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      await user.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalledTimes(1);
      reloadSpy.mockRestore();
    });

    it('should navigate to home when go home button is clicked', async () => {
      const user = userEvent.setup();
      const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});

      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      const homeButton = screen.getByRole('button', { name: /go to home/i });
      await user.click(homeButton);

      expect(assignSpy).toHaveBeenCalledWith('/');
      assignSpy.mockRestore();
    });
  });

  describe('Error Details', () => {
    it('should show error stack in development mode', () => {
      vi.stubEnv('DEV', true);

      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      // Stack trace should be in details element
      const details = document.querySelector('details');
      expect(details).toBeInTheDocument();
    });

    it('should hide error stack in production mode', () => {
      vi.stubEnv('DEV', false);

      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      // Stack trace should not be visible
      const details = document.querySelector('details');
      expect(details).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      // Alert role for error message
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<ErrorFallback error={mockError} resetError={mockResetError} />);

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      const homeButton = screen.getByRole('button', { name: /go to home/i });

      expect(reloadButton).toHaveAccessibleName();
      expect(homeButton).toHaveAccessibleName();
    });
  });
});
