'use client';

import React from 'react';
import { Link } from 'lucide-react';

interface RelatedCase {
  id: string;
  referenceNumber: string;
  subject: string;
  status: string;
}

interface RelatedCasesProps {
  cases: RelatedCase[];
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'RESOLVED':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'CLOSED':
      return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
    default:
      return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
  }
};

export const RelatedCases: React.FC<RelatedCasesProps> = ({ cases }) => {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Related Cases</h3>
      </div>

      <div className="space-y-2">
        {cases.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No related cases</p>
        ) : (
          cases.map((relatedCase) => (
            <a
              key={relatedCase.id}
              href={`/cases/${relatedCase.id}`}
              className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  {relatedCase.referenceNumber}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    relatedCase.status
                  )}`}
                >
                  {relatedCase.status}
                </span>
              </div>
              <p className="text-sm text-slate-900 dark:text-white line-clamp-2 font-medium">
                {relatedCase.subject}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
};
