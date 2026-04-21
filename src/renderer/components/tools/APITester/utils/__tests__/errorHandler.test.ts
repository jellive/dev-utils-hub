import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  getErrorType,
  isNetworkError,
  isCORSError,
  isTimeoutError,
  isParseError,
  getErrorSuggestion,
  ErrorType,
} from '../errorHandler';

describe('errorHandler', () => {
  describe('getErrorType', () => {
    it('should identify network errors', () => {
      const error = new Error('Failed to fetch');
      expect(getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it('should identify CORS errors', () => {
      const error = new Error('CORS policy');
      expect(getErrorType(error)).toBe(ErrorType.CORS);
    });

    it('should identify timeout errors', () => {
      const error = new Error('Request timeout');
      expect(getErrorType(error)).toBe(ErrorType.TIMEOUT);
    });

    it('should identify abort errors', () => {
      const error = new Error('AbortError');
      error.name = 'AbortError';
      expect(getErrorType(error)).toBe(ErrorType.ABORT);
    });

    it('should identify parse errors', () => {
      const error = new SyntaxError('Unexpected token');
      expect(getErrorType(error)).toBe(ErrorType.PARSE);
    });

    it('should identify authentication errors from status code', () => {
      const error = { status: 401, message: 'Unauthorized' };
      expect(getErrorType(error)).toBe(ErrorType.AUTH);
    });

    it('should identify authorization errors from status code', () => {
      const error = { status: 403, message: 'Forbidden' };
      expect(getErrorType(error)).toBe(ErrorType.AUTH);
    });

    it('should return UNKNOWN for unrecognized errors', () => {
      const error = new Error('Some random error');
      expect(getErrorType(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for fetch errors', () => {
      const error = new Error('Failed to fetch');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for network errors', () => {
      const error = new Error('Network request failed');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Something else');
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isCORSError', () => {
    it('should return true for CORS policy errors', () => {
      const error = new Error('CORS policy: No Access-Control-Allow-Origin');
      expect(isCORSError(error)).toBe(true);
    });

    it('should return true for cross-origin errors', () => {
      const error = new Error('Cross-origin request blocked');
      expect(isCORSError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Something else');
      expect(isCORSError(error)).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('should return true for timeout errors', () => {
      const error = new Error('Request timeout');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should return true for timed out errors', () => {
      const error = new Error('Request timed out');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Something else');
      expect(isTimeoutError(error)).toBe(false);
    });
  });

  describe('isParseError', () => {
    it('should return true for SyntaxError', () => {
      const error = new SyntaxError('Unexpected token');
      expect(isParseError(error)).toBe(true);
    });

    it('should return true for JSON parse errors', () => {
      const error = new Error('JSON.parse error');
      expect(isParseError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Something else');
      expect(isParseError(error)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message for Error objects', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should return string for string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return message property for objects with message', () => {
      const error = { message: 'Object error' };
      expect(getErrorMessage(error)).toBe('Object error');
    });

    it('should return default message for unknown error types', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
    });

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    });
  });

  describe('getErrorSuggestion', () => {
    it('should return translated suggestion for network errors', () => {
      const error = new Error('Failed to fetch');
      const suggestion = getErrorSuggestion(error);
      expect(suggestion).toBeTruthy();
      expect(typeof suggestion).toBe('string');
    });

    it('should return translated suggestion for CORS errors', () => {
      const error = new Error('CORS policy');
      const suggestion = getErrorSuggestion(error);
      expect(suggestion).toBeTruthy();
      expect(typeof suggestion).toBe('string');
    });

    it('should return translated suggestion for timeout errors', () => {
      const error = new Error('Request timeout');
      const suggestion = getErrorSuggestion(error);
      expect(suggestion).toBeTruthy();
      expect(typeof suggestion).toBe('string');
    });

    it('should return translated suggestion for auth errors', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const suggestion = getErrorSuggestion(error);
      expect(suggestion).toBeTruthy();
      expect(typeof suggestion).toBe('string');
    });

    it('should return translated suggestion for parse errors', () => {
      const error = new SyntaxError('Unexpected token');
      const suggestion = getErrorSuggestion(error);
      expect(suggestion).toBeTruthy();
      expect(typeof suggestion).toBe('string');
    });

    it('should return translated suggestion for unknown errors', () => {
      const error = new Error('Random error');
      const suggestion = getErrorSuggestion(error);
      expect(suggestion).toBeTruthy();
      expect(typeof suggestion).toBe('string');
    });
  });

  describe('Error Type Constants', () => {
    it('should have all error types defined', () => {
      expect(ErrorType.NETWORK).toBe('NETWORK');
      expect(ErrorType.CORS).toBe('CORS');
      expect(ErrorType.TIMEOUT).toBe('TIMEOUT');
      expect(ErrorType.AUTH).toBe('AUTH');
      expect(ErrorType.PARSE).toBe('PARSE');
      expect(ErrorType.ABORT).toBe('ABORT');
      expect(ErrorType.UNKNOWN).toBe('UNKNOWN');
    });
  });
});
