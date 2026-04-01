'use client';

import React, { useEffect, useRef } from 'react';
import type { CaseMessage } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Globe } from 'lucide-react';

interface ConversationThreadProps {
  messages: CaseMessage[];
  constituentName: string;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  messages,
  constituentName,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isSystemMessage = (msg: CaseMessage): boolean => {
    return msg.authorType === 'SYSTEM';
  };

  const isStaffMessage = (msg: CaseMessage): boolean => {
    return msg.authorType === 'STAFF';
  };

  return (
    <div className="space-y-4 p-6">
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No messages yet</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${isStaffMessage(msg) ? 'justify-end' : 'justify-start'}`}
          >
            {isSystemMessage(msg) ? (
              // System Message
              <div className="w-full text-center py-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  {msg.content}
                </p>
              </div>
            ) : (
              // Regular Message
              <div
                className={`max-w-md ${
                  isStaffMessage(msg)
                    ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-lg rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg rounded-tl-none'
                } p-4`}
              >
                {/* Author and Timestamp */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold">
                    {isStaffMessage(msg)
                      ? msg.authorName || 'Staff Member'
                      : constituentName}
                  </span>
                  <span
                    className={`text-xs ${
                      isStaffMessage(msg)
                        ? 'text-blue-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {/* Language Badge */}
                {msg.contentLanguage && msg.contentLanguage !== 'en' && (
                  <div
                    className={`inline-flex items-center gap-1 mb-2 px-2 py-1 rounded text-xs font-medium ${
                      isStaffMessage(msg)
                        ? 'bg-blue-500/30'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    {msg.contentLanguage.toUpperCase()}
                  </div>
                )}

                {/* Message Content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>

                {/* Attachments */}
                {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-opacity-20 border-current">
                    <p className="text-xs font-medium mb-2 opacity-75">Attachments:</p>
                    <div className="space-y-1">
                      {(msg.attachments as Array<{ name?: string; url?: string; size?: number }>).map(
                        (att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block text-xs underline ${
                              isStaffMessage(msg)
                                ? 'text-blue-100 hover:text-white'
                                : 'text-blue-600 dark:text-blue-400 hover:text-blue-700'
                            }`}
                          >
                            {att.name || 'Attachment'}
                            {att.size && ` (${(att.size / 1024).toFixed(1)}KB)`}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
};
