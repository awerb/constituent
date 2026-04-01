'use client'

import Link from 'next/link'
import { AlertCircle, Box, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface NeedsAttentionProps {
  unassignedCount: number
  overdueCount: number
  highPriorityNewCount: number
}

interface AttentionCard {
  icon: React.ReactNode
  count: number
  label: string
  description: string
  filterParam: string
  color: 'red' | 'orange' | 'amber'
}

export function NeedsAttention({
  unassignedCount,
  overdueCount,
  highPriorityNewCount,
}: NeedsAttentionProps) {
  const attentionCards: AttentionCard[] = [
    {
      icon: <Box className="h-6 w-6" />,
      count: unassignedCount,
      label: 'Unassigned Cases',
      description: 'Cases waiting for assignment',
      filterParam: 'status=NEW',
      color: 'red',
    },
    {
      icon: <AlertCircle className="h-6 w-6" />,
      count: overdueCount,
      label: 'Overdue Cases',
      description: 'SLA deadline passed',
      filterParam: 'slaBreached=true',
      color: 'red',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      count: highPriorityNewCount,
      label: 'High Priority New',
      description: 'Urgent new cases',
      filterParam: 'priority=URGENT,HIGH&status=NEW',
      color: 'orange',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {attentionCards.map((item) => {
        const hasIssues = item.count > 0
        const colorClasses = {
          red: hasIssues
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
            : 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-900',
          orange: hasIssues
            ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900'
            : 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-900',
          amber: hasIssues
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
            : 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-900',
        }

        const textColorClasses = {
          red: hasIssues
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400',
          orange: hasIssues
            ? 'text-orange-600 dark:text-orange-400'
            : 'text-gray-600 dark:text-gray-400',
          amber: hasIssues
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-gray-600 dark:text-gray-400',
        }

        return (
          <Card
            key={item.label}
            className={`border-2 cursor-pointer transition-all hover:shadow-md ${colorClasses[item.color]}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-white dark:bg-gray-900 ${textColorClasses[item.color]}`}>
                  {item.icon}
                </div>
                <p className={`text-2xl font-bold ${textColorClasses[item.color]}`}>
                  {item.count}
                </p>
              </div>
              <h3 className="font-semibold text-sm mb-1">{item.label}</h3>
              <p className="text-xs text-muted-foreground mb-4">{item.description}</p>
              <Link
                href={`/dashboard/inbox?${item.filterParam}`}
                className={`text-sm font-medium ${textColorClasses[item.color]} hover:underline inline-flex items-center gap-1`}
              >
                View
                <span className="text-lg">→</span>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
