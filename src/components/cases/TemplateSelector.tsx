'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Search } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  onSelect: (content: string) => void;
  variables?: Record<string, string>;
  onClose?: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSelect,
  variables = {},
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Get unique categories
  const categories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category))),
    [templates]
  );

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  // Get preview with variable substitution
  const getPreview = (content: string): string => {
    let preview = content;
    Object.entries(variables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return preview;
  };

  const handleSelectTemplate = (template: Template) => {
    onSelect(template.content);
    onClose?.();
  };

  return (
    <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">Select Template</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="dark:border-slate-700 dark:bg-slate-900">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template List and Preview */}
      <div className="grid grid-cols-2 gap-4 max-h-96">
        {/* Template List */}
        <div className="border-r border-slate-200 dark:border-slate-700 overflow-y-auto space-y-2">
          {filteredTemplates.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              No templates found
            </p>
          ) : (
            filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="text-sm font-medium">{template.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {template.category}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Preview */}
        <div className="overflow-y-auto">
          {selectedTemplate ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 h-full">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase">
                Preview
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                {getPreview(selectedTemplate.content)}
              </p>

              {/* Variables in use */}
              {Object.keys(variables).some((key) =>
                selectedTemplate.content.includes(`{${key}}`)
              ) && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Variables substituted:
                  </p>
                  <div className="space-y-1">
                    {Object.entries(variables).map(([key, value]) =>
                      selectedTemplate.content.includes(`{${key}}`) ? (
                        <p key={key} className="text-xs text-slate-600 dark:text-slate-400">
                          {'{' + key + '}'} → <span className="font-medium">{value}</span>
                        </p>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
              <p className="text-sm">Select a template to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      {selectedTemplate && (
        <Button onClick={() => handleSelectTemplate(selectedTemplate)} className="w-full">
          Use This Template
        </Button>
      )}
    </div>
  );
};
