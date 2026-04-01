"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";

type RequestType = "export" | "delete" | "";

interface SubmissionSuccess {
  requestId: string;
  email: string;
  type: RequestType;
}

export default function PrivacyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmissionSuccess | null>(null);
  const [requestType, setRequestType] = useState<RequestType>("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!requestType || !email) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          requestType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to submit privacy request");
      }

      setSuccess({
        requestId: data.data.requestId,
        email,
        type: requestType,
      });

      setEmail("");
      setRequestType("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Request Received</CardTitle>
              <CardDescription>
                Your privacy request has been submitted successfully
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Request ID</p>
              <p className="text-lg font-mono font-bold">{success.requestId}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Request Type</p>
              <p className="text-sm text-muted-foreground">
                {success.type === "export"
                  ? "Export My Data"
                  : "Delete My Data"}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-muted-foreground">
                We will process your request within 30 days. A confirmation email
                has been sent to:
              </p>
              <p className="text-sm font-semibold mt-2">{success.email}</p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                You can use your Request ID to track the status of your privacy
                request.
              </p>
              <p>
                For questions about your privacy rights, please contact our privacy
                team.
              </p>
            </div>

            <Button asChild className="w-full">
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-primary mt-1" />
              <div className="space-y-2">
                <CardTitle className="text-2xl">Privacy Request</CardTitle>
                <CardDescription>
                  Exercise your privacy rights under applicable laws
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  We'll send a confirmation email to this address
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Request Type *</Label>
                <RadioGroup value={requestType} onValueChange={(val) => setRequestType(val as RequestType)}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <RadioGroupItem value="export" id="export" />
                    <Label htmlFor="export" className="flex-1 cursor-pointer">
                      <div className="space-y-1">
                        <p className="font-semibold">Export My Data</p>
                        <p className="text-sm text-muted-foreground">
                          Download a copy of all your personal data in a portable
                          format
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <RadioGroupItem value="delete" id="delete" className="mt-1" />
                    <Label htmlFor="delete" className="flex-1 cursor-pointer">
                      <div className="space-y-1">
                        <p className="font-semibold">Delete My Data</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete all your personal data from our
                          system
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {requestType === "delete" && (
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-900 space-y-3">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-red-700 dark:text-red-300">
                        Important: This action cannot be undone
                      </p>
                      <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                        <li>All your personal data will be permanently deleted</li>
                        <li>You will no longer be able to access your case history</li>
                        <li>This deletion cannot be reversed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={isLoading || !requestType || !email} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Privacy Request"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We will process your request according to applicable privacy laws,
                typically within 30 days.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
