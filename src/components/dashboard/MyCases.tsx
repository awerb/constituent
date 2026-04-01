'use client'

import Link from 'next/link'
import { formatDistanceToNow, isPast } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface Case {
  id: string
  referenceNumber: string
  subject: string
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'
  status:
    | 'NEW'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'AWAITING_RESPONSE'
    | 'RESOLVED'
    | 'CLOSED'
  slaDeadline: Date
  slaBreached: boolean
  updatedAt: Date
  constituentName: string
}

interface MyCasesProps {
  cases: Case[]
}

const getPriorityBadgeVariant = (
  priority: Case['priority']
): 'destructive' | 'default' | 'secondary' | 'outline' | 'success' | 'warning' => {
  switch (priority) {
    case 'URGENT':
      return 'destructive'
    case 'HIGH':
      return 'warning'
    case 'NORMAL':
      return 'default'
    case 'LOW':
      return 'secondary'
    default:
      return 'default'
  }
}

const getStatusBadgeVariant = (
  status: Case['status']
): 'destructive' | 'default' | 'secondary' | 'outline' | 'success' | 'warning' => {
  switch (status) {
    case 'NEW':
      return 'default'
    case 'ASSIGNED':
      return 'secondary'
    case 'IN_PROGRESS':
      return 'warning'
    case 'AWAITING_RESPONSE':
      return 'warning'
    case 'RESOLVED':
      return 'success'
    case 'CLOSED':
      return 'secondary'
    default:
      return 'default'
  }
}

const getSortedCases = (cases: Case[]): Case[] => {
  return [...cases].sort((a, b) => {
    // Breached cases first
    if (a.slaBreached !== b.slaBreached) {
      return a.slaBreached ? -1 : 1
    }
    // Then by closest deadline
    return a.slaDeadline.getTime() - b.slaDeadline.getTime()
  })
}

export function MyCases({ cases }: MyCasesProps) {
  const sortedCases = getSortedCases(cases)

  if (sortedCases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Cases</CardTitle>
          <CardDescription>Cases assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No cases assigned to you</p>
            <Link
              href="/dashboard/inbox"
              className="text-primary hover:underline font-medium"
            >
              Go to Inbox
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Cases</CardTitle>
        <CardDescription>{sortedCases.length} cases assigned to you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Ref #</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-32">SLA Countdown</TableHead>
                <TableHead className="w-28">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCases.map((caseItem) => {
                const isBreached = caseItem.slaBreached || isPast(caseItem.slaDeadline)
                const timeRemaining = formatDistanceToNow(caseItem.slaDeadline, {
                  addSuffix: true,
                })

                return (
                  <TableRow
                    key={caseItem.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      window.location.href = `/dashboard/cases/${caseItem.id}`
                    }}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {caseItem.referenceNumber}
                    </TableCell>
                    <TableCell className="truncate max-w-xs" title={caseItem.subject}>
                      {caseItem.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(caseItem.priority)}>
                        {caseItem.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                        {caseItem.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`text-sm ${
                          isBreached
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isBreached && <AlertCircle className="h-3 w-3 inline mr-1" />}
                        {timeRemaining}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(caseItem.updatedAt, { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
