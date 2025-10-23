import { useState } from 'react';

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const handleFormat = () => {
    setError('');

    if (!input.trim()) {
      setError('Input is empty');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      setOutput('');
    }
  };

  const handleCompress = () => {
    setError('');

    if (!input.trim()) {
      setError('Input is empty');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const compressed = JSON.stringify(parsed);
      setOutput(compressed);
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      setOutput('');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const handleCopy = async () => {
    if (output) {
      try {
        await navigator.clipboard.writeText(output);
      } catch (err) {
        setError('Failed to copy to clipboard');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Input JSON
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here..."
            className="w-full h-96 p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     resize-none"
          />
        </div>

        {/* Output Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Formatted Output
          </label>
          <pre
            data-testid="json-output"
            className="w-full h-96 p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     overflow-auto"
          >
            {output}
          </pre>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleFormat}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg
                   font-medium transition-colors duration-75"
        >
          Format
        </button>
        <button
          onClick={handleCompress}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg
                   font-medium transition-colors duration-75"
        >
          Compress
        </button>
        <button
          onClick={handleCopy}
          disabled={!output}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                   font-medium transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Copy
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg
                   font-medium transition-colors duration-75"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
