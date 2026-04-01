'use client';

import { useState } from 'react';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Department {
  id: string;
  name: string;
  slug: string;
  topics: string[];
  defaultSLAHours: number;
  active: boolean;
}

interface DepartmentManagerProps {
  departments: Department[];
  onAdd: (department: Omit<Department, 'id'>) => void;
  onUpdate: (id: string, department: Partial<Department>) => void;
  onDelete: (id: string) => void;
}

export function DepartmentManager({
  departments,
  onAdd,
  onUpdate,
  onDelete,
}: DepartmentManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Department>>({});
  const [newDept, setNewDept] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    topics: '',
    defaultSLAHours: 24,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEditStart = (dept: Department) => {
    setEditingId(dept.id);
    setEditData(dept);
  };

  const handleEditSave = (id: string) => {
    onUpdate(id, editData);
    setEditingId(null);
  };

  const handleAddNew = () => {
    if (formData.name && formData.slug) {
      onAdd({
        name: formData.name,
        slug: formData.slug,
        topics: formData.topics.split(',').map(t => t.trim()),
        defaultSLAHours: formData.defaultSLAHours,
        active: true,
      });
      setFormData({ name: '', slug: '', topics: '', defaultSLAHours: 24 });
      setNewDept(false);
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: slugify(value),
    });
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Departments
        </h3>
        <Button
          onClick={() => setNewDept(!newDept)}
          className="gap-2"
          variant={newDept ? 'outline' : 'default'}
        >
          <Plus className="w-4 h-4" />
          {newDept ? 'Cancel' : 'Add Department'}
        </Button>
      </div>

      {/* Add New Department Form */}
      {newDept && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-slate-700 rounded-lg space-y-4 bg-gray-50 dark:bg-slate-800">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Department Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Public Works"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Slug (auto-generated)
            </label>
            <Input
              type="text"
              value={formData.slug}
              readOnly
              className="mt-1 bg-gray-100 dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Topics (comma-separated)
            </label>
            <Input
              type="text"
              value={formData.topics}
              onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
              placeholder="Roads, Maintenance, Infrastructure"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Default SLA Hours
            </label>
            <Input
              type="number"
              value={formData.defaultSLAHours}
              onChange={(e) =>
                setFormData({ ...formData, defaultSLAHours: parseInt(e.target.value) })
              }
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddNew} className="gap-2 flex-1">
              <Plus className="w-4 h-4" />
              Add Department
            </Button>
          </div>
        </div>
      )}

      {/* Departments Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-slate-700 hover:bg-transparent">
              <TableHead className="text-gray-700 dark:text-gray-300">Name</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Slug</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Topics</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Default SLA</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Active</TableHead>
              <TableHead className="text-right text-gray-700 dark:text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) =>
              editingId === dept.id ? (
                <TableRow key={dept.id} className="border-gray-200 dark:border-slate-700">
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {editData.slug}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={(editData.topics || []).join(', ')}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          topics: e.target.value.split(',').map(t => t.trim()),
                        })
                      }
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editData.defaultSLAHours || 24}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          defaultSLAHours: parseInt(e.target.value),
                        })
                      }
                      className="text-sm w-20"
                    />
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
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSave(dept.id)}
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
                  key={dept.id}
                  className="border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {dept.name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {dept.slug}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {dept.topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {dept.defaultSLAHours}h
                  </TableCell>
                  <TableCell>
                    {dept.active ? (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStart(dept)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(dept.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    {deleteConfirm === dept.id && (
                      <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-10 min-w-max">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Delete {dept.name}?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              onDelete(dept.id);
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
  );
}
