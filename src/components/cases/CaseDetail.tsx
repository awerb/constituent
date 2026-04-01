'use client';

import React, { useState } from 'react';
import type { CaseWithRelations } from '@/types';
import { ConversationThread } from './ConversationThread';
import { InternalNotes } from './InternalNotes';
import { AIDraftPanel } from './AIDraftPanel';
import { ComposePanel } from './ComposePanel';
import { StatusControls } from './StatusControls';
import { NewsletterContext } from './NewsletterContext';
import { RelatedCases } from './RelatedCases';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CaseDetailProps {
  caseData: CaseWithRelations;
  currentUserId: string;
  departments?: Array<{ id: string; name: string }>;
  users?: Array<{ id: string; name: string; email: string; avatar?: string }>;
  onCaseUpdate?: (updatedCase: CaseWithRelations) => void;
  onMessageAdd?: (messageContent: string, isInternal: boolean) => Promise<void>;
  isAiEnabled?: boolean;
  isAiAvailable?: boolean;
  relatedCases?: Array<{ id: string; referenceNumber: string; subject: string; status: string }>;
  templates?: Array<{ id: string; name: string; content: string; category: string }>;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({
  caseData,
  currentUserId,
  departments = [],
  users = [],
  onCaseUpdate,
  onMessageAdd,
  isAiEnabled = false,
  isAiAvailable = false,
  relatedCases = [],
  templates = [],
}) => {
  const [activeTab, setActiveTab] = useState<'conversation' | 'notes'>('conversation');
  const [composeText, setComposeText] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const publicMessages = caseData.messages.filter(
    (msg) => !msg.isInternalNote && !msg.isPublicRecordsExcluded
  );
  const internalNotes = caseData.messages.filter((msg) => msg.isInternalNote);

  const handleStatusUpdate = async (field: string, value: unknown) => {
    if (onCaseUpdate) {
      const updated = { ...caseData, [field]: value };
      onCaseUpdate(updated as CaseWithRelations);
    }
  };

  const handleUseDraft = (text: string) => {
    setComposeText(text);
    setIsComposing(true);
  };

  const handleGenerateAiDraft = async (tone: string): Promise<string> => {
    // This would call your AI service
    // For now, return a placeholder that the caller would replace
    return `[AI Generated Draft - Tone: ${tone}]`;
  };

  const handleSendMessage = async () => {
    if (!composeText.trim() || !onMessageAdd) return;

    try {
      await onMessageAdd(composeText, false);
      setComposeText('');
      setIsComposing(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSendInternalNote = async () => {
    if (!composeText.trim() || !onMessageAdd) return;

    try {
      await onMessageAdd(composeText, true);
      setComposeText('');
      setIsComposing(false);
    } catch (error) {
      console.error('Failed to send internal note:', error);
    }
  };

  return (
    <div className="flex h-full gap-6 bg-white dark:bg-slate-950">
      {/* Left Column - Conversation */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Case Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {caseData.subject}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ref: {caseData.referenceNumber} · {caseData.constituent.name || caseData.constituent.email}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
              {caseData.status}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-6">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'conversation' | 'notes')}>
            <TabsList className="border-none bg-transparent">
              <TabsTrigger value="conversation" className="border-b-2 border-transparent rounded-none">
                Conversation ({publicMessages.length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="border-b-2 border-transparent rounded-none">
                Internal Notes ({internalNotes.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'conversation' ? (
            <ConversationThread
              messages={publicMessages}
              constituentName={caseData.constituent.name || 'Constituent'}
            />
          ) : (
            <InternalNotes notes={internalNotes} />
          )}
        </div>

        {/* Compose Panel */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/50">
          <ComposePanel
            value={composeText}
            onChange={setComposeText}
            onSend={activeTab === 'notes' ? handleSendInternalNote : handleSendMessage}
            isLoading={false}
            placeholder={activeTab === 'notes' ? 'Add internal note...' : 'Type your response...'}
            showInternalNoteBadge={activeTab === 'notes'}
          />

          {/* AI Draft Panel */}
          <div className="mt-4">
            <AIDraftPanel
              onDraft={handleGenerateAiDraft}
              onUseDraft={handleUseDraft}
              isAiEnabled={isAiEnabled}
              isAiAvailable={isAiAvailable}
              onUseTemplate={() => setComposeText('[Select template to insert]')}
              templates={templates}
              variables={{
                constituentName: caseData.constituent.name || 'Constituent',
                caseRef: caseData.referenceNumber,
                department: caseData.department?.name || 'Department',
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className="w-96 border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Status Controls */}
          <StatusControls
            caseData={caseData}
            departments={departments}
            users={users}
            onUpdate={handleStatusUpdate}
          />

          {/* Newsletter Context */}
          {caseData.newsletterSignals && caseData.newsletterSignals.length > 0 && (
            <NewsletterContext
              newsletterSignal={caseData.newsletterSignals[0]}
            />
          )}

          {/* Related Cases */}
          {relatedCases.length > 0 && (
            <RelatedCases cases={relatedCases} />
          )}

          {/* Quick Info */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Created</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {new Date(caseData.createdAt).toLocaleDateString()} at{' '}
              {new Date(caseData.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
