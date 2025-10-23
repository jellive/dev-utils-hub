import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HashGenerator } from '../HashGenerator';

describe('HashGenerator', () => {
  beforeEach(() => {
    render(<HashGenerator />);
  });

  describe('Initial State', () => {
    it('should render input textarea', () => {
      expect(screen.getByPlaceholderText(/enter text to hash/i)).toBeInTheDocument();
    });

    it('should render algorithm selector', () => {
      expect(screen.getByRole('combobox', { name: /hash algorithm/i })).toBeInTheDocument();
    });

    it('should render generate button', () => {
      expect(screen.getByRole('button', { name: /generate hash/i })).toBeInTheDocument();
    });

    it('should render clear button', () => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should have MD5 as default algorithm', () => {
      const algorithmSelect = screen.getByRole('combobox', { name: /hash algorithm/i }) as HTMLSelectElement;
      expect(algorithmSelect.value).toBe('md5');
    });
  });

  describe('Hash Generation', () => {
    it('should generate MD5 hash', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput).toBeInTheDocument();
        expect(hashOutput.textContent).toBe('5d41402abc4b2a76b9719d911017c592');
      });
    });

    it('should generate SHA-256 hash', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const algorithmSelect = screen.getByRole('combobox', { name: /hash algorithm/i });
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      fireEvent.change(algorithmSelect, { target: { value: 'sha256' } });
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput).toBeInTheDocument();
        expect(hashOutput.textContent).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
      });
    });

    it('should generate SHA-512 hash', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const algorithmSelect = screen.getByRole('combobox', { name: /hash algorithm/i });
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      fireEvent.change(algorithmSelect, { target: { value: 'sha512' } });
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput).toBeInTheDocument();
        expect(hashOutput.textContent).toMatch(/^[a-f0-9]{128}$/);
      });
    });

    it('should show error for empty input', async () => {
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/input.*empty/i)).toBeInTheDocument();
      });
    });

    it('should update hash when input changes', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput.textContent).toBe('5d41402abc4b2a76b9719d911017c592');
      });

      fireEvent.change(input, { target: { value: 'world' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput.textContent).toBe('7d793037a0760186574b0282f2f435e7');
      });
    });

    it('should update hash when algorithm changes', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const algorithmSelect = screen.getByRole('combobox', { name: /hash algorithm/i });
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.change(algorithmSelect, { target: { value: 'md5' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput.textContent).toBe('5d41402abc4b2a76b9719d911017c592');
      });

      fireEvent.change(algorithmSelect, { target: { value: 'sha256' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput.textContent).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
      });
    });
  });

  describe('Copy Functionality', () => {
    it('should show copy button when hash is generated', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });
    });
  });

  describe('Clear Functionality', () => {
    it('should clear input and hash result', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i) as HTMLTextAreaElement;
      const generateButton = screen.getByRole('button', { name: /generate hash/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByTestId('hash-output')).toBeInTheDocument();
      });

      fireEvent.click(clearButton);

      expect(input.value).toBe('');
      expect(screen.queryByTestId('hash-output')).not.toBeInTheDocument();
    });

    it('should clear error messages', async () => {
      const generateButton = screen.getByRole('button', { name: /generate hash/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/input.*empty/i)).toBeInTheDocument();
      });

      fireEvent.click(clearButton);

      expect(screen.queryByText(/input.*empty/i)).not.toBeInTheDocument();
    });
  });

  describe('Algorithm Support', () => {
    it('should support MD5 algorithm', () => {
      const algorithmSelect = screen.getByRole('combobox', { name: /hash algorithm/i });
      expect(algorithmSelect.querySelector('option[value="md5"]')).toBeInTheDocument();
    });

    it('should support SHA-256 algorithm', () => {
      const algorithmSelect = screen.getByRole('combobox', { name: /hash algorithm/i });
      expect(algorithmSelect.querySelector('option[value="sha256"]')).toBeInTheDocument();
    });

    it('should support SHA-512 algorithm', () => {
      const algorithmSelect = screen.getByRole('combobox', { name: /hash algorithm/i });
      expect(algorithmSelect.querySelector('option[value="sha512"]')).toBeInTheDocument();
    });
  });
});
