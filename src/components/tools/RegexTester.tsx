import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, AlertCircle, HelpCircle, BookOpen, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  explanation: string;
}

const PRESET_EXAMPLES: Record<string, PresetExample> = {
  email: {
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    testString: 'Contact us at test@example.com or info@test.org',
    flags: { g: true, i: false, m: false },
    description: 'Email validation',
    explanation: 'Matches standard email addresses with username, @ symbol, domain, and TLD',
  },
  phone: {
    pattern: '\\d{3}-\\d{4}-\\d{4}',
    testString: 'Call 010-1234-5678 or 010-9876-5432',
    flags: { g: true, i: false, m: false },
    description: 'Korean phone number',
    explanation: 'Matches Korean phone format: 3 digits, dash, 4 digits, dash, 4 digits',
  },
  url: {
    pattern: 'https?://[^\\s]+',
    testString: 'Visit https://example.com or http://test.org for more info',
    flags: { g: true, i: false, m: false },
    description: 'URL matching',
    explanation: 'Matches HTTP and HTTPS URLs with any non-whitespace characters',
  },
  capture: {
    pattern: '(\\w+)@(\\w+)\\.(\\w+)',
    testString: 'user@domain.com and admin@example.org',
    flags: { g: false, i: false, m: false },
    description: 'Capture groups (username, domain, TLD)',
    explanation: 'Captures three groups: username before @, domain name, and top-level domain',
  },
  named: {
    pattern: '(?<user>\\w+)@(?<domain>\\w+)\\.(?<tld>\\w+)',
    testString: 'test@example.com',
    flags: { g: false, i: false, m: false },
    description: 'Named capture groups',
    explanation: 'Named groups allow accessing captures by name instead of index',
  },
  date: {
    pattern: '\\d{4}-\\d{2}-\\d{2}',
    testString: 'Events on 2024-01-15 and 2024-12-31',
    flags: { g: true, i: false, m: false },
    description: 'Date format (YYYY-MM-DD)',
    explanation: 'Matches dates in ISO 8601 format: 4 digits year, 2 digits month, 2 digits day',
  },
  hexColor: {
    pattern: '#[0-9a-fA-F]{6}',
    testString: 'Colors: #FF5733, #00AA00, #123ABC',
    flags: { g: true, i: false, m: false },
    description: 'Hex color codes',
    explanation: 'Matches 6-digit hexadecimal color codes with # prefix',
  },
};

