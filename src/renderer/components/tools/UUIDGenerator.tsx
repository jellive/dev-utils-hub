import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Copy, Trash2, Download, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const MAX_HISTORY = 50;
const STORAGE_KEY = 'uuid-history';

export function UUIDGenerator() {
  const { t } = useTranslation();
  const [currentUUID, setCurrentUUID] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [bulkCount, setBulkCount] = useState('10');
  const [bulkUUIDs, setBulkUUIDs] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  const generateUUID = () => {
    const uuid = crypto.randomUUID();
    setCurrentUUID(uuid);

    // Add to history
    setHistory(prev => {
      const newHistory = [uuid, ...prev];
      return newHistory.slice(0, MAX_HISTORY);
    });
  };

  const handleCopy = async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(uuid);
      toast.success(t('common.copied'));
    } catch (err) {
      toast.error(t('common.copyFailed'));
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success(t('tools.uuid.historyCleared'));
  };

  const generateBulk = () => {
    const count = parseInt(bulkCount);
    if (isNaN(count) || count < 1 || count > 100) {
      toast.error('Please enter a number between 1 and 100');
      return;
    }

    const uuids: string[] = [];
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }
    setBulkUUIDs(uuids);
  };

  const copyAllBulk = async () => {
    try {
      await navigator.clipboard.writeText(bulkUUIDs.join('\n'));
      toast.success(`${bulkUUIDs.length} UUIDs copied to clipboard!`);
    } catch (err) {
      toast.error('Failed to copy UUIDs');
    }
  };

  const downloadBulk = () => {
    const content = bulkUUIDs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('UUIDs downloaded');
  };

  // Parse UUID metadata
  const getUUIDMetadata = (uuid: string) => {
    if (!uuid) return null;

    const version = parseInt(uuid[14], 16);
    const variant = parseInt(uuid[19], 16);

    let variantStr = 'Unknown';
    if ((variant & 0x8) === 0) {
      variantStr = 'NCS';
    } else if ((variant & 0xc) === 0x8) {
      variantStr = 'RFC 4122';
    } else if ((variant & 0xe) === 0xc) {
      variantStr = 'Microsoft';
    }

    return {
      version: version === 4 ? 'v4 (Random)' : `v${version}`,
      variant: variantStr,
    };
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.uuid.title')}</h2>

      {/* Generate Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={generateUUID}
          className="flex-1 gap-2"
          size="lg"
        >
          <RefreshCw className="h-5 w-5" />
          {t('tools.uuid.generate')}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="gap-2">
              <Package className="h-5 w-5" />
              {t('tools.uuid.bulk')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t('tools.uuid.bulkGeneration')}</DialogTitle>
              <DialogDescription>
                {t('tools.uuid.generateMultiple')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  placeholder="Enter quantity..."
                />
                <Button onClick={generateBulk}>Generate</Button>
              </div>

              {bulkUUIDs.length > 0 && (
                <>
                  <div className="flex gap-2">
                    <Button onClick={copyAllBulk} className="flex-1 gap-2">
                      <Copy className="h-4 w-4" />
                      {t('tools.uuid.copyAll')}
                    </Button>
                    <Button onClick={downloadBulk} variant="outline" className="flex-1 gap-2">
                      <Download className="h-4 w-4" />
                      {t('tools.uuid.download')}
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px] rounded-lg border p-3">
                    <div className="space-y-2">
                      {bulkUUIDs.map((uuid, index) => (
                        <div
                          key={`${uuid}-${index}`}
                          className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700"
                        >
                          <code className="text-sm font-mono">{uuid}</code>
                          <Button
                            onClick={() => handleCopy(uuid)}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('tools.uuid.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current UUID Display */}
      {currentUUID && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('tools.uuid.generatedUuid')}
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={currentUUID}
              readOnly
              className="font-mono"
              data-testid="current-uuid"
            />
            <Button
              onClick={() => handleCopy(currentUUID)}
              variant="outline"
              size="icon"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* UUID Metadata */}
          {(() => {
            const metadata = getUUIDMetadata(currentUUID);
            return metadata ? (
              <div className="flex gap-2">
                <Badge variant="secondary">{metadata.version}</Badge>
                <Badge variant="outline">{metadata.variant}</Badge>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('tools.uuid.history')} ({history.length})
            </label>
            <Button
              onClick={clearHistory}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('tools.uuid.clearHistory')}
            </Button>
          </div>
          <ScrollArea className="h-[200px] rounded-lg border border-gray-300 dark:border-gray-600 p-2">
            <div className="space-y-2">
              {history.map((uuid, index) => (
                <div
                  key={`${uuid}-${index}`}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {uuid}
                  </code>
                  <Button
                    onClick={() => handleCopy(uuid)}
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          UUID v4 (Random)
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          Generates cryptographically random UUIDs following RFC 4122 standard.
          Each UUID is 128-bit identifier displayed as 36-character hexadecimal string.
        </p>
      </div>
    </div>
  );
}
