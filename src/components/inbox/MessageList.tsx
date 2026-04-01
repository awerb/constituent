'use client'

import { formatDistanceToNow, isPast } from 'date-fns'
import { Flag, Globe, Mail, Phone, FileText, AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface Case {
  id: string
  referenceNumber: string
  source: 'NEWSLETTER' | 'WEB' | 'EMAIL' | 'PHONE' | 'MAIL'
  constituentName: string
  subject: string
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'AWAITING_RESPONSE' | 'RESOLVED' | 'CLOSED'
  slaDeadline: Date
  slaBreached: boolean
  assignedTo?: { id: string; name: string; avatarUrl?: string } | null
  lastMessagePreview: string
  updatedAt: Date
}

interface MessageListProps {
  cases: Case[]
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onCaseClick?: (caseId: string) => void
}

const getSourceIcon = (source: Case['source']) => {
  switch (source) {
    case 'NEWSLETTER':
      return <Flag className="h-4 w-4 text-amber-600" />
    case 'WEB':
      return <Globe className="h-4 w-4 text-blue-600" />
    case 'EMAIL':
      return <Mail className="h-4 w-4 text-gray-600" />
    case 'PHONE':
      return <Phone className="h-4 w-4 text-purple-600" />
    case 'MAIL':
      return <FileText className="h-4 w-4 text-orange-600" />
    default:
      return null
  }
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

const getAvatarInitials = (name?: string) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function MessageList({
  cases,
  selectedIds,
  onSelect,
  onSelectAll,
  onCaseClick,
}: MessageListProps) {
  const isAllSelected = cases.length > 0 && selectedIds.size === cases.length

  const handleRowClick = (caseId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return
    }
    onCaseClick?.(caseId)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              />
            </TableHead>
            <TableHead className="w-12">Source</TableHead>
            <TableHead>Constituent</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="w-20">Priority</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-32">SLA Deadline</TableHead>
            <TableHead className="w-24">Assigned</TableHead>
            <TableHead className="max-w-xs">Last Message</TableHead>
            <TableHead className="w-24">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No cases found</p>
              </TableCell>
            </TableRow>
          ) : (
            cases.map((caseItem) => {
              const isBreached = caseItem.slaBreached || isPast(caseItem.slaDeadline)
              const timeRemaining = formatDistanceToNow(caseItem.slaDeadline)

              return (
                <TableRow
                  key={caseItem.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(e) => handleRowClick(caseItem.id, e)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(caseItem.id)}
                      onCheckedChange={(checked) =>
                        onSelect(caseItem.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div title={caseItem.source}>{getSourceIcon(caseItem.source)}</div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {caseItem.constituentName}
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
                    <div className={isBreached ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                      {isBreached && <AlertCircle className="h-3 w-3 inline mr-1" />}
                      <span className="text-sm">{timeRemaining}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {caseItem.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                          {getAvatarInitials(caseItem.assignedTo.name)}
                        </div>
                        <span className="text-xs">{caseItem.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="truncate max-w-xs text-sm text-muted-foreground">
                    {caseItem.lastMessagePreview}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(caseItem.updatedAt, { addSuffix: true })}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
