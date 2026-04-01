'use client';

import React from 'react';
import type { PrivacyStatus } from '@prisma/client';
import { Check, Clock, Trash2, Eye } from 'lucide-react';

interface PrivacyBadgeProps {
  status: PrivacyStatus;
  compact?: boolean;
}

const PRIVACY_CONFIG: Record<
  PrivacyStatus,
  {
    bg: string;
    text: string;
    icon: React.ReactNode;
    label: string;
    description: string;
  }
> = {
  ACTIVE: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    icon: <Check className="w-4 h-4" />,
    label: 'Active',
    description: 'All data retained and accessible',
  },
  EXPORT_REQUESTED: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: <Clock className="w-4 h-4" />,
    label: 'Export Pending',
    description: 'Data export in progress',
  },
  DELETION_REQUESTED: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    icon: <Trash2 className="w-4 h-4" />,
    label: 'Deletion Pending',
    description: 'Scheduled for deletion',
  },
  ANONYMIZED: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-300',
    icon: <Eye className="w-4 h-4" />,
    label: 'Anonymized',
    description: 'Data anonymized and inaccessible',
  },
};

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  status,
  compact = false,
}) => {
  const config = PRIVACY_CONFIG[status];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 flex items-start gap-3 ${config.bg} ${config.text} border-opacity-50`}
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div>
        <p className="font-semibold text-sm">{config.label}</p>
        <p className="text-xs opacity-75">{config.description}</p>
      </div>
    </div>
  );
};
