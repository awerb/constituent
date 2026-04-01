'use client';

import React, { useState } from 'react';
import type { ConstituentDetail } from '@/types/constituent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, MapPin, Globe, Edit2, Save, X } from 'lucide-react';
import { PrivacyBadge } from './PrivacyBadge';

interface ProfileCardProps {
  constituent: ConstituentDetail;
  caseCount?: number;
  onUpdate?: (updated: Partial<ConstituentDetail>) => Promise<void>;
  onViewCases?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  constituent,
  caseCount = 0,
  onUpdate,
  onViewCases,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: constituent.name || '',
    phone: constituent.phone || '',
    address: constituent.address || '',
    ward: constituent.ward || '',
    district: constituent.district || '',
    languagePreference: constituent.languagePreference || 'en',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleEditChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    setIsSaving(true);
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update constituent:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      {/* Header with Edit Button */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? (
              <Input
                value={editData.name}
                onChange={(e) => handleEditChange('name', e.target.value)}
                placeholder="Name"
                className="text-2xl font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            ) : (
              constituent.name || 'Unnamed Constituent'
            )}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Created {new Date(constituent.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          <PrivacyBadge status={constituent.privacyStatus} />
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2 dark:border-slate-700"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="gap-2 dark:border-slate-700"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 mb-6">
        {/* Email */}
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          <a
            href={`mailto:${constituent.email}`}
            className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 break-all"
          >
            {constituent.email}
          </a>
        </div>

        {/* Phone */}
        {isEditing ? (
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <Input
              value={editData.phone}
              onChange={(e) => handleEditChange('phone', e.target.value)}
              placeholder="Phone number"
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        ) : (
          constituent.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <a
                href={`tel:${constituent.phone}`}
                className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {constituent.phone}
              </a>
            </div>
          )
        )}

        {/* Address */}
        {isEditing ? (
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <Input
              value={editData.address}
              onChange={(e) => handleEditChange('address', e.target.value)}
              placeholder="Address"
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        ) : (
          constituent.address && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">{constituent.address}</span>
            </div>
          )
        )}

        {/* Language */}
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          {isEditing ? (
            <Input
              value={editData.languagePreference}
              onChange={(e) => handleEditChange('languagePreference', e.target.value)}
              placeholder="Language"
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          ) : (
            <span className="text-slate-700 dark:text-slate-300">
              {constituent.languagePreference?.toUpperCase() || 'EN'}
            </span>
          )}
        </div>
      </div>

      {/* Ward and District */}
      {(constituent.ward || constituent.district || isEditing) && (
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          {/* Ward */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Ward
            </p>
            {isEditing ? (
              <Input
                value={editData.ward}
                onChange={(e) => handleEditChange('ward', e.target.value)}
                placeholder="Ward"
                className="dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            ) : (
              <p className="text-sm text-slate-900 dark:text-white">
                {constituent.ward || 'Not specified'}
              </p>
            )}
          </div>

          {/* District */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
              District
            </p>
            {isEditing ? (
              <Input
                value={editData.district}
                onChange={(e) => handleEditChange('district', e.target.value)}
                placeholder="District"
                className="dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            ) : (
              <p className="text-sm text-slate-900 dark:text-white">
                {constituent.district || 'Not specified'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cases Link */}
      {caseCount !== undefined && (
        <Button
          variant="outline"
          className="w-full gap-2 dark:border-slate-700"
          onClick={onViewCases}
        >
          View {caseCount} Case{caseCount !== 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );
};
