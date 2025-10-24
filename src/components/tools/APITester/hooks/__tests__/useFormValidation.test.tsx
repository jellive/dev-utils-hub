import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';

describe('useFormValidation', () => {
  describe('URL Validation', () => {
    it('should validate correct HTTP URL', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('https://api.example.com/users');
      });

      expect(result.current.errors.url).toBeUndefined();
      expect(result.current.isValid).toBe(true);
    });

    it('should validate correct HTTPS URL', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('http://localhost:3000/api');
      });

      expect(result.current.errors.url).toBeUndefined();
      expect(result.current.isValid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('not-a-url');
      });

      expect(result.current.errors.url).toBeDefined();
      expect(result.current.errors.url).toContain('valid URL');
      expect(result.current.isValid).toBe(false);
    });

    it('should reject empty URL', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('');
      });

      expect(result.current.errors.url).toBeDefined();
      expect(result.current.errors.url).toContain('required');
      expect(result.current.isValid).toBe(false);
    });

    it('should reject URL without protocol', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('example.com');
      });

      expect(result.current.errors.url).toBeDefined();
      expect(result.current.isValid).toBe(false);
    });

    it('should accept URL with query parameters', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('https://api.example.com/users?page=1&limit=10');
      });

      expect(result.current.errors.url).toBeUndefined();
      expect(result.current.isValid).toBe(true);
    });

    it('should accept localhost URLs', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('http://localhost:8080/api');
      });

      expect(result.current.errors.url).toBeUndefined();
      expect(result.current.isValid).toBe(true);
    });
  });

  describe('JSON Body Validation', () => {
    it('should validate correct JSON', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateBody('{"name": "John", "age": 30}');
      });

      expect(result.current.errors.body).toBeUndefined();
    });

    it('should allow empty body', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateBody('');
      });

      expect(result.current.errors.body).toBeUndefined();
    });

    it('should reject invalid JSON syntax', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateBody('{"name": invalid}');
      });

      expect(result.current.errors.body).toBeDefined();
      expect(result.current.errors.body).toContain('Invalid JSON');
    });

    it('should reject malformed JSON', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateBody('{"name": "John"');
      });

      expect(result.current.errors.body).toBeDefined();
    });

    it('should validate nested JSON', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateBody('{"user": {"name": "John", "address": {"city": "NYC"}}}');
      });

      expect(result.current.errors.body).toBeUndefined();
    });

    it('should validate JSON array', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateBody('[{"id": 1}, {"id": 2}]');
      });

      expect(result.current.errors.body).toBeUndefined();
    });
  });

  describe('Headers Validation', () => {
    it('should validate correct headers', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateHeaders([
          { key: 'Content-Type', value: 'application/json', enabled: true },
          { key: 'Authorization', value: 'Bearer token123', enabled: true },
        ]);
      });

      expect(result.current.errors.headers).toBeUndefined();
    });

    it('should allow empty headers', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateHeaders([]);
      });

      expect(result.current.errors.headers).toBeUndefined();
    });

    it('should reject headers with empty key', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateHeaders([
          { key: '', value: 'application/json', enabled: true },
        ]);
      });

      expect(result.current.errors.headers).toBeDefined();
      expect(result.current.errors.headers).toContain('empty key');
    });

    it('should reject headers with empty value', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateHeaders([
          { key: 'Content-Type', value: '', enabled: true },
        ]);
      });

      expect(result.current.errors.headers).toBeDefined();
      expect(result.current.errors.headers).toContain('empty value');
    });

    it('should ignore disabled headers in validation', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateHeaders([
          { key: '', value: '', enabled: false },
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ]);
      });

      expect(result.current.errors.headers).toBeUndefined();
    });

    it('should reject duplicate header keys', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateHeaders([
          { key: 'Content-Type', value: 'application/json', enabled: true },
          { key: 'Content-Type', value: 'text/plain', enabled: true },
        ]);
      });

      expect(result.current.errors.headers).toBeDefined();
      expect(result.current.errors.headers?.toLowerCase()).toContain('duplicate');
    });

    it('should validate header key format', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateHeaders([
          { key: 'Invalid Header!', value: 'value', enabled: true },
        ]);
      });

      expect(result.current.errors.headers).toBeDefined();
      expect(result.current.errors.headers).toContain('invalid format');
    });
  });

  describe('Overall Form Validation', () => {
    it('should return valid when all fields are correct', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('https://api.example.com/users');
        result.current.validateBody('{"name": "John"}');
        result.current.validateHeaders([
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ]);
      });

      expect(result.current.isValid).toBe(true);
      expect(Object.keys(result.current.errors)).toHaveLength(0);
    });

    it('should return invalid when any field has errors', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('invalid-url');
        result.current.validateBody('{"name": "John"}');
      });

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.url).toBeDefined();
    });

    it('should provide validateAll method', () => {
      const { result } = renderHook(() => useFormValidation());

      const isValid = result.current.validateAll({
        url: 'https://api.example.com',
        body: '{"test": true}',
        headers: [],
      });

      expect(isValid).toBe(true);
    });

    it('should clear specific field error', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('invalid');
        result.current.validateBody('invalid json');
      });

      expect(result.current.errors.url).toBeDefined();
      expect(result.current.errors.body).toBeDefined();

      act(() => {
        result.current.clearError('url');
      });

      expect(result.current.errors.url).toBeUndefined();
      expect(result.current.errors.body).toBeDefined();
    });

    it('should clear all errors', () => {
      const { result } = renderHook(() => useFormValidation());

      act(() => {
        result.current.validateURL('invalid');
        result.current.validateBody('invalid json');
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      act(() => {
        result.current.clearAllErrors();
      });

      expect(Object.keys(result.current.errors)).toHaveLength(0);
    });
  });

  describe('Debounced Validation', () => {
    it('should debounce URL validation', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useFormValidation({ debounceMs: 300 }));

      act(() => {
        result.current.validateURL('invalid');
      });

      // Error should not appear immediately
      expect(result.current.errors.url).toBeUndefined();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Error should appear after debounce
      expect(result.current.errors.url).toBeDefined();

      vi.useRealTimers();
    });

    it('should debounce body validation', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useFormValidation({ debounceMs: 300 }));

      act(() => {
        result.current.validateBody('invalid json');
      });

      expect(result.current.errors.body).toBeUndefined();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.errors.body).toBeDefined();

      vi.useRealTimers();
    });

    it('should cancel previous debounce on new validation', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useFormValidation({ debounceMs: 300 }));

      act(() => {
        result.current.validateURL('invalid1');
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      act(() => {
        result.current.validateURL('https://valid.com');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not have error because last validation was valid
      expect(result.current.errors.url).toBeUndefined();

      vi.useRealTimers();
    });
  });
});
