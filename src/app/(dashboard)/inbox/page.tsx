"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterSidebar, MessageList, BulkActions, CollisionIndicator } from "@/components/inbox";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CaseFilterOptions } from "@/types";

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Parse filters from URL
  const [filters, setFilters] = useState({
    statuses: searchParams.getAll("status") as any[],
    priorities: searchParams.getAll("priority") as any[],
    sources: searchParams.getAll("source") as any[],
    search: searchParams.get("search") || "",
  });

  // Fetch cases with filters
  const casesQuery = trpc.cases.listCases.useQuery(
    {
      limit: 50,
      offset: 0,
      status: filters.statuses.length > 0 ? filters.statuses : undefined,
      priority: filters.priorities.length > 0 ? filters.priorities : undefined,
      source: filters.sources.length > 0 ? filters.sources : undefined,
      search: filters.search || undefined,
    },
    { staleTime: 60 * 1000 }
  );

  // Get other viewers for collision detection
  const viewersQuery = trpc.cases.getViewing.useQuery(undefined, {
    staleTime: 30 * 1000,
  });

  const handleFilterChange = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setSelectedIds(new Set());

      // Update URL
      const params = new URLSearchParams();
      if (newFilters.statuses?.length) {
        newFilters.statuses.forEach((s: string) => params.append("status", s));
      }
      if (newFilters.priorities?.length) {
        newFilters.priorities.forEach((p: string) => params.append("priority", p));
      }
      if (newFilters.sources?.length) {
        newFilters.sources.forEach((s: string) => params.append("source", s));
      }
      if (newFilters.search) {
        params.set("search", newFilters.search);
      }

      const newUrl = params.toString()
        ? `/dashboard/inbox?${params.toString()}`
        : "/dashboard/inbox";
      router.push(newUrl);
    },
    [router]
  );

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected && casesQuery.data?.data) {
      setSelectedIds(new Set(casesQuery.data.data.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [casesQuery.data]);

  const handleCaseClick = useCallback(
    (caseId: string) => {
      router.push(`/dashboard/cases/${caseId}`);
    },
    [router]
  );

  if (casesQuery.isLoading) {
    return (
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <Skeleton className="h-96 rounded-lg" />
        </div>
        <div className="flex-1">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cases = casesQuery.data?.data || [];
  const viewers = viewersQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-muted-foreground mt-2">
          {cases.length} case{cases.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Collision Indicator */}
      {viewers.length > 0 && <CollisionIndicator viewers={viewers} />}

      {/* Main Layout */}
      <div className="flex gap-6">
        {/* Filters */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </div>

        {/* Cases List */}
        <div className="flex-1 min-w-0">
          <MessageList
            cases={cases}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onCaseClick={handleCaseClick}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <BulkActions
          selectedCount={selectedIds.size}
          onAssign={() => {
            console.log("Assign selected cases:", Array.from(selectedIds));
          }}
          onSetPriority={() => {
            console.log("Set priority for:", Array.from(selectedIds));
          }}
          onBatchRespond={() => {
            console.log("Batch respond for:", Array.from(selectedIds));
          }}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
}
