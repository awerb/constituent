'use client'

import { BarChart3, Clock, Flag, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsCardsProps {
  openCases: number
  dueToday: number
  avgResponseTime: number
  newsletterFlags: number
}

export function StatsCards({
  openCases,
  dueToday,
  avgResponseTime,
  newsletterFlags,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Open Cases Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Open Cases</p>
              <p className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">
                {openCases}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Due Today Card */}
      <Card
        className={`bg-gradient-to-br border-2 ${
          dueToday > 0
            ? 'from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-950/20 border-red-200 dark:border-red-900'
            : 'from-gray-50 to-gray-50/50 dark:from-gray-950/30 dark:to-gray-950/20 border-gray-200 dark:border-gray-900'
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Due Today</p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  dueToday > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {dueToday}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                dueToday > 0
                  ? 'bg-red-100 dark:bg-red-900/50'
                  : 'bg-gray-100 dark:bg-gray-900/50'
              }`}
            >
              <AlertCircle
                className={`h-6 w-6 ${
                  dueToday > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Response Time Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/30 dark:to-purple-950/20 border-purple-200 dark:border-purple-900">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Avg Response Time</p>
              <p className="text-3xl font-bold mt-2 text-purple-600 dark:text-purple-400">
                {avgResponseTime.toFixed(1)}h
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Flags Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Newsletter Flags</p>
              <p className="text-xs text-muted-foreground mt-1">last 7 days</p>
              <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {newsletterFlags}
              </p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-lg">
              <Flag className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
