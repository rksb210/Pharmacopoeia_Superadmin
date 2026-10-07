/**
 * Content Diff Utilities
 * Computes word diffs, field-level diffs, and section-level diffs
 * for Chapters, Sub-Chapters, and Drug Monographs with visual color coding:
 * - Additions & Updates: Green
 * - Removals & Deletions: Red
 */

/**
 * Tokenize string into words, preserving spaces and punctuation
 */
function tokenize(str) {
  if (!str) return [];
  return str.split(/(\s+)/).filter(Boolean);
}

/**
 * Computes word-level diff between oldText and newText.
 * Returns array of { type: 'added' | 'removed' | 'unchanged', value: string }
 */
export function computeWordDiff(oldText = '', newText = '') {
  const oldStr = oldText == null ? '' : String(oldText);
  const newStr = newText == null ? '' : String(newText);

  if (oldStr === newStr) {
    return [{ type: 'unchanged', value: oldStr }];
  }
  if (!oldStr) {
    return [{ type: 'added', value: newStr }];
  }
  if (!newStr) {
    return [{ type: 'removed', value: oldStr }];
  }

  const oldTokens = tokenize(oldStr);
  const newTokens = tokenize(newStr);

  // If token matrix is too large (> 300,000 cells), avoid slow computation with fallback
  if (oldTokens.length * newTokens.length > 300000) {
    return [
      { type: 'removed', value: oldStr },
      { type: 'added', value: newStr },
    ];
  }

  const m = oldTokens.length;
  const n = newTokens.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const parts = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      parts.unshift({ type: 'unchanged', value: oldTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      parts.unshift({ type: 'added', value: newTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      parts.unshift({ type: 'removed', value: oldTokens[i - 1] });
      i--;
    }
  }

  // Merge adjacent parts with same type
  const merged = [];
  for (const part of parts) {
    if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
      merged[merged.length - 1].value += part.value;
    } else {
      merged.push({ ...part });
    }
  }

  return merged;
}

/**
 * Computes scalar field differences between an original snapshot and current item
 */
export function computeFieldDiffs(original = {}, current = {}, fieldDefs = []) {
  if (!original) return [];

  const diffs = [];
  for (const def of fieldDefs) {
    const key = def.key;
    const label = def.label || key;

    let origVal = original[key];
    let currVal = current[key];

    // Handle array serialization like brandNames
    if (Array.isArray(origVal)) origVal = origVal.join(', ');
    if (Array.isArray(currVal)) currVal = currVal.join(', ');

    // Normalize empty values
    origVal = origVal == null ? '' : String(origVal).trim();
    currVal = currVal == null ? '' : String(currVal).trim();

    if (origVal !== currVal) {
      diffs.push({
        key,
        label,
        originalValue: origVal,
        currentValue: currVal,
        isNew: !origVal && !!currVal,
        isRemoved: !!origVal && !currVal,
        isModified: !!origVal && !!currVal && origVal !== currVal,
        wordDiff: computeWordDiff(origVal, currVal),
      });
    }
  }

  return diffs;
}

/**
 * Computes section-level differences for drug monographs.
 * Categorizes each section as:
 * - 'added': new section (Green)
 * - 'removed': deleted section (Red)
 * - 'modified': title or content changed (Word diff with Red removed and Green added)
 * - 'unchanged': identical section
 */
export function computeSectionDiffs(originalSections = [], currentSections = []) {
  const origList = Array.isArray(originalSections) ? originalSections : [];
  const currList = Array.isArray(currentSections) ? currentSections : [];

  const usedOrig = new Set();
  const matchedPairs = []; // { current, original }

  // 1. Match by _id
  currList.forEach((c) => {
    if (c._id) {
      const matchIdx = origList.findIndex(
        (o, idx) => !usedOrig.has(idx) && o._id && String(o._id) === String(c._id)
      );
      if (matchIdx !== -1) {
        usedOrig.add(matchIdx);
        matchedPairs.push({ current: c, original: origList[matchIdx] });
        return;
      }
    }
    // 2. Match by key
    if (c.key) {
      const matchIdx = origList.findIndex(
        (o, idx) => !usedOrig.has(idx) && o.key && o.key === c.key
      );
      if (matchIdx !== -1) {
        usedOrig.add(matchIdx);
        matchedPairs.push({ current: c, original: origList[matchIdx] });
        return;
      }
    }
    // 3. Match by exact title
    const cTitle = (c.title || c.label || '').trim().toLowerCase();
    if (cTitle) {
      const matchIdx = origList.findIndex(
        (o, idx) =>
          !usedOrig.has(idx) &&
          (o.title || o.label || '').trim().toLowerCase() === cTitle
      );
      if (matchIdx !== -1) {
        usedOrig.add(matchIdx);
        matchedPairs.push({ current: c, original: origList[matchIdx] });
        return;
      }
    }

    // Unmatched in original -> Added
    matchedPairs.push({ current: c, original: null });
  });

  // Find remaining original items that were not matched -> Removed
  const removedSections = origList
    .map((o, idx) => ({ original: o, idx }))
    .filter(({ idx }) => !usedOrig.has(idx))
    .map(({ original }) => ({
      diffType: 'removed',
      original,
      current: null,
      title: original.title || original.label || 'Untitled Section',
      content: original.content || original.text || '',
      order: original.order,
      pageNumber: original.pageNumber,
      key: original.key,
      customTable: original.customTable,
      tableId: original.tableId,
    }));

  const activeResults = matchedPairs.map(({ current, original }) => {
    if (!original) {
      return {
        diffType: 'added',
        original: null,
        current,
        title: current.title || current.label || 'Untitled Section',
        content: current.content || current.text || '',
        order: current.order,
        pageNumber: current.pageNumber,
        key: current.key,
        customTable: current.customTable,
        tableId: current.tableId,
      };
    }

    const origTitle = original.title || original.label || '';
    const currTitle = current.title || current.label || '';
    const origContent = original.content || original.text || '';
    const currContent = current.content || current.text || '';

    const isTitleChanged = origTitle.trim() !== currTitle.trim();
    const isContentChanged = origContent.trim() !== currContent.trim();
    const isOrderChanged = original.order !== current.order;
    const isPageChanged = original.pageNumber !== current.pageNumber;

    if (isTitleChanged || isContentChanged || isOrderChanged || isPageChanged) {
      return {
        diffType: 'modified',
        original,
        current,
        title: currTitle || origTitle || 'Untitled Section',
        content: currContent,
        titleWordDiff: isTitleChanged ? computeWordDiff(origTitle, currTitle) : null,
        contentWordDiff: computeWordDiff(origContent, currContent),
        isTitleChanged,
        isContentChanged,
        isOrderChanged,
        isPageChanged,
        order: current.order ?? original.order,
        pageNumber: current.pageNumber ?? original.pageNumber,
        key: current.key || original.key,
        customTable: current.customTable || original.customTable,
        tableId: current.tableId || original.tableId,
      };
    }

    return {
      diffType: 'unchanged',
      original,
      current,
      title: currTitle || origTitle || 'Untitled Section',
      content: currContent,
      order: current.order,
      pageNumber: current.pageNumber,
      key: current.key,
      customTable: current.customTable,
      tableId: current.tableId,
    };
  });

  // Combine and sort by order
  const allSections = [...activeResults, ...removedSections];
  allSections.sort((a, b) => (a.order || 0) - (b.order || 0));

  const addedCount = allSections.filter((s) => s.diffType === 'added').length;
  const removedCount = allSections.filter((s) => s.diffType === 'removed').length;
  const modifiedCount = allSections.filter((s) => s.diffType === 'modified').length;

  return {
    sections: allSections,
    addedCount,
    removedCount,
    modifiedCount,
    hasChanges: addedCount > 0 || removedCount > 0 || modifiedCount > 0,
  };
}
