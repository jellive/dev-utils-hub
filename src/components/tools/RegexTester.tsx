import { useState } from 'react';

interface Match {
  text: string;
  index: number;
  groups?: { [key: string]: string };
  captures: string[];
}

interface PresetExample {
  pattern: string;
  testString: string;
  flags: { g: boolean; i: boolean; m: boolean };
  description: string;
}

const PRESET_EXAMPLES: Record<string, PresetExample> = {
  email: {
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    testString: 'Contact us at test@example.com or info@test.org',
    flags: { g: true, i: false, m: false },
    description: 'Email validation',
  },
  phone: {
    pattern: '\\d{3}-\\d{4}-\\d{4}',
    testString: 'Call 010-1234-5678 or 010-9876-5432',
    flags: { g: true, i: false, m: false },
    description: 'Korean phone number',
  },
  url: {
    pattern: 'https?://[^\\s]+',
    testString: 'Visit https://example.com for more info',
    flags: { g: false, i: false, m: false },
    description: 'URL matching',
  },
  capture: {
    pattern: '(\\w+)@(\\w+)\\.(\\w+)',
    testString: 'user@domain.com',
    flags: { g: false, i: false, m: false },
    description: 'Capture groups',
  },
  named: {
    pattern: '(?<user>\\w+)@(?<domain>\\w+)',
    testString: 'test@example',
    flags: { g: false, i: false, m: false },
    description: 'Named capture groups',
  },
};

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [testString, setTestString] = useState('');
  const [flags, setFlags] = useState({ g: false, i: false, m: false });
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState('');

  const handleTest = () => {
    setError('');
    setMatches([]);

    if (!pattern.trim()) {
      setError('Pattern is empty. Please enter a regex pattern.');
      return;
    }

    try {
      const flagString = Object.entries(flags)
        .filter(([_, enabled]) => enabled)
        .map(([flag]) => flag)
        .join('');

      const regex = new RegExp(pattern, flagString);
      const foundMatches: Match[] = [];

      if (flags.g) {
        // Global flag: find all matches
        let match;
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.groups || {},
            captures: Array.from(match).slice(1), // All capture groups (excluding full match)
          });
        }
      } else {
        // No global flag: find first match only
        const match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.groups || {},
            captures: Array.from(match).slice(1), // All capture groups (excluding full match)
          });
        }
      }

      setMatches(foundMatches);
    } catch (err) {
      setError('Invalid regex pattern. Please check your syntax.');
      setMatches([]);
    }
  };

  const handleClear = () => {
    setPattern('');
    setTestString('');
    setFlags({ g: false, i: false, m: false });
    setMatches([]);
    setError('');
  };

  const toggleFlag = (flag: 'g' | 'i' | 'm') => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const loadPreset = (presetKey: string) => {
    if (presetKey === '') {
      return;
    }

    const preset = PRESET_EXAMPLES[presetKey];
    if (preset) {
      setPattern(preset.pattern);
      setTestString(preset.testString);
      setFlags(preset.flags);
      setMatches([]);
      setError('');
    }
  };

  const getHighlightedText = () => {
    if (matches.length === 0) return testString;

    const parts: { text: string; isMatch: boolean }[] = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          text: testString.substring(lastIndex, match.index),
          isMatch: false,
        });
      }

      // Add matched text
      parts.push({
        text: match.text,
        isMatch: true,
      });

      lastIndex = match.index + match.text.length;
    });

    // Add remaining text after last match
    if (lastIndex < testString.length) {
      parts.push({
        text: testString.substring(lastIndex),
        isMatch: false,
      });
    }

    return parts;
  };

  const highlightedParts = getHighlightedText();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Regex Tester</h2>

      {/* Preset Examples */}
      <div>
        <label
          htmlFor="preset-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Preset Examples
        </label>
        <select
          id="preset-select"
          onChange={(e) => loadPreset(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          defaultValue=""
        >
          <option value="">-- Select a preset example --</option>
          {Object.entries(PRESET_EXAMPLES).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.description}
            </option>
          ))}
        </select>
      </div>

      {/* Pattern Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Regex Pattern
        </label>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="Enter regex pattern (e.g., \d+, [a-z]+, etc.)"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
        />
      </div>

      {/* Flags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Flags
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={flags.g}
              onChange={() => toggleFlag('g')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Global (g)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={flags.i}
              onChange={() => toggleFlag('i')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Case Insensitive (i)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={flags.m}
              onChange={() => toggleFlag('m')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Multiline (m)</span>
          </label>
        </div>
      </div>

      {/* Test String */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Test String
        </label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter test string to match against"
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleTest}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Test
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

      {/* Match Results */}
      {!error && matches.length >= 0 && testString && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-900 dark:text-green-300 font-semibold">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
          </p>
        </div>
      )}

      {/* Highlighted Text */}
      {matches.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Highlighted Matches
          </label>
          <div
            data-testid="highlighted-text"
            className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 font-mono text-sm whitespace-pre-wrap break-words"
          >
            {Array.isArray(highlightedParts) ? (
              highlightedParts.map((part, index) => (
                <span
                  key={index}
                  className={
                    part.isMatch
                      ? 'bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-white'
                      : 'text-gray-900 dark:text-white'
                  }
                >
                  {part.text}
                </span>
              ))
            ) : (
              <span className="text-gray-900 dark:text-white">{highlightedParts}</span>
            )}
          </div>
        </div>
      )}

      {/* Capture Groups */}
      {matches.length > 0 && matches[0].captures.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Capture Groups
          </label>
          <div className="space-y-2">
            {/* Numbered Groups */}
            {matches[0].captures.map((value, index) => (
              <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <span className="font-semibold text-blue-900 dark:text-blue-300">Group {index + 1}: </span>
                <span className="text-blue-800 dark:text-blue-400 font-mono">{value}</span>
              </div>
            ))}
            {/* Named Groups */}
            {matches[0].groups && Object.keys(matches[0].groups).length > 0 && (
              <>
                {Object.entries(matches[0].groups).map(([name, value]) => (
                  <div key={name} className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <span className="font-semibold text-purple-900 dark:text-purple-300">{name}: </span>
                    <span className="text-purple-800 dark:text-purple-400 font-mono">{value}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Common Patterns:</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 font-mono">
          <li>• Email: <code>[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{'{2,}'}</code></li>
          <li>• Phone: <code>\d{'{3}'}-\d{'{4}'}-\d{'{4}'}</code></li>
          <li>• URL: <code>https?://[^\s]+</code></li>
          <li>• Numbers: <code>\d+</code></li>
          <li>• Words: <code>\w+</code></li>
        </ul>
      </div>
    </div>
  );
}
