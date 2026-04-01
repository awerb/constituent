'use client'

import * as React from 'react'
import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  message: string
  timestamp: Date
  read: boolean
  icon?: React.ReactNode
}

interface NotificationBellProps {
  notifications?: Notification[]
  unreadCount?: number
  onMarkAllAsRead?: () => void
  onDismiss?: (id: string) => void
  onClick?: () => void
}

export const NotificationBell = React.forwardRef<
  HTMLButtonElement,
  NotificationBellProps
>(
  (
    {
      notifications = [],
      unreadCount = 0,
      onMarkAllAsRead,
      onDismiss,
      onClick,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleMarkAllAsRead = () => {
      onMarkAllAsRead?.()
    }

    const formatTime = (date: Date) => {
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

      if (diffInMinutes < 1) return 'just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`

      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours}h ago`

      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }

    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onClick}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
          </div>
          <DropdownMenuSeparator />

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-0',
                    !notification.read && 'bg-blue-50 dark:bg-blue-950/30'
                  )}
                >
                  {notification.icon && (
                    <div className="mt-1 flex-shrink-0">
                      {notification.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDismiss?.(notification.id)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

NotificationBell.displayName = 'NotificationBell'
