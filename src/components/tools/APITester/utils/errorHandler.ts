export enum ErrorType {
  NETWORK = 'NETWORK',
  CORS = 'CORS',
  TIMEOUT = 'TIMEOUT',
  AUTH = 'AUTH',
  PARSE = 'PARSE',
  ABORT = 'ABORT',
  UNKNOWN = 'UNKNOWN',
}

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
      return 'Please check your internet connection and try again.';

    case ErrorType.CORS:
      return 'This request is being blocked by CORS policy. The server needs to allow cross-origin requests from this domain.';

    case ErrorType.TIMEOUT:
      return 'The request took too long to complete. Try increasing the timeout or check if the server is responding.';

    case ErrorType.AUTH:
      return 'Authentication failed. Please check your credentials or authorization tokens.';

    case ErrorType.PARSE:
      return 'Failed to parse the response. Please check if the response format is correct.';

    case ErrorType.ABORT:
      return 'The request was cancelled.';

    case ErrorType.UNKNOWN:
    default:
      return 'An error occurred. Please try again or check the error details.';
  }
}
