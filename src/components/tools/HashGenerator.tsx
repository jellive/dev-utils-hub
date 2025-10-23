import { useState } from 'react';
import { generateHash } from '../../utils/hashUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type HashAlgorithm = 'md5' | 'sha256' | 'sha512';

interface AlgorithmOption {
  value: HashAlgorithm;
  label: string;
  bits: string;
}

export function HashGenerator() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('md5');
  const [hashResult, setHashResult] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const algorithms: AlgorithmOption[] = [
    { value: 'md5', label: 'MD5', bits: '128-bit' },
    { value: 'sha256', label: 'SHA-256', bits: '256-bit' },
    { value: 'sha512', label: 'SHA-512', bits: '512-bit' },
  ];

  const handleGenerate = async () => {
    setError('');
    setHashResult('');

    if (!input.trim()) {
      setError('Input is empty. Please enter text to hash.');
      return;
    }

    try {
      setIsProcessing(true);
      const hash = await generateHash(input, algorithm);
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
    } catch (err) {
      // Ignore clipboard errors silently
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hash Generator</h2>

      {/* Algorithm Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Hash Algorithm
        </label>
        <div className="flex flex-wrap gap-2">
          {algorithms.map((algo) => (
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
        onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)}
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
            <strong>Security Warning:</strong> MD5 is not cryptographically secure and should not be used for security-sensitive applications. Consider using SHA-256 or SHA-512 instead.
          </AlertDescription>
        </Alert>
      )}

      {/* Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Input Text
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash..."
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
          {isProcessing ? 'Generating...' : 'Generate Hash'}
        </button>
        <button
          onClick={handleClear}
          disabled={isProcessing}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
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
              Hash Result
            </label>
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
            >
              Copy
            </button>
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

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Hash Algorithms:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• <strong>MD5</strong>: 128-bit hash (32 hex characters) - Fast but not cryptographically secure</li>
          <li>• <strong>SHA-256</strong>: 256-bit hash (64 hex characters) - Cryptographically secure</li>
          <li>• <strong>SHA-512</strong>: 512-bit hash (128 hex characters) - Most secure</li>
        </ul>
      </div>
    </div>
  );
}
