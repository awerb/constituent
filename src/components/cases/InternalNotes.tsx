'use client';

import React from 'react';
import type { CaseMessage } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle } from 'lucide-react';

interface InternalNotesProps {
  notes: CaseMessage[];
}

export const InternalNotes: React.FC<InternalNotesProps> = ({ notes }) => {
  return (
    <div className="space-y-4 p-6">
      {/* Staff Only Banner */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              STAFF ONLY
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Not visible to constituent. Excluded from public records by default.
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No internal notes yet</p>
        </div>
      ) : (
        notes.map((note) => (
          <div
            key={note.id}
            className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4"
          >
            {/* Author and Timestamp */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {note.authorName || 'Unknown'}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {formatDistanceToNow(new Date(note.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Note Content */}
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
              {note.content}
            </p>

            {/* Metadata */}
            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 flex gap-4 text-xs text-slate-600 dark:text-slate-400">
              {note.isPublicRecordsExcluded && (
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  Excluded from public records
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
