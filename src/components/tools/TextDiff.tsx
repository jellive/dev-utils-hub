import { useState } from 'react';
import { diffLines } from '../../utils/diffAlgorithm';
import type { DiffResult } from '../../utils/diffAlgorithm';

export function TextDiff() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [hasCompared, setHasCompared] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCompare = () => {
    try {
      setIsProcessing(true);
      const results = diffLines(originalText, modifiedText);
      setDiffResults(results);
      setHasCompared(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
    setDiffResults([]);
    setHasCompared(false);
  };

  const hasDifferences = diffResults.some(result => result.type !== 'equal');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Text Diff Tool</h2>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Original Text
          </label>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Enter original text here..."
            className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Modified Text
          </label>
          <textarea
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            placeholder="Enter modified text here..."
            className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCompare}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Compare'}
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
          <span className="text-blue-900 dark:text-blue-300 text-sm">Processing diff...</span>
        </div>
      )}

      {/* Results Section */}
      {hasCompared && (
        <div className="space-y-4">
          {!hasDifferences ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-900 dark:text-green-300 font-semibold">
                No differences found. The texts are identical.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Differences
              </h3>
              <div
                data-testid="diff-viewer"
                className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
              >
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
