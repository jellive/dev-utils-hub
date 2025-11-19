import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Copy, Download, Package, Clock, Upload, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { HistorySidebar } from '../history/HistorySidebar';
import { useClipboard } from '../../hooks/useClipboard';
import { useHistoryExportImport } from '../../hooks/useHistoryExportImport';
import { ExportDialog } from '../dialogs/ExportDialog';
import { ImportDialog } from '../dialogs/ImportDialog';
import type { HistoryEntry } from '../../../preload/index.d';

export function UUIDGenerator() {
  const { t } = useTranslation();
  const { copy } = useClipboard();

  // Use the new useHistoryExportImport hook with UUID validation
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
    tool: 'uuid',
    toolDisplayName: 'UUID Generator',
    parseImportData: (content, format) => {
      // Use default parsing first
      const defaultParse = (content: string) => {
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
          const lines = content.split('\n').filter(line => line.trim());
          return lines.map(line => ({ input: line.trim(), output: undefined }));
        }
      };

      const data = defaultParse(content);

      // Validate UUID format and filter invalid entries
      return data.filter(item =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.input)
      );
    },
  });

  const [currentUUID, setCurrentUUID] = useState('');
  const [bulkCount, setBulkCount] = useState('10');
  const [bulkUUIDs, setBulkUUIDs] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Get total count for ExportDialog
  useEffect(() => {
    const fetchCount = async () => {
      if (window.api?.history) {
        try {
          const count = await window.api.history.count('uuid');
          setTotalCount(count);
        } catch (error) {
          console.error('Failed to get history count:', error);
        }
      }
    };
    fetchCount();
  }, [currentUUID, bulkUUIDs]); // Refetch when UUIDs are generated

  const generateUUID = async () => {
    const uuid = crypto.randomUUID();
    setCurrentUUID(uuid);

    // Save to integrated history immediately
    const metadata = getUUIDMetadata(uuid);
    try {
      if (window.api?.history) {
        await window.api.history.save(
          'uuid',
          uuid,
          uuid,
          metadata ? { version: metadata.version, variant: metadata.variant } : undefined
        );
      }
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  const handleCopy = async (uuid: string) => {
    await copy(uuid);
  };

  const handleHistoryItemClick = (item: HistoryEntry) => {
    setCurrentUUID(item.input);
    setIsHistoryOpen(false);
    toast.success(t('common.loaded'));
  };

  const generateBulk = async () => {
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

    // Save all generated UUIDs to history
    if (window.api?.history) {
      try {
        for (const uuid of uuids) {
          const metadata = getUUIDMetadata(uuid);
          await window.api.history.save(
            'uuid',
            uuid,
            uuid,
            metadata ? { version: metadata.version, variant: metadata.variant } : undefined
          );
        }
        toast.success(`${count}개의 UUID가 생성되고 히스토리에 저장되었습니다`);
      } catch (error) {
        console.error('Failed to save bulk UUIDs to history:', error);
        toast.error('히스토리 저장에 실패했습니다');
      }
    }
  };

  const copyAllBulk = async () => {
    await copy(bulkUUIDs.join('\n'));
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

        <Button
          onClick={() => setIsHistoryOpen(true)}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Clock className="h-5 w-5" />
          {t('tools.uuid.history')}
        </Button>

        <Button
          onClick={() => setShowExportDialog(true)}
          variant="outline"
          size="lg"
          className="gap-2"
          disabled={isExporting}
        >
          <Upload className="h-5 w-5" />
          {t('tools.uuid.export')}
        </Button>

        <Button
          onClick={() => setShowImportDialog(true)}
          variant="outline"
          size="lg"
          className="gap-2"
          disabled={isImporting}
        >
          <FileDown className="h-5 w-5" />
          {t('tools.uuid.import')}
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

      {/* History Sidebar */}
      <HistorySidebar
        tool="uuid"
        isOpen={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        onHistoryItemClick={handleHistoryItemClick}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        totalCount={totalCount}
        title="UUID 히스토리 내보내기"
        description="내보낼 UUID 개수와 파일 형식을 선택하세요"
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        title="UUID 파일 가져오기"
        description="UUID 파일을 선택하여 히스토리에 추가하세요. 지원 형식: TXT, JSON, CSV"
      />

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
