'use client';

import React, { useState } from 'react';
import { NewsletterSignal } from '@prisma/client';
import { ChevronDown, ChevronUp, ThumbsUp, Flag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewsletterContextProps {
  newsletterSignal: NewsletterSignal;
}

export const NewsletterContext: React.FC<NewsletterContextProps> = ({
  newsletterSignal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Cast metadata to expected structure
  const metadata = (newsletterSignal.metadata as Record<string, unknown>) || {};
  const title = (metadata.title as string) || 'Newsletter Item';
  const summary = (metadata.summary as string) || '';
  const tcDataUrl = (metadata.tcDataUrl as string) || '';
  const flagCount = (metadata.flagCount as number) || 0;
  const applaudCount = (metadata.applaudCount as number) || 0;

  const truncatedSummary = summary.length > 150 ? summary.substring(0, 150) + '...' : summary;

  return (
    <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
            {title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {truncatedSummary}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {flagCount} flags
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {applaudCount} applaud
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-700 space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {summary}
          </p>

          {tcDataUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 dark:border-slate-700"
              asChild
            >
              <a href={tcDataUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                View Full Data on TC
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
