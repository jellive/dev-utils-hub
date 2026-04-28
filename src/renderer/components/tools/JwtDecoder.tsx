import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/tauri-api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHistoryAutoSave } from '../../hooks/useHistoryAutoSave';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Copy, AlertTriangle, CheckCircle2, Shield, Send, Upload, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useHistoryExportImport } from '../../hooks/useHistoryExportImport';
import { ExportDialog } from '../dialogs/ExportDialog';
import { ImportDialog } from '../dialogs/ImportDialog';

interface DecodedJWT {
  header: string;
  payload: string;
  signature: string;
  headerObj?: Record<string, unknown>;
  payloadObj?: Record<string, unknown>;
}

type CountdownStatus = 'future-long' | 'future-medium' | 'future-soon' | 'expired';

interface CountdownResult {
  text: string;
  status: CountdownStatus;
}

/** Pure formatter — exported for unit testing */
export function formatCountdown(expUnix: number): CountdownResult {
  const nowSec = Date.now() / 1000;
  const diff = expUnix - nowSec;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / 86400);
  const hours = Math.floor((absDiff % 86400) / 3600);
  const minutes = Math.floor((absDiff % 3600) / 60);
  const seconds = Math.floor(absDiff % 60);

  if (diff > 0) {
    if (diff > 86400) {
      return { text: `expires in ${days}d ${hours}h`, status: 'future-long' };
    } else if (diff > 3600) {
      return { text: `expires in ${hours}h ${minutes}m`, status: 'future-medium' };
    } else {
      return { text: `expires in ${minutes}m ${seconds}s`, status: 'future-soon' };
    }
  } else {
    if (absDiff >= 86400) {
      return { text: `expired ${days}d ${hours}h ago`, status: 'expired' };
    } else if (absDiff >= 3600) {
      return { text: `expired ${hours}h ${minutes}m ago`, status: 'expired' };
    } else {
      return { text: `expired ${minutes}m ${seconds}s ago`, status: 'expired' };
    }
  }
}

function formatRelativeTime(unixSec: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSec;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60);
  const hours = Math.floor(absDiff / 3600);
  const days = Math.floor(absDiff / 86400);

  let relative: string;
  if (absDiff < 60) {
    relative = diff >= 0 ? 'just now' : 'in a moment';
  } else if (absDiff < 3600) {
    relative = diff >= 0 ? `${minutes} minutes ago` : `in ${minutes} minutes`;
  } else if (absDiff < 86400) {
    relative = diff >= 0 ? `${hours} hours ago` : `in ${hours} hours`;
  } else {
    relative = diff >= 0 ? `${days} days ago` : `in ${days} days`;
  }

  const date = new Date(unixSec * 1000);
  const formatted = date.toISOString().slice(0, 16).replace('T', ' ');
  return `${formatted} (${relative})`;
}

function base64urlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const buf = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const ALG_MAP: Record<string, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

type VerifyStatus = 'verified' | 'mismatch' | 'unsupported' | 'error' | null;

