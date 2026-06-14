"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function NewCasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    constituentName: "",
    constituentEmail: "",
    constituentPhone: "",
    subject: "",
    description: "",
    priority: "NORMAL",
    departmentId: "",
    source: "WEB",
  });

  const createCaseMutation = trpc.cases.createManual.useMutation();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await createCaseMutation.mutateAsync({
        constituentName: formData.constituentName,
        constituentEmail: formData.constituentEmail,
        constituentPhone: formData.constituentPhone || undefined,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority as any,
        departmentId: formData.departmentId || undefined,
        source: formData.source as any,
      });

      router.push(`/dashboard/cases/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Case</h1>
          <p className="text-muted-foreground">
            Manually enter a new constituent request
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
          <CardDescription>
            Enter the constituent information and case details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Constituent Info */}
            <fieldset className="space-y-4">
              <h3 className="font-semibold text-sm">Constituent Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="constituentName">Name *</Label>
                  <Input
                    id="constituentName"
                    name="constituentName"
                    value={formData.constituentName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constituentEmail">Email *</Label>
                  <Input
                    id="constituentEmail"
                    name="constituentEmail"
                    type="email"
                    value={formData.constituentEmail}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constituentPhone">Phone (Optional)</Label>
                <Input
                  id="constituentPhone"
                  name="constituentPhone"
                  type="tel"
                  value={formData.constituentPhone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  disabled={isLoading}
                />
              </div>
            </fieldset>

            {/* Case Details */}
            <fieldset className="space-y-4">
              <h3 className="font-semibold text-sm">Case Details</h3>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief summary of the issue"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of the concern..."
                  className="min-h-32"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(val) =>
                      handleSelectChange("priority", val)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(val) =>
                      handleSelectChange("departmentId", val)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="departmentId">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public-works">Public Works</SelectItem>
                      <SelectItem value="planning">
                        Planning & Development
                      </SelectItem>
                      <SelectItem value="police">Police Department</SelectItem>
                      <SelectItem value="parks">Parks & Recreation</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(val) =>
                      handleSelectChange("source", val)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEB">Web</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="IN_PERSON">In Person</SelectItem>
                      <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Case...
                  </>
                ) : (
                  "Create Case"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
