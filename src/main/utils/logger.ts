/**
 * Safe logger that handles EPIPE errors
 */

function safeLog(level: 'log' | 'error' | 'warn' | 'info', ...args: any[]): void {
  try {
    console[level](...args)
  } catch (error) {
    // Silently ignore EPIPE errors and other write errors
    if ((error as any).code !== 'EPIPE') {
      // For non-EPIPE errors, try to log to stderr
      try {
        console.error('Logger error:', error)
      } catch {
        // Completely ignore if even error logging fails
      }
    }
  }
}

export const logger = {
  log: (...args: any[]) => safeLog('log', ...args),
  error: (...args: any[]) => safeLog('error', ...args),
  warn: (...args: any[]) => safeLog('warn', ...args),
  info: (...args: any[]) => safeLog('info', ...args)
}
