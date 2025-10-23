import { useState } from 'react';

export function Base64Converter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  // UTF-8 safe Base64 encoding
  const encodeBase64 = (text: string): string => {
    const utf8Bytes = new TextEncoder().encode(text);
    let binary = '';
    utf8Bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  // UTF-8 safe Base64 decoding
  const decodeBase64 = (base64: string): string => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  };

  const handleEncode = () => {
    setError('');

    if (!input.trim()) {
      setError('Input is empty. Please enter text to encode.');
      return;
    }

    try {
      const encoded = encodeBase64(input);
      setOutput(encoded);
    } catch (err) {
      setError('Failed to encode text. Please try again.');
      setOutput('');
    }
  };

  const handleDecode = () => {
    setError('');

    if (!input.trim()) {
      setError('Input is empty. Please enter Base64 text to decode.');
      return;
    }

    try {
      const decoded = decodeBase64(input);
      setOutput(decoded);
    } catch (err) {
      setError('Invalid Base64 format. Please check your input.');
      setOutput('');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Base64 Encoder/Decoder</h2>

      {/* Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Input Text
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to encode or Base64 to decode"
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleEncode}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Encode
        </button>
        <button
          onClick={handleDecode}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          Decode
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Clear
        </button>
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Copy
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Output Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Output
        </label>
        <textarea
          value={output}
          readOnly
          placeholder="Base64 output will appear here"
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        />
      </div>

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">How to use:</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• <strong>Encode</strong>: Enter plain text and click "Encode" to convert to Base64</li>
          <li>• <strong>Decode</strong>: Enter Base64 text and click "Decode" to convert back to plain text</li>
          <li>• Supports UTF-8 encoding (Korean, emojis, special characters)</li>
          <li>• Click "Copy" to copy the output to clipboard</li>
        </ul>
      </div>
    </div>
  );
}
