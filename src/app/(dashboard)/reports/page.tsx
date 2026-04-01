"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format, subDays } from "date-fns";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [department, setDepartment] = useState("");

  const reportsQuery = trpc.reports.generateReport.useQuery(
    {
      startDate,
      endDate,
      department: department || undefined,
    },
    { staleTime: 120 * 1000 }
  );

  const handleDownload = (format: "csv" | "pdf") => {
    console.log(`Download report as ${format}`);
  };

  if (reportsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports</h1>
          <Skeleton className="w-32 h-10 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const report = reportsQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Analyze constituent cases and response metrics
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  <SelectItem value="public-works">Public Works</SelectItem>
                  <SelectItem value="planning">Planning & Development</SelectItem>
                  <SelectItem value="police">Police Department</SelectItem>
                  <SelectItem value="parks">Parks & Recreation</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      {report && (
        <Tabs defaultValue="volume" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="response-times">Response Times</TabsTrigger>
            <TabsTrigger value="top-issues">Top Issues</TabsTrigger>
          </TabsList>

          {/* Volume Tab */}
          <TabsContent value="volume">
            <Card>
              <CardHeader>
                <CardTitle>Case Volume</CardTitle>
                <CardDescription>
                  Number of cases by status and priority
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Cases</p>
                      <p className="text-3xl font-bold">
                        {report.totalCases || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">New</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {report.newCases || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {report.activeCases || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Resolved</p>
                      <p className="text-3xl font-bold text-green-600">
                        {report.resolvedCases || 0}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Status Breakdown
                    </p>
                    <div className="space-y-2">
                      {Object.entries(report.casesByStatus || {}).map(
                        ([status, count]: any) => (
                          <div key={status} className="flex justify-between text-sm">
                            <span>{status.replace(/_/g, " ")}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <Button onClick={() => handleDownload("csv")} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report (CSV)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Response Times Tab */}
          <TabsContent value="response-times">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>
                  Average response times and SLA metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Avg Resolution Time
                      </p>
                      <p className="text-3xl font-bold">
                        {report.avgResolutionTime || 0}h
                      </p>
                    </div>
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        SLA Breach Rate
                      </p>
                      <p className="text-3xl font-bold text-red-600">
                        {report.slaBreachRate || 0}%
                      </p>
                    </div>
                  </div>

                  <Button onClick={() => handleDownload("pdf")} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Issues Tab */}
          <TabsContent value="top-issues">
            <Card>
              <CardHeader>
                <CardTitle>Top Issues</CardTitle>
                <CardDescription>
                  Most common constituent concerns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Analysis of the most frequently reported issues in this period
                  </p>
                  <Button onClick={() => handleDownload("csv")} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Report (CSV)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
