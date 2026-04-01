'use client';

import { useState } from 'react';
import { Download, Upload, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs } from '@/components/ui/tabs';

interface DataExportProps {
  onExportAll?: () => void;
  onImport?: (file: File, columnMapping: Record<string, string>) => void;
  onSaveRetention?: (archiveDays: number, autoCloseDays: number) => void;
}

export function DataExport({
  onExportAll,
  onImport,
  onSaveRetention,
}: DataExportProps) {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [archiveDays, setArchiveDays] = useState('180');
  const [autoCloseDays, setAutoCloseDays] = useState('90');
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const handleExportAll = async () => {
    setExportLoading(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => Math.min(prev + Math.random() * 30, 90));
    }, 500);

    try {
      if (onExportAll) {
        await onExportAll();
      }
      setExportProgress(100);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setExportLoading(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Simulate reading first 10 rows
      setPreviewData([
        {
          ref: 'CASE-2024-001',
          constituent: 'John Doe',
          subject: 'Pothole on Main St',
          created: '2024-01-15',
        },
        {
          ref: 'CASE-2024-002',
          constituent: 'Jane Smith',
          subject: 'Broken streetlight',
          created: '2024-01-16',
        },
        {
          ref: 'CASE-2024-003',
          constituent: 'Bob Johnson',
          subject: 'Graffiti removal',
          created: '2024-01-17',
        },
      ]);
      setImportStep('mapping');
    }
  };

  const handleMappingChange = (csvColumn: string, systemColumn: string) => {
    setColumnMapping({ ...columnMapping, [csvColumn]: systemColumn });
  };

  const handleImportConfirm = async () => {
    if (importFile && onImport) {
      setImportLoading(true);
      try {
        await onImport(importFile, columnMapping);
        setImportFile(null);
        setColumnMapping({});
        setPreviewData([]);
        setImportStep('upload');
      } finally {
        setImportLoading(false);
      }
    }
  };

  const handleSaveRetention = async () => {
    setRetentionLoading(true);
    try {
      if (onSaveRetention) {
        await onSaveRetention(parseInt(archiveDays), parseInt(autoCloseDays));
      }
    } finally {
      setRetentionLoading(false);
    }
  };

  const csvColumns = previewData.length > 0 ? Object.keys(previewData[0]) : [];
  const systemColumns = ['ref', 'constituent_id', 'department_id', 'subject', 'description', 'status', 'priority', 'created_at'];

  return (
    <div className="space-y-6">
      {/* Bulk Export */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Bulk Export
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export all cases, constituents, and related data
        </p>

        <div className="space-y-4">
          <Button
            onClick={handleExportAll}
            disabled={exportLoading}
            className="w-full gap-2"
          >
            <Download className="w-4 h-4" />
            {exportLoading ? 'Exporting...' : 'Export All Data'}
          </Button>

          {exportLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Exporting data...
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
        </div>
      </Card>

      {/* Import */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Import Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Import cases from CSV file
        </p>

        {importStep === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center">
              <label className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Drag and drop or click to upload CSV
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  CSV format: ref, constituent, subject, description, etc.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {importStep === 'mapping' && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Column Mapping
              </Label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Map CSV columns to system fields
              </p>
              <div className="space-y-2">
                {csvColumns.map((csvCol) => (
                  <div
                    key={csvCol}
                    className="flex gap-3 items-center p-3 border border-gray-200 dark:border-slate-700 rounded"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32">
                      {csvCol}
                    </span>
                    <span className="text-gray-400">→</span>
                    <select
                      value={columnMapping[csvCol] || ''}
                      onChange={(e) =>
                        handleMappingChange(csvCol, e.target.value)
                      }
                      className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-white text-sm"
                    >
                      <option value="">Select field</option>
                      {systemColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setImportStep('preview')}
              className="w-full"
            >
              Continue to Preview
            </Button>
          </div>
        )}

        {importStep === 'preview' && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Preview (First 10 rows)
              </Label>
              <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                      {csvColumns.map((col) => (
                        <th
                          key={col}
                          className="p-3 text-left font-medium text-gray-900 dark:text-white"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        {csvColumns.map((col) => (
                          <td
                            key={col}
                            className="p-3 text-gray-600 dark:text-gray-400"
                          >
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setImportStep('mapping')}
                variant="outline"
                className="flex-1"
              >
                Back to Mapping
              </Button>
              <Button
                onClick={handleImportConfirm}
                disabled={importLoading}
                className="flex-1 gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {importLoading ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Retention Policies */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Retention Policies
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Automatic data archival and case closing
        </p>

        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              These settings will automatically close and archive old cases. Archived data can still be exported for FOIA compliance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="autoCloseDays" className="block text-sm font-medium mb-2">
                Auto-Close Cases (days)
              </Label>
              <Input
                id="autoCloseDays"
                type="number"
                value={autoCloseDays}
                onChange={(e) => setAutoCloseDays(e.target.value)}
                placeholder="90"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Cases inactive for this long will auto-close
              </p>
            </div>

            <div>
              <Label htmlFor="archiveDays" className="block text-sm font-medium mb-2">
                Archive Cases (days)
              </Label>
              <Input
                id="archiveDays"
                type="number"
                value={archiveDays}
                onChange={(e) => setArchiveDays(e.target.value)}
                placeholder="180"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Closed cases older than this will be archived
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveRetention}
            disabled={retentionLoading}
            className="w-full gap-2"
          >
            <Save className="w-4 h-4" />
            {retentionLoading ? 'Saving...' : 'Save Retention Policy'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
