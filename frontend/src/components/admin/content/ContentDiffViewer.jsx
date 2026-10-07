import React, { useState, useMemo } from 'react';
import { Badge } from '../../ui/badge';
import {
  PlusCircle,
  MinusCircle,
  FileEdit,
  CheckCircle2,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Eye,
  Info,
} from 'lucide-react';
import {
  computeWordDiff,
  computeFieldDiffs,
  computeSectionDiffs,
} from '../../../utils/diffUtils';

const CHAPTER_FIELDS = [
  { key: 'code', label: 'Chapter Code' },
  { key: 'chapterNumber', label: 'Chapter Number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'level', label: 'Hierarchy Level' },
];

const SUBCHAPTER_FIELDS = [
  { key: 'code', label: 'Sub-Chapter Code' },
  { key: 'subChapterNumber', label: 'Sub-Chapter Number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
];

const MEDICINE_FIELDS = [
  { key: 'name', label: 'Generic Name' },
  { key: 'brandNames', label: 'Brand Names' },
  { key: 'therapeuticClass', label: 'Therapeutic Class' },
  { key: 'dosageForm', label: 'Dosage Form' },
  { key: 'strength', label: 'Strength' },
  { key: 'schedule', label: 'Regulatory Schedule' },
  { key: 'atcCode', label: 'ATC Code' },
  { key: 'sideEffects', label: 'Adverse Effects' },
  { key: 'precautions', label: 'Precautions / Warnings' },
];

/**
 * Inline text renderer that highlights:
 * - Green for additions
 * - Red line-through for removals
 */
export const WordDiffText = ({ diffParts = [] }) => {
  if (!Array.isArray(diffParts) || diffParts.length === 0) return null;

  return (
    <span className="leading-relaxed">
      {diffParts.map((part, idx) => {
        if (part.type === 'added') {
          return (
            <mark
              key={idx}
              className="bg-emerald-100 text-emerald-900 font-semibold px-0.5 rounded not-italic border-b-2 border-emerald-500"
              title="Added Content"
            >
              {part.value}
            </mark>
          );
        }
        if (part.type === 'removed') {
          return (
            <del
              key={idx}
              className="bg-rose-100 text-rose-800 line-through px-0.5 rounded not-italic opacity-90 border-b-2 border-rose-400"
              title="Removed Content"
            >
              {part.value}
            </del>
          );
        }
        return <span key={idx}>{part.value}</span>;
      })}
    </span>
  );
};

export const ContentDiffViewer = ({
  item,
  itemType = 'medicine', // 'chapter' | 'subchapter' | 'medicine'
  defaultShowUnchanged = false,
}) => {
  const [showUnchanged, setShowUnchanged] = useState(defaultShowUnchanged);

  const snapshot = item?.lastPublishedSnapshot || null;

  // Determine field definitions
  const fieldDefs = useMemo(() => {
    if (itemType === 'chapter') return CHAPTER_FIELDS;
    if (itemType === 'subchapter') return SUBCHAPTER_FIELDS;
    return MEDICINE_FIELDS;
  }, [itemType]);

  // Compute field differences
  const fieldDiffs = useMemo(() => {
    if (!snapshot) return [];
    return computeFieldDiffs(snapshot, item, fieldDefs);
  }, [snapshot, item, fieldDefs]);

  // Compute section differences for medicines
  const sectionDiffData = useMemo(() => {
    if (itemType !== 'medicine') return null;
    const origSections = snapshot?.sections || [];
    const currSections = item?.sections || [];
    return computeSectionDiffs(origSections, currSections);
  }, [itemType, snapshot, item]);

  // If item is completely new (no baseline snapshot)
  if (!snapshot) {
    const sectionsCount = Array.isArray(item?.sections) ? item.sections.length : 0;
    return (
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] uppercase"
          >
            <PlusCircle className="w-3 h-3 mr-1 text-emerald-700" />
            Newly Authored Entry
          </Badge>
          <span className="text-xs text-emerald-900 font-semibold">
            All submitted fields and {sectionsCount} clinical section(s) are new additions.
          </span>
        </div>
        <p className="text-xs text-emerald-800/90 leading-relaxed">
          No prior published snapshot exists for this item. Approval will publish this entry to the formulary for the first time.
        </p>
      </div>
    );
  }

  const {
    sections = [],
    addedCount = 0,
    removedCount = 0,
    modifiedCount = 0,
  } = sectionDiffData || {};

  const totalFieldChanges = fieldDiffs.length;
  const hasAnyChanges =
    totalFieldChanges > 0 || addedCount > 0 || removedCount > 0 || modifiedCount > 0;

  return (
    <div className="space-y-4">
      {/* Visual Diff Summary Ribbon */}
      <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-amber-400" />
              Visual Review Diff
            </span>
            <span className="text-[11px] text-slate-300">
              (Live Published Baseline vs Submitted Changes)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5 align-middle"></span>
            <strong className="text-emerald-300">Green:</strong> Additions & Updates &bull;{' '}
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400 ml-2 mr-1.5 align-middle"></span>
            <strong className="text-rose-300">Red:</strong> Removals & Deletions
          </p>
        </div>

        {/* Change Stats Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {totalFieldChanges > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-400/20 text-amber-200 border-amber-400/40 text-[10px] font-bold"
            >
              {totalFieldChanges} Field(s) Changed
            </Badge>
          )}
          {addedCount > 0 && (
            <Badge
              variant="outline"
              className="bg-emerald-500/25 text-emerald-300 border-emerald-400/50 text-[10px] font-bold"
            >
              +{addedCount} Section(s) Added
            </Badge>
          )}
          {modifiedCount > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-500/25 text-amber-300 border-amber-400/50 text-[10px] font-bold"
            >
              ~{modifiedCount} Section(s) Modified
            </Badge>
          )}
          {removedCount > 0 && (
            <Badge
              variant="outline"
              className="bg-rose-500/25 text-rose-300 border-rose-400/50 text-[10px] font-bold"
            >
              -{removedCount} Section(s) Removed
            </Badge>
          )}
          {!hasAnyChanges && (
            <Badge
              variant="outline"
              className="bg-slate-700 text-slate-300 border-slate-600 text-[10px] font-semibold"
            >
              No textual changes detected
            </Badge>
          )}
        </div>
      </div>

      {/* Field-Level Differences */}
      {fieldDiffs.length > 0 && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Info className="w-3.5 h-3.5 text-orange-500" />
            Field Updates ({fieldDiffs.length})
          </h5>

          <div className="space-y-2.5">
            {fieldDiffs.map((diff) => (
              <div
                key={diff.key}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs"
              >
                <div className="font-bold text-slate-700 flex items-center justify-between">
                  <span>{diff.label}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-semibold bg-amber-50 text-amber-800 border-amber-200"
                  >
                    Modified
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  {/* Before (Red) */}
                  <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-900 space-y-0.5">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                      - Published (Before)
                    </span>
                    <div className="line-through opacity-85 break-words">
                      {diff.originalValue || <em className="italic text-rose-400">(Empty)</em>}
                    </div>
                  </div>

                  {/* After (Green) */}
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      + Proposed (After)
                    </span>
                    <div className="font-medium break-words">
                      {diff.currentValue || <em className="italic text-emerald-400">(Empty)</em>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monograph Sections Diff (Medicines) */}
      {itemType === 'medicine' && sectionDiffData && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5 text-orange-500" />
              Monograph Clinical Sections Diff ({sections.length})
            </h5>

            <button
              type="button"
              onClick={() => setShowUnchanged((prev) => !prev)}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              {showUnchanged ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Hide Unchanged ({sections.filter((s) => s.diffType === 'unchanged').length})
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Show Unchanged ({sections.filter((s) => s.diffType === 'unchanged').length})
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {sections.map((sec, idx) => {
              if (sec.diffType === 'unchanged' && !showUnchanged) {
                return null;
              }

              // Added Section Card (Green)
              if (sec.diffType === 'added') {
                return (
                  <div
                    key={sec._id || sec.key || idx}
                    className="p-3.5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/60 shadow-xs space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-emerald-600 text-white border-emerald-700 font-bold text-[10px] uppercase gap-1"
                        >
                          <PlusCircle className="w-3 h-3" />
                          + Added Section (New)
                        </Badge>
                        <h6 className="text-xs font-bold text-emerald-950">
                          {sec.order ? `${sec.order}. ` : ''}{sec.title}
                        </h6>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {sec.pageNumber && (
                          <Badge variant="outline" className="text-[9px] bg-white text-emerald-800 border-emerald-200">
                            p. {sec.pageNumber}
                          </Badge>
                        )}
                        {sec.key && (
                          <Badge variant="outline" className="text-[9px] font-mono bg-white text-emerald-800 border-emerald-200">
                            {sec.key}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed whitespace-pre-wrap font-medium">
                      {sec.content || <em className="italic text-emerald-500">No content text specified</em>}
                    </div>
                  </div>
                );
              }

              // Removed Section Card (Red)
              if (sec.diffType === 'removed') {
                return (
                  <div
                    key={sec._id || sec.key || idx}
                    className="p-3.5 rounded-2xl border-2 border-rose-400 border-dashed bg-rose-50/70 shadow-xs space-y-2.5 opacity-90 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-rose-600 text-white border-rose-700 font-bold text-[10px] uppercase gap-1"
                        >
                          <MinusCircle className="w-3 h-3" />
                          - Removed Section (Deleted)
                        </Badge>
                        <h6 className="text-xs font-bold text-rose-950 line-through">
                          {sec.order ? `${sec.order}. ` : ''}{sec.title}
                        </h6>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {sec.pageNumber && (
                          <Badge variant="outline" className="text-[9px] bg-white text-rose-800 border-rose-200">
                            p. {sec.pageNumber}
                          </Badge>
                        )}
                        {sec.key && (
                          <Badge variant="outline" className="text-[9px] font-mono bg-white text-rose-800 border-rose-200">
                            {sec.key}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white/70 rounded-xl border border-rose-200 text-xs text-rose-900 leading-relaxed whitespace-pre-wrap line-through opacity-85">
                      {sec.content || <em className="italic text-rose-400">Section was removed from monograph</em>}
                    </div>
                  </div>
                );
              }

              // Modified Section Card (Word Diff: Green additions, Red deletions)
              if (sec.diffType === 'modified') {
                return (
                  <div
                    key={sec._id || sec.key || idx}
                    className="p-3.5 rounded-2xl border-2 border-amber-400 bg-amber-50/40 shadow-xs space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-amber-500 text-slate-950 border-amber-600 font-bold text-[10px] uppercase gap-1"
                        >
                          <FileEdit className="w-3 h-3" />
                          ~ Modified Section
                        </Badge>
                        <h6 className="text-xs font-bold text-slate-900">
                          {sec.order ? `${sec.order}. ` : ''}
                          {sec.titleWordDiff ? (
                            <WordDiffText diffParts={sec.titleWordDiff} />
                          ) : (
                            sec.title
                          )}
                        </h6>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {sec.isPageChanged && (
                          <Badge variant="outline" className="text-[9px] bg-amber-100 text-amber-800 border-amber-300">
                            Page changed: {sec.original?.pageNumber || '-'} &rarr; {sec.current?.pageNumber || '-'}
                          </Badge>
                        )}
                        {sec.key && (
                          <Badge variant="outline" className="text-[9px] font-mono bg-white text-slate-700 border-slate-200">
                            {sec.key}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Word-by-word content diff */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200/90 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      <WordDiffText diffParts={sec.contentWordDiff} />
                    </div>
                  </div>
                );
              }

              // Unchanged Section Card
              return (
                <div
                  key={sec._id || sec.key || idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sec.order ? `${sec.order}. ` : ''}{sec.title}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-200">
                      Unchanged
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 pl-5">
                    {sec.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDiffViewer;
