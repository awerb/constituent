'use client';

import { useState } from 'react';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Department {
  id: string;
  name: string;
}

interface FOIAExportProps {
  departments: Department[];
  onGenerateExport?: (filters: FOIAExportFilters) => void;
}

interface FOIAExportFilters {
  fromDate: string;
  toDate: string;
  departmentId?: string;
  topic?: string;
  includeInternalNotes: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
}

export function FOIAExport({ departments, onGenerateExport }: FOIAExportProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [topic, setTopic] = useState('');
  const [includeInternalNotes, setIncludeInternalNotes] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([
    {
      id: '1',
      timestamp: '2024-03-15T10:30:00Z',
      userId: 'admin-001',
      userEmail: 'admin@city.gov',
      action: 'FOIA Export Generated',
      details: 'Date range: 2024-01-01 to 2024-03-31, 245 records',
    },
    {
      id: '2',
      timestamp: '2024-03-14T14:15:00Z',
      userId: 'admin-002',
      userEmail: 'manager@city.gov',
      action: 'FOIA Export Generated',
      details: 'Date range: 2024-02-01 to 2024-03-14, 156 records',
    },
  ]);

  const topicOptions = [
    'Pothole',
    'Graffiti',
    'Streetlight',
    'Traffic Signal',
    'Debris',
    'Drainage',
    'Sidewalk',
    'Parking',
    'Noise',
    'Other',
  ];

  const handleGenerateExport = async () => {
    if (!fromDate || !toDate) {
      alert('Please select both from and to dates');
      return;
    }

    setExportLoading(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => Math.min(prev + Math.random() * 25, 95));
    }, 400);

    try {
      const filters: FOIAExportFilters = {
        fromDate,
        toDate,
        departmentId: departmentId || undefined,
        topic: topic || undefined,
        includeInternalNotes,
      };

      if (onGenerateExport) {
        await onGenerateExport(filters);
      }

      setExportProgress(100);
      setExportComplete(true);

      // Add to audit log
      const newEntry: AuditLogEntry = {
        id: String(auditLog.length + 1),
        timestamp: new Date().toISOString(),
        userId: 'admin-001',
        userEmail: 'admin@city.gov',
        action: 'FOIA Export Generated',
        details: `Date range: ${fromDate} to ${toDate}${
          departmentId ? `, Department: ${departments.find(d => d.id === departmentId)?.name}` : ''
        }${topic ? `, Topic: ${topic}` : ''}, ${Math.floor(Math.random() * 500)} records`,
      };
      setAuditLog([newEntry, ...auditLog]);

      setTimeout(() => {
        setExportComplete(false);
      }, 3000);
    } finally {
      clearInterval(interval);
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* FOIA Export Form */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          FOIA Export
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Generate compliant export for Freedom of Information Act requests
        </p>

        <div className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromDate" className="block text-sm font-medium mb-2">
                From Date
              </Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="toDate" className="block text-sm font-medium mb-2">
                To Date
              </Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <Label htmlFor="department" className="block text-sm font-medium mb-2">
              Department (Optional)
            </Label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-white border-gray-300 dark:border-slate-600"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <Label htmlFor="topic" className="block text-sm font-medium mb-2">
              Topic (Optional)
            </Label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-white border-gray-300 dark:border-slate-600"
            >
              <option value="">All Topics</option>
              {topicOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Internal Notes Checkbox */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={includeInternalNotes}
                onChange={(e) => setIncludeInternalNotes(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Include Internal Notes
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Staff-only notes may include sensitive information
                </p>
              </div>
            </label>

            {includeInternalNotes && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Including internal notes may reveal confidential information, legal advice, or personnel matters. Ensure FOIA exemptions are properly applied.
                </p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateExport}
            disabled={exportLoading}
            className="w-full gap-2"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? 'Generating Export...' : 'Generate FOIA Export'}
          </Button>

          {/* Progress Indicator */}
          {exportLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Preparing export...
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {Math.round(exportProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Export Complete */}
          {exportComplete && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Export generated successfully
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your FOIA export is ready for download
                </p>
              </div>
            </div>
          )}

          {/* Compliance Note */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Compliance:</strong> All FOIA exports are logged for audit purposes. Redactions and exemptions applied per local regulations.
            </p>
          </div>
        </div>
      </Card>

      {/* Audit Log */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Audit Log
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          All FOIA export requests are recorded for compliance
        </p>

        <div className="space-y-3">
          {auditLog.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No FOIA exports yet
            </p>
          ) : (
            auditLog.map((entry) => (
              <div
                key={entry.id}
                className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {entry.action}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {entry.details}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      By: {entry.userEmail}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
