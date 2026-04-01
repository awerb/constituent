'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FolderOpen,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface TimelineInteraction {
  id: string;
  type:
    | 'case_created'
    | 'message_sent'
    | 'response_received'
    | 'case_resolved'
    | 'signal_sent'
    | 'note_added';
  date: Date;
  summary: string;
  caseRef?: string;
}

interface InteractionTimelineProps {
  interactions: TimelineInteraction[];
}

const getIconForType = (
  type: TimelineInteraction['type']
): React.ReactNode => {
  switch (type) {
    case 'case_created':
      return <FolderOpen className="w-5 h-5" />;
    case 'message_sent':
      return <Mail className="w-5 h-5" />;
    case 'response_received':
      return <MessageSquare className="w-5 h-5" />;
    case 'case_resolved':
      return <CheckCircle className="w-5 h-5" />;
    case 'signal_sent':
      return <AlertCircle className="w-5 h-5" />;
    case 'note_added':
      return <FileText className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

const getColorForType = (
  type: TimelineInteraction['type']
): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} => {
  switch (type) {
    case 'case_created':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-900 dark:text-blue-100',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-600 dark:bg-blue-400',
      };
    case 'message_sent':
      return {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        text: 'text-slate-900 dark:text-slate-100',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-600 dark:bg-slate-400',
      };
    case 'response_received':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-900 dark:text-green-100',
        border: 'border-green-200 dark:border-green-800',
        dot: 'bg-green-600 dark:bg-green-400',
      };
    case 'case_resolved':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-900 dark:text-emerald-100',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-600 dark:bg-emerald-400',
      };
    case 'signal_sent':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-900 dark:text-amber-100',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-600 dark:bg-amber-400',
      };
    case 'note_added':
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-900 dark:text-purple-100',
        border: 'border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-600 dark:bg-purple-400',
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        text: 'text-slate-900 dark:text-slate-100',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-600 dark:bg-slate-400',
      };
  }
};

const getTypeLabel = (type: TimelineInteraction['type']): string => {
  switch (type) {
    case 'case_created':
      return 'Case Created';
    case 'message_sent':
      return 'Message Sent';
    case 'response_received':
      return 'Response Received';
    case 'case_resolved':
      return 'Case Resolved';
    case 'signal_sent':
      return 'Signal Sent';
    case 'note_added':
      return 'Note Added';
    default:
      return 'Event';
  }
};

export const InteractionTimeline: React.FC<InteractionTimelineProps> = ({
  interactions,
}) => {
  return (
    <div className="space-y-4">
      {interactions.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
          No interactions yet
        </p>
      ) : (
        <div className="space-y-4">
          {interactions.map((interaction, index) => {
            const colors = getColorForType(interaction.type);
            const icon = getIconForType(interaction.type);
            const label = getTypeLabel(interaction.type);

            return (
              <div key={interaction.id} className="flex gap-4">
                {/* Timeline Dot and Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full ${colors.dot} flex items-center justify-center text-white shadow-sm`}
                  >
                    {icon}
                  </div>
                  {index < interactions.length - 1 && (
                    <div
                      className={`w-0.5 h-12 ${colors.dot} opacity-40`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div
                    className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-semibold ${colors.text}`}>
                        {label}
                      </p>
                      {interaction.caseRef && (
                        <a
                          href={`/cases/${interaction.caseRef}`}
                          className={`text-xs font-mono underline ${colors.text} hover:opacity-75`}
                        >
                          {interaction.caseRef}
                        </a>
                      )}
                    </div>
                    <p className={`text-sm ${colors.text} leading-relaxed`}>
                      {interaction.summary}
                    </p>
                    <p
                      className={`text-xs mt-2 ${colors.text} opacity-75`}
                    >
                      {formatDistanceToNow(new Date(interaction.date), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
