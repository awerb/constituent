'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Wand2, AlertCircle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TemplateSelector } from './TemplateSelector';

interface AIDraftPanelProps {
  onDraft: (tone: string) => Promise<string>;
  onUseDraft: (text: string) => void;
  isAiEnabled: boolean;
  isAiAvailable: boolean;
  onUseTemplate: () => void;
  templates?: Array<{ id: string; name: string; content: string; category: string }>;
  variables?: Record<string, string>;
  monthlyDraftsUsed?: number;
  monthlyDraftsLimit?: number;
}

type ToneType = 'formal' | 'friendly' | 'empathetic' | 'technical';

export const AIDraftPanel: React.FC<AIDraftPanelProps> = ({
  onDraft,
  onUseDraft,
  isAiEnabled,
  isAiAvailable,
  onUseTemplate,
  templates = [],
  variables = {},
  monthlyDraftsUsed = 0,
  monthlyDraftsLimit = 0,
}) => {
  const [draft, setDraft] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ToneType>('friendly');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [draftCount, setDraftCount] = useState(monthlyDraftsUsed);
  const [limitExceeded, setLimitExceeded] = useState(false);

  // Check if monthly limit is exceeded
  useEffect(() => {
    if (monthlyDraftsLimit > 0 && draftCount >= monthlyDraftsLimit) {
      setLimitExceeded(true);
    } else {
      setLimitExceeded(false);
    }
  }, [draftCount, monthlyDraftsLimit]);

  const handleGenerateDraft = async () => {
    // Check limit before generating
    if (limitExceeded) {
      alert(
        `Monthly AI draft limit reached (${draftCount}/${monthlyDraftsLimit}). Please use a template instead.`
      );
      setShowTemplateSelector(true);
      return;
    }

    setIsLoading(true);
    try {
      const generatedDraft = await onDraft(selectedTone);
      setDraft(generatedDraft);
      // Increment local counter
      setDraftCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to generate draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDraft = () => {
    onUseDraft(draft);
  };

  const handleSelectTemplate = (content: string) => {
    let processedContent = content;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      processedContent = processedContent.replace(
        new RegExp(`{${key}}`, 'g'),
        value
      );
    });

    onUseDraft(processedContent);
    setShowTemplateSelector(false);
  };

  // AI Limit Exceeded
  if (limitExceeded) {
    return (
      <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-900 dark:text-red-100 mb-3">
              Monthly AI draft limit reached ({draftCount}/{monthlyDraftsLimit}). Use a template instead.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
              className="dark:border-red-700"
            >
              Use Template
            </Button>
          </div>
        </div>
        {showTemplateSelector && (
          <TemplateSelector
            templates={templates}
            onSelect={handleSelectTemplate}
            variables={variables}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}
      </div>
    );
  }

  // AI Not Enabled
  if (!isAiEnabled) {
    return (
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-slate-900 dark:text-white mb-3">
              AI drafting is not enabled for this city
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
              className="dark:border-slate-700"
            >
              Use Template
            </Button>
          </div>
        </div>
        {showTemplateSelector && (
          <TemplateSelector
            templates={templates}
            onSelect={handleSelectTemplate}
            variables={variables}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}
      </div>
    );
  }

  // AI Not Available
  if (!isAiAvailable) {
    return (
      <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-3">
              AI is temporarily unavailable. Use a template or write manually.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
              className="dark:border-yellow-700"
            >
              Use Template
            </Button>
          </div>
        </div>
        {showTemplateSelector && (
          <TemplateSelector
            templates={templates}
            onSelect={handleSelectTemplate}
            variables={variables}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}
      </div>
    );
  }

  // AI Available
  return (
    <div className="space-y-3">
      {!draft ? (
        // Generate Draft UI
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-slate-900 dark:text-white">
                  Generate AI Draft
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-slate-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI drafts cost ~$0.01 each</p>
                      {monthlyDraftsLimit > 0 && (
                        <p>({draftCount}/{monthlyDraftsLimit} used this month)</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={selectedTone} onValueChange={(val) => setSelectedTone(val as ToneType)}>
                <SelectTrigger className="dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="empathetic">Empathetic</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerateDraft}
              disabled={isLoading}
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
          {monthlyDraftsLimit > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Usage: {draftCount} of {monthlyDraftsLimit} drafts this month
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplateSelector(true)}
            className="mt-2 text-slate-600 dark:text-slate-400"
          >
            Use Template Instead
          </Button>
        </div>
      ) : (
        // Draft Preview UI
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-900 dark:text-white">
              AI Draft (Tone: {selectedTone})
            </label>
            {monthlyDraftsLimit > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {draftCount}/{monthlyDraftsLimit}
              </span>
            )}
          </div>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-32 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="flex gap-2 mt-3">
            <Button onClick={handleUseDraft} size="sm" className="flex-1">
              Use This Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateDraft}
              disabled={isLoading}
              className="gap-2 dark:border-slate-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft('');
                setShowTemplateSelector(true);
              }}
              className="dark:text-slate-400"
            >
              Use Template
            </Button>
          </div>
        </div>
      )}

      {showTemplateSelector && (
        <TemplateSelector
          templates={templates}
          onSelect={handleSelectTemplate}
          variables={variables}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
};
