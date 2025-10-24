import { useState, useCallback, useRef } from 'react';

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface ValidationErrors {
  url?: string;
  body?: string;
  headers?: string;
}

interface UseFormValidationOptions {
  debounceMs?: number;
}

interface ValidateAllParams {
  url: string;
  body: string;
  headers: Header[];
}

export function useFormValidation(options: UseFormValidationOptions = {}) {
  const { debounceMs = 0 } = options;
  const [errors, setErrors] = useState<ValidationErrors>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const isValid = Object.keys(errors).length === 0;

  const validateURL = useCallback(
    (url: string) => {
      const validate = () => {
        if (!url || url.trim() === '') {
          setErrors((prev) => ({ ...prev, url: 'URL is required' }));
          return;
        }

        try {
          const urlObj = new URL(url);
          if (!['http:', 'https:'].includes(urlObj.protocol)) {
            setErrors((prev) => ({ ...prev, url: 'URL must use HTTP or HTTPS protocol' }));
            return;
          }
          setErrors((prev) => {
            const { url: _, ...rest } = prev;
            return rest;
          });
        } catch {
          setErrors((prev) => ({ ...prev, url: 'Please enter a valid URL' }));
        }
      };

      if (debounceMs > 0) {
        if (debounceTimers.current.url) {
          clearTimeout(debounceTimers.current.url);
        }
        debounceTimers.current.url = setTimeout(validate, debounceMs);
      } else {
        validate();
      }
    },
    [debounceMs]
  );

  const validateBody = useCallback(
    (body: string) => {
      const validate = () => {
        if (!body || body.trim() === '') {
          setErrors((prev) => {
            const { body: _, ...rest } = prev;
            return rest;
          });
          return;
        }

        try {
          JSON.parse(body);
          setErrors((prev) => {
            const { body: _, ...rest } = prev;
            return rest;
          });
        } catch {
          setErrors((prev) => ({ ...prev, body: 'Invalid JSON format' }));
        }
      };

      if (debounceMs > 0) {
        if (debounceTimers.current.body) {
          clearTimeout(debounceTimers.current.body);
        }
        debounceTimers.current.body = setTimeout(validate, debounceMs);
      } else {
        validate();
      }
    },
    [debounceMs]
  );

  const validateHeaders = useCallback((headers: Header[]) => {
    const enabledHeaders = headers.filter((h) => h.enabled);

    // Check for empty keys or values
    for (const header of enabledHeaders) {
      if (!header.key || header.key.trim() === '') {
        setErrors((prev) => ({ ...prev, headers: 'Header has empty key' }));
        return;
      }
      if (!header.value || header.value.trim() === '') {
        setErrors((prev) => ({ ...prev, headers: 'Header has empty value' }));
        return;
      }
    }

    // Check for duplicate keys
    const keys = enabledHeaders.map((h) => h.key.toLowerCase());
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      setErrors((prev) => ({ ...prev, headers: 'Duplicate header keys found' }));
      return;
    }

    // Validate header key format (basic check)
    const headerKeyRegex = /^[a-zA-Z0-9-]+$/;
    for (const header of enabledHeaders) {
      if (!headerKeyRegex.test(header.key)) {
        setErrors((prev) => ({ ...prev, headers: 'Header key has invalid format' }));
        return;
      }
    }

    setErrors((prev) => {
      const { headers: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const validateAll = useCallback(
    ({ url, body, headers }: ValidateAllParams): boolean => {
      validateURL(url);
      validateBody(body);
      validateHeaders(headers);
      return Object.keys(errors).length === 0;
    },
    [validateURL, validateBody, validateHeaders, errors]
  );

  const clearError = useCallback((field: keyof ValidationErrors) => {
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    isValid,
    validateURL,
    validateBody,
    validateHeaders,
    validateAll,
    clearError,
    clearAllErrors,
  };
}
