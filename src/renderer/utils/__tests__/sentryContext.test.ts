import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @sentry/react before importing sentryContext
vi.mock('@sentry/react', () => ({
  isInitialized: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((cb) => cb({ setTag: vi.fn(), setContext: vi.fn(), setLevel: vi.fn() })),
  startTransaction: vi.fn(() => ({
    setTag: vi.fn(),
    setData: vi.fn(),
    setStatus: vi.fn(),
    finish: vi.fn(),
  })),
}));

import * as Sentry from '@sentry/react';
import {
  setCurrentTool,
  setCurrentFeature,
  addNavigationBreadcrumb,
  addInteractionBreadcrumb,
  addAPIBreadcrumb,
  addConversionBreadcrumb,
  addErrorBreadcrumb,
  setDeviceContext,
  setPerformanceContext,
  initializeSentryContext,
  TOOLS,
  FEATURES,
  INTERACTION_TYPES,
} from '../sentryContext';

const mockIsInitialized = vi.mocked(Sentry.isInitialized);
const mockSetTag = vi.mocked(Sentry.setTag);
const mockAddBreadcrumb = vi.mocked(Sentry.addBreadcrumb);
const mockSetContext = vi.mocked(Sentry.setContext);

beforeEach(() => {
  vi.clearAllMocks();
  mockIsInitialized.mockReturnValue(false);
});

describe('TOOLS constants', () => {
  it('exports expected tool constants', () => {
    expect(TOOLS.JSON_FORMATTER).toBe('json');
    expect(TOOLS.JWT_DECODER).toBe('jwt');
    expect(TOOLS.BASE64_CONVERTER).toBe('base64');
    expect(TOOLS.UUID_GENERATOR).toBe('uuid');
    expect(TOOLS.TIMESTAMP_CONVERTER).toBe('timestamp');
  });
});

describe('FEATURES constants', () => {
  it('exports expected feature constants', () => {
    expect(FEATURES.NAVIGATION).toBe('navigation');
    expect(FEATURES.TOOL_USAGE).toBe('tool-usage');
    expect(FEATURES.HISTORY).toBe('history');
  });
});

describe('INTERACTION_TYPES constants', () => {
  it('exports expected interaction type constants', () => {
    expect(INTERACTION_TYPES.CLICK).toBe('click');
    expect(INTERACTION_TYPES.COPY).toBe('copy');
    expect(INTERACTION_TYPES.ERROR).toBe('error');
  });
});

describe('setCurrentTool', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    setCurrentTool(TOOLS.JSON_FORMATTER);
    expect(mockSetTag).not.toHaveBeenCalled();
  });

  it('sets tool tag when Sentry is initialized', () => {
    mockIsInitialized.mockReturnValue(true);
    setCurrentTool(TOOLS.JSON_FORMATTER);
    expect(mockSetTag).toHaveBeenCalledWith('tool', 'json');
  });

  it('sets tool.category tag when Sentry is initialized', () => {
    mockIsInitialized.mockReturnValue(true);
    setCurrentTool(TOOLS.JSON_FORMATTER);
    expect(mockSetTag).toHaveBeenCalledWith('tool.category', 'formatter');
  });

  it('sets correct category for converter tools', () => {
    mockIsInitialized.mockReturnValue(true);
    setCurrentTool(TOOLS.BASE64_CONVERTER);
    expect(mockSetTag).toHaveBeenCalledWith('tool.category', 'converter');
  });

  it('sets correct category for UUID generator', () => {
    mockIsInitialized.mockReturnValue(true);
    setCurrentTool(TOOLS.UUID_GENERATOR);
    expect(mockSetTag).toHaveBeenCalledWith('tool.category', 'generator');
  });
});

describe('setCurrentFeature', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    setCurrentFeature(FEATURES.NAVIGATION);
    expect(mockSetTag).not.toHaveBeenCalled();
  });

  it('sets feature tag when initialized', () => {
    mockIsInitialized.mockReturnValue(true);
    setCurrentFeature(FEATURES.HISTORY);
    expect(mockSetTag).toHaveBeenCalledWith('feature', 'history');
  });
});

describe('addNavigationBreadcrumb', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    addNavigationBreadcrumb('home', 'json');
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it('adds breadcrumb with from/to when initialized', () => {
    mockIsInitialized.mockReturnValue(true);
    addNavigationBreadcrumb('home', 'json');
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'navigation',
        level: 'info',
        data: expect.objectContaining({ from: 'home', to: 'json' }),
      })
    );
  });

  it('includes timestamp in breadcrumb data', () => {
    mockIsInitialized.mockReturnValue(true);
    addNavigationBreadcrumb('a', 'b');
    const call = mockAddBreadcrumb.mock.calls[0][0];
    expect(call.data?.timestamp).toBeDefined();
  });
});

describe('addInteractionBreadcrumb', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    addInteractionBreadcrumb(INTERACTION_TYPES.CLICK, 'button');
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it('adds interaction breadcrumb with type and target', () => {
    mockIsInitialized.mockReturnValue(true);
    addInteractionBreadcrumb(INTERACTION_TYPES.COPY, 'hex-value', { color: '#ff0000' });
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'user-interaction',
        level: 'info',
        data: expect.objectContaining({
          type: 'copy',
          target: 'hex-value',
          color: '#ff0000',
        }),
      })
    );
  });

  it('works without optional details', () => {
    mockIsInitialized.mockReturnValue(true);
    addInteractionBreadcrumb(INTERACTION_TYPES.CLICK, 'btn');
    expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
  });
});

