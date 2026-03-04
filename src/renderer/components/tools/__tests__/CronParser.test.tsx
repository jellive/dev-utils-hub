import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CronParser } from '../CronParser';

describe('CronParser', () => {
  beforeEach(() => {
    render(<CronParser />);
  });

  describe('Initial State', () => {
    it('should render the title', () => {
      expect(screen.getByText('Cron Expression Parser')).toBeInTheDocument();
    });

    it('should render the cron input', () => {
      expect(screen.getByTestId('cron-input')).toBeInTheDocument();
    });

    it('should render preset selector', () => {
      expect(screen.getByText('Presets')).toBeInTheDocument();
    });

    it('should render reference section', () => {
      expect(screen.getByText('Quick Reference')).toBeInTheDocument();
    });

    it('should show field labels for default expression', () => {
      expect(screen.getByText('Minute')).toBeInTheDocument();
      expect(screen.getByText('Hour')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Weekday')).toBeInTheDocument();
    });
  });

  describe('Default Expression', () => {
    it('should have default expression * * * * *', () => {
      const input = screen.getByTestId('cron-input') as HTMLInputElement;
      expect(input.value).toBe('* * * * *');
    });

    it('should show description for default expression', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('description-en')).toBeInTheDocument();
      });
      expect(screen.getByTestId('description-en').textContent).toContain('every minute');
    });

    it('should show Korean description for default expression', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('description-ko')).toBeInTheDocument();
      });
      expect(screen.getByTestId('description-ko').textContent).toContain('매 분마다');
    });

    it('should show next 5 execution times', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('next-run-0')).toBeInTheDocument();
      });
      expect(screen.getByTestId('next-run-4')).toBeInTheDocument();
    });
  });

  describe('Expression Parsing', () => {
    it('should describe hourly cron correctly', async () => {
      const input = screen.getByTestId('cron-input');
      fireEvent.change(input, { target: { value: '0 * * * *' } });

      await waitFor(() => {
        const desc = screen.getByTestId('description-en');
        expect(desc.textContent).toContain('minute 0');
      });
    });

    it('should describe daily cron correctly', async () => {
      const input = screen.getByTestId('cron-input');
      fireEvent.change(input, { target: { value: '0 0 * * *' } });

      await waitFor(() => {
        const desc = screen.getByTestId('description-en');
        expect(desc.textContent).toContain('12:00 AM');
      });
    });

    it('should describe every 5 minutes cron', async () => {
      const input = screen.getByTestId('cron-input');
      fireEvent.change(input, { target: { value: '*/5 * * * *' } });

      await waitFor(() => {
        const desc = screen.getByTestId('description-en');
        expect(desc.textContent).toContain('every 5 minutes');
      });
    });

    it('should show error for invalid expression', async () => {
      const input = screen.getByTestId('cron-input');
      fireEvent.change(input, { target: { value: 'not valid' } });

      await waitFor(() => {
        expect(screen.getByText(/invalid cron expression/i)).toBeInTheDocument();
      });
    });

    it('should show error for too few fields', async () => {
      const input = screen.getByTestId('cron-input');
      fireEvent.change(input, { target: { value: '* *' } });

      await waitFor(() => {
        expect(screen.getByText(/invalid cron expression/i)).toBeInTheDocument();
      });
    });
  });

  describe('Copy Functionality', () => {
    it('should have a copy button', () => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });
});
