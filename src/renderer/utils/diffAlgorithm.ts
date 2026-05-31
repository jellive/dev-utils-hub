export interface DiffResult {
  type: 'equal' | 'insert' | 'delete';
  value: string;
  oldIndex: number | undefined;
  newIndex: number | undefined;
}

/**
 * Computes the Longest Common Subsequence (LCS) between two arrays
 */
function computeLCS<T>(a: T[], b: T[]): number[][] {
  const m = a.length;
  const n = b.length;
  const lcs: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  return lcs;
}

/**
 * Walks the LCS matrix to generate diff results.
 *
 * Iterative (was recursive — one frame per line, which overflowed the stack
 * and blocked the main thread on large inputs). Collects in reverse, then
 * reverses to keep the original forward output order.
 */
function backtrack(
  lcs: number[][],
  oldLines: string[],
  newLines: string[],
  i: number,
  j: number
): DiffResult[] {
  const result: DiffResult[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({
        type: 'equal',
        value: oldLines[i - 1],
        oldIndex: i - 1,
        newIndex: j - 1,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      result.push({
        type: 'insert',
        value: newLines[j - 1],
        oldIndex: undefined,
        newIndex: j - 1,
      });
      j--;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      result.push({
        type: 'delete',
        value: oldLines[i - 1],
        oldIndex: i - 1,
        newIndex: undefined,
      });
      i--;
    } else {
      break;
    }
  }

  return result.reverse();
}

/**
 * Compares two texts line by line and returns diff results
 */
export function diffLines(text1: string, text2: string): DiffResult[] {
  const oldLines = text1 ? text1.split('\n') : [];
  const newLines = text2 ? text2.split('\n') : [];

  if (oldLines.length === 0 && newLines.length === 0) {
    return [];
  }

  const lcs = computeLCS(oldLines, newLines);
  const result = backtrack(lcs, oldLines, newLines, oldLines.length, newLines.length);

  return result;
}
