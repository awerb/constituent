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
import { Download, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  DistrictSummary,
  TopFlagged,
  TopApplauded,
  ResponseRateCard,
} from "@/components/elected";

export default function ElectedDashboardPage() {
  const [district, setDistrict] = useState("");

  // Fetch elected official data
  const dashboardQuery = trpc.elected.getDashboard.useQuery(
    {
      district: district || undefined,
    },
    { staleTime: 60 * 1000 }
  );

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">District Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            View constituent feedback and response metrics for your district
          </p>
        </div>

        <Skeleton className="w-64 h-10 rounded-lg" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const data = dashboardQuery.data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">District Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          View constituent feedback and response metrics for your district
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select district..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Districts</SelectItem>
            <SelectItem value="district-1">District 1</SelectItem>
            <SelectItem value="district-2">District 2</SelectItem>
            <SelectItem value="district-3">District 3</SelectItem>
            <SelectItem value="district-4">District 4</SelectItem>
            <SelectItem value="district-5">District 5</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="ml-auto">
          <Download className="w-4 h-4 mr-2" />
          Export Weekly Summary
        </Button>
      </div>

      {/* Summary Cards */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DistrictSummary data={data.summary} />
            <ResponseRateCard data={data.responseRate} />
          </div>

          {/* Top Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                Positive Feedback
              </h2>
              <TopApplauded cases={data.topApplauded || []} />
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                Flagged Issues
              </h2>
              <TopFlagged cases={data.topFlagged || []} />
            </div>
          </div>

          {/* Additional Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>
                Performance indicators for this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Constituent Satisfaction</p>
                  <p className="text-2xl font-bold">
                    {data.summary?.satisfactionScore || 0}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-2xl font-bold">
                    {data.responseRate?.percentage || 0}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                  <p className="text-2xl font-bold">
                    {data.summary?.avgResolutionDays || 0}d
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                  <p className="text-2xl font-bold">
                    {data.summary?.totalCases || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
