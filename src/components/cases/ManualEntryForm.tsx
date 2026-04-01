'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

interface ManualEntryFormProps {
  departments: Department[];
  onSubmit: (data: {
    constituentEmail: string;
    constituentName: string;
    phone?: string;
    subject: string;
    description: string;
    source: string;
    departmentId: string;
    priority: string;
  }) => Promise<void>;
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  departments,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    constituentEmail: '',
    constituentName: '',
    phone: '',
    subject: '',
    description: '',
    source: 'MANUAL',
    departmentId: '',
    priority: 'MEDIUM',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.constituentEmail.trim()) {
      newErrors.constituentEmail = 'Email is required';
    } else if (!validateEmail(formData.constituentEmail)) {
      newErrors.constituentEmail = 'Invalid email format';
    }

    if (!formData.constituentName.trim()) {
      newErrors.constituentName = 'Name is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        constituentEmail: '',
        constituentName: '',
        phone: '',
        subject: '',
        description: '',
        source: 'MANUAL',
        departmentId: '',
        priority: 'MEDIUM',
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'Failed to create case. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Error Alert */}
      {errors.submit && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {errors.submit}
          </p>
        </div>
      )}

      {/* Constituent Email */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          Constituent Email *
        </label>
        <Input
          type="email"
          name="constituentEmail"
          value={formData.constituentEmail}
          onChange={handleChange}
          placeholder="example@email.com"
          className={`dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
            errors.constituentEmail ? 'border-red-500' : ''
          }`}
        />
        {errors.constituentEmail && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.constituentEmail}</p>
        )}
      </div>

      {/* Constituent Name */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          Constituent Name *
        </label>
        <Input
          type="text"
          name="constituentName"
          value={formData.constituentName}
          onChange={handleChange}
          placeholder="John Doe"
          className={`dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
            errors.constituentName ? 'border-red-500' : ''
          }`}
        />
        {errors.constituentName && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.constituentName}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          Phone (Optional)
        </label>
        <Input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(555) 123-4567"
          className="dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          Subject *
        </label>
        <Input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Brief case summary"
          className={`dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
            errors.subject ? 'border-red-500' : ''
          }`}
        />
        {errors.subject && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.subject}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          Description *
        </label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of the case..."
          className={`min-h-32 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${
            errors.description ? 'border-red-500' : ''
          }`}
        />
        {errors.description && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
      </div>

      {/* Source */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          Source
        </label>
        <Select value={formData.source} onValueChange={(val) => handleSelectChange('source', val)}>
          <SelectTrigger className="dark:border-slate-700 dark:bg-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PHONE">Phone</SelectItem>
            <SelectItem value="WALK_IN">Walk-in</SelectItem>
            <SelectItem value="MAIL">Mail</SelectItem>
            <SelectItem value="MANUAL">Manual Entry</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          Department *
        </label>
        <Select
          value={formData.departmentId}
          onValueChange={(val) => handleSelectChange('departmentId', val)}
        >
          <SelectTrigger
            className={`dark:border-slate-700 dark:bg-slate-800 ${
              errors.departmentId ? 'border-red-500' : ''
            }`}
          >
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentId && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.departmentId}</p>
        )}
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          Priority
        </label>
        <Select
          value={formData.priority}
          onValueChange={(val) => handleSelectChange('priority', val)}
        >
          <SelectTrigger className="dark:border-slate-700 dark:bg-slate-800">
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

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-32 gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Case'
          )}
        </Button>
      </div>
    </form>
  );
};
