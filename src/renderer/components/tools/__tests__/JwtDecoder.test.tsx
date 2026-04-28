import { webcrypto } from 'node:crypto';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JwtDecoder, formatCountdown } from '../JwtDecoder';

// Canonical HS256 token from jwt.io with secret "your-256-bit-secret"
const CANONICAL_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const CANONICAL_SECRET = 'your-256-bit-secret';

function renderJwt() {
  return render(
    <MemoryRouter>
      <JwtDecoder />
    </MemoryRouter>
  );
}

function decodeToken(jwt: string) {
  const input = screen.getByRole('textbox');
  const decodeButton = screen.getByRole('button', { name: /decode token/i });
  fireEvent.change(input, { target: { value: jwt } });
  fireEvent.click(decodeButton);
}

describe('formatCountdown', () => {
  it('formats > 1 day remaining', () => {
    const now = Date.now() / 1000;
    const result = formatCountdown(now + 2 * 86400 + 3600);
    expect(result.text).toMatch(/expires in 2d 1h/);
    expect(result.status).toBe('future-long');
  });

  it('formats 1h–1d remaining', () => {
    const now = Date.now() / 1000;
    const result = formatCountdown(now + 5 * 3600 + 30 * 60);
    expect(result.text).toMatch(/expires in 5h 30m/);
    expect(result.status).toBe('future-medium');
  });

  it('formats < 1h remaining', () => {
    const now = Date.now() / 1000;
    const result = formatCountdown(now + 25 * 60 + 10);
    expect(result.text).toMatch(/expires in 25m/);
    expect(result.status).toBe('future-soon');
  });

  it('formats already expired', () => {
    const now = Date.now() / 1000;
    const result = formatCountdown(now - 7200 - 15 * 60);
    expect(result.text).toMatch(/expired 2h 15m ago/);
    expect(result.status).toBe('expired');
  });
});

