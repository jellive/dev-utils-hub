import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../ColorPicker';

describe('ColorPicker', () => {
  beforeEach(() => {
    render(<ColorPicker />);
  });

  describe('Initial State', () => {
    it('should render the title', () => {
      expect(screen.getByText('Color Picker & Converter')).toBeInTheDocument();
    });

    it('should render color picker input', () => {
      expect(screen.getByTestId('color-picker-input')).toBeInTheDocument();
    });

    it('should render color preview', () => {
      expect(screen.getByTestId('color-preview')).toBeInTheDocument();
    });

    it('should render HEX input', () => {
      expect(screen.getByTestId('hex-input')).toBeInTheDocument();
    });

    it('should render RGB input', () => {
      expect(screen.getByTestId('rgb-input')).toBeInTheDocument();
    });

    it('should render HSL input', () => {
      expect(screen.getByTestId('hsl-input')).toBeInTheDocument();
    });

    it('should render palette section', () => {
      expect(screen.getByText('Color Palette')).toBeInTheDocument();
    });

    it('should show complementary, analogous and triadic palette labels', () => {
      expect(screen.getByText('Complementary')).toBeInTheDocument();
      expect(screen.getByText('Analogous')).toBeInTheDocument();
      expect(screen.getByText('Triadic')).toBeInTheDocument();
    });
  });

  describe('HEX Input', () => {
    it('should update RGB when HEX input changes to valid value', () => {
      const hexInput = screen.getByTestId('hex-input') as HTMLInputElement;
      fireEvent.change(hexInput, { target: { value: '#ff0000' } });
      const rgbInput = screen.getByTestId('rgb-input') as HTMLInputElement;
      expect(rgbInput.value).toBe('rgb(255, 0, 0)');
    });

    it('should update HSL when HEX input changes to valid value', () => {
      const hexInput = screen.getByTestId('hex-input') as HTMLInputElement;
      fireEvent.change(hexInput, { target: { value: '#ff0000' } });
      const hslInput = screen.getByTestId('hsl-input') as HTMLInputElement;
      expect(hslInput.value).toBe('hsl(0, 100%, 50%)');
    });

    it('should not update on invalid HEX value', () => {
      const hexInput = screen.getByTestId('hex-input') as HTMLInputElement;
      const rgbBefore = (screen.getByTestId('rgb-input') as HTMLInputElement).value;
      fireEvent.change(hexInput, { target: { value: '#zzzzzz' } });
      const rgbAfter = (screen.getByTestId('rgb-input') as HTMLInputElement).value;
      expect(rgbAfter).toBe(rgbBefore);
    });
  });

  describe('RGB Input', () => {
    it('should update HEX when RGB input changes to valid value', () => {
      const rgbInput = screen.getByTestId('rgb-input') as HTMLInputElement;
      fireEvent.change(rgbInput, { target: { value: 'rgb(255, 0, 0)' } });
      const hexInput = screen.getByTestId('hex-input') as HTMLInputElement;
      expect(hexInput.value.toLowerCase()).toBe('#ff0000');
    });

    it('should update HSL when RGB input changes', () => {
      const rgbInput = screen.getByTestId('rgb-input') as HTMLInputElement;
      fireEvent.change(rgbInput, { target: { value: 'rgb(0, 0, 255)' } });
      const hslInput = screen.getByTestId('hsl-input') as HTMLInputElement;
      expect(hslInput.value).toBe('hsl(240, 100%, 50%)');
    });
  });

  describe('HSL Input', () => {
    it('should update HEX when HSL input changes to valid value', () => {
      const hslInput = screen.getByTestId('hsl-input') as HTMLInputElement;
      fireEvent.change(hslInput, { target: { value: 'hsl(0, 100%, 50%)' } });
      const hexInput = screen.getByTestId('hex-input') as HTMLInputElement;
      expect(hexInput.value.toLowerCase()).toBe('#ff0000');
    });
  });

  describe('Copy Functionality', () => {
    it('should copy HEX value when copy button is clicked', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      const hexInput = screen.getByTestId('hex-input') as HTMLInputElement;
      fireEvent.change(hexInput, { target: { value: '#ff0000' } });

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      fireEvent.click(copyButtons[0]);

      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  describe('Color Picker Native Input', () => {
    it('should update hex input when picker changes', () => {
      const picker = screen.getByTestId('color-picker-input') as HTMLInputElement;
      fireEvent.change(picker, { target: { value: '#00ff00' } });
      const hexInput = screen.getByTestId('hex-input') as HTMLInputElement;
      expect(hexInput.value).toBe('#00ff00');
    });
  });
});
