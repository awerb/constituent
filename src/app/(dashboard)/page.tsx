"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCards, MyCases, NeedsAttention, ActivityFeed } from "@/components/dashboard";
import { trpc } from "@/lib/trpc";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  const statsQuery = trpc.dashboard.getStats.useQuery(undefined, {
    staleTime: 60 * 1000,
  });
  const myCasesQuery = trpc.cases.getMyCases.useQuery(
    { limit: 10 },
    { staleTime: 60 * 1000 }
  );
  const activitiesQuery = trpc.dashboard.getRecentActivity.useQuery(
    { limit: 20 },
    { staleTime: 60 * 1000 }
  );
  const attentionQuery = trpc.dashboard.getNeedsAttention.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (
      !statsQuery.isLoading &&
      !myCasesQuery.isLoading &&
      !activitiesQuery.isLoading &&
      !attentionQuery.isLoading
    ) {
      setIsLoading(false);
    }
  }, [
    statsQuery.isLoading,
    myCasesQuery.isLoading,
    activitiesQuery.isLoading,
    attentionQuery.isLoading,
  ]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's your constituent response overview.
          </p>
        </div>

        {/* Stats Skeleton */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </section>

        {/* Needs Attention Skeleton */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Needs Attention</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </section>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's your constituent response overview.
        </p>
      </div>

      {/* Stats Cards */}
      {statsQuery.data && (
        <section>
          <StatsCards
            openCases={statsQuery.data.openCases}
            dueToday={statsQuery.data.dueToday}
            avgResponseTime={statsQuery.data.avgResponseTime}
            newsletterFlags={statsQuery.data.newsletterFlags}
          />
        </section>
      )}

      {/* Needs Attention */}
      {attentionQuery.data && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Needs Attention</h2>
          <NeedsAttention
            unassignedCount={attentionQuery.data.unassignedCount}
            overdueCount={attentionQuery.data.overdueCount}
            highPriorityNewCount={attentionQuery.data.highPriorityNewCount}
          />
        </section>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* My Cases */}
          {myCasesQuery.data && <MyCases cases={myCasesQuery.data} />}

          {/* Activity Feed */}
          {activitiesQuery.data && <ActivityFeed activities={activitiesQuery.data} />}
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <div className="bg-muted/50 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <a
                href="/dashboard/cases/new"
                className="block w-full px-4 py-2 text-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                New Case
              </a>
              <a
                href="/dashboard/inbox"
                className="block w-full px-4 py-2 text-center rounded-lg border border-input hover:bg-muted transition-colors"
              >
                View Inbox
              </a>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
            <h4 className="font-semibold text-sm mb-2">Need Help?</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Check our knowledge base for answers and best practices.
            </p>
            <a
              href="/dashboard/kb"
              className="text-xs text-primary hover:underline"
            >
              View Knowledge Base →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
