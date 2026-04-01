'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Inbox,
  FolderOpen,
  Users,
  FileText,
  BookOpen,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'inbox', label: 'Inbox', href: '/inbox', icon: <Inbox className="h-5 w-5" /> },
  { id: 'cases', label: 'Cases', href: '/cases', icon: <FolderOpen className="h-5 w-5" /> },
  { id: 'constituents', label: 'Constituents', href: '/constituents', icon: <Users className="h-5 w-5" /> },
  { id: 'templates', label: 'Templates', href: '/templates', icon: <FileText className="h-5 w-5" /> },
  { id: 'knowledge', label: 'Knowledge Base', href: '/knowledge-base', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'reports', label: 'Reports', href: '/reports', icon: <BarChart3 className="h-5 w-5" /> },
]

interface SidebarProps {
  cityName?: string
  cityLogo?: string
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ cityName = 'City', cityLogo }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()

    const toggleCollapse = useCallback(() => {
      setIsCollapsed((prev) => !prev)
    }, [])

    const isActive = (href: string) => {
      return pathname === href || pathname.startsWith(href + '/')
    }

    return (
      <TooltipProvider>
        <aside
          ref={ref}
          className={cn(
            'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-background transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-20' : 'w-64'
          )}
        >
          {/* Logo Section */}
          <div className="flex items-center justify-between border-b border-border p-4">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                {cityLogo && (
                  <img src={cityLogo} alt={cityName} className="h-8 w-8 rounded" />
                )}
                <h1 className="truncate text-lg font-semibold">{cityName}</h1>
              </div>
            )}
            {isCollapsed && cityLogo && (
              <img src={cityLogo} alt={cityName} className="h-8 w-8 rounded" />
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.id}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={item.href}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                'h-10 w-10',
                                active && 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                              )}
                            >
                              {item.icon}
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            'w-full justify-start gap-3',
                            active && 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          )}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Button>
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Collapse Toggle */}
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-10 w-10"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>
        </aside>
      </TooltipProvider>
    )
  }
)

Sidebar.displayName = 'Sidebar'
