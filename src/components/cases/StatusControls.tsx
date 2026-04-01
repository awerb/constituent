'use client';

import React from 'react';
import type { CaseWithRelations } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, AlertCircle, User, Layers } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatusControlsProps {
  caseData: CaseWithRelations;
  departments: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; email: string; avatar?: string }>;
  onUpdate: (field: string, value: unknown) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  IN_PROGRESS: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  AWAITING_RESPONSE: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  RESOLVED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  CLOSED: { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-300' },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-blue-600 dark:text-blue-400',
  MEDIUM: 'text-yellow-600 dark:text-yellow-400',
  HIGH: 'text-orange-600 dark:text-orange-400',
  URGENT: 'text-red-600 dark:text-red-400',
};

export const StatusControls: React.FC<StatusControlsProps> = ({
  caseData,
  departments,
  users,
  onUpdate,
}) => {
  const slaDeadline = caseData.slaDeadline ? new Date(caseData.slaDeadline) : null;
  const isSlaBreach = slaDeadline ? slaDeadline < new Date() : false;
  const statusColor = STATUS_COLORS[caseData.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.NEW;

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Status
        </label>
        <Select value={caseData.status} onValueChange={(val) => onUpdate('status', val)}>
          <SelectTrigger className={`dark:border-slate-700 ${statusColor.text}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="AWAITING_RESPONSE">Awaiting Response</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          Priority
        </label>
        <Select value={caseData.priority} onValueChange={(val) => onUpdate('priority', val)}>
          <SelectTrigger className={`dark:border-slate-700 ${PRIORITY_COLORS[caseData.priority as keyof typeof PRIORITY_COLORS] || ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <label className="text-sm font-semibold text-slate-900 dark:text-white">
            Department
          </label>
        </div>
        <Select
          value={caseData.departmentId}
          onValueChange={(val) => onUpdate('departmentId', val)}
        >
          <SelectTrigger className="dark:border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assigned To */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <label className="text-sm font-semibold text-slate-900 dark:text-white">
            Assigned To
          </label>
        </div>
        <Select
          value={caseData.assignedToId || ''}
          onValueChange={(val) => onUpdate('assignedToId', val || null)}
        >
          <SelectTrigger className="dark:border-slate-700">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  {user.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SLA Status */}
      {slaDeadline && (
        <div
          className={`rounded-lg border p-4 ${
            isSlaBreach
              ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {isSlaBreach ? (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {isSlaBreach ? 'SLA Breached' : 'SLA Deadline'}
              </p>
              <p
                className={`text-sm ${
                  isSlaBreach
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isSlaBreach ? (
                  <>Breached {formatDistanceToNow(slaDeadline, { addSuffix: true })}</>
                ) : (
                  <>
                    Due {formatDistanceToNow(slaDeadline, { addSuffix: true })}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Case Age */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
          Age
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Created {formatDistanceToNow(new Date(caseData.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};
