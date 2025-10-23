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

  describe('Algorithm Selection UI (Task 8.1)', () => {
    it('should display algorithm buttons instead of select dropdown', () => {
      // Check for button group instead of select
      const md5Button = screen.getByRole('button', { name: /MD5/i });
      const sha256Button = screen.getByRole('button', { name: /SHA-256/i });
      const sha512Button = screen.getByRole('button', { name: /SHA-512/i });

      expect(md5Button).toBeInTheDocument();
      expect(sha256Button).toBeInTheDocument();
      expect(sha512Button).toBeInTheDocument();
    });

    it('should display bit length badges for each algorithm', () => {
      const md5Button = screen.getByRole('button', { name: /MD5/i });
      const sha256Button = screen.getByRole('button', { name: /SHA-256/i });
      const sha512Button = screen.getByRole('button', { name: /SHA-512/i });

      // MD5 button should contain 128-bit badge
      expect(md5Button.textContent).toContain('128-bit');

      // SHA-256 button should contain 256-bit badge
      expect(sha256Button.textContent).toContain('256-bit');

      // SHA-512 button should contain 512-bit badge
      expect(sha512Button.textContent).toContain('512-bit');
    });

    it('should highlight selected algorithm button', () => {
      const md5Button = screen.getByRole('button', { name: /MD5/i });

      // MD5 should be selected by default
      expect(md5Button).toHaveAttribute('data-state', 'active');
    });

    it('should allow switching between algorithms by clicking buttons', async () => {
      const md5Button = screen.getByRole('button', { name: /MD5/i });
      const sha256Button = screen.getByRole('button', { name: /SHA-256/i });

      // Initially MD5 is active
      expect(md5Button).toHaveAttribute('data-state', 'active');

      // Click SHA-256
      fireEvent.click(sha256Button);

      // SHA-256 should now be active
      await waitFor(() => {
        expect(sha256Button).toHaveAttribute('data-state', 'active');
        expect(md5Button).toHaveAttribute('data-state', 'inactive');
      });
    });

    it('should generate hash with selected algorithm from button', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const sha256Button = screen.getByRole('button', { name: /SHA-256/i });
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      // Select SHA-256
      fireEvent.click(sha256Button);

      // Generate hash
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput.textContent).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
      });
    });
  });

  describe('MD5 Security Warning (Task 8.2)', () => {
    it('should display security warning alert when MD5 is selected', () => {
      // MD5 is selected by default
      const alert = screen.getByRole('alert');

      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/MD5.*not.*secure/i);
    });

    it('should hide security warning when SHA-256 is selected', async () => {
      const sha256Button = screen.getByRole('button', { name: /SHA-256/i });

      // Click SHA-256
      fireEvent.click(sha256Button);

      await waitFor(() => {
        const alerts = screen.queryAllByRole('alert');
        // Filter out any other alerts and check for MD5 warning specifically
        const md5Alert = alerts.find(alert => alert.textContent?.includes('MD5'));
        expect(md5Alert).toBeUndefined();
      });
    });

    it('should hide security warning when SHA-512 is selected', async () => {
      const sha512Button = screen.getByRole('button', { name: /SHA-512/i });

      // Click SHA-512
      fireEvent.click(sha512Button);

      await waitFor(() => {
        const alerts = screen.queryAllByRole('alert');
        const md5Alert = alerts.find(alert => alert.textContent?.includes('MD5'));
        expect(md5Alert).toBeUndefined();
      });
    });

    it('should show security warning again when switching back to MD5', async () => {
      const sha256Button = screen.getByRole('button', { name: /SHA-256/i });
      const md5Button = screen.getByRole('button', { name: /MD5/i });

      // Switch to SHA-256
      fireEvent.click(sha256Button);

      await waitFor(() => {
        const alerts = screen.queryAllByRole('alert');
        const md5Alert = alerts.find(alert => alert.textContent?.includes('MD5'));
        expect(md5Alert).toBeUndefined();
      });

      // Switch back to MD5
      fireEvent.click(md5Button);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/MD5.*not.*secure/i);
      });
    });

    it('should display warning with destructive styling', () => {
      const alert = screen.getByRole('alert');

      // Alert should have destructive variant styling
      expect(alert.className).toContain('destructive');
    });
  });

  describe('File Hashing (Task 8.3)', () => {
    it('should display file upload area', () => {
      const fileUpload = screen.getByText(/drag and drop a file here/i);
      expect(fileUpload).toBeInTheDocument();
    });

    it('should hash a file when dropped', async () => {
      const fileContent = 'hello world';
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const dropZone = screen.getByText(/drag and drop a file here/i).closest('div');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput).toBeInTheDocument();
        // MD5 hash of "hello world"
        expect(hashOutput.textContent).toBeTruthy();
      });
    });

    it('should display file information after upload', async () => {
      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });

      const dropZone = screen.getByText(/drag and drop a file here/i).closest('div');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/document\.pdf/i)).toBeInTheDocument();
      });
    });

    it('should allow file selection via input', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      expect(input).toBeInTheDocument();

      fireEvent.change(input, {
        target: { files: [file] },
      });

      await waitFor(() => {
        expect(screen.getByText(/test\.txt/i)).toBeInTheDocument();
      });
    });

    it('should show visual feedback on drag over', () => {
      const textElement = screen.getByText(/drag and drop a file here/i);
      // Go up 3 levels: p -> div -> div.space-y-3 -> div with border classes
      const dropZone = textElement.closest('div')?.parentElement?.parentElement;

      fireEvent.dragEnter(dropZone!);

      // Check for drag-over styling
      expect(dropZone?.className).toContain('border-blue-500');
    });

    it('should clear file when switching to text input mode', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const dropZone = screen.getByText(/drag and drop a file here/i).closest('div');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/test\.txt/i)).toBeInTheDocument();
      });

      // Switch to text input
      const clearButton = screen.getByRole('button', { name: /remove.*file/i });
      fireEvent.click(clearButton);

      expect(screen.queryByText(/test\.txt/i)).not.toBeInTheDocument();
    });
  });

  describe('HMAC Support (Task 8.4)', () => {
    it('should display HMAC mode toggle', () => {
      const hmacToggle = screen.getByRole('checkbox', { name: /hmac mode/i });
      expect(hmacToggle).toBeInTheDocument();
      expect(hmacToggle).not.toBeChecked();
    });

    it('should show key input field when HMAC mode is enabled', () => {
      const hmacToggle = screen.getByRole('checkbox', { name: /hmac mode/i });

      // Initially key input should not be visible
      expect(screen.queryByPlaceholderText(/enter.*key/i)).not.toBeInTheDocument();

      // Enable HMAC mode
      fireEvent.click(hmacToggle);

      // Key input should now be visible
      expect(screen.getByPlaceholderText(/enter.*key/i)).toBeInTheDocument();
    });

    it('should generate HMAC with key', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const hmacToggle = screen.getByRole('checkbox', { name: /hmac mode/i });
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      // Enable HMAC mode
      fireEvent.click(hmacToggle);

      // Enter key
      const keyInput = screen.getByPlaceholderText(/enter.*key/i);
      fireEvent.change(keyInput, { target: { value: 'secret-key' } });

      // Enter text
      fireEvent.change(input, { target: { value: 'hello' } });

      // Generate HMAC
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput).toBeInTheDocument();
        // HMAC should be different from regular hash
        expect(hashOutput.textContent).not.toBe('5d41402abc4b2a76b9719d911017c592'); // MD5 of 'hello'
      });
    });

    it('should show error when key is empty in HMAC mode', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const hmacToggle = screen.getByRole('checkbox', { name: /hmac mode/i });
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      // Enable HMAC mode
      fireEvent.click(hmacToggle);

      // Enter text but no key
      fireEvent.change(input, { target: { value: 'hello' } });

      // Try to generate HMAC
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/key.*required/i)).toBeInTheDocument();
      });
    });

    it('should update HMAC when key changes', async () => {
      const input = screen.getByPlaceholderText(/enter text to hash/i);
      const hmacToggle = screen.getByRole('checkbox', { name: /hmac mode/i });
      const generateButton = screen.getByRole('button', { name: /generate hash/i });

      // Enable HMAC mode
      fireEvent.click(hmacToggle);

      const keyInput = screen.getByPlaceholderText(/enter.*key/i);

      // Generate HMAC with first key
      fireEvent.change(keyInput, { target: { value: 'key1' } });
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput).toBeInTheDocument();
      });

      const firstHmac = screen.getByTestId('hash-output').textContent;

      // Generate HMAC with different key
      fireEvent.change(keyInput, { target: { value: 'key2' } });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const hashOutput = screen.getByTestId('hash-output');
        expect(hashOutput.textContent).not.toBe(firstHmac);
      });
    });

    it('should clear key input when HMAC mode is disabled', () => {
      const hmacToggle = screen.getByRole('checkbox', { name: /hmac mode/i });

      // Enable HMAC mode and enter key
      fireEvent.click(hmacToggle);
      const keyInput = screen.getByPlaceholderText(/enter.*key/i);
      fireEvent.change(keyInput, { target: { value: 'secret' } });

      // Disable HMAC mode
      fireEvent.click(hmacToggle);

      // Key input should be hidden
      expect(screen.queryByPlaceholderText(/enter.*key/i)).not.toBeInTheDocument();

      // Enable again - key should be cleared
      fireEvent.click(hmacToggle);
      const newKeyInput = screen.getByPlaceholderText(/enter.*key/i) as HTMLInputElement;
      expect(newKeyInput.value).toBe('');
    });
  });
});
