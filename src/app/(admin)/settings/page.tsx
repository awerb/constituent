"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const settingsQuery = trpc.admin.getSettings.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  const [formData, setFormData] = useState({
    cityName: "",
    cityLogo: "",
    timezone: "America/New_York",
    language: "en",
    allowPublicSubmissions: true,
    requirePhoneVerification: false,
    enableNewsletter: true,
    slaEnabledDays: 5,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: isNaN(Number(value)) ? value : Number(value),
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update settings
      console.log("Saving settings:", formData);
      // Call API/tRPC mutation here
    } finally {
      setIsSaving(false);
    }
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">City Settings</h1>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">City Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your city's platform settings
        </p>
      </div>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            City name, branding, and general settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cityName">City Name</Label>
              <Input
                id="cityName"
                name="cityName"
                value={formData.cityName}
                onChange={handleInputChange}
                placeholder="San Francisco"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityLogo">Logo URL</Label>
              <Input
                id="cityLogo"
                name="cityLogo"
                value={formData.cityLogo}
                onChange={handleInputChange}
                placeholder="https://example.com/logo.png"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(val) => handleSelectChange("timezone", val)}
                disabled={isSaving}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern</SelectItem>
                  <SelectItem value="America/Chicago">Central</SelectItem>
                  <SelectItem value="America/Denver">Mountain</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                  <SelectItem value="America/Anchorage">Alaska</SelectItem>
                  <SelectItem value="Pacific/Honolulu">Hawaii</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Default Language</Label>
              <Select
                value={formData.language}
                onValueChange={(val) => handleSelectChange("language", val)}
                disabled={isSaving}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Enable or disable platform features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Public Submissions</p>
              <p className="text-sm text-muted-foreground">
                Allow constituents to submit requests publicly
              </p>
            </div>
            <Switch
              checked={formData.allowPublicSubmissions}
              onCheckedChange={(val) =>
                handleSwitchChange("allowPublicSubmissions", val)
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Phone Verification</p>
              <p className="text-sm text-muted-foreground">
                Require phone number verification for submissions
              </p>
            </div>
            <Switch
              checked={formData.requirePhoneVerification}
              onCheckedChange={(val) =>
                handleSwitchChange("requirePhoneVerification", val)
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Newsletter Integration</p>
              <p className="text-sm text-muted-foreground">
                Accept flagged newsletter items as cases
              </p>
            </div>
            <Switch
              checked={formData.enableNewsletter}
              onCheckedChange={(val) => handleSwitchChange("enableNewsletter", val)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* SLA Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Configuration</CardTitle>
          <CardDescription>
            Service level agreement defaults
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slaEnabledDays">Default SLA Window (days)</Label>
            <Input
              id="slaEnabledDays"
              name="slaEnabledDays"
              type="number"
              value={formData.slaEnabledDays}
              onChange={handleInputChange}
              disabled={isSaving}
              min="1"
              max="30"
            />
            <p className="text-xs text-muted-foreground">
              Number of business days to respond to a case
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
