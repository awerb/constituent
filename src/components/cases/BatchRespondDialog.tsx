'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Send } from 'lucide-react';

interface CaseSummary {
  id: string;
  referenceNumber: string;
  constituentName: string;
  constituentEmail: string;
  subject: string;
}

interface BatchRespondDialogProps {
  cases: CaseSummary[];
  onSend: (responseText: string) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export const BatchRespondDialog: React.FC<BatchRespondDialogProps> = ({
  cases,
  onSend,
  onClose,
  isOpen,
}) => {
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!responseText.trim()) return;

    setIsLoading(true);
    try {
      await onSend(responseText);
      setResponseText('');
      onClose();
    } catch (error) {
      console.error('Failed to send batch responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:border-slate-700 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Batch Response</DialogTitle>
          <DialogDescription>
            Send a personalized response to {cases.length} constituent{cases.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cases List */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Cases ({cases.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      {caseItem.referenceNumber}
                    </p>
                    <p className="text-sm text-slate-900 dark:text-white font-medium truncate">
                      {caseItem.subject}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {caseItem.constituentEmail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Note */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Each email will be personalized with "Dear [Name]" and the constituent's name will be
              used from their profile.
            </p>
          </div>

          {/* Response Textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white">
              Response Message
            </label>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Write your response. It will be sent to all selected constituents..."
              className="min-h-40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {responseText.length} characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading || !responseText.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to {cases.length} Constituent{cases.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
