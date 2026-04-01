"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

interface CaseStatus {
  referenceNumber: string;
  status: string;
  department: string;
  createdAt: string;
  lastUpdatedAt: string;
  priority: string;
  subject: string;
}

export default function StatusPage() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseStatus | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ASSIGNED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "AWAITING_RESPONSE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "NORMAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "LOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCaseData(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/cases/${referenceNumber}/status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Case not found");
      }

      setCaseData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Case Status</CardTitle>
            <CardDescription>
              Enter your reference number to see the current status of your request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refNumber">Reference Number</Label>
                <Input
                  id="refNumber"
                  placeholder="e.g., CR-2024-00123"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" disabled={isLoading || !referenceNumber} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {caseData && (
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{caseData.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Reference: {caseData.referenceNumber}
                    </p>
                  </div>
                  <Badge className={`whitespace-nowrap ${getStatusColor(caseData.status)}`}>
                    {caseData.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge className={`whitespace-nowrap w-fit ${getPriorityColor(caseData.priority)}`}>
                    {caseData.priority}
                  </Badge>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm font-semibold">{caseData.department}</p>
                </div>

                {/* Created Date */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">
                      {new Date(caseData.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">
                      {new Date(caseData.lastUpdatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-3">
                <h3 className="font-semibold">Current Status</h3>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-800 my-1"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold">Your request has been received</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {new Date(caseData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm text-muted-foreground">
                  We will keep you updated on the progress of your request. If you have any questions,
                  please contact the{" "}
                  <span className="font-semibold">{caseData.department}</span> using your reference
                  number.
                </p>
              </div>

              {/* Navigation */}
              <Button asChild variant="outline" className="w-full">
                <a href="/">Back to Home</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