export function RegexTester() {
  const { t } = useTranslation();
  const [pattern, setPattern] = useState('');
  const [testString, setTestString] = useState('');
  const [flags, setFlags] = useState({ g: false, i: false, m: false });
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
            captures: Array.from(match).slice(1),
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
            captures: Array.from(match).slice(1),
          });
        }
      }

      setMatches(foundMatches);
      toast.success(`Found ${foundMatches.length} ${foundMatches.length === 1 ? 'match' : 'matches'}`);
    } catch (err) {
      setError('Invalid regex pattern. Please check your syntax.');
      setMatches([]);
      toast.error('Invalid regex pattern');
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
    const preset = PRESET_EXAMPLES[presetKey];
    if (preset) {
      setPattern(preset.pattern);
      setTestString(preset.testString);
      setFlags(preset.flags);
      setMatches([]);
      setError('');
      setIsDialogOpen(false);
      toast.success(`Loaded: ${preset.description}`);
    }
  };

  const getHighlightedText = () => {
    if (matches.length === 0) return testString;

    const parts: { text: string; isMatch: boolean }[] = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      if (match.index > lastIndex) {
        parts.push({
          text: testString.substring(lastIndex, match.index),
          isMatch: false,
        });
      }

      parts.push({
        text: match.text,
        isMatch: true,
      });

      lastIndex = match.index + match.text.length;
    });

    if (lastIndex < testString.length) {
      parts.push({
        text: testString.substring(lastIndex),
        isMatch: false,
      });
    }

    return parts;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('common.copied'));
    } catch (err) {
      toast.error(t('common.copyFailed'));
    }
  };

  const highlightedParts = getHighlightedText();

  const getPatternExplanation = (): string => {
    if (!pattern) return 'Enter a regex pattern to see explanation';

    const explanations: string[] = [];

    if (pattern.includes('\\d')) explanations.push('\\d = any digit (0-9)');
    if (pattern.includes('\\w')) explanations.push('\\w = any word character (a-z, A-Z, 0-9, _)');
    if (pattern.includes('\\s')) explanations.push('\\s = any whitespace');
    if (pattern.includes('+')) explanations.push('+ = one or more');
    if (pattern.includes('*')) explanations.push('* = zero or more');
    if (pattern.includes('?')) explanations.push('? = optional (zero or one)');
    if (pattern.includes('{')) explanations.push('{n,m} = between n and m occurrences');
    if (pattern.includes('[')) explanations.push('[abc] = any character in set');
    if (pattern.includes('(')) explanations.push('(...) = capture group');
    if (pattern.includes('(?<')) explanations.push('(?<name>...) = named capture group');

    return explanations.length > 0 ? explanations.join(' | ') : 'Custom pattern';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.regex.title')}</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              {t('tools.regex.examples')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('tools.regex.commonPatterns')}</DialogTitle>
              <DialogDescription>
                {t('tools.regex.clickExample')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {Object.entries(PRESET_EXAMPLES).map(([key, preset]) => (
                <Card key={key} className="cursor-pointer hover:border-primary" onClick={() => loadPreset(key)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{preset.description}</CardTitle>
                      <Badge variant="secondary">
                        {Object.entries(preset.flags)
                          .filter(([_, enabled]) => enabled)
                          .map(([flag]) => flag)
                          .join('') || 'none'}
                      </Badge>
                    </div>
                    <CardDescription className="font-mono text-xs mt-2">
                      /{preset.pattern}/
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {preset.explanation}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
                      Test: "{preset.testString}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pattern Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('tools.regex.pattern')}</CardTitle>
              <CardDescription>{t('tools.regex.enterRegexPattern')}</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{getPatternExplanation()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regex pattern (e.g., \d+, [a-z]+, etc.)"
            className="font-mono"
          />

          {/* Flags */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('tools.regex.flags')}</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-g"
                  checked={flags.g}
                  onCheckedChange={() => toggleFlag('g')}
                />
                <label
                  htmlFor="flag-g"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('tools.regex.global')}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-i"
                  checked={flags.i}
                  onCheckedChange={() => toggleFlag('i')}
                />
                <label
                  htmlFor="flag-i"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('tools.regex.caseInsensitive')}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-m"
                  checked={flags.m}
                  onCheckedChange={() => toggleFlag('m')}
                />
                <label
                  htmlFor="flag-m"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('tools.regex.multiline')}
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test String */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools.regex.testString')}</CardTitle>
          <CardDescription>{t('tools.regex.enterTest')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter test string to match against..."
            className="font-mono min-h-[120px]"
          />

          <div className="flex items-center gap-2">
            <Button onClick={handleTest} className="gap-2">
              <Search className="h-4 w-4" />
              {t('tools.regex.testPattern')}
            </Button>
            <Button onClick={handleClear} variant="outline">
              {t('tools.regex.clearAll')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Match Count Badge */}
      {!error && testString && (
        <div className="flex items-center gap-2">
          <Badge variant={matches.length > 0 ? 'default' : 'secondary'} className="text-base px-4 py-2">
            {t('tools.regex.matchesFound', { count: matches.length })}
          </Badge>
          {matches.length > 0 && (
            <Badge variant="outline">
              {matches[0].captures.length > 0
                ? t('tools.regex.captureGroupsCount', { count: matches[0].captures.length })
                : t('tools.regex.noCaptures')}
            </Badge>
          )}
        </div>
      )}

      {/* Highlighted Matches */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{t('tools.regex.highlightedMatches')}</CardTitle>
                <CardDescription>{t('tools.regex.matchedHighlighted')}</CardDescription>
              </div>
              <Button
                onClick={() => handleCopy(testString)}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              data-testid="highlighted-text"
              className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm whitespace-pre-wrap break-words"
            >
              {Array.isArray(highlightedParts) ? (
                highlightedParts.map((part, index) => (
                  <span
                    key={index}
                    className={
                      part.isMatch
                        ? 'bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-white font-semibold'
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
          </CardContent>
        </Card>
      )}

      {/* Match Details */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('tools.regex.matchDetails')}</CardTitle>
            <CardDescription>{t('tools.regex.allMatchesPositions')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {matches.map((match, matchIndex) => (
              <div
                key={matchIndex}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Match {matchIndex + 1}</Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      at position {match.index}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleCopy(match.text)}
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  "{match.text}"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Capture Groups */}
      {matches.length > 0 && matches[0].captures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('tools.regex.captureGroups')}</CardTitle>
            <CardDescription>{t('tools.regex.explanation')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Numbered Groups */}
            {matches[0].captures.map((value, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div>
                  <Badge variant="secondary" className="mb-1">
                    Group {index + 1}
                  </Badge>
                  <p className="text-sm text-blue-800 dark:text-blue-400 font-mono mt-1">
                    {value}
                  </p>
                </div>
                <Button
                  onClick={() => handleCopy(value)}
                  variant="ghost"
                  size="sm"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Named Groups */}
            {matches[0].groups && Object.keys(matches[0].groups).length > 0 && (
              <>
                {Object.entries(matches[0].groups).map(([name, value]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                  >
                    <div>
                      <Badge variant="secondary" className="mb-1">
                        {name}
                      </Badge>
                      <p className="text-sm text-purple-800 dark:text-purple-400 font-mono mt-1">
                        {value}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleCopy(value)}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          {t('tools.regex.quickReference')}
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• <code className="font-mono">\d</code> - Any digit (0-9)</li>
          <li>• <code className="font-mono">\w</code> - Any word character (a-z, A-Z, 0-9, _)</li>
          <li>• <code className="font-mono">\s</code> - Any whitespace character</li>
          <li>• <code className="font-mono">+</code> - One or more | <code className="font-mono">*</code> - Zero or more | <code className="font-mono">?</code> - Zero or one</li>
          <li>• <code className="font-mono">[abc]</code> - Any character in set | <code className="font-mono">[^abc]</code> - Any character not in set</li>
          <li>• <code className="font-mono">(...)</code> - Capture group | <code className="font-mono">(?&lt;name&gt;...)</code> - Named capture group</li>
        </ul>
      </div>
    </div>
  );
}
