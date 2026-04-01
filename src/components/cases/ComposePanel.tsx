'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Send } from 'lucide-react';

interface ComposePanelProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
  showInternalNoteBadge?: boolean;
}

export const ComposePanel: React.FC<ComposePanelProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Type your response...',
  showInternalNoteBadge = false,
}) => {
  return (
    <div className="space-y-3">
      {showInternalNoteBadge && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
            This will be an internal note (not sent to constituent)
          </span>
        </div>
      )}

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-32 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />

      <div className="flex justify-end gap-2">
        <Button
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          className="gap-2"
        >
          {isLoading ? 'Sending...' : 'Send'}
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
