'use client'

import { useState } from 'react'
import { StatsCards, MyCases, NeedsAttention, ActivityFeed } from '@/components/dashboard'
import {
  FilterSidebar,
  MessageList,
  BulkActions,
  CollisionIndicator,
} from '@/components/inbox'

/**
 * EXAMPLE: Complete Dashboard Page
 * Shows how to integrate all dashboard components together
 *
 * In a real application, this data would come from:
 * - tRPC queries in a server component
 * - Props passed from parent page
 * - React Query hooks in a client component
 */
export function ExampleDashboardPage() {
  // Dashboard state
  const statsData = {
    openCases: 42,
    dueToday: 5,
    avgResponseTime: 2.5,
    newsletterFlags: 12,
  }

  const myCases = [
    {
      id: '1',
      referenceNumber: 'CR-2024-00147',
      subject: 'Water service complaint - Main Street area',
      priority: 'HIGH' as const,
      status: 'IN_PROGRESS' as const,
      slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      slaBreached: false,
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      constituentName: 'John Doe',
    },
    {
      id: '2',
      referenceNumber: 'CR-2024-00148',
      subject: 'Pothole repair - 5th Avenue',
      priority: 'NORMAL' as const,
      status: 'ASSIGNED' as const,
      slaDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      slaBreached: false,
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      constituentName: 'Jane Smith',
    },
    {
      id: '3',
      referenceNumber: 'CR-2024-00149',
      subject: 'Permit application inquiry',
      priority: 'LOW' as const,
      status: 'NEW' as const,
      slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      slaBreached: false,
      updatedAt: new Date(),
      constituentName: 'Bob Johnson',
    },
  ]

  const needsAttentionData = {
    unassignedCount: 3,
    overdueCount: 2,
    highPriorityNewCount: 1,
  }

  const activities = [
    {
      id: '1',
      action: 'case.assigned' as const,
      userName: 'Jane Admin',
      caseRef: 'CR-2024-00147',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '2',
      action: 'response.sent' as const,
      userName: 'John Agent',
      caseRef: 'CR-2024-00148',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '3',
      action: 'case.created' as const,
      userName: 'System',
      caseRef: 'CR-2024-00149',
      timestamp: new Date(),
    },
  ]

  // Inbox state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    sources: [] as string[],
    statuses: [] as string[],
    priorities: [] as string[],
  })

  const inboxCases = [
    {
      id: '1',
      referenceNumber: 'CR-2024-00150',
      source: 'EMAIL' as const,
      constituentName: 'Alice Williams',
      subject: 'Trash collection schedule change',
      priority: 'HIGH' as const,
      status: 'NEW' as const,
      slaDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      slaBreached: false,
      assignedTo: null,
      lastMessagePreview:
        'Could you please clarify the new trash pickup schedule? I received conflicting information...',
      updatedAt: new Date(),
    },
    {
      id: '2',
      referenceNumber: 'CR-2024-00151',
      source: 'NEWSLETTER' as const,
      constituentName: 'Michael Davis',
      subject: 'Newsletter flag - Road closure issue',
      priority: 'URGENT' as const,
      status: 'ASSIGNED' as const,
      slaDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      slaBreached: false,
      assignedTo: {
        id: 'u1',
        name: 'Sarah Manager',
        avatarUrl: undefined,
      },
      lastMessagePreview:
        'The road closure on Oak Street is causing major disruptions to our community...',
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: '3',
      referenceNumber: 'CR-2024-00152',
      source: 'WEB' as const,
      constituentName: 'Emma Taylor',
      subject: 'Building permits process',
      priority: 'LOW' as const,
      status: 'IN_PROGRESS' as const,
      slaDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      slaBreached: false,
      assignedTo: {
        id: 'u2',
        name: 'Tom Reviewer',
        avatarUrl: undefined,
      },
      lastMessagePreview: 'Could you provide more details on the permit requirements...',
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ]

  const viewers = [
    { id: 'u1', name: 'Jane Smith', avatarUrl: undefined },
    { id: 'u2', name: 'Bob Johnson', avatarUrl: undefined },
  ]

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's your constituent response overview.
        </p>
      </div>

      {/* Stats Cards */}
      <section>
        <StatsCards
          openCases={statsData.openCases}
          dueToday={statsData.dueToday}
          avgResponseTime={statsData.avgResponseTime}
          newsletterFlags={statsData.newsletterFlags}
        />
      </section>

      {/* Needs Attention */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Needs Attention</h2>
        <NeedsAttention
          unassignedCount={needsAttentionData.unassignedCount}
          overdueCount={needsAttentionData.overdueCount}
          highPriorityNewCount={needsAttentionData.highPriorityNewCount}
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - My Cases and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Cases */}
          <MyCases cases={myCases} />

          {/* Activity Feed */}
          <ActivityFeed activities={activities} />
        </div>

        {/* Right Column - Inbox Preview */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Inbox Preview</h2>

            {/* Collision Indicator */}
            <CollisionIndicator viewers={viewers} />

            {/* Filter Sidebar */}
            <div className="mt-4">
              <FilterSidebar filters={filters} onFilterChange={setFilters} />
            </div>
          </div>
        </div>
      </div>

      {/* Full Inbox Example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">All Cases</h2>
        <MessageList
          cases={inboxCases}
          selectedIds={selectedIds}
          onSelect={(id, selected) => {
            const newIds = new Set(selectedIds)
            if (selected) newIds.add(id)
            else newIds.delete(id)
            setSelectedIds(newIds)
          }}
          onSelectAll={(selected) => {
            if (selected) {
              setSelectedIds(new Set(inboxCases.map((c) => c.id)))
            } else {
              setSelectedIds(new Set())
            }
          }}
          onCaseClick={(caseId) => {
            console.log('Navigate to case:', caseId)
            // In real app: navigate to case detail page
          }}
        />
      </section>

      {/* Bulk Actions Toolbar */}
      <BulkActions
        selectedCount={selectedIds.size}
        onAssign={() => {
          console.log('Assign selected cases:', Array.from(selectedIds))
          // Open assign dialog
        }}
        onSetPriority={() => {
          console.log('Set priority for:', Array.from(selectedIds))
          // Open priority dialog
        }}
        onBatchRespond={() => {
          console.log('Batch respond for:', Array.from(selectedIds))
          // Open batch respond dialog
        }}
        onClear={() => {
          setSelectedIds(new Set())
        }}
      />
    </div>
  )
}

/**
 * EXAMPLE: Using in a Server Component (Next.js 14+ with App Router)
 *
 * In your page.tsx or page.server.tsx:
 *
 * import { ExampleDashboardPage } from '@/components/examples/ExampleDashboardPage'
 * import { db } from '@/server/db'
 *
 * export default async function DashboardPage() {
 *   // Fetch data from database
 *   const stats = await db.case.aggregate({...})
 *   const myCases = await db.case.findMany({...})
 *   const activities = await db.auditLog.findMany({...})
 *
 *   // Pass as props to client component
 *   return <ExampleDashboardPage stats={stats} cases={myCases} activities={activities} />
 * }
 */

/**
 * EXAMPLE: Using with tRPC
 *
 * export function DashboardPageWithTRPC() {
 *   const { data: stats } = trpc.dashboard.getStats.useQuery()
 *   const { data: myCases } = trpc.cases.getMyCases.useQuery()
 *   const { data: activities } = trpc.activity.getRecent.useQuery()
 *
 *   if (!stats || !myCases || !activities) {
 *     return <div>Loading...</div>
 *   }
 *
 *   return (
 *     <StatsCards {...stats} />
 *     // ... rest of page
 *   )
 * }
 */
