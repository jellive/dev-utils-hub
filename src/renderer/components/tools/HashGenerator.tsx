import { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/tauri-api';
import { useNavigate } from 'react-router-dom';
import { useHistoryAutoSave } from '../../hooks/useHistoryAutoSave';
import { generateHash, generateHMAC } from '../../utils/hashUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertCircle,
  Upload,
  X,
  HelpCircle,
  Check,
  X as XCircle,
  Send,
  Upload as UploadIcon,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useHistoryExportImport } from '../../hooks/useHistoryExportImport';
import { ExportDialog } from '../dialogs/ExportDialog';
import { ImportDialog } from '../dialogs/ImportDialog';

type HashAlgorithm = 'md5' | 'sha256' | 'sha512';

interface AlgorithmOption {
  value: HashAlgorithm;
  label: string;
  bits: string;
}

export function HashGenerator() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('md5');
  const [hashResult, setHashResult] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHmacMode, setIsHmacMode] = useState(false);
  const [hmacKey, setHmacKey] = useState('');
  const [comparisonHash, setComparisonHash] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'hash' });

  // Use the new useHistoryExportImport hook with hash-specific parsing
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
    tool: 'hash',
    toolDisplayName: 'Hash Generator',
    parseImportData: (content, format) => {
      // Parse based on format
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
        const dataLines = lines.slice(1); // Skip header
        return dataLines.map(line => {
          const values = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));
          return { input: values[0] || '', output: values[1] || undefined };
        });
      } else {
        // TXT format: one hash per line
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => ({ input: line.trim(), output: undefined }));
      }
    },
  });

  // Get total count for ExportDialog
  useEffect(() => {
    const fetchCount = async () => {
      if (api?.history) {
        try {
          const count = await api.history.count('hash');
          setTotalCount(count);
        } catch (error) {
          console.error('Failed to get history count:', error);
        }
      }
    };
    fetchCount();
  }, [hashResult]); // Refetch when hash is generated

  // Save to history when hash result changes
  useEffect(() => {
    if (hashResult && !error) {
      saveToHistory(input || selectedFile?.name || '', hashResult, { algorithm, isHmacMode });
    }
  }, [hashResult, error, input, selectedFile, algorithm, isHmacMode, saveToHistory]);

  const algorithms: AlgorithmOption[] = [
    { value: 'md5', label: 'MD5', bits: '128-bit' },
    { value: 'sha256', label: 'SHA-256', bits: '256-bit' },
    { value: 'sha512', label: 'SHA-512', bits: '512-bit' },
  ];

  const handleGenerate = async () => {
    setError('');
    setHashResult('');
    setComparisonHash(''); // Clear comparison when generating new hash

    if (!input.trim()) {
      setError('Input is empty. Please enter text to hash.');
      return;
    }

    if (isHmacMode && !hmacKey.trim()) {
      setError('Key is required for HMAC mode.');
      return;
    }

    try {
      setIsProcessing(true);
      const hash = isHmacMode
        ? await generateHMAC(input, hmacKey, algorithm)
        : await generateHash(input, algorithm);
      setHashResult(hash);
    } catch (err) {
      setError('Failed to generate hash. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setHashResult('');
    setError('');
    setAlgorithm('md5');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hashResult);
      toast.success(t('common.copied'));
    } catch (err) {
      toast.error(t('common.copyFailed'));
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError('');
    setHashResult('');

    if (isHmacMode && !hmacKey.trim()) {
      setError('Key is required for HMAC mode.');
      return;
    }

    try {
      setIsProcessing(true);
      const reader = new FileReader();

      reader.onload = async e => {
        const content = e.target?.result as string;
        const hash = isHmacMode
          ? await generateHMAC(content, hmacKey, algorithm)
          : await generateHash(content, algorithm);
        setHashResult(hash);
        setIsProcessing(false);
      };

      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
        setIsProcessing(false);
      };

      reader.readAsText(file);
    } catch (err) {
      setError('Failed to hash file. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setHashResult('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendToAPITester = () => {
    if (!hashResult) {
      toast.error('No hash to send');
      return;
    }

    // Send the hash as a custom header value for API signature
    navigate('/api-tester', {
      state: {
        body: JSON.stringify(
          {
            hash: hashResult,
            algorithm: algorithm,
            hmacMode: isHmacMode,
            message: input,
          },
          null,
          2
        ),
      },
    });
    toast.success('Hash sent to API Tester');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.hash.title')}</h2>

      {/* Algorithm Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('tools.hash.selectAlgorithm')}
        </label>
        <div className="flex flex-wrap gap-2">
          {algorithms.map(algo => (
            <Button
              key={algo.value}
              variant={algorithm === algo.value ? 'default' : 'outline'}
              onClick={() => setAlgorithm(algo.value)}
              data-state={algorithm === algo.value ? 'active' : 'inactive'}
              className="flex items-center gap-2"
            >
              {algo.label}
              <Badge variant="secondary" className="ml-1">
                {algo.bits}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Keep old select for backward compatibility (hidden) */}
      <select
        id="hash-algorithm"
        value={algorithm}
        onChange={e => setAlgorithm(e.target.value as HashAlgorithm)}
        className="hidden"
        aria-label="Hash Algorithm"
      >
        <option value="md5">MD5</option>
        <option value="sha256">SHA-256</option>
        <option value="sha512">SHA-512</option>
      </select>

      {/* MD5 Security Warning */}
      {algorithm === 'md5' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Warning:</strong> MD5 is not cryptographically secure and should not be
            used for security-sensitive applications. Consider using SHA-256 or SHA-512 instead.
          </AlertDescription>
        </Alert>
      )}

      {/* HMAC Mode Toggle */}
      <TooltipProvider>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hmac-mode"
            checked={isHmacMode}
            onChange={e => {
              setIsHmacMode(e.target.checked);
              if (!e.target.checked) {
                setHmacKey('');
              }
            }}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            aria-label="HMAC mode"
          />
          <label
            htmlFor="hmac-mode"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {t('tools.hash.hmacMode')}
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-gray-500 dark:text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="font-semibold mb-1">HMAC (Hash-based Message Authentication Code)</p>
              <p className="text-sm">
                HMAC은 메시지와 비밀 키를 사용하여 메시지 인증 코드를 생성합니다. 메시지의 무결성과
                진위를 확인하는 데 사용되며, API 인증, 데이터 서명 등에 활용됩니다.
              </p>
              <p className="text-sm mt-2">
                <strong>사용 예시:</strong> API 요청 서명, JWT 토큰 검증, 파일 무결성 확인
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* HMAC Key Input */}
      {isHmacMode && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('tools.hash.hmacKey')}
          </label>
          <Input
            type="text"
            value={hmacKey}
            onChange={e => setHmacKey(e.target.value)}
            placeholder="Enter HMAC key..."
            className="font-mono"
          />
        </div>
      )}

      {/* File Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('tools.hash.uploadFile')}
        </label>
        <div
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
            ${selectedFile ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'hover:border-gray-400 dark:hover:border-gray-500'}
          `}
        >
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-900 dark:text-green-300">
                  {selectedFile.name}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={handleRemoveFile}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" />
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag and drop a file here
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                Choose File
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {isHmacMode ? t('tools.hash.messageToAuthenticate') : t('tools.hash.inputText')}
        </label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isHmacMode ? 'Enter message to authenticate...' : 'Enter text to hash...'}
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing
            ? t('tools.hash.generating')
            : isHmacMode
              ? t('tools.hash.generateHmac')
              : t('tools.hash.generateHash')}
        </button>
        <button
          onClick={handleClear}
          disabled={isProcessing}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <Button
          onClick={() => setShowExportDialog(true)}
          variant="outline"
          disabled={isExporting}
          className="gap-2"
        >
          <UploadIcon className="h-4 w-4" />
          {t('common.export')}
        </Button>
        <Button
          onClick={() => setShowImportDialog(true)}
          variant="outline"
          disabled={isImporting}
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          {t('common.import')}
        </Button>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
          <span className="text-blue-900 dark:text-blue-300 text-sm">Generating hash...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Hash Result */}
      {hashResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {isHmacMode ? t('tools.hash.hmacResult') : t('tools.hash.hashResult')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
              >
                {t('common.copy')}
              </button>
              <Button onClick={sendToAPITester} variant="secondary" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Send to API Tester
              </Button>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
            <code
              data-testid="hash-output"
              className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all"
            >
              {hashResult}
            </code>
          </div>
        </div>
      )}

      {/* Hash Comparison */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('tools.hash.compareHash')}
        </label>
        <Input
          type="text"
          value={comparisonHash}
          onChange={e => setComparisonHash(e.target.value)}
          placeholder="Enter hash to compare..."
          className="font-mono"
        />
        {hashResult && comparisonHash && (
          <div className="mt-2">
            {hashResult.toLowerCase() === comparisonHash.toLowerCase() ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-900 dark:text-green-300">
                  Hashes match!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>Hashes do not match</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Hash Algorithms:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>
            • <strong>MD5</strong>: 128-bit hash (32 hex characters) - Fast but not
            cryptographically secure
          </li>
          <li>
            • <strong>SHA-256</strong>: 256-bit hash (64 hex characters) - Cryptographically secure
          </li>
          <li>
            • <strong>SHA-512</strong>: 512-bit hash (128 hex characters) - Most secure
          </li>
        </ul>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        totalCount={totalCount}
        title="해시 히스토리 내보내기"
        description="내보낼 해시 히스토리 개수와 파일 형식을 선택하세요"
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        title="해시 파일 가져오기"
        description="해시 파일을 선택하여 히스토리에 추가하세요. 지원 형식: TXT, JSON, CSV"
      />
    </div>
  );
}
