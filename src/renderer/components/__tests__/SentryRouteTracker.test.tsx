import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SentryRouteTracker } from '../SentryRouteTracker';

// Mock sentryContext functions used by the tracker
vi.mock('../../utils/sentryContext', () => ({
  setCurrentTool: vi.fn(),
  addNavigationBreadcrumb: vi.fn(),
  TOOLS: {
    HOME: 'home',
    JSON_FORMATTER: 'json',
    JWT_DECODER: 'jwt',
    BASE64_CONVERTER: 'base64',
    URL_CONVERTER: 'url',
    REGEX_TESTER: 'regex',
    TEXT_DIFF: 'diff',
    HASH_GENERATOR: 'hash',
    UUID_GENERATOR: 'uuid',
    TIMESTAMP_CONVERTER: 'timestamp',
  },
}));

import { setCurrentTool, addNavigationBreadcrumb } from '../../utils/sentryContext';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SentryRouteTracker', () => {
  it('renders null — no DOM output', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <SentryRouteTracker />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls setCurrentTool with HOME on "/" route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <SentryRouteTracker />
      </MemoryRouter>
    );
    expect(setCurrentTool).toHaveBeenCalledWith('home');
  });

  it('calls setCurrentTool on "/json" route', () => {
    render(
      <MemoryRouter initialEntries={['/json']}>
        <SentryRouteTracker />
      </MemoryRouter>
    );
    // setCurrentTool is called with the TOOLS value for '/json' from the real module map
    expect(setCurrentTool).toHaveBeenCalled();
  });

  it('calls setCurrentTool on unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <SentryRouteTracker />
      </MemoryRouter>
    );
    // Falls back to TOOLS.HOME for unknown routes
    expect(setCurrentTool).toHaveBeenCalled();
  });

  it('does not call addNavigationBreadcrumb on initial mount at "/"', () => {
    // previousLocation.current starts as '/' and initial path is '/' — no navigation occurred
    render(
      <MemoryRouter initialEntries={['/']}>
        <SentryRouteTracker />
      </MemoryRouter>
    );
    expect(addNavigationBreadcrumb).not.toHaveBeenCalled();
  });
});
