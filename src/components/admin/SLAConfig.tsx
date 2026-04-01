'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit2, Save, X } from 'lucide-react';

interface SLAConfig {
  departmentId: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  responseHours: number;
  resolutionHours: number;
}

interface Department {
  id: string;
  name: string;
}

interface SLAConfigProps {
  configs: SLAConfig[];
  departments: Department[];
  onSave: (configs: SLAConfig[]) => void;
}

interface EditingCell {
  departmentId: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  field: 'responseHours' | 'resolutionHours';
}

export function SLAConfig({ configs, departments, onSave }: SLAConfigProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [localConfigs, setLocalConfigs] = useState(configs);
  const [businessHours, setBusinessHours] = useState({
    startTime: '09:00',
    endTime: '17:00',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const priorities: Array<'urgent' | 'high' | 'normal' | 'low'> = ['urgent', 'high', 'normal', 'low'];
  const priorityColors = {
    urgent: 'bg-red-50 dark:bg-red-900/20',
    high: 'bg-orange-50 dark:bg-orange-900/20',
    normal: 'bg-blue-50 dark:bg-blue-900/20',
    low: 'bg-green-50 dark:bg-green-900/20',
  };

  const getSLA = (
    departmentId: string,
    priority: 'urgent' | 'high' | 'normal' | 'low',
    field: 'responseHours' | 'resolutionHours'
  ): number => {
    const config = localConfigs.find(
      c => c.departmentId === departmentId && c.priority === priority
    );
    return config ? config[field] : 0;
  };

  const handleCellClick = (
    departmentId: string,
    priority: 'urgent' | 'high' | 'normal' | 'low',
    field: 'responseHours' | 'resolutionHours'
  ) => {
    setEditingCell({ departmentId, priority, field });
    setEditValue(getSLA(departmentId, priority, field));
  };

  const handleSaveCell = () => {
    if (editingCell) {
      const { departmentId, priority, field } = editingCell;
      const existingIndex = localConfigs.findIndex(
        c => c.departmentId === departmentId && c.priority === priority
      );

      let updated = [...localConfigs];
      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          [field]: editValue,
        };
      } else {
        updated.push({
          departmentId,
          priority,
          responseHours: field === 'responseHours' ? editValue : 4,
          resolutionHours: field === 'resolutionHours' ? editValue : 48,
        });
      }
      setLocalConfigs(updated);
      setEditingCell(null);
    }
  };

  const handleSaveAll = () => {
    onSave(localConfigs);
  };

  const isEditing = (
    departmentId: string,
    priority: 'urgent' | 'high' | 'normal' | 'low',
    field: 'responseHours' | 'resolutionHours'
  ) => {
    return (
      editingCell?.departmentId === departmentId &&
      editingCell?.priority === priority &&
      editingCell?.field === field
    );
  };

  return (
    <div className="space-y-6">
      {/* SLA Matrix */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          SLA Configuration Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">
                  Department
                </th>
                {priorities.map((priority) => (
                  <th
                    key={priority}
                    colSpan={2}
                    className={`p-3 font-semibold text-gray-900 dark:text-white border-l border-gray-200 dark:border-slate-700 ${
                      priorityColors[priority]
                    }`}
                  >
                    <div className="capitalize">{priority}</div>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left p-3 font-medium text-gray-600 dark:text-gray-400"></th>
                {priorities.map((priority) => (
                  <th key={priority} colSpan={2} className="border-l border-gray-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 text-center">
                        Response
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 text-center">
                        Resolution
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr
                  key={dept.id}
                  className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <td className="p-3 font-medium text-gray-900 dark:text-white">
                    {dept.name}
                  </td>
                  {priorities.map((priority) => (
                    <td
                      key={`${dept.id}-${priority}`}
                      colSpan={2}
                      className={`border-l border-gray-200 dark:border-slate-700 ${
                        priorityColors[priority]
                      }`}
                    >
                      <div className="grid grid-cols-2 gap-1 p-1">
                        {/* Response Hours */}
                        <div
                          className="p-2 rounded cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          onClick={() =>
                            handleCellClick(dept.id, priority, 'responseHours')
                          }
                        >
                          {isEditing(dept.id, priority, 'responseHours') ? (
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) =>
                                  setEditValue(parseInt(e.target.value))
                                }
                                autoFocus
                                className="w-12 h-6 text-xs p-1"
                              />
                              <button
                                onClick={handleSaveCell}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {getSLA(dept.id, priority, 'responseHours')}h
                            </span>
                          )}
                        </div>

                        {/* Resolution Hours */}
                        <div
                          className="p-2 rounded cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          onClick={() =>
                            handleCellClick(dept.id, priority, 'resolutionHours')
                          }
                        >
                          {isEditing(dept.id, priority, 'resolutionHours') ? (
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) =>
                                  setEditValue(parseInt(e.target.value))
                                }
                                autoFocus
                                className="w-12 h-6 text-xs p-1"
                              />
                              <button
                                onClick={handleSaveCell}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {getSLA(dept.id, priority, 'resolutionHours')}h
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveAll} className="gap-2">
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
        </div>
      </Card>

      {/* Business Hours Configuration */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Business Hours
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime" className="block text-sm font-medium mb-2">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={businessHours.startTime}
                onChange={(e) =>
                  setBusinessHours({ ...businessHours, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="block text-sm font-medium mb-2">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={businessHours.endTime}
                onChange={(e) =>
                  setBusinessHours({ ...businessHours, endTime: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-3">Business Days</Label>
            <div className="grid grid-cols-4 gap-3">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
                (day) => (
                  <label
                    key={day}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={
                        businessHours[day as keyof typeof businessHours] as boolean
                      }
                      onChange={(e) =>
                        setBusinessHours({
                          ...businessHours,
                          [day]: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {day.slice(0, 3)}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          <Button onClick={() => {}} className="w-full gap-2">
            <Save className="w-4 h-4" />
            Save Business Hours
          </Button>
        </div>
      </Card>
    </div>
  );
}
