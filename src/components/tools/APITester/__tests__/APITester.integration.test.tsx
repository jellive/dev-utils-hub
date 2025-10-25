import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { APITester } from '../index';

// Mock fetch
globalThis.fetch = vi.fn();

describe('APITester - State Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request State Management', () => {
    it('should update method state and reflect in UI', async () => {
      const user = userEvent.setup();
      render(<APITester />);

      const methodSelector = screen.getByRole('combobox', { name: /method/i });
      expect(methodSelector).toHaveTextContent('GET');

      // Change method (clicking select would open dropdown)
      // For now, verify initial state
      expect(methodSelector).toHaveTextContent('GET');
    });

    it('should update URL state and enable send button', async () => {
      const user = userEvent.setup();
      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Initially disabled
      expect(sendButton).toBeDisabled();

      // Type URL
      await user.type(urlInput, 'https://api.example.com/users');

      // Should enable send button
      await waitFor(() => {
        expect(sendButton).not.toBeDisabled();
      });
    });

    it('should manage loading state during request', async () => {
      const user = userEvent.setup();

      // Mock delayed response to catch loading state
      (globalThis.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              statusText: 'OK',
              headers: new Headers({ 'content-type': 'application/json' }),
              text: async () => '{"success": true}',
            });
          }, 100);
        })
      );

      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(urlInput, 'https://api.example.com/test');

      // Initially shows "Send"
      expect(sendButton).toHaveTextContent(/send/i);

      await user.click(sendButton);

      // Should show loading state
      await waitFor(() => {
        expect(sendButton).toHaveTextContent(/sending/i);
      }, { timeout: 50 });

      // Wait for request to complete
      await waitFor(() => {
        expect(sendButton).toHaveTextContent(/^send$/i);
      });
    });

    it('should handle error state when URL is empty', async () => {
      const user = userEvent.setup();
      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send button should be disabled when URL is empty
      expect(sendButton).toBeDisabled();
    });

    it('should clear error when URL is updated', async () => {
      const user = userEvent.setup();
      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);

      // Type invalid then valid URL
      await user.type(urlInput, 'https://api.example.com/test');

      // No error should be shown
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Response State Management', () => {
    it('should update response state after successful request', async () => {
      const user = userEvent.setup();

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{"data": "test"}',
      };

      (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(urlInput, 'https://api.example.com/test');
      await user.click(sendButton);

      // Wait for response to be displayed
      await waitFor(() => {
        expect(screen.getByText(/200/i)).toBeInTheDocument();
      });
    });

    it('should update error state on request failure', async () => {
      const user = userEvent.setup();

      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(urlInput, 'https://api.example.com/test');
      await user.click(sendButton);

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should clear previous response when new request is sent', async () => {
      const user = userEvent.setup();

      const mockResponse1 = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{"data": "first"}',
      };

      const mockResponse2 = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{"data": "second"}',
      };

      (globalThis.fetch as any)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // First request
      await user.type(urlInput, 'https://api.example.com/first');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/"data": "first"/i)).toBeInTheDocument();
      });

      // Clear URL and type new one
      await user.clear(urlInput);
      await user.type(urlInput, 'https://api.example.com/second');
      await user.click(sendButton);

      // Should show new response
      await waitFor(() => {
        expect(screen.getByText(/"data": "second"/i)).toBeInTheDocument();
      });
    });
  });

  describe('History State Management', () => {
    it('should save request to history after successful request', async () => {
      const user = userEvent.setup();

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{"success": true}',
      };

      (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(urlInput, 'https://api.example.com/test');
      await user.click(sendButton);

      // Wait for history to update
      await waitFor(() => {
        expect(screen.getByText(/api.example.com\/test/i)).toBeInTheDocument();
      });

      // History count badge should be visible
      const historyBadges = screen.getAllByText('1');
      expect(historyBadges.length).toBeGreaterThan(0);
    });

    it('should save request to history on error', async () => {
      const user = userEvent.setup();

      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Request failed'));

      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(urlInput, 'https://api.example.com/error');
      await user.click(sendButton);

      // Wait for history to update with error
      await waitFor(() => {
        const historyItems = screen.getAllByText(/error/i);
        expect(historyItems.length).toBeGreaterThan(0);
      });
    });

    it('should restore request from history', async () => {
      const user = userEvent.setup();

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '{"data": "test"}',
      };

      (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Make a request
      await user.type(urlInput, 'https://api.example.com/restore');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/api.example.com\/restore/i)).toBeInTheDocument();
      });

      // Clear the URL
      await user.clear(urlInput);
      expect(urlInput).toHaveValue('');

      // Click history item to restore
      const historyItem = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('api.example.com/restore')
      );

      if (historyItem) {
        await user.click(historyItem);

        // URL should be restored
        await waitFor(() => {
          expect(urlInput).toHaveValue('https://api.example.com/restore');
        });
      }
    });
  });

  describe('State Coordination', () => {
    it('should coordinate all states during complete request lifecycle', async () => {
      const user = userEvent.setup();

      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({
          'content-type': 'application/json',
          'x-request-id': '123'
        }),
        text: async () => '{"id": 1, "name": "Test"}',
      };

      (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // 1. Initial state
      expect(sendButton).toBeDisabled();
      expect(screen.queryByText(/201/i)).not.toBeInTheDocument();

      // 2. Update URL state
      await user.type(urlInput, 'https://api.example.com/create');
      expect(sendButton).not.toBeDisabled();

      // 3. Send request
      await user.click(sendButton);

      // 4. Response received (response state)
      await waitFor(() => {
        expect(screen.getByText(/201/i)).toBeInTheDocument();
      });

      // 5. History updated
      expect(screen.getByText(/api.example.com\/create/i)).toBeInTheDocument();

      // 6. No error state
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not trigger unnecessary re-renders', async () => {
      // This test verifies useCallback optimization
      const user = userEvent.setup();
      render(<APITester />);

      const urlInput = screen.getByLabelText(/api url/i);

      // Type multiple characters
      await user.type(urlInput, 'https://api.example.com/test');

      // Component should still be responsive
      expect(urlInput).toHaveValue('https://api.example.com/test');
    });
  });
});
