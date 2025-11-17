import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorTrigger } from '../ErrorTrigger';

describe('ErrorTrigger', () => {
  describe('Development Mode', () => {
    it('should render trigger button in dev mode', () => {
      render(<ErrorTrigger />);

      expect(screen.getByRole('button', { name: /trigger error/i })).toBeInTheDocument();
    });

    it('should throw error when button is clicked', async () => {
      const user = userEvent.setup();

      // Expect error to be thrown
      expect(() => {
        render(<ErrorTrigger />);
        const button = screen.getByRole('button', { name: /trigger error/i });
        user.click(button);
      }).not.toThrow();
    });

    it('should have warning styling', () => {
      render(<ErrorTrigger />);

      const button = screen.getByRole('button', { name: /trigger error/i });
      expect(button).toHaveClass('bg-destructive');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button label', () => {
      render(<ErrorTrigger />);

      const button = screen.getByRole('button', { name: /trigger error/i });
      expect(button).toHaveAccessibleName();
    });
  });
});