describe('addAPIBreadcrumb', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    addAPIBreadcrumb('GET', '/api/data');
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it('adds breadcrumb with method and url', () => {
    mockIsInitialized.mockReturnValue(true);
    addAPIBreadcrumb('POST', '/api/save', 200, 150);
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'http',
        level: 'info',
        data: expect.objectContaining({
          method: 'POST',
          url: '/api/save',
          status_code: 200,
          duration_ms: 150,
        }),
      })
    );
  });

  it('uses error level for 4xx status codes', () => {
    mockIsInitialized.mockReturnValue(true);
    addAPIBreadcrumb('GET', '/api/fail', 404);
    const call = mockAddBreadcrumb.mock.calls[0][0];
    expect(call.level).toBe('error');
  });

  it('uses error level for 5xx status codes', () => {
    mockIsInitialized.mockReturnValue(true);
    addAPIBreadcrumb('POST', '/api/error', 500);
    const call = mockAddBreadcrumb.mock.calls[0][0];
    expect(call.level).toBe('error');
  });

  it('uses info level for success status codes', () => {
    mockIsInitialized.mockReturnValue(true);
    addAPIBreadcrumb('GET', '/api/ok', 200);
    const call = mockAddBreadcrumb.mock.calls[0][0];
    expect(call.level).toBe('info');
  });

  it('works without optional statusCode and duration', () => {
    mockIsInitialized.mockReturnValue(true);
    addAPIBreadcrumb('GET', '/api/test');
    expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
  });
});

describe('addConversionBreadcrumb', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    addConversionBreadcrumb(TOOLS.BASE64_CONVERTER, 10, 20, true);
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it('adds conversion breadcrumb with success info level', () => {
    mockIsInitialized.mockReturnValue(true);
    addConversionBreadcrumb(TOOLS.JSON_FORMATTER, 100, 200, true);
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'conversion',
        level: 'info',
        data: expect.objectContaining({
          tool: 'json',
          input_size: 100,
          output_size: 200,
          success: true,
        }),
      })
    );
  });

  it('uses warning level for failed conversion', () => {
    mockIsInitialized.mockReturnValue(true);
    addConversionBreadcrumb(TOOLS.JSON_FORMATTER, 50, 0, false);
    const call = mockAddBreadcrumb.mock.calls[0][0];
    expect(call.level).toBe('warning');
  });
});

describe('addErrorBreadcrumb', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    addErrorBreadcrumb('ParseError', 'Invalid JSON');
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it('adds error breadcrumb with type and message', () => {
    mockIsInitialized.mockReturnValue(true);
    addErrorBreadcrumb('NetworkError', 'Connection refused', 'api-call');
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'error',
        level: 'error',
        data: expect.objectContaining({
          error_type: 'NetworkError',
          error_message: 'Connection refused',
          context: 'api-call',
        }),
      })
    );
  });

  it('works without optional context', () => {
    mockIsInitialized.mockReturnValue(true);
    addErrorBreadcrumb('TypeError', 'Cannot read property');
    expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
  });
});

describe('setDeviceContext', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    setDeviceContext();
    expect(mockSetContext).not.toHaveBeenCalled();
  });

  it('sets device context when initialized', () => {
    mockIsInitialized.mockReturnValue(true);
    setDeviceContext();
    expect(mockSetContext).toHaveBeenCalledWith('device', expect.any(Object));
  });

  it('includes browser, screen, viewport, device, platform in context', () => {
    mockIsInitialized.mockReturnValue(true);
    setDeviceContext();
    const ctx = mockSetContext.mock.calls[0][1] as any;
    expect(ctx).toHaveProperty('browser');
    expect(ctx).toHaveProperty('screen');
    expect(ctx).toHaveProperty('viewport');
    expect(ctx).toHaveProperty('device');
    expect(ctx).toHaveProperty('platform');
  });
});

describe('setPerformanceContext', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    setPerformanceContext();
    expect(mockSetContext).not.toHaveBeenCalled();
  });

  it('runs without error when initialized', () => {
    mockIsInitialized.mockReturnValue(true);
    expect(() => setPerformanceContext()).not.toThrow();
  });
});

describe('initializeSentryContext', () => {
  it('does nothing when Sentry is not initialized', () => {
    mockIsInitialized.mockReturnValue(false);
    initializeSentryContext();
    expect(mockSetTag).not.toHaveBeenCalled();
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it('calls setTag for environment and version when initialized', () => {
    mockIsInitialized.mockReturnValue(true);
    initializeSentryContext();
    expect(mockSetTag).toHaveBeenCalledWith('environment', expect.any(String));
    expect(mockSetTag).toHaveBeenCalledWith('app.version', expect.any(String));
  });

  it('adds initial app breadcrumb when initialized', () => {
    mockIsInitialized.mockReturnValue(true);
    initializeSentryContext();
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'app' })
    );
  });
});
