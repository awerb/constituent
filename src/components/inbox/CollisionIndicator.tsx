'use client'

import { AlertCircle } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface Viewer {
  id: string
  name: string
  avatarUrl?: string
}

interface CollisionIndicatorProps {
  viewers: Viewer[]
}

const getAvatarInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function CollisionIndicator({ viewers }: CollisionIndicatorProps) {
  if (viewers.length === 0) {
    return null
  }

  const viewerNames = viewers.map((v) => v.name).join(', ')

  return (
    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <span className="font-semibold">Also viewing:</span>
          <span className="ml-2">{viewerNames}</span>
        </p>
      </div>

      {/* Avatar Group */}
      <div className="flex -space-x-2 ml-2">
        {viewers.slice(0, 3).map((viewer) => (
          <div
            key={viewer.id}
            title={viewer.name}
            className="ring-2 ring-background"
          >
            <Avatar className="h-6 w-6">
              {viewer.avatarUrl && (
                <AvatarImage src={viewer.avatarUrl} alt={viewer.name} />
              )}
              <AvatarFallback className="text-xs">
                {getAvatarInitials(viewer.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        ))}
        {viewers.length > 3 && (
          <div
            className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold ring-2 ring-background"
            title={viewers.slice(3).map((v) => v.name).join(', ')}
          >
            +{viewers.length - 3}
          </div>
        )}
      </div>
    </div>
  )
}
