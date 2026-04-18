// src/components/tools/SentryToolkit/types.ts
import type { Event, Breadcrumb, User, StackFrame } from '@sentry/types';

// DSN 관련
export interface ParsedDSN {
  protocol: 'https' | 'http';
  publicKey: string;
  host: string;
  projectId: string;
  storeEndpoint: string;
  envelopeEndpoint: string;
}

export interface DSNValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: ParsedDSN;
}

export interface DSNConnectionResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

// 이벤트 빌더 관련
export interface EventBuilderOptions {
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  message: string;
  environment?: string;
  release?: string;
  tags?: Record<string, string>;
  user?: User;
  contexts?: {
    browser?: Record<string, unknown>;
    os?: Record<string, unknown>;
    device?: Record<string, unknown>;
    runtime?: Record<string, unknown>;
  };
  breadcrumbs?: Breadcrumb[];
  stacktrace?: boolean;
}

export interface EventSendResult {
  success: boolean;
  eventId?: string;
  error?: string;
  responseTime?: number;
}

export interface EnvelopeSendResult {
  success: boolean;
  eventId?: string;
  statusCode?: number;
  error?: string;
}

// 이벤트 파서 관련
export interface ParsedEvent {
  valid: boolean;
  errors: string[];
  event?: Event;
  sections: {
    eventInfo: {
      event_id: string;
      timestamp: string;
      level: string;
      environment: string;
      release?: string;
      platform: string;
    };
    exception?: {
      type: string;
      value: string;
      stacktrace?: {
        frames: StackFrame[];
      };
    };
    breadcrumbs: Breadcrumb[];
    contexts: Record<string, unknown>;
    tags: Record<string, string>;
    user?: User;
  };
}

export interface SearchResult {
  path: string;
  value: unknown;
  highlight?: string;
}

// 소스맵 관련
export interface SourceMap {
  version: number;
  sources: string[];
  sourcesContent?: string[];
  names: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
}

export interface SourceMapValidationResult {
  valid: boolean;
  errors: Array<{
    severity: 'error' | 'warning';
    field: string;
    message: string;
  }>;
  warnings: string[];
  stats: {
    sourcesCount: number;
    namesCount: number;
    mappingsLength: number;
    estimatedSize: string;
  };
}

export interface DecodedMapping {
  generatedLine: number;
  generatedColumn: number;
  sourceIndex?: number;
  originalLine?: number;
  originalColumn?: number;
  nameIndex?: number;
}

export interface OriginalPosition {
  source?: string;
  line?: number;
  column?: number;
  name?: string;
}

// 릴리스 헬퍼 관련
export interface ReleaseConfig {
  organization: string;
  project: string;
  version: string;
  environment: string;
  repository?: string;
  commit?: string;
  distPath?: string;
  urlPrefix?: string;
  includePatterns?: string[];
  ignorePatterns?: string[];
}

export interface GeneratedCommands {
  createRelease: string;
  uploadSourceMaps: string;
  finalizeRelease: string;
  setCommits?: string;
  deployNotification?: string;
}

// 히스토리/템플릿 관련
export interface DSNHistory {
  dsn: string;
  timestamp: number;
  alias?: string;
}

export interface EventTemplate {
  name: string;
  config: EventBuilderOptions;
}

export interface ReleaseTemplate {
  name: string;
  config: ReleaseConfig;
}
