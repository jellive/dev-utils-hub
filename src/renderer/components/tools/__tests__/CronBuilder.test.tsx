import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CronBuilder, fieldToCron } from '../CronBuilder';

function renderBuilder() {
  return render(
    <MemoryRouter>
      <CronBuilder />
    </MemoryRouter>
  );
}

async function selectMode(fieldKey: string, label: string) {
  const user = userEvent.setup();
  const mode = label.toLowerCase();
  const button = screen.getByTestId(`mode-${fieldKey}-${mode}`);
  await user.click(button);
}

describe('CronBuilder', () => {
  describe('fieldToCron pure function', () => {
    it('every mode → *', () => {
      expect(
        fieldToCron({
          mode: 'every',
          specific: '0',
          rangeFrom: '0',
          rangeTo: '0',
          list: '',
          step: '5',
        })
      ).toBe('*');
    });

    it('specific mode → number', () => {
      expect(
        fieldToCron({
          mode: 'specific',
          specific: '15',
          rangeFrom: '0',
          rangeTo: '0',
          list: '',
          step: '5',
        })
      ).toBe('15');
    });

    it('range mode → from-to', () => {
      expect(
        fieldToCron({
          mode: 'range',
          specific: '0',
          rangeFrom: '9',
          rangeTo: '17',
          list: '',
          step: '5',
        })
      ).toBe('9-17');
    });

    it('list mode → csv', () => {
      expect(
        fieldToCron({
          mode: 'list',
          specific: '0',
          rangeFrom: '0',
          rangeTo: '0',
          list: '1,3,5',
          step: '5',
        })
      ).toBe('1,3,5');
    });

    it('step mode → */N', () => {
      expect(
        fieldToCron({
          mode: 'step',
          specific: '0',
          rangeFrom: '0',
          rangeTo: '0',
          list: '',
          step: '5',
        })
      ).toBe('*/5');
    });

    it('specific mode with empty value falls back to *', () => {
      expect(
        fieldToCron({
          mode: 'specific',
          specific: '',
          rangeFrom: '0',
          rangeTo: '0',
          list: '',
          step: '5',
        })
      ).toBe('*');
    });
  });

  describe('component rendering', () => {
    beforeEach(() => {
      renderBuilder();
    });

    it('renders the heading', () => {
      expect(screen.getByText('Cron Builder')).toBeInTheDocument();
    });

    it('default expression is "* * * * *"', () => {
      const output = screen.getByTestId('cron-output') as HTMLInputElement;
      expect(output.value).toBe('* * * * *');
    });

    it('renders all 5 field cards', () => {
      expect(screen.getByTestId('field-minute')).toBeInTheDocument();
      expect(screen.getByTestId('field-hour')).toBeInTheDocument();
      expect(screen.getByTestId('field-day')).toBeInTheDocument();
      expect(screen.getByTestId('field-month')).toBeInTheDocument();
      expect(screen.getByTestId('field-weekday')).toBeInTheDocument();
    });

    it('shows description card for default expression', () => {
      expect(screen.getByTestId('description-en')).toBeInTheDocument();
      expect(screen.getByTestId('description-ko')).toBeInTheDocument();
    });
  });

  describe('mode interactions', () => {
    it('setting minute to step=5 produces */5 * * * *', async () => {
      renderBuilder();
      await selectMode('minute', 'Step');
      const output = screen.getByTestId('cron-output') as HTMLInputElement;
      expect(output.value).toBe('*/5 * * * *');
    });

    it('setting minute=15 hour=9 (specific) produces 15 9 * * *', async () => {
      const user = userEvent.setup();
      renderBuilder();
      await selectMode('minute', 'Specific');
      const minuteInput = screen.getByTestId('specific-minute') as HTMLInputElement;
      await user.clear(minuteInput);
      await user.type(minuteInput, '15');

      await selectMode('hour', 'Specific');
      const hourInput = screen.getByTestId('specific-hour') as HTMLInputElement;
      await user.clear(hourInput);
      await user.type(hourInput, '9');

      const output = screen.getByTestId('cron-output') as HTMLInputElement;
      expect(output.value).toBe('15 9 * * *');
    });

    it('setting hour to range 9-17 produces * 9-17 * * *', async () => {
      const user = userEvent.setup();
      renderBuilder();
      await selectMode('hour', 'Range');
      const fromInput = screen.getByTestId('from-hour') as HTMLInputElement;
      const toInput = screen.getByTestId('to-hour') as HTMLInputElement;
      await user.clear(fromInput);
      await user.type(fromInput, '9');
      await user.clear(toInput);
      await user.type(toInput, '17');

      const output = screen.getByTestId('cron-output') as HTMLInputElement;
      expect(output.value).toBe('* 9-17 * * *');
    });

    it('setting weekday to list 1,3,5 produces * * * * 1,3,5', async () => {
      const user = userEvent.setup();
      renderBuilder();
      await selectMode('weekday', 'List');
      const listInput = screen.getByTestId('list-weekday') as HTMLInputElement;
      await user.type(listInput, '1,3,5');

      const output = screen.getByTestId('cron-output') as HTMLInputElement;
      expect(output.value).toBe('* * * * 1,3,5');
    });
  });

  describe('copy button', () => {
    it('copies expression to clipboard', async () => {
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

      const user = userEvent.setup();
      renderBuilder();
      const copyBtn = screen.getByRole('button', { name: /copy/i });
      await user.click(copyBtn);

      expect(writeText).toHaveBeenCalledWith('* * * * *');
      writeText.mockRestore();
    });
  });

  describe('description card content', () => {
    it('renders Korean description for non-trivial expression', async () => {
      const user = userEvent.setup();
      renderBuilder();
      await selectMode('minute', 'Specific');
      const minuteInput = screen.getByTestId('specific-minute') as HTMLInputElement;
      await user.clear(minuteInput);
      await user.type(minuteInput, '30');

      await selectMode('hour', 'Specific');
      const hourInput = screen.getByTestId('specific-hour') as HTMLInputElement;
      await user.clear(hourInput);
      await user.type(hourInput, '14');

      const ko = screen.getByTestId('description-ko');
      expect(ko.textContent).toContain('14');
      expect(ko.textContent).toContain('30');
    });
  });
});
