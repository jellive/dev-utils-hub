import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHistoryAutoSave } from '../../hooks/useHistoryAutoSave';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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

export function JwtDecoder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<DecodedJWT>({
    header: '',
    payload: '',
    signature: ''
  });
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState<boolean | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'jwt' });

  // Use the new useHistoryExportImport hook with JWT-specific parsing
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
    toolDisplayName: 'JWT Decoder',
    parseImportData: (content, format) => {
      // Parse based on format
      if (format === 'json') {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) throw new Error('JSON must be an array');
        return data.map((item: any) => ({
          input: String(item.input || ''),
          output: item.output ? String(item.output) : undefined,
        }));
      } else if (format === 'csv') {
        const lines = content.split('\n').filter(line => line.trim());
        const dataLines = lines.slice(1); // Skip header
        return dataLines.map(line => {
          const values = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));
          return { input: values[0] || '', output: values[1] || undefined };
        });
      } else {
        // TXT format: one JWT per line
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => ({ input: line.trim(), output: undefined }));
      }
    },
  });

  // Get total count for ExportDialog
  useEffect(() => {
    const fetchCount = async () => {
      if (window.api?.history) {
        try {
          const count = await window.api.history.count('jwt');
          setTotalCount(count);
        } catch (error) {
          console.error('Failed to get history count:', error);
        }
      }
    };
    fetchCount();
  }, [decoded.payload]); // Refetch when JWT is decoded

  // Save to history when decoded output changes
  useEffect(() => {
    if (decoded.payload && !error) {
      saveToHistory(input, JSON.stringify({ header: decoded.header, payload: decoded.payload }, null, 2), {
        isExpired,
        expirationDate: expirationDate?.toISOString()
      });
    }
  }, [decoded.payload, error, input, isExpired, expirationDate, saveToHistory]);

  const decodeJWT = () => {
    setError('');
    setIsExpired(null);
    setExpirationDate(null);

    if (!input.trim()) {
      setError('Input is empty. Please paste a JWT token.');
      return;
    }

    const parts = input.trim().split('.');

    if (parts.length !== 3) {
      setError('Invalid JWT format. JWT must have 3 parts separated by dots.');
      return;
    }

    try {
      // Decode header
      const decodedHeader = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
      const headerObj = JSON.parse(decodedHeader);

      // Decode payload
      const decodedPayload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payloadObj = JSON.parse(decodedPayload);

      // Format JSON with 2-space indentation
      const formattedHeader = JSON.stringify(headerObj, null, 2);
      const formattedPayload = JSON.stringify(payloadObj, null, 2);

      setDecoded({
        header: formattedHeader,
        payload: formattedPayload,
        signature: parts[2],
        headerObj,
        payloadObj,
      });

      // Check for expiration
      if (payloadObj.exp) {
        const expDate = new Date(payloadObj.exp * 1000);
        const now = new Date();
        setExpirationDate(expDate);
        setIsExpired(expDate < now);
      }
    } catch (err) {
      setError('Invalid JWT format. Unable to decode token.');
      setDecoded({ header: '', payload: '', signature: '' });
    }
  };

  const handleClear = () => {
    setInput('');
    setDecoded({ header: '', payload: '', signature: '' });
    setError('');
    setIsExpired(null);
    setExpirationDate(null);
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

    // Navigate to API Tester with Bearer token
    navigate('/api-tester', {
      state: {
        authType: 'bearer',
        bearerToken: input.trim(),
      },
    });
    toast.success('JWT token sent to API Tester');
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools.jwt.input')}</CardTitle>
          <CardDescription>
            {t('tools.jwt.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tools.jwt.pasteToken')}
            className="min-h-[120px] font-mono text-sm"
          />

          <div className="flex gap-2">
            <Button onClick={decodeJWT}>
              <Shield className="mr-2 h-4 w-4" />
              {t('common.decode')}
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

      {/* Expiration Alert */}
      {expirationDate && (
        <Alert variant={isExpired ? "destructive" : "default"}>
          {isExpired ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription>
            {isExpired
              ? `Token expired on ${expirationDate.toLocaleString()}`
              : `Token expires on ${expirationDate.toLocaleString()}`
            }
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
                <CardDescription>{t('tools.jwt.algorithm')} & {t('tools.jwt.type')}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {decoded.headerObj?.alg !== undefined && (
                  <Badge variant="secondary">
                    {String(decoded.headerObj.alg)}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(decoded.header)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md border">
              <pre
                data-testid="jwt-header"
                className="p-4 text-sm font-mono"
              >
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
                  <Badge variant={isExpired ? "destructive" : "default"}>
                    {isExpired ? 'Expired' : 'Valid'}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(decoded.payload)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <pre
                data-testid="jwt-payload"
                className="p-4 text-sm font-mono"
              >
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
                  Used to verify the token hasn't been tampered with
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(decoded.signature)}
              >
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

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        totalCount={totalCount}
        title="JWT 히스토리 내보내기"
        description="내보낼 JWT 히스토리 개수와 파일 형식을 선택하세요"
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        title="JWT 파일 가져오기"
        description="JWT 파일을 선택하여 히스토리에 추가하세요. 지원 형식: TXT, JSON, CSV"
      />
    </div>
  );
}