describe('JwtDecoder', () => {
  beforeEach(() => {
    renderJwt();
  });

  describe('Initial State', () => {
    it('should render input textarea', () => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render decode and clear buttons', () => {
      expect(screen.getByRole('button', { name: /decode token/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should render header and payload sections', () => {
      expect(screen.getByText('JWT Token Input')).toBeInTheDocument();
    });
  });

  describe('JWT Decoding (regression)', () => {
    it('should decode a valid JWT token', () => {
      decodeToken(CANONICAL_JWT);

      const headerOutput = screen.getByTestId('jwt-header');
      const payloadOutput = screen.getByTestId('jwt-payload');

      expect(headerOutput.textContent).toContain('"alg": "HS256"');
      expect(headerOutput.textContent).toContain('"typ": "JWT"');
      expect(payloadOutput.textContent).toContain('"sub": "1234567890"');
      expect(payloadOutput.textContent).toContain('"name": "John Doe"');
    });

    it('should handle JWT with Korean characters in payload', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi7ZmN6ri464-ZIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';
      decodeToken(jwt);
      const payloadOutput = screen.getByTestId('jwt-payload');
      expect(payloadOutput.textContent).toContain('"name"');
    });

    it('should handle JWT with nested objects', () => {
      const payload = { user: { id: 1, name: 'Test', roles: ['admin', 'user'] } };
      const header = { alg: 'HS256', typ: 'JWT' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.fake-signature`;
      decodeToken(jwt);
      const payloadOutput = screen.getByTestId('jwt-payload');
      expect(payloadOutput.textContent).toContain('"user"');
      expect(payloadOutput.textContent).toContain('"roles"');
    });

    it('should display signature section', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature-here';
      decodeToken(jwt);
      const signatureOutput = screen.getByTestId('jwt-signature');
      expect(signatureOutput.textContent).toContain('signature-here');
    });
  });

  describe('Error Handling', () => {
    it('should show error for invalid JWT format', () => {
      decodeToken('not-a-jwt-token');
      expect(screen.getByText(/invalid jwt/i)).toBeInTheDocument();
    });

    it('should show error for JWT with only two parts', () => {
      decodeToken('header.payload');
      expect(screen.getByText(/invalid jwt/i)).toBeInTheDocument();
    });

    it('should show error for empty input', () => {
      const decodeButton = screen.getByRole('button', { name: /decode token/i });
      fireEvent.click(decodeButton);
      expect(screen.getByText(/empty/i)).toBeInTheDocument();
    });

    it('should show error for malformed base64', () => {
      decodeToken('invalid@@@.base64$$$invalid.sig');
      expect(screen.getByText(/invalid jwt/i)).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear input and all outputs', () => {
      const input = screen.getByRole('textbox') as HTMLTextAreaElement;
      const clearButton = screen.getByRole('button', { name: /clear/i });

      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig';
      decodeToken(jwt);
      expect(screen.getByTestId('jwt-header')).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(input.value).toBe('');
      expect(screen.queryByTestId('jwt-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('jwt-payload')).not.toBeInTheDocument();
      expect(screen.queryByTestId('jwt-signature')).not.toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should have copy buttons for header, payload, and signature', () => {
      decodeToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig');
      const allButtons = screen.getAllByRole('button');
      const copyButtons = allButtons.filter(
        btn => btn.querySelector('svg[class*="lucide-copy"]') !== null
      );
      expect(copyButtons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Expiry Countdown', () => {
    it('should show rich countdown for future token', () => {
      const exp = Math.floor(Date.now() / 1000) + 7200; // 2h future
      const payload = { sub: '123', exp };
      const header = { alg: 'HS256', typ: 'JWT' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.sig`;
      decodeToken(jwt);
      expect(screen.getByText(/expires in/i)).toBeInTheDocument();
    });

    it('should show expired countdown for past token', () => {
      const exp = Math.floor(Date.now() / 1000) - 7200;
      const payload = { sub: '123', exp };
      const header = { alg: 'HS256', typ: 'JWT' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.sig`;
      decodeToken(jwt);
      expect(screen.getAllByText(/expired/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should display iat claim when present', () => {
      const iat = Math.floor(Date.now() / 1000) - 300;
      const payload = { sub: '123', iat };
      const header = { alg: 'HS256', typ: 'JWT' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.sig`;
      decodeToken(jwt);
      expect(screen.getByText(/issued:/i)).toBeInTheDocument();
    });

    it('should display nbf claim when present', () => {
      const nbf = Math.floor(Date.now() / 1000) + 60;
      const payload = { sub: '123', nbf };
      const header = { alg: 'HS256', typ: 'JWT' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.sig`;
      decodeToken(jwt);
      expect(screen.getByText(/not before:/i)).toBeInTheDocument();
    });
  });

  describe('HMAC Signature Verification', () => {
    it('should show verify section after decoding', () => {
      decodeToken(CANONICAL_JWT);
      expect(screen.getByText(/verify signature/i)).toBeInTheDocument();
    });

    it('should verify correct HMAC secret as success', async () => {
      decodeToken(CANONICAL_JWT);

      const secretInput = screen.getByPlaceholderText(/enter secret/i);
      fireEvent.change(secretInput, { target: { value: CANONICAL_SECRET } });

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await act(async () => {
        fireEvent.click(verifyButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText(/signature verified/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should show mismatch for wrong secret', async () => {
      decodeToken(CANONICAL_JWT);

      const secretInput = screen.getByPlaceholderText(/enter secret/i);
      fireEvent.change(secretInput, { target: { value: 'wrong-secret' } });

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await act(async () => {
        fireEvent.click(verifyButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText(/signature mismatch/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should show neutral message for non-HMAC algorithm', async () => {
      // RS256 token (header only matters for alg detection)
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = { sub: '123' };
      const jwt = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.fakesig`;
      decodeToken(jwt);

      const secretInput = screen.getByPlaceholderText(/enter secret/i);
      fireEvent.change(secretInput, { target: { value: 'any-secret' } });

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await act(async () => {
        fireEvent.click(verifyButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText(/only supports hmac/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should support base64-encoded secret checkbox', async () => {
      // Encode secret as base64 and check the checkbox
      decodeToken(CANONICAL_JWT);

      const secretInput = screen.getByPlaceholderText(/enter secret/i);
      const b64Secret = btoa(CANONICAL_SECRET);
      fireEvent.change(secretInput, { target: { value: b64Secret } });

      const checkbox = screen.getByRole('checkbox', { name: /base64/i });
      fireEvent.click(checkbox);

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await act(async () => {
        fireEvent.click(verifyButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText(/signature verified/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});
