'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  Box,
  CheckCircle2,
  MessageSquare,
  Zap,
  Clock,
  User,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Activity {
  id: string
  action:
    | 'case.created'
    | 'case.assigned'
    | 'response.sent'
    | 'case.resolved'
    | 'case.status_changed'
    | 'case.priority_changed'
  userName: string
  caseRef: string
  timestamp: Date
}

interface ActivityFeedProps {
  activities: Activity[]
}

const getActionDetails = (
  action: Activity['action']
): { label: string; icon: React.ReactNode; color: string } => {
  switch (action) {
    case 'case.created':
      return {
        label: 'created case',
        icon: <Box className="h-4 w-4" />,
        color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
      }
    case 'case.assigned':
      return {
        label: 'assigned case',
        icon: <User className="h-4 w-4" />,
        color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
      }
    case 'response.sent':
      return {
        label: 'sent response',
        icon: <MessageSquare className="h-4 w-4" />,
        color: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
      }
    case 'case.resolved':
      return {
        label: 'resolved case',
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
      }
    case 'case.status_changed':
      return {
        label: 'changed status',
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
      }
    case 'case.priority_changed':
      return {
        label: 'changed priority',
        icon: <Zap className="h-4 w-4" />,
        color: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
      }
    default:
      return {
        label: 'activity',
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400',
      }
  }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, 20)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your team</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {displayActivities.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayActivities.map((activity) => {
                const details = getActionDetails(activity.action)
                return (
                  <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${details.color}`}>
                      {details.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">
                          {activity.userName}
                        </span>
                        <span className="text-muted-foreground mx-1">{details.label}</span>
                        <span className="font-mono text-xs text-primary font-semibold">
                          {activity.caseRef}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
