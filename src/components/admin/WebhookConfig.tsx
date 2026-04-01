'use client';

import { useState } from 'react';
import { Trash2, Plus, Edit2, Save, X, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered?: Date;
  failureCount: number;
  secret: string;
}

interface WebhookConfigProps {
  webhooks: Webhook[];
  onAdd: (webhook: Omit<Webhook, 'id'>) => void;
  onUpdate: (id: string, webhook: Partial<Webhook>) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
}

const AVAILABLE_EVENTS = [
  'case.created',
  'case.updated',
  'case.status_changed',
  'case.assigned',
  'case.closed',
  'case.reopened',
  'signal.flagged',
  'signal.applauded',
  'newsletter.published',
  'response.sent',
];

export function WebhookConfig({
  webhooks,
  onAdd,
  onUpdate,
  onDelete,
  onTest,
}: WebhookConfigProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Webhook>>({});
  const [newWebhook, setNewWebhook] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const handleEditStart = (webhook: Webhook) => {
    setEditingId(webhook.id);
    setEditData(webhook);
  };

  const handleEditSave = (id: string) => {
    onUpdate(id, editData);
    setEditingId(null);
  };

  const generateSecret = () => {
    return 'whk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleAddNew = () => {
    if (formData.name && formData.url && formData.events.length > 0) {
      onAdd({
        name: formData.name,
        url: formData.url,
        events: formData.events,
        active: true,
        failureCount: 0,
        secret: generateSecret(),
      });
      setFormData({ name: '', url: '', events: [] });
      setNewWebhook(false);
    }
  };

  const toggleEvent = (event: string) => {
    setFormData({
      ...formData,
      events: formData.events.includes(event)
        ? formData.events.filter(e => e !== event)
        : [...formData.events, event],
    });
  };

  const toggleEditEvent = (event: string) => {
    const current = editData.events || [];
    setEditData({
      ...editData,
      events: current.includes(event) ? current.filter(e => e !== event) : [...current, event],
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(id);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Add New Webhook Form */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Webhooks
          </h3>
          <Button
            onClick={() => setNewWebhook(!newWebhook)}
            className="gap-2"
            variant={newWebhook ? 'outline' : 'default'}
          >
            <Plus className="w-4 h-4" />
            {newWebhook ? 'Cancel' : 'Add Webhook'}
          </Button>
        </div>

        {newWebhook && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-slate-700 rounded-lg space-y-4 bg-gray-50 dark:bg-slate-800">
            <div>
              <Label htmlFor="webhookName" className="block text-sm font-medium mb-2">
                Webhook Name
              </Label>
              <Input
                id="webhookName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Webhook"
              />
            </div>

            <div>
              <Label htmlFor="webhookUrl" className="block text-sm font-medium mb-2">
                URL
              </Label>
              <Input
                id="webhookUrl"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/webhook"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Events</Label>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 p-2 rounded hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event)}
                      onChange={() => toggleEvent(event)}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleAddNew} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Create Webhook
            </Button>
          </div>
        )}

        {/* Webhooks Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-slate-700 hover:bg-transparent">
                <TableHead className="text-gray-700 dark:text-gray-300">Name</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">URL</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Events</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Last Triggered</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Failures</TableHead>
                <TableHead className="text-right text-gray-700 dark:text-gray-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) =>
                editingId === webhook.id ? (
                  <TableRow key={webhook.id} className="border-gray-200 dark:border-slate-700">
                    <TableCell>
                      <Input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        className="text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="url"
                        value={editData.url || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, url: e.target.value })
                        }
                        className="text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-xs">
                        {AVAILABLE_EVENTS.map((event) => (
                          <label
                            key={event}
                            className="flex items-center gap-2 text-xs cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={(editData.events || []).includes(event)}
                              onChange={() => toggleEditEvent(event)}
                            />
                            {event}
                          </label>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={editData.active || false}
                        onChange={(e) =>
                          setEditData({ ...editData, active: e.target.checked })
                        }
                      />
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSave(webhook.id)}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow
                    key={webhook.id}
                    className="border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {webhook.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.active ? (
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {webhook.lastTriggered
                        ? new Date(webhook.lastTriggered).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {webhook.failureCount > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {webhook.failureCount}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTest(webhook.id)}
                        >
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart(webhook)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      {deleteConfirm === webhook.id && (
                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-10 min-w-max">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Delete webhook?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                onDelete(webhook.id);
                                setDeleteConfirm(null);
                              }}
                            >
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delivery Log */}
      {webhooks.length > 0 && (
        <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Delivery Log
          </h3>

          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedLog(expandedLog === webhook.id ? null : webhook.id)
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {webhook.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {webhook.url}
                    </p>
                  </div>
                  {expandedLog === webhook.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedLog === webhook.id && (
                  <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800 space-y-3">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-white mb-2">
                        Secret:
                      </p>
                      <div className="flex gap-2 items-center">
                        <code className="flex-1 bg-gray-900 dark:bg-slate-900 text-gray-100 p-2 rounded text-xs truncate">
                          {webhook.secret}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(webhook.secret, webhook.id)}
                        >
                          <Copy className="w-4 h-4" />
                          {copiedSecret === webhook.id ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        Last Delivery Attempts:
                      </p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>
                          {webhook.lastTriggered
                            ? `${new Date(webhook.lastTriggered).toLocaleString()} - Success`
                            : 'No attempts yet'}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
