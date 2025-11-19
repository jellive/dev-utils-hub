import { useState, useRef, useEffect } from 'react';
import { useHistoryAutoSave } from '../../hooks/useHistoryAutoSave';
import { useHistoryExportImport } from '../../hooks/useHistoryExportImport';
import { ExportDialog } from '../dialogs/ExportDialog';
import { ImportDialog } from '../dialogs/ImportDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDiff, Copy, Upload, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { diffLines } from '../../utils/diffAlgorithm';
import type { DiffResult } from '../../utils/diffAlgorithm';

export function TextDiff() {
  const { t } = useTranslation();
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [hasCompared, setHasCompared] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('split');
  const [totalCount, setTotalCount] = useState(0);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // Use the new useHistoryExportImport hook with Diff parsing
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
    tool: 'diff',
    toolDisplayName: 'Text Diff',
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
        // TXT format: one diff per line
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => ({ input: line.trim(), output: undefined }));
      }
    },
  });

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'diff' });

  // Get total count for ExportDialog
  useEffect(() => {
    const fetchCount = async () => {
      if (window.api?.history) {
        try {
          const count = await window.api.history.count('diff');
          setTotalCount(count);
        } catch (error) {
          console.error('Failed to get history count:', error);
        }
      }
    };
    fetchCount();
  }, [diffResults]); // Refetch when diff is compared

  // Save to history when diff results change
  useEffect(() => {
    if (diffResults.length > 0 && hasCompared) {
      const summary = `${diffResults.filter(d => d.type === 'insert').length} additions, ${diffResults.filter(d => d.type === 'delete').length} deletions`;
      saveToHistory(originalText, summary, { ignoreWhitespace, viewMode });
    }
  }, [diffResults, hasCompared, originalText, ignoreWhitespace, viewMode, saveToHistory]);

  const handleCompare = () => {
    try {
      setIsProcessing(true);

      let original = originalText;
      let modified = modifiedText;

      if (ignoreWhitespace) {
        original = original.replace(/\s+/g, ' ').trim();
        modified = modified.replace(/\s+/g, ' ').trim();
      }

      const results = diffLines(original, modified);
      setDiffResults(results);
      setHasCompared(true);

      const stats = getDiffStats(results);
      toast.success(
        `${stats.additions} ${t('tools.diff.additions')}, ${stats.deletions} ${t('tools.diff.deletions')}, ${stats.unchanged} ${t('tools.diff.unchanged')}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
    setDiffResults([]);
    setHasCompared(false);
    toast.info(t('common.clear'));
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('common.copied'));
    } catch (err) {
      toast.error(t('common.copyFailed'));
    }
  };

  const getDiffStats = (results: DiffResult[]) => {
    return {
      additions: results.filter((r) => r.type === 'insert').length,
      deletions: results.filter((r) => r.type === 'delete').length,
      unchanged: results.filter((r) => r.type === 'equal').length,
    };
  };

  const hasDifferences = diffResults.some((result) => result.type !== 'equal');
  const stats = getDiffStats(diffResults);

  // Synchronized scrolling for side-by-side view
  const handleLeftScroll = () => {
    if (leftScrollRef.current && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
  };

  const handleRightScroll = () => {
    if (leftScrollRef.current && rightScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.diff.title')}</h2>

        {hasCompared && (
          <div className="flex items-center gap-2">
            <Badge variant={hasDifferences ? 'default' : 'secondary'} className="text-sm">
              {hasDifferences ? t('tools.diff.differencesFound') : t('tools.diff.identical')}
            </Badge>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{t('tools.diff.original')}</CardTitle>
                <CardDescription>{t('tools.diff.originalVersion')}</CardDescription>
              </div>
              <Button
                onClick={() => handleCopy(originalText)}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder={t('tools.diff.enterOriginal')}
              className="font-mono min-h-[200px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{t('tools.diff.modified')}</CardTitle>
                <CardDescription>{t('tools.diff.modifiedVersion')}</CardDescription>
              </div>
              <Button
                onClick={() => handleCopy(modifiedText)}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              placeholder={t('tools.diff.enterModified')}
              className="font-mono min-h-[200px]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Options and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ignore-whitespace"
                  checked={ignoreWhitespace}
                  onCheckedChange={setIgnoreWhitespace}
                />
                <Label htmlFor="ignore-whitespace">{t('tools.diff.ignoreWhitespace')}</Label>
              </div>

              {hasCompared && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'unified' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('unified')}
                  >
                    {t('tools.diff.unified')}
                  </Button>
                  <Button
                    variant={viewMode === 'split' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('split')}
                  >
                    {t('tools.diff.sideBySide')}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleCompare} disabled={isProcessing} className="gap-2">
                <FileDiff className="h-4 w-4" />
                {isProcessing ? t("common.loading") : t("common.compare")}
              </Button>
              <Button onClick={handleClear} variant="outline">
                {t('common.clear')}
              </Button>
              <Button
                onClick={() => setShowExportDialog(true)}
                disabled={isExporting}
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {t('common.export')}
              </Button>
              <Button
                onClick={() => setShowImportDialog(true)}
                disabled={isImporting}
                variant="outline"
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                {t('common.import')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Badge */}
      {hasCompared && hasDifferences && (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <span className="text-green-600 dark:text-green-400">+{stats.additions}</span>
            <span>{t('tools.diff.additions')}</span>
          </Badge>
          <Badge variant="destructive" className="gap-1">
            <span>-{stats.deletions}</span>
            <span>{t('tools.diff.deletions')}</span>
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span>{stats.unchanged}</span>
            <span>{t('tools.diff.unchanged')}</span>
          </Badge>
        </div>
      )}

      {/* Results Section */}
      {hasCompared && (
        <>
          {!hasDifferences ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="text-green-600 dark:text-green-400 text-5xl mb-4">✓</div>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-300">
                      {t('tools.diff.noDifferences')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {t('tools.diff.textsIdentical')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'unified' ? (
            /* Unified Diff View */
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tools.diff.unifiedView')}</CardTitle>
                <CardDescription>{t('tools.diff.changesHighlighted')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] rounded-lg border border-gray-300 dark:border-gray-600">
                  <div data-testid="diff-viewer">
                    {diffResults.map((result, index) => (
                      <div
                        key={index}
                        className={`flex border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                          result.type === 'insert'
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : result.type === 'delete'
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : 'bg-white dark:bg-gray-800'
                        }`}
                      >
                        {/* Line Numbers */}
                        <div className="flex-shrink-0 w-24 flex">
                          <div className="w-12 px-2 py-1 text-right text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                            {result.oldIndex !== undefined ? result.oldIndex + 1 : ''}
                          </div>
                          <div className="w-12 px-2 py-1 text-right text-xs text-gray-500 dark:text-gray-400">
                            {result.newIndex !== undefined ? result.newIndex + 1 : ''}
                          </div>
                        </div>

                        {/* Change Indicator */}
                        <div className="flex-shrink-0 w-8 flex items-center justify-center border-r border-gray-200 dark:border-gray-700">
                          {result.type === 'insert' ? (
                            <span className="text-green-600 dark:text-green-400 font-bold">+</span>
                          ) : result.type === 'delete' ? (
                            <span className="text-red-600 dark:text-red-400 font-bold">-</span>
                          ) : (
                            <span className="text-gray-400">·</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 px-3 py-1 font-mono text-sm overflow-x-auto">
                          <pre
                            className={`${
                              result.type === 'insert'
                                ? 'text-green-900 dark:text-green-200'
                                : result.type === 'delete'
                                ? 'text-red-900 dark:text-red-200'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {result.value}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            /* Side-by-Side Diff View */
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('tools.diff.sideView')}</CardTitle>
                <CardDescription>
                  {t('tools.diff.compareVersions')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Side - Original */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-300 dark:border-gray-600">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t('tools.diff.original')}
                      </p>
                    </div>
                    <ScrollArea
                      className="h-[500px]"
                      ref={leftScrollRef}
                      onScroll={handleLeftScroll}
                    >
                      <div>
                        {diffResults.map((result, index) => {
                          if (result.type === 'insert') return null;
                          return (
                            <div
                              key={index}
                              className={`flex border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                                result.type === 'delete'
                                  ? 'bg-red-50 dark:bg-red-900/20'
                                  : 'bg-white dark:bg-gray-800'
                              }`}
                            >
                              <div className="w-12 px-2 py-1 text-right text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                                {result.oldIndex !== undefined ? result.oldIndex + 1 : ''}
                              </div>
                              <div className="flex-1 px-3 py-1 font-mono text-sm overflow-x-auto">
                                <pre
                                  className={
                                    result.type === 'delete'
                                      ? 'text-red-900 dark:text-red-200'
                                      : 'text-gray-900 dark:text-gray-100'
                                  }
                                >
                                  {result.value}
                                </pre>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right Side - Modified */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-300 dark:border-gray-600">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t('tools.diff.modified')}
                      </p>
                    </div>
                    <ScrollArea
                      className="h-[500px]"
                      ref={rightScrollRef}
                      onScroll={handleRightScroll}
                    >
                      <div>
                        {diffResults.map((result, index) => {
                          if (result.type === 'delete') return null;
                          return (
                            <div
                              key={index}
                              className={`flex border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                                result.type === 'insert'
                                  ? 'bg-green-50 dark:bg-green-900/20'
                                  : 'bg-white dark:bg-gray-800'
                              }`}
                            >
                              <div className="w-12 px-2 py-1 text-right text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                                {result.newIndex !== undefined ? result.newIndex + 1 : ''}
                              </div>
                              <div className="flex-1 px-3 py-1 font-mono text-sm overflow-x-auto">
                                <pre
                                  className={
                                    result.type === 'insert'
                                      ? 'text-green-900 dark:text-green-200'
                                      : 'text-gray-900 dark:text-gray-100'
                                  }
                                >
                                  {result.value}
                                </pre>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          {t('tools.diff.howToUse')}
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• {t('tools.diff.step1')}</li>
          <li>• {t('tools.diff.step2')}</li>
          <li>• {t('tools.diff.step3')}</li>
          <li>• {t('tools.diff.step4')}</li>
          <li>• {t('tools.diff.step5')}</li>
        </ul>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        totalCount={totalCount}
        title="Diff 히스토리 내보내기"
        description="내보낼 Diff 히스토리 개수와 파일 형식을 선택하세요"
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        title="Diff 파일 가져오기"
        description="Diff 파일을 선택하여 히스토리에 추가하세요. 지원 형식: TXT, JSON, CSV"
      />
    </div>
  );
}
