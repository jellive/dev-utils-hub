import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JwtDecoder } from '../JwtDecoder';

describe('JwtDecoder', () => {
  beforeEach(() => {
    render(<JwtDecoder />);
  });

  describe('Initial State', () => {
    it('should render input textarea', () => {
      expect(screen.getByPlaceholderText(/paste.*jwt/i)).toBeInTheDocument();
    });

    it('should render decode and clear buttons', () => {
      expect(screen.getByRole('button', { name: /decode/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should render header and payload sections', () => {
      expect(screen.getByText(/header/i)).toBeInTheDocument();
      expect(screen.getByText(/payload/i)).toBeInTheDocument();
    });
  });

  describe('JWT Decoding', () => {
    it('should decode a valid JWT token', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      // Standard JWT: header.payload.signature
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      fireEvent.change(input, { target: { value: jwt } });
      fireEvent.click(decodeButton);

      const headerOutput = screen.getByTestId('jwt-header');
      const payloadOutput = screen.getByTestId('jwt-payload');

      expect(headerOutput.textContent).toContain('"alg": "HS256"');
      expect(headerOutput.textContent).toContain('"typ": "JWT"');
      expect(payloadOutput.textContent).toContain('"sub": "1234567890"');
      expect(payloadOutput.textContent).toContain('"name": "John Doe"');
    });

    it('should handle JWT with Korean characters in payload', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      // JWT with Korean name
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi7ZmN6ri464-ZIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';

      fireEvent.change(input, { target: { value: jwt } });
      fireEvent.click(decodeButton);

      const payloadOutput = screen.getByTestId('jwt-payload');
      expect(payloadOutput.textContent).toContain('"name"');
    });

    it('should handle JWT with nested objects', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      // JWT with nested user object
      const payload = { user: { id: 1, name: 'Test', roles: ['admin', 'user'] } };
      const header = { alg: 'HS256', typ: 'JWT' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.fake-signature`;

      fireEvent.change(input, { target: { value: jwt } });
      fireEvent.click(decodeButton);

      const payloadOutput = screen.getByTestId('jwt-payload');
      expect(payloadOutput.textContent).toContain('"user"');
      expect(payloadOutput.textContent).toContain('"roles"');
    });

    it('should display signature section', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature-here';

      fireEvent.change(input, { target: { value: jwt } });
      fireEvent.click(decodeButton);

      const signatureOutput = screen.getByTestId('jwt-signature');
      expect(signatureOutput.textContent).toContain('signature-here');
    });
  });

  describe('Error Handling', () => {
    it('should show error for invalid JWT format', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      fireEvent.change(input, { target: { value: 'not-a-jwt-token' } });
      fireEvent.click(decodeButton);

      expect(screen.getByText(/invalid jwt/i)).toBeInTheDocument();
    });

    it('should show error for JWT with only two parts', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      fireEvent.change(input, { target: { value: 'header.payload' } });
      fireEvent.click(decodeButton);

      expect(screen.getByText(/invalid jwt/i)).toBeInTheDocument();
    });

    it('should show error for empty input', () => {
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      fireEvent.click(decodeButton);

      expect(screen.getByText(/empty/i)).toBeInTheDocument();
    });

    it('should show error for malformed base64', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      fireEvent.change(input, { target: { value: 'invalid@@@.base64$$$invalid.sig' } });
      fireEvent.click(decodeButton);

      expect(screen.getByText(/invalid jwt/i)).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear input and all outputs', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i) as HTMLTextAreaElement;
      const decodeButton = screen.getByRole('button', { name: /decode/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig';

      fireEvent.change(input, { target: { value: jwt } });
      fireEvent.click(decodeButton);
      expect(input.value).toBe(jwt);

      fireEvent.click(clearButton);
      expect(input.value).toBe('');

      const headerOutput = screen.getByTestId('jwt-header');
      const payloadOutput = screen.getByTestId('jwt-payload');
      const signatureOutput = screen.getByTestId('jwt-signature');

      expect(headerOutput.textContent).toBe('');
      expect(payloadOutput.textContent).toBe('');
      expect(signatureOutput.textContent).toBe('');
    });
  });

  describe('Copy Functionality', () => {
    it('should have copy buttons for header and payload', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      // Decode a JWT first to show copy buttons
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig';
      fireEvent.change(input, { target: { value: jwt } });
      fireEvent.click(decodeButton);

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      // Should have 2 copy buttons (header and payload)
      expect(copyButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Token Information Display', () => {
    it('should display token expiration if present', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      // Current time + 1 hour
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { sub: '123', exp };
      const header = { alg: 'HS256', typ: 'JWT' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.sig`;

      fireEvent.change(input, { target: { value: jwt } });
      fireEvent.click(decodeButton);

      // Should show expiration info
      expect(screen.getByText(/expires/i)).toBeInTheDocument();
    });

    it('should show warning for expired tokens', () => {
      const input = screen.getByPlaceholderText(/paste.*jwt/i);
      const decodeButton = screen.getByRole('button', { name: /decode/i });

      // Past time
      const exp = Math.floor(Date.now() / 1000) - 3600;
      const payload = { sub: '123', exp };
      const header = { alg: 'HS256', typ: 'JWT' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.sig`;

      fireEvent.change(input, { target: { value: jwt } });
      fireEvent.click(decodeButton);

      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });
  });
});
