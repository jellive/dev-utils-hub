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
import { Copy, AlertTriangle, CheckCircle2, Shield, Send } from 'lucide-react';
import { toast } from 'sonner';

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

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'jwt' });

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
            {input.trim() && (
              <Button onClick={sendToAPITester} variant="secondary">
                <Send className="mr-2 h-4 w-4" />
                Send to API Tester
              </Button>
            )}
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
    </div>
  );
}
