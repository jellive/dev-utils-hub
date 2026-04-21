import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ErrorType,
  isNetworkError,
  isCORSError,
  isTimeoutError,
  isParseError,
  getErrorType,
  getErrorMessage,
  getErrorSuggestion,
} from '../utils/errorHandler';
import i18n from '@/i18n/config';

/**
 * Error Handler Utility Tests
 *
 * Comprehensive tests for API Tester error handling utilities including:
 * - Error type detection (network, CORS, timeout, auth, parse, abort)
 * - Error message extraction
 * - Error suggestion generation
 * - Edge case handling for various error formats
 */

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ErrorType constants', () => {
    it('should define all error types', () => {
      expect(ErrorType.NETWORK).toBe('NETWORK');
      expect(ErrorType.CORS).toBe('CORS');
      expect(ErrorType.TIMEOUT).toBe('TIMEOUT');
      expect(ErrorType.AUTH).toBe('AUTH');
      expect(ErrorType.PARSE).toBe('PARSE');
      expect(ErrorType.ABORT).toBe('ABORT');
      expect(ErrorType.UNKNOWN).toBe('UNKNOWN');
    });

    it('should have readonly error types', () => {
      expect(Object.keys(ErrorType)).toHaveLength(7);
    });
  });

  describe('isNetworkError', () => {
    it('should detect "failed to fetch" error', () => {
      const error = new Error('Failed to fetch');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should detect "network request failed" error', () => {
      const error = new Error('Network request failed');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should detect "network error" error', () => {
      const error = new Error('Network Error occurred');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should be case insensitive', () => {
      const error = new Error('FAILED TO FETCH');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      const error = new Error('Something else happened');
      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isNetworkError('not an error')).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
      expect(isNetworkError(42)).toBe(false);
    });
  });

  describe('isCORSError', () => {
    it('should detect CORS keyword', () => {
      const error = new Error('CORS policy blocked the request');
      expect(isCORSError(error)).toBe(true);
    });

    it('should detect cross-origin keyword', () => {
      const error = new Error('Cross-Origin Request Blocked');
      expect(isCORSError(error)).toBe(true);
    });

    it('should detect access-control-allow-origin keyword', () => {
      const error = new Error('Access-Control-Allow-Origin header missing');
      expect(isCORSError(error)).toBe(true);
    });

    it('should be case insensitive', () => {
      const error = new Error('CORS ERROR');
      expect(isCORSError(error)).toBe(true);
    });

    it('should return false for non-CORS errors', () => {
      const error = new Error('Network timeout');
      expect(isCORSError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isCORSError('not an error')).toBe(false);
      expect(isCORSError(null)).toBe(false);
      expect(isCORSError(undefined)).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('should detect timeout keyword', () => {
      const error = new Error('Request timeout');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should detect "timed out" phrase', () => {
      const error = new Error('Connection timed out');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should be case insensitive', () => {
      const error = new Error('TIMEOUT ERROR');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should return false for non-timeout errors', () => {
      const error = new Error('Network failure');
      expect(isTimeoutError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isTimeoutError('not an error')).toBe(false);
      expect(isTimeoutError(null)).toBe(false);
    });
  });

  describe('isParseError', () => {
    it('should detect SyntaxError', () => {
      const error = new SyntaxError('Unexpected token');
      expect(isParseError(error)).toBe(true);
    });

    it('should detect JSON.parse error message', () => {
      const error = new Error('JSON.parse failed');
      expect(isParseError(error)).toBe(true);
    });

    it('should detect "unexpected token" message', () => {
      const error = new Error('Unexpected token < in JSON at position 0');
      expect(isParseError(error)).toBe(true);
    });

    it('should be case insensitive', () => {
      const error = new Error('UNEXPECTED TOKEN IN JSON');
      expect(isParseError(error)).toBe(true);
    });

    it('should return false for non-parse errors', () => {
      const error = new Error('Network timeout');
      expect(isParseError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isParseError('not an error')).toBe(false);
      expect(isParseError(null)).toBe(false);
    });
  });

  describe('getErrorType', () => {
    it('should return ABORT for AbortError', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      expect(getErrorType(error)).toBe(ErrorType.ABORT);
    });

    it('should return NETWORK for network errors', () => {
      const error = new Error('Failed to fetch');
      expect(getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it('should return CORS for CORS errors', () => {
      const error = new Error('CORS policy blocked');
      expect(getErrorType(error)).toBe(ErrorType.CORS);
    });

    it('should return TIMEOUT for timeout errors', () => {
      const error = new Error('Request timeout');
      expect(getErrorType(error)).toBe(ErrorType.TIMEOUT);
    });

    it('should return PARSE for parse errors', () => {
      const error = new SyntaxError('Unexpected token');
      expect(getErrorType(error)).toBe(ErrorType.PARSE);
    });

    it('should return AUTH for 401 status code', () => {
      const error = { status: 401, message: 'Unauthorized' };
      expect(getErrorType(error)).toBe(ErrorType.AUTH);
    });

    it('should return AUTH for 403 status code', () => {
      const error = { status: 403, message: 'Forbidden' };
      expect(getErrorType(error)).toBe(ErrorType.AUTH);
    });

    it('should return UNKNOWN for unrecognized errors', () => {
      const error = new Error('Something unexpected');
      expect(getErrorType(error)).toBe(ErrorType.UNKNOWN);
    });

    it('should return UNKNOWN for non-Error objects without status', () => {
      expect(getErrorType('string error')).toBe(ErrorType.UNKNOWN);
      expect(getErrorType(42)).toBe(ErrorType.UNKNOWN);
      expect(getErrorType(null)).toBe(ErrorType.UNKNOWN);
    });

    it('should prioritize AbortError over other error types', () => {
      const error = new Error('Failed to fetch');
      error.name = 'AbortError';
      expect(getErrorType(error)).toBe(ErrorType.ABORT);
    });

    it('should prioritize network errors over CORS errors', () => {
      const error = new Error('Failed to fetch due to CORS');
      expect(getErrorType(error)).toBe(ErrorType.NETWORK);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return string errors directly', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should extract message property from objects', () => {
      const error = { message: 'Object error message' };
      expect(getErrorMessage(error)).toBe('Object error message');
    });

    it('should convert non-string message to string', () => {
      const error = { message: 42 };
      expect(getErrorMessage(error)).toBe('42');
    });

    it('should return default message for null', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
    });

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    });

    it('should return default message for number', () => {
      expect(getErrorMessage(42)).toBe('An unknown error occurred');
    });

    it('should return default message for objects without message property', () => {
      const error = { status: 500 };
      expect(getErrorMessage(error)).toBe('An unknown error occurred');
    });
  });

  describe('getErrorSuggestion', () => {
    beforeEach(() => {
      // Mock i18n translations
      vi.spyOn(i18n, 't').mockImplementation((key: string) => {
        const translations: Record<string, string> = {
          'tools.api.errors.networkSuggestion': 'Check your internet connection',
          'tools.api.errors.corsSuggestion': 'Configure CORS on the server',
          'tools.api.errors.timeoutSuggestion': 'Increase timeout or check server response time',
          'tools.api.errors.authSuggestion': 'Check authentication credentials',
          'tools.api.errors.parseSuggestion': 'Verify response format',
          'tools.api.errors.abortSuggestion': 'Request was cancelled',
          'tools.api.errors.unknownSuggestion': 'An unexpected error occurred',
        };
        return translations[key] || key;
      });
    });

    it('should return network suggestion for network errors', () => {
      const error = new Error('Failed to fetch');
      expect(getErrorSuggestion(error)).toBe('Check your internet connection');
    });

    it('should return CORS suggestion for CORS errors', () => {
      const error = new Error('CORS policy blocked');
      expect(getErrorSuggestion(error)).toBe('Configure CORS on the server');
    });

    it('should return timeout suggestion for timeout errors', () => {
      const error = new Error('Request timeout');
      expect(getErrorSuggestion(error)).toBe('Increase timeout or check server response time');
    });

    it('should return auth suggestion for 401 errors', () => {
      const error = { status: 401 };
      expect(getErrorSuggestion(error)).toBe('Check authentication credentials');
    });

    it('should return auth suggestion for 403 errors', () => {
      const error = { status: 403 };
      expect(getErrorSuggestion(error)).toBe('Check authentication credentials');
    });

    it('should return parse suggestion for parse errors', () => {
      const error = new SyntaxError('Unexpected token');
      expect(getErrorSuggestion(error)).toBe('Verify response format');
    });

    it('should return abort suggestion for AbortError', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      expect(getErrorSuggestion(error)).toBe('Request was cancelled');
    });

    it('should return unknown suggestion for unrecognized errors', () => {
      const error = new Error('Something unexpected');
      expect(getErrorSuggestion(error)).toBe('An unexpected error occurred');
    });

    it('should handle null and undefined errors', () => {
      expect(getErrorSuggestion(null)).toBe('An unexpected error occurred');
      expect(getErrorSuggestion(undefined)).toBe('An unexpected error occurred');
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly categorize and provide suggestions for network failure', () => {
      const error = new Error('Failed to fetch');
      expect(getErrorType(error)).toBe(ErrorType.NETWORK);
      expect(getErrorMessage(error)).toBe('Failed to fetch');
      expect(getErrorSuggestion(error)).toContain('connection');
    });

    it('should correctly handle authentication errors with status codes', () => {
      const error = { status: 401, message: 'Unauthorized access' };
      expect(getErrorType(error)).toBe(ErrorType.AUTH);
      expect(getErrorMessage(error)).toBe('Unauthorized access');
      expect(getErrorSuggestion(error)).toContain('authentication');
    });

    it('should correctly handle JSON parsing errors', () => {
      const error = new SyntaxError('Unexpected token < in JSON at position 0');
      expect(getErrorType(error)).toBe(ErrorType.PARSE);
      expect(getErrorMessage(error)).toBe('Unexpected token < in JSON at position 0');
      expect(getErrorSuggestion(error)).toContain('format');
    });

    it('should correctly handle aborted requests', () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      expect(getErrorType(error)).toBe(ErrorType.ABORT);
      expect(getErrorMessage(error)).toBe('The operation was aborted');
      expect(getErrorSuggestion(error)).toContain('cancelled');
    });
  });
});