export function JwtDecoder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<DecodedJWT>({
    header: '',
    payload: '',
    signature: '',
  });
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState<boolean | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [parts, setParts] = useState<string[]>([]);

  // Countdown state
  const [countdown, setCountdown] = useState<CountdownResult | null>(null);

  // Signature verification state
  const [secret, setSecret] = useState('');
  const [secretIsBase64, setSecretIsBase64] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>(null);
  const [verifyMessage, setVerifyMessage] = useState('');

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'jwt' });

  const {
    isExporting,
    isImporting,
    showExportDialog,
    showImportDialog,
    setShowExportDialog,
    setShowImportDialog,
    handleExport,
    handleImport,
  } = useHistoryExportImport({
    tool: 'jwt',
    toolDisplayName: 'JWT Debugger',
    parseImportData: (content, format) => {
      if (format === 'json') {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) throw new Error('JSON must be an array');
        return data.map((item: unknown) => {
          const record = item as Record<string, unknown>;
          return {
            input: String(record.input || ''),
            output: record.output ? String(record.output) : undefined,
          };
        });
      } else if (format === 'csv') {
        const lines = content.split('\n').filter(line => line.trim());
        const dataLines = lines.slice(1);
        return dataLines.map(line => {
          const values = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));
          return { input: values[0] || '', output: values[1] || undefined };
        });
      } else {
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => ({ input: line.trim(), output: undefined }));
      }
    },
  });

  useEffect(() => {
    const fetchCount = async () => {
      if (api?.history) {
        try {
          const count = await api.history.count('jwt');
          setTotalCount(count);
        } catch (err) {
          console.error('Failed to get history count:', err);
        }
      }
    };
    fetchCount();
  }, [decoded.payload]);

  useEffect(() => {
    if (decoded.payload && !error) {
      saveToHistory(
        input,
        JSON.stringify({ header: decoded.header, payload: decoded.payload }, null, 2),
        {
          isExpired,
          expirationDate: expirationDate?.toISOString(),
        }
      );
    }
  }, [decoded.payload, error, input, isExpired, expirationDate, saveToHistory]);

  // Live countdown ticker
  useEffect(() => {
    if (!expirationDate) {
      setCountdown(null);
      return;
    }

    const tick = () => {
      setCountdown(formatCountdown(expirationDate.getTime() / 1000));
    };
    tick();

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expirationDate]);

  const decodeJWT = () => {
    setError('');
    setIsExpired(null);
    setExpirationDate(null);
    setVerifyStatus(null);
    setVerifyMessage('');

    if (!input.trim()) {
      setError('Input is empty. Please paste a JWT token.');
      return;
    }

    const tokenParts = input.trim().split('.');

    if (tokenParts.length !== 3) {
      setError('Invalid JWT format. JWT must have 3 parts separated by dots.');
      return;
    }

    try {
      const decodedHeader = atob(tokenParts[0].replace(/-/g, '+').replace(/_/g, '/'));
      const headerObj = JSON.parse(decodedHeader);

      const decodedPayload = atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payloadObj = JSON.parse(decodedPayload);

      const formattedHeader = JSON.stringify(headerObj, null, 2);
      const formattedPayload = JSON.stringify(payloadObj, null, 2);

      setDecoded({
        header: formattedHeader,
        payload: formattedPayload,
        signature: tokenParts[2],
        headerObj,
        payloadObj,
      });
      setParts(tokenParts);

      if (payloadObj.exp) {
        const expDate = new Date((payloadObj.exp as number) * 1000);
        const now = new Date();
        setExpirationDate(expDate);
        setIsExpired(expDate < now);
      }
    } catch (_err) {
      setError('Invalid JWT format. Unable to decode token.');
      setDecoded({ header: '', payload: '', signature: '' });
      setParts([]);
    }
  };

  const handleClear = () => {
    setInput('');
    setDecoded({ header: '', payload: '', signature: '' });
    setError('');
    setIsExpired(null);
    setExpirationDate(null);
    setCountdown(null);
    setParts([]);
    setVerifyStatus(null);
    setVerifyMessage('');
    setSecret('');
    setSecretIsBase64(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied'));
  };

  const sendToJsonFormatter = () => {
    if (!decoded.payload) {
      toast.error('No decoded payload to send');
      return;
    }
    navigate('/json', { state: { jsonInput: decoded.payload } });
    toast.success(t('common.sendToJsonFormatter'));
  };

  const sendToAPITester = () => {
    if (!input.trim()) {
      toast.error('No JWT token to send');
      return;
    }
    navigate('/api-tester', {
      state: {
        authType: 'bearer',
        bearerToken: input.trim(),
      },
    });
    toast.success('JWT token sent to API Tester');
  };

  const verifySignature = useCallback(async () => {
    const alg = decoded.headerObj?.alg as string | undefined;
    if (!alg) return;

    const hashAlg = ALG_MAP[alg];
    if (!hashAlg) {
      setVerifyStatus('unsupported');
      setVerifyMessage(
        `Verification only supports HMAC algorithms (HS256/384/512). Your token uses ${alg}.`
      );
      return;
    }

    try {
      let keyBytes: BufferSource;
      if (secretIsBase64) {
        keyBytes = base64urlToBytes(secret);
      } else {
        const enc = new TextEncoder().encode(secret);
        keyBytes = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength) as ArrayBuffer;
      }

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: hashAlg },
        false,
        ['verify']
      );

      const encInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
      const signingInput = encInput.buffer.slice(
        encInput.byteOffset,
        encInput.byteOffset + encInput.byteLength
      ) as ArrayBuffer;
      const signatureBytes = base64urlToBytes(parts[2]);

      const valid = await crypto.subtle.verify('HMAC', cryptoKey, signatureBytes, signingInput);

      if (valid) {
        setVerifyStatus('verified');
        setVerifyMessage('Signature verified ✓');
      } else {
        setVerifyStatus('mismatch');
        setVerifyMessage('Signature mismatch ✗');
      }
    } catch (err) {
      setVerifyStatus('error');
      setVerifyMessage(`Verification error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [decoded.headerObj, secret, secretIsBase64, parts]);

  const payloadObj = decoded.payloadObj as
    | (Record<string, unknown> & { iat?: number; nbf?: number; exp?: number })
    | undefined;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools.jwt.input')}</CardTitle>
          <CardDescription>{t('tools.jwt.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('tools.jwt.pasteToken')}
            className="min-h-[120px] font-mono text-sm"
          />

          <div className="flex gap-2 flex-wrap">
            <Button onClick={decodeJWT}>
              <Shield className="mr-2 h-4 w-4" />
              Decode Token
            </Button>
            <Button onClick={handleClear} variant="outline">
              {t('common.clear')}
            </Button>
            {decoded.payload && (
              <Button onClick={sendToJsonFormatter} variant="secondary">
                <Send className="mr-2 h-4 w-4" />
                {t('common.sendToJsonFormatter')}
              </Button>
            )}
            {input.trim() && (
              <Button onClick={sendToAPITester} variant="secondary">
                <Send className="mr-2 h-4 w-4" />
                Send to API Tester
              </Button>
            )}
            <Button
              onClick={() => setShowExportDialog(true)}
              variant="outline"
              disabled={isExporting}
            >
              <Upload className="mr-2 h-4 w-4" />
              {t('common.export')}
            </Button>
            <Button
              onClick={() => setShowImportDialog(true)}
              variant="outline"
              disabled={isImporting}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {t('common.import')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Expiry Countdown */}
      {countdown && (
        <div className={countdown.status === 'future-soon' ? 'bg-yellow-50 rounded-lg' : undefined}>
          <Alert
            variant={countdown.status === 'expired' ? 'destructive' : 'default'}
            className={countdown.status === 'future-soon' ? 'border-yellow-400' : undefined}
          >
            {countdown.status === 'expired' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription className="space-y-1">
              <div className="font-medium">{countdown.text}</div>
              {payloadObj?.iat !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Issued: {formatRelativeTime(payloadObj.iat)}
                </div>
              )}
              {payloadObj?.nbf !== undefined && (
                <div className="text-xs text-muted-foreground">
                  Not before: {formatRelativeTime(payloadObj.nbf)}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* iat/nbf only (no exp) */}
      {!countdown && (payloadObj?.iat !== undefined || payloadObj?.nbf !== undefined) && (
        <Alert variant="default">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="space-y-1">
            {payloadObj?.iat !== undefined && (
              <div className="text-xs text-muted-foreground">
                Issued: {formatRelativeTime(payloadObj.iat)}
              </div>
            )}
            {payloadObj?.nbf !== undefined && (
              <div className="text-xs text-muted-foreground">
                Not before: {formatRelativeTime(payloadObj.nbf)}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      {decoded.header && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('tools.jwt.header')}</CardTitle>
                <CardDescription>
                  {t('tools.jwt.algorithm')} & {t('tools.jwt.type')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {decoded.headerObj?.alg !== undefined && (
                  <Badge variant="secondary">{String(decoded.headerObj.alg)}</Badge>
                )}
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(decoded.header)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md border">
              <pre data-testid="jwt-header" className="p-4 text-sm font-mono">
                {decoded.header}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Payload Section */}
      {decoded.payload && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('tools.jwt.payload')}</CardTitle>
                <CardDescription>Claims and user data</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isExpired !== null && (
                  <Badge variant={isExpired ? 'destructive' : 'default'}>
                    {isExpired ? 'Expired' : 'Valid'}
                  </Badge>
                )}
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(decoded.payload)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <pre data-testid="jwt-payload" className="p-4 text-sm font-mono">
                {decoded.payload}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Signature Section */}
      {decoded.signature && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('tools.jwt.signature')}</CardTitle>
                <CardDescription>
                  Used to verify the token hasn&apos;t been tampered with
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(decoded.signature)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              data-testid="jwt-signature"
              className="rounded-md border bg-muted p-4 font-mono text-sm break-all"
            >
              {decoded.signature}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verify Signature Section */}
      {decoded.signature && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Signature</CardTitle>
            <CardDescription>
              Verify the HMAC signature using a secret key (HS256/384/512)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jwt-secret">Secret</Label>
              <Input
                id="jwt-secret"
                type="text"
                placeholder="Enter secret..."
                value={secret}
                onChange={e => setSecret(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="jwt-secret-b64"
                checked={secretIsBase64}
                onCheckedChange={checked => setSecretIsBase64(checked === true)}
              />
              <Label htmlFor="jwt-secret-b64" className="cursor-pointer">
                Secret is base64-encoded
              </Label>
            </div>
            <Button onClick={verifySignature} disabled={!secret}>
              Verify
            </Button>

            {verifyStatus === 'verified' && (
              <Alert variant="default" className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{verifyMessage}</AlertDescription>
              </Alert>
            )}
            {(verifyStatus === 'mismatch' || verifyStatus === 'error') && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{verifyMessage}</AlertDescription>
              </Alert>
            )}
            {verifyStatus === 'unsupported' && (
              <Alert variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{verifyMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        totalCount={totalCount}
        title={t('tools.jwt.history.exportTitle')}
        description={t('tools.jwt.history.exportDescription')}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        title={t('tools.jwt.history.importTitle')}
        description={t('tools.jwt.history.importDescription')}
      />
    </div>
  );
}
