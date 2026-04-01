'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/layout/NotificationBell'

interface HeaderProps {
  title: string
  userName?: string
  userEmail?: string
  userAvatar?: string
  onProfileClick?: () => void
  onNotificationsClick?: () => void
  onSignOut?: () => void
}

export const Header = React.forwardRef<HTMLHeaderElement, HeaderProps>(
  (
    {
      title,
      userName = 'User',
      userEmail,
      userAvatar,
      onProfileClick,
      onNotificationsClick,
      onSignOut,
    },
    ref
  ) => {
    const { theme, setTheme } = useTheme()

    const handleThemeToggle = () => {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    const userInitials = userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <header
        ref={ref}
        className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left: Page Title */}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

          {/* Right: Controls */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell onClick={onNotificationsClick} />

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  {userEmail && (
                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onProfileClick}>
                  Profile settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onProfileClick}>
                  Notification preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    )
  }
)

Header.displayName = 'Header'
