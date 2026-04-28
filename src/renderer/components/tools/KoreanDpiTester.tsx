import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export interface ProbeResult {
  status: number | null;
  total_ms: number;
  error: string | null;
  error_kind?: string | null;
}

export type ProbeRow = {
  client: 'browser' | 'native' | 'curl';
  label: string;
} & ProbeResult;

export function diagnose(rows: ProbeRow[]): {
  kind: 'ok' | 'dpi' | 'unreachable' | 'partial';
  message: string;
} {
  const ok = rows.filter(r => r.error === null);
  const failed = rows.filter(r => r.error !== null);

  if (failed.length === 0) {
    return {
      kind: 'ok',
      message: 'All clients reached the URL successfully — no DPI block detected.',
    };
  }
  if (ok.length === 0) {
    return {
      kind: 'unreachable',
      message:
        'No client could reach the URL. Likely DNS issue, server down, or full network block.',
    };
  }
  // Partial: at least one OK, at least one failed
  const okClients = ok.map(r => r.label).join(', ');
  const failedClients = failed.map(r => `${r.label} (${r.error_kind ?? 'error'})`).join(', ');
  // Specific Korean DPI signature: native client failures while browser/curl pass
  const browserOk = ok.some(r => r.client === 'browser');
  const nativeFailed = failed.some(r => r.client === 'native');
  if (browserOk && nativeFailed) {
    return {
      kind: 'dpi',
      message: `Suspected DPI/TLS-fingerprint block. Worked: ${okClients}. Failed: ${failedClients}. The native (rustls) client uses a different TLS handshake — Korean ISP DPI is known to selectively drop specific TLS fingerprints.`,
    };
  }
  return {
    kind: 'partial',
    message: `Mixed results. Worked: ${okClients}. Failed: ${failedClients}.`,
  };
}

async function probeBrowser(url: string): Promise<ProbeResult> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    const resp = await fetch(url, { signal: controller.signal, mode: 'cors' });
    clearTimeout(timeoutId);
    const total_ms = Math.round(performance.now() - start);
    return { status: resp.status, total_ms, error: null, error_kind: null };
  } catch (err: unknown) {
    const total_ms = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    const error_kind =
      err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'fetch';
    return { status: null, total_ms, error: message, error_kind };
  }
}

export function KoreanDpiTester() {
  const [url, setUrl] = useState('https://api.telegram.org/');
  const [rows, setRows] = useState<ProbeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<ReturnType<typeof diagnose> | null>(null);

  const runProbe = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setRows([]);
    setDiagnosis(null);

    const [browser, native, curl] = await Promise.all([
      probeBrowser(url),
      invoke<ProbeResult>('probe_native', { url }).catch(e => ({
        status: null,
        total_ms: 0,
        error: `invoke failed: ${e}`,
        error_kind: 'invoke',
      })) as Promise<ProbeResult>,
      invoke<ProbeResult>('probe_curl', { url }).catch(e => ({
        status: null,
        total_ms: 0,
        error: `invoke failed: ${e}`,
        error_kind: 'invoke',
      })) as Promise<ProbeResult>,
    ]);

    const newRows: ProbeRow[] = [
      { client: 'browser', label: 'Browser fetch (Chromium)', ...browser },
      { client: 'native', label: 'Native (Rust + rustls)', ...native },
      { client: 'curl', label: 'curl (system)', ...curl },
    ];
    setRows(newRows);
    setDiagnosis(diagnose(newRows));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Korean DPI Tester</h2>
      <p className="text-sm text-muted-foreground">
        Probe the same URL through multiple HTTP clients to detect Korean ISP DPI / TLS-fingerprint
        blocks.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>URL</CardTitle>
          <CardDescription>Enter the URL to probe (HTTPS recommended)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="dpi-url">URL</Label>
            <Input
              id="dpi-url"
              data-testid="dpi-url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://api.telegram.org/"
            />
          </div>
          <Button
            onClick={runProbe}
            disabled={loading || !url.trim()}
            data-testid="dpi-probe-button"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Probing…
              </>
            ) : (
              'Probe'
            )}
          </Button>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" data-testid="dpi-results-table">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.client}
                    className="border-b last:border-b-0"
                    data-testid={`dpi-row-${row.client}`}
                  >
                    <td className="py-2 pr-4">{row.label}</td>
                    <td className="py-2 pr-4">
                      {row.error === null ? (
                        <Badge variant="default" className="bg-green-600">
                          {row.status} OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive">{row.error_kind ?? 'fail'}</Badge>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{row.total_ms} ms</td>
                    <td
                      className="py-2 font-mono text-xs text-red-600 dark:text-red-400"
                      data-testid={`dpi-error-${row.client}`}
                    >
                      {row.error ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {diagnosis && (
        <Alert
          variant={
            diagnosis.kind === 'dpi' || diagnosis.kind === 'unreachable' ? 'destructive' : 'default'
          }
          data-testid="dpi-diagnosis"
        >
          {diagnosis.kind === 'ok' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{diagnosis.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
