'use client'

import { X, Users, AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface BulkActionsProps {
  selectedCount: number
  onAssign?: () => void
  onSetPriority?: () => void
  onBatchRespond?: () => void
  onClear: () => void
}

export function BulkActions({
  selectedCount,
  onAssign,
  onSetPriority,
  onBatchRespond,
  onClear,
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50 md:left-auto md:right-6 md:w-auto">
      <Card className="bg-slate-900 dark:bg-slate-950 border-slate-800 shadow-2xl">
        <div className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-white">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold">{selectedCount} cases selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={onAssign}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
            >
              <Users className="h-4 w-4 mr-1" />
              Assign to...
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onSetPriority}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Set Priority...
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onBatchRespond}
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
            >
              <Send className="h-4 w-4 mr-1" />
              Batch Respond...
            </Button>

            <div className="h-6 w-px bg-slate-700" />

            <Button
              size="sm"
              variant="ghost"
              onClick={onClear}
              className="hover:bg-slate-800 text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
