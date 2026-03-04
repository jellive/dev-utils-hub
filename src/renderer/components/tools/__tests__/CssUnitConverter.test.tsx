import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CssUnitConverter } from '../CssUnitConverter';

describe('CssUnitConverter', () => {
  beforeEach(() => {
    render(<CssUnitConverter />);
  });

  describe('Initial State', () => {
    it('should render the title', () => {
      expect(screen.getByText('CSS Unit Converter')).toBeInTheDocument();
    });

    it('should render value input', () => {
      expect(screen.getByTestId('value-input')).toBeInTheDocument();
    });

    it('should render unit buttons', () => {
      expect(screen.getByTestId('unit-btn-px')).toBeInTheDocument();
      expect(screen.getByTestId('unit-btn-rem')).toBeInTheDocument();
      expect(screen.getByTestId('unit-btn-em')).toBeInTheDocument();
      expect(screen.getByTestId('unit-btn-vh')).toBeInTheDocument();
      expect(screen.getByTestId('unit-btn-vw')).toBeInTheDocument();
      expect(screen.getByTestId('unit-btn-%')).toBeInTheDocument();
    });

    it('should render config inputs', () => {
      expect(screen.getByTestId('base-font-size')).toBeInTheDocument();
      expect(screen.getByTestId('viewport-width')).toBeInTheDocument();
      expect(screen.getByTestId('viewport-height')).toBeInTheDocument();
    });

    it('should render conversion table', () => {
      expect(screen.getByText('Conversion Table (px base)')).toBeInTheDocument();
    });

    it('should show all result boxes', () => {
      expect(screen.getByTestId('result-px')).toBeInTheDocument();
      expect(screen.getByTestId('result-rem')).toBeInTheDocument();
      expect(screen.getByTestId('result-em')).toBeInTheDocument();
      expect(screen.getByTestId('result-vh')).toBeInTheDocument();
      expect(screen.getByTestId('result-vw')).toBeInTheDocument();
      expect(screen.getByTestId('result-%')).toBeInTheDocument();
    });
  });

  describe('px to rem conversion', () => {
    it('should convert 16px to 1rem with default base 16', () => {
      const input = screen.getByTestId('value-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '16' } });

      // px is selected by default
      const remResult = screen.getByTestId('result-rem');
      expect(remResult.textContent).toContain('1');
    });

    it('should convert 32px to 2rem with default base 16', () => {
      const input = screen.getByTestId('value-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '32' } });

      const remResult = screen.getByTestId('result-rem');
      expect(remResult.textContent).toContain('2');
    });

    it('should convert 8px to 0.5rem', () => {
      const input = screen.getByTestId('value-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '8' } });

      const remResult = screen.getByTestId('result-rem');
      expect(remResult.textContent).toContain('0.5');
    });
  });

  describe('Unit switching', () => {
    it('should switch from unit to rem', () => {
      const remBtn = screen.getByTestId('unit-btn-rem');
      fireEvent.click(remBtn);

      expect(remBtn.className).toContain('bg-blue-600');
    });

    it('should convert 1rem to 16px with default config', () => {
      const remBtn = screen.getByTestId('unit-btn-rem');
      fireEvent.click(remBtn);

      const input = screen.getByTestId('value-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '1' } });

      const pxResult = screen.getByTestId('result-px');
      expect(pxResult.textContent).toContain('16');
    });
  });

  describe('Config changes', () => {
    it('should update conversion when base font size changes', () => {
      const baseFontInput = screen.getByTestId('base-font-size') as HTMLInputElement;
      fireEvent.change(baseFontInput, { target: { value: '10' } });

      const valueInput = screen.getByTestId('value-input') as HTMLInputElement;
      fireEvent.change(valueInput, { target: { value: '10' } });

      // 10px / 10 (new base) = 1rem
      const remResult = screen.getByTestId('result-rem');
      expect(remResult.textContent).toContain('1');
    });
  });

  describe('Copy Functionality', () => {
    it('should copy value when copy link clicked', () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      const copyLinks = screen.getAllByRole('button', { name: /copy/i });
      fireEvent.click(copyLinks[0]);

      expect(mockWriteText).toHaveBeenCalled();
    });
  });
});
