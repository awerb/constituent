'use client';

import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Upload, X, Plus, Check, Clock, Zap, Link as LinkIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const TIMEZONES = [
  'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 'US/Alaska', 'US/Hawaii',
];

const DEFAULT_DEPARTMENTS = [
  'Public Works',
  'Police',
  'Fire',
  'Planning & Development',
  'Finance',
  'City Manager',
  'City Council',
  'Parks & Recreation',
  'Utilities',
  'Housing & Community Development',
];

interface DepartmentForm {
  name: string;
  topics: string[];
}

interface SetupWizardProps {
  onComplete?: (formData: Record<string, any>) => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentForm[]>(
    DEFAULT_DEPARTMENTS.map(name => ({ name, topics: [] }))
  );
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'none'>('none');
  const [disableAi, setDisableAi] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    // Step 2
    cityName: '',
    state: '',
    timezone: '',
    // Step 3
    primaryColor: '#3b82f6',
    fromEmail: '',
    // Step 4: departments (state)
    // Step 5
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    // Step 6
    aiApiKey: '',
    // Step 7
    transparentCityApiKey: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.adminName) newErrors.adminName = 'Name is required';
        if (!formData.adminEmail) newErrors.adminEmail = 'Email is required';
        if (!formData.adminPassword) newErrors.adminPassword = 'Password is required';
        if (formData.adminPassword !== formData.adminPasswordConfirm)
          newErrors.adminPasswordConfirm = 'Passwords do not match';
        if (formData.adminPassword.length < 8)
          newErrors.adminPassword = 'Password must be at least 8 characters';
        break;
      case 2:
        if (!formData.cityName) newErrors.cityName = 'City name is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.timezone) newErrors.timezone = 'Timezone is required';
        break;
      case 3:
        if (!formData.fromEmail) newErrors.fromEmail = 'Email address is required';
        break;
      case 5:
        if (!formData.smtpHost) newErrors.smtpHost = 'SMTP host is required';
        break;
      case 6:
        if (aiProvider !== 'none' && !formData.aiApiKey)
          newErrors.aiApiKey = 'API key is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 7));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleAddDepartment = () => {
    if (newDepartmentName.trim()) {
      setDepartments([...departments, { name: newDepartmentName, topics: [] }]);
      setNewDepartmentName('');
    }
  };

  const handleRemoveDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const handleUpdateDepartment = (
    index: number,
    field: 'name' | 'topics',
    value: string | string[]
  ) => {
    const updated = [...departments];
    if (field === 'name') {
      updated[index].name = value as string;
    } else {
      updated[index].topics = value as string[];
    }
    setDepartments(updated);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        ...formData,
        departments,
        aiProvider,
        disableAi,
      });
    }
  };

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {step < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                step
              )}
            </div>
            {step < 7 && (
              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  step < currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
        <span>Admin Account</span>
        <span>City Info</span>
        <span>Branding</span>
        <span>Departments</span>
        <span>Email</span>
        <span>AI</span>
        <span>Transparent City</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Setup Wizard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get your constituent response system up and running in 7 steps
          </p>
        </div>

        <Card className="p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
          <StepIndicator />

          {/* Step 1: Admin Account */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Create Admin Account
                </h2>
              </div>

              <div>
                <Label htmlFor="adminName" className="block text-sm font-medium mb-2">
                  Full Name
                </Label>
                <Input
                  id="adminName"
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className={errors.adminName ? 'border-red-500' : ''}
                  placeholder="John Doe"
                />
                {errors.adminName && (
                  <p className="text-red-500 text-sm mt-1">{errors.adminName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="adminEmail" className="block text-sm font-medium mb-2">
                  Email Address
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className={errors.adminEmail ? 'border-red-500' : ''}
                  placeholder="admin@example.com"
                />
                {errors.adminEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.adminEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="adminPassword" className="block text-sm font-medium mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="adminPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.adminPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, adminPassword: e.target.value })
                    }
                    className={errors.adminPassword ? 'border-red-500' : ''}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.adminPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.adminPassword}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="adminPasswordConfirm"
                  className="block text-sm font-medium mb-2"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="adminPasswordConfirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.adminPasswordConfirm}
                    onChange={(e) =>
                      setFormData({ ...formData, adminPasswordConfirm: e.target.value })
                    }
                    className={errors.adminPasswordConfirm ? 'border-red-500' : ''}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.adminPasswordConfirm && (
                  <p className="text-red-500 text-sm mt-1">{errors.adminPasswordConfirm}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: City Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  City Information
                </h2>
              </div>

              <div>
                <Label htmlFor="cityName" className="block text-sm font-medium mb-2">
                  City Name
                </Label>
                <Input
                  id="cityName"
                  type="text"
                  value={formData.cityName}
                  onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                  className={errors.cityName ? 'border-red-500' : ''}
                  placeholder="San Francisco"
                />
                {errors.cityName && (
                  <p className="text-red-500 text-sm mt-1">{errors.cityName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state" className="block text-sm font-medium mb-2">
                  State
                </Label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-white ${
                    errors.state ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  }`}
                >
                  <option value="">Select a state</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <Label htmlFor="timezone" className="block text-sm font-medium mb-2">
                  Timezone
                </Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-white ${
                    errors.timezone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  }`}
                >
                  <option value="">Select a timezone</option>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="text-red-500 text-sm mt-1">{errors.timezone}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Branding */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Branding
                </h2>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">
                  Logo Upload
                </Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                  {logoPreview ? (
                    <div className="space-y-3">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-24 h-24 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoPreview(null)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove logo
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Drag and drop or click to upload
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="primaryColor" className="block text-sm font-medium mb-2">
                  Primary Color
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.primaryColor}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="fromEmail" className="block text-sm font-medium mb-2">
                  From Email Address
                </Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  className={errors.fromEmail ? 'border-red-500' : ''}
                  placeholder="noreply@city.gov"
                />
                {errors.fromEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.fromEmail}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Departments */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Departments
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Configure your city departments. You can edit these later.
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {departments.map((dept, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg space-y-3"
                  >
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={dept.name}
                        onChange={(e) =>
                          handleUpdateDepartment(index, 'name', e.target.value)
                        }
                        placeholder="Department name"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDepartment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="Topics (comma-separated)"
                        defaultValue={dept.topics.join(', ')}
                        onChange={(e) =>
                          handleUpdateDepartment(
                            index,
                            'topics',
                            e.target.value.split(',').map(t => t.trim())
                          )
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAddDepartment();
                  }}
                  placeholder="Add new department"
                />
                <Button onClick={handleAddDepartment} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Email Configuration */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Email Configuration
                </h2>
              </div>

              <div>
                <Label htmlFor="smtpHost" className="block text-sm font-medium mb-2">
                  SMTP Host
                </Label>
                <Input
                  id="smtpHost"
                  type="text"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  className={errors.smtpHost ? 'border-red-500' : ''}
                  placeholder="smtp.gmail.com"
                />
                {errors.smtpHost && (
                  <p className="text-red-500 text-sm mt-1">{errors.smtpHost}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpPort" className="block text-sm font-medium mb-2">
                    Port
                  </Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="smtpUser" className="block text-sm font-medium mb-2">
                  SMTP User
                </Label>
                <Input
                  id="smtpUser"
                  type="email"
                  value={formData.smtpUser}
                  onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <Label htmlFor="smtpPassword" className="block text-sm font-medium mb-2">
                  SMTP Password
                </Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={formData.smtpPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, smtpPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <Button className="w-full gap-2" variant="outline">
                <Clock className="w-4 h-4" />
                Send Test Email
              </Button>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                For hosted instances, email configuration is managed by your provider.
              </div>
            </div>
          )}

          {/* Step 6: AI Configuration */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  AI Configuration
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <input
                      type="radio"
                      name="aiProvider"
                      value="openai"
                      checked={aiProvider === 'openai'}
                      onChange={(e) => setAiProvider(e.target.value as 'openai' | 'anthropic' | 'none')}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">OpenAI</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <input
                      type="radio"
                      name="aiProvider"
                      value="anthropic"
                      checked={aiProvider === 'anthropic'}
                      onChange={(e) => setAiProvider(e.target.value as 'openai' | 'anthropic' | 'none')}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">Anthropic</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <input
                      type="radio"
                      name="aiProvider"
                      value="none"
                      checked={aiProvider === 'none'}
                      onChange={(e) => setAiProvider(e.target.value as 'openai' | 'anthropic' | 'none')}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">None (Disable AI)</span>
                  </label>
                </div>
              </div>

              {aiProvider !== 'none' && (
                <>
                  <div>
                    <Label htmlFor="aiApiKey" className="block text-sm font-medium mb-2">
                      API Key
                    </Label>
                    <Input
                      id="aiApiKey"
                      type="password"
                      value={formData.aiApiKey}
                      onChange={(e) =>
                        setFormData({ ...formData, aiApiKey: e.target.value })
                      }
                      className={errors.aiApiKey ? 'border-red-500' : ''}
                      placeholder="sk-..."
                    />
                    {errors.aiApiKey && (
                      <p className="text-red-500 text-sm mt-1">{errors.aiApiKey}</p>
                    )}
                  </div>

                  <Button className="w-full gap-2" variant="outline">
                    <Zap className="w-4 h-4" />
                    Test AI Connection
                  </Button>
                </>
              )}

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={disableAi}
                  onChange={(e) => setDisableAi(e.target.checked)}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Disable AI features entirely
                </span>
              </label>
            </div>
          )}

          {/* Step 7: Transparent City Connection */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Transparent City Connection
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Connect your system to Transparent City for 311/CRM integration.
                </p>
              </div>

              <div>
                <Label htmlFor="transparentCityApiKey" className="block text-sm font-medium mb-2">
                  API Key
                </Label>
                <Input
                  id="transparentCityApiKey"
                  type="password"
                  value={formData.transparentCityApiKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transparentCityApiKey: e.target.value,
                    })
                  }
                  placeholder="tc-..."
                />
              </div>

              <Button className="w-full gap-2" variant="outline">
                <LinkIcon className="w-4 h-4" />
                Verify Connection
              </Button>

              <div className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Webhook URL
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value="https://your-domain.com/api/webhooks/transparent-city"
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'https://your-domain.com/api/webhooks/transparent-city'
                      );
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 border-t border-gray-200 dark:border-slate-700 pt-6">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <div className="flex-1" />
            {currentStep < 7 ? (
              <Button onClick={handleNextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Launch
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
