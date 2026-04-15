import { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileDiff } from 'lucide-react';

// Line-level diff result
interface LineDiff {
  type: 'equal' | 'insert' | 'delete';
  value: string;
  // Character-level ranges for changed lines (only populated when type != 'equal')
  charDiffs?: CharDiff[];
}

interface CharDiff {
  type: 'equal' | 'change';
  value: string;
}

function computeLineDiff(left: string, right: string): LineDiff[] {
  const leftLines = left.split('\n');
  const rightLines = right.split('\n');

  // LCS-based line diff
  const m = leftLines.length;
  const n = rightLines.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (leftLines[i - 1] === rightLines[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  const result: LineDiff[] = [];

  function backtrack(i: number, j: number): void {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      backtrack(i - 1, j - 1);
      result.push({ type: 'equal', value: leftLines[i - 1] });
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      backtrack(i, j - 1);
      result.push({ type: 'insert', value: rightLines[j - 1], charDiffs: [] });
    } else if (i > 0) {
      backtrack(i - 1, j);
      result.push({ type: 'delete', value: leftLines[i - 1], charDiffs: [] });
    }
  }

  backtrack(m, n);
  return result;
}

function computeCharDiff(a: string, b: string): { aChunks: CharDiff[]; bChunks: CharDiff[] } {
  // Simple character-level LCS for highlighting within a changed line
  const m = a.length;
  const n = b.length;

  if (m > 200 || n > 200) {
    // Skip char diff for very long lines to avoid O(n²) perf hit
    return {
      aChunks: [{ type: 'change', value: a }],
      bChunks: [{ type: 'change', value: b }],
    };
  }

  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      lcs[i][j] =
        a[i - 1] === b[j - 1] ? lcs[i - 1][j - 1] + 1 : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
    }
  }

  const aResult: CharDiff[] = [];
  const bResult: CharDiff[] = [];

  function bt(i: number, j: number): void {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      bt(i - 1, j - 1);
      aResult.push({ type: 'equal', value: a[i - 1] });
      bResult.push({ type: 'equal', value: b[j - 1] });
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      bt(i, j - 1);
      bResult.push({ type: 'change', value: b[j - 1] });
    } else if (i > 0) {
      bt(i - 1, j);
      aResult.push({ type: 'change', value: a[i - 1] });
    }
  }

  bt(m, n);
  return { aChunks: aResult, bChunks: bResult };
}

function renderCharDiffs(chunks: CharDiff[], side: 'delete' | 'insert'): React.ReactNode {
  return chunks.map((chunk, i) =>
    chunk.type === 'equal' ? (
      <span key={i}>{chunk.value}</span>
    ) : (
      <mark
        key={i}
        className={
          side === 'delete'
            ? 'bg-red-300 dark:bg-red-700 rounded-sm'
            : 'bg-green-300 dark:bg-green-700 rounded-sm'
        }
      >
        {chunk.value}
      </mark>
    )
  );
}

export function DiffViewer() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [hasCompared, setHasCompared] = useState(false);

  const diffs = useMemo<LineDiff[]>(() => {
    if (!hasCompared) return [];
    return computeLineDiff(left, right);
  }, [left, right, hasCompared]);

  // Pair up delete+insert lines for character-level diffing
  const enrichedDiffs = useMemo<
    Array<LineDiff & { aChunks?: CharDiff[]; bChunks?: CharDiff[] }>
  >(() => {
    const result: Array<LineDiff & { aChunks?: CharDiff[]; bChunks?: CharDiff[] }> = [];
    let i = 0;
    while (i < diffs.length) {
      const cur = diffs[i];
      if (cur.type === 'delete' && i + 1 < diffs.length && diffs[i + 1].type === 'insert') {
        const next = diffs[i + 1];
        const { aChunks, bChunks } = computeCharDiff(cur.value, next.value);
        result.push({ ...cur, aChunks });
        result.push({ ...next, bChunks });
        i += 2;
      } else {
        result.push(cur);
        i++;
      }
    }
    return result;
  }, [diffs]);

  const stats = useMemo(() => {
    const added = diffs.filter(d => d.type === 'insert').length;
    const removed = diffs.filter(d => d.type === 'delete').length;
    return { added, removed };
  }, [diffs]);

  const handleCompare = () => setHasCompared(true);
  const handleClear = () => {
    setLeft('');
    setRight('');
    setHasCompared(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Diff Viewer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Compare two text blocks. Highlights additions (green), deletions (red), and character-level
        changes within modified lines.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Original</label>
          <Textarea
            value={left}
            onChange={e => {
              setLeft(e.target.value);
              setHasCompared(false);
            }}
            placeholder="Paste original text here..."
            className="h-48 font-mono text-xs resize-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modified</label>
          <Textarea
            value={right}
            onChange={e => {
              setRight(e.target.value);
              setHasCompared(false);
            }}
            placeholder="Paste modified text here..."
            className="h-48 font-mono text-xs resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 items-center">
        <Button onClick={handleCompare} disabled={!left && !right} className="gap-2">
          <FileDiff className="h-4 w-4" />
          Compare
        </Button>
        <Button onClick={handleClear} variant="outline">
          Clear
        </Button>
        {hasCompared && (
          <div className="flex gap-2 ml-2">
            <Badge variant="outline" className="text-green-700 border-green-500">
              +{stats.added} added
            </Badge>
            <Badge variant="outline" className="text-red-700 border-red-500">
              -{stats.removed} removed
            </Badge>
          </div>
        )}
      </div>

      {/* Diff output */}
      {hasCompared && (
        <Card>
          <CardContent className="p-0">
            <div className="font-mono text-xs overflow-x-auto">
              {enrichedDiffs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No differences found — texts are identical.
                </div>
              ) : (
                enrichedDiffs.map((line, i) => {
                  const bg =
                    line.type === 'insert'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : line.type === 'delete'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : '';
                  const prefix =
                    line.type === 'insert' ? (
                      <span className="text-green-600 dark:text-green-400 select-none w-5 inline-block">
                        +
                      </span>
                    ) : line.type === 'delete' ? (
                      <span className="text-red-600 dark:text-red-400 select-none w-5 inline-block">
                        -
                      </span>
                    ) : (
                      <span className="text-gray-400 select-none w-5 inline-block"> </span>
                    );

                  const content =
                    line.type === 'delete' && line.aChunks
                      ? renderCharDiffs(line.aChunks, 'delete')
                      : line.type === 'insert' && line.bChunks
                        ? renderCharDiffs(line.bChunks, 'insert')
                        : line.value;

                  return (
                    <div key={i} className={`flex px-3 py-0.5 whitespace-pre ${bg}`}>
                      {prefix}
                      <span className="flex-1">{content}</span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
