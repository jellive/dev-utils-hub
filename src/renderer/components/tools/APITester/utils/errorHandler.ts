import i18n from '@/i18n/config';

export const ErrorType = {
  NETWORK: 'NETWORK',
  CORS: 'CORS',
  TIMEOUT: 'TIMEOUT',
  AUTH: 'AUTH',
  PARSE: 'PARSE',
  ABORT: 'ABORT',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('network request failed') ||
      message.includes('network error')
    );
  }
  return false;
}

export function isCORSError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('cors') ||
      message.includes('cross-origin') ||
      message.includes('access-control-allow-origin')
    );
  }
  return false;
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || message.includes('timed out');
  }
  return false;
}

export function isParseError(error: unknown): boolean {
  if (error instanceof SyntaxError) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('json.parse') || message.includes('unexpected token');
  }
  return false;
}

export function getErrorType(error: unknown): ErrorType {
  // Check for abort
  if (error instanceof Error && error.name === 'AbortError') {
    return ErrorType.ABORT;
  }

  // Check for network errors
  if (isNetworkError(error)) {
    return ErrorType.NETWORK;
  }

  // Check for CORS errors
  if (isCORSError(error)) {
    return ErrorType.CORS;
  }

  // Check for timeout errors
  if (isTimeoutError(error)) {
    return ErrorType.TIMEOUT;
  }

  // Check for parse errors
  if (isParseError(error)) {
    return ErrorType.PARSE;
  }

  // Check for authentication errors (status code based)
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status === 401 || status === 403) {
      return ErrorType.AUTH;
    }
  }

  return ErrorType.UNKNOWN;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return 'An unknown error occurred';
}

export function getErrorSuggestion(error: unknown): string {
  const errorType = getErrorType(error);

  switch (errorType) {
    case ErrorType.NETWORK:
      return i18n.t('tools.api.errors.networkSuggestion');

    case ErrorType.CORS:
      return i18n.t('tools.api.errors.corsSuggestion');

    case ErrorType.TIMEOUT:
      return i18n.t('tools.api.errors.timeoutSuggestion');

    case ErrorType.AUTH:
      return i18n.t('tools.api.errors.authSuggestion');

    case ErrorType.PARSE:
      return i18n.t('tools.api.errors.parseSuggestion');

    case ErrorType.ABORT:
      return i18n.t('tools.api.errors.abortSuggestion');

    case ErrorType.UNKNOWN:
    default:
      return i18n.t('tools.api.errors.unknownSuggestion');
  }
}
