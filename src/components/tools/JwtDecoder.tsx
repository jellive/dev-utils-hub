import { useState } from 'react';

interface DecodedJWT {
  header: string;
  payload: string;
  signature: string;
}

export function JwtDecoder() {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<DecodedJWT>({ header: '', payload: '', signature: '' });
  const [error, setError] = useState('');
  const [expirationInfo, setExpirationInfo] = useState('');

  const decodeJWT = () => {
    setError('');
    setExpirationInfo('');

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
      });

      // Check for expiration
      if (payloadObj.exp) {
        const expDate = new Date(payloadObj.exp * 1000);
        const now = new Date();

        if (expDate < now) {
          setExpirationInfo(`Token expired on ${expDate.toLocaleString()}`);
        } else {
          setExpirationInfo(`Token expires on ${expDate.toLocaleString()}`);
        }
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
    setExpirationInfo('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">JWT Decoder</h2>

      {/* Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          JWT Token Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your JWT token here (e.g., eyJhbGci...)"
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={decodeJWT}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Decode
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Expiration Info */}
      {expirationInfo && (
        <div className={`p-3 rounded-lg ${expirationInfo.includes('expired') ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
          <p className={expirationInfo.includes('expired') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
            {expirationInfo}
          </p>
        </div>
      )}

      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Header
          </label>
          {decoded.header && (
            <button
              onClick={() => copyToClipboard(decoded.header)}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded transition-colors"
            >
              Copy
            </button>
          )}
        </div>
        <pre
          data-testid="jwt-header"
          className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm overflow-auto"
        >
          {decoded.header}
        </pre>
      </div>

      {/* Payload Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payload
          </label>
          {decoded.payload && (
            <button
              onClick={() => copyToClipboard(decoded.payload)}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded transition-colors"
            >
              Copy
            </button>
          )}
        </div>
        <pre
          data-testid="jwt-payload"
          className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm overflow-auto"
        >
          {decoded.payload}
        </pre>
      </div>

      {/* Signature Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Signature
        </label>
        <div
          data-testid="jwt-signature"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm break-all"
        >
          {decoded.signature}
        </div>
      </div>
    </div>
  );
}
