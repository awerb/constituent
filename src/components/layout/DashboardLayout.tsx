'use client'

import * as React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  title: string
  children: React.ReactNode
  userName?: string
  userEmail?: string
  userAvatar?: string
  cityName?: string
  cityLogo?: string
  onProfileClick?: () => void
  onSignOut?: () => void
  sidebarClassName?: string
  headerClassName?: string
  mainClassName?: string
}

export const DashboardLayout = React.forwardRef<
  HTMLDivElement,
  DashboardLayoutProps
>(
  (
    {
      title,
      children,
      userName,
      userEmail,
      userAvatar,
      cityName,
      cityLogo,
      onProfileClick,
      onSignOut,
      sidebarClassName,
      headerClassName,
      mainClassName,
    },
    ref
  ) => {
    return (
      <div ref={ref} className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar cityName={cityName} cityLogo={cityLogo} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden pl-64 transition-all duration-300 ease-in-out">
          {/* Header */}
          <Header
            title={title}
            userName={userName}
            userEmail={userEmail}
            userAvatar={userAvatar}
            onProfileClick={onProfileClick}
            onSignOut={onSignOut}
          />

          {/* Page Content */}
          <main
            className={cn(
              'flex-1 overflow-auto bg-background p-6',
              mainClassName
            )}
          >
            {children}
          </main>
        </div>
      </div>
    )
  }
)

DashboardLayout.displayName = 'DashboardLayout'
