'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Language {
  code: string
  name: string
  flag: string
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
]

interface LanguageSelectorProps {
  currentLanguage?: string
  onChange?: (languageCode: string) => void
  compact?: boolean
}

export const LanguageSelector = React.forwardRef<
  HTMLDivElement,
  LanguageSelectorProps
>(({ currentLanguage = 'en', onChange, compact = false }, ref) => {
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage)

  return (
    <div ref={ref}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            className={compact ? 'px-2' : ''}
          >
            {compact ? (
              <>
                <Globe className="h-4 w-4" />
              </>
            ) : (
              <>
                <span className="mr-2 text-lg">{current?.flag}</span>
                <span>{current?.name}</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => onChange?.(language.code)}
              className={cn(
                'cursor-pointer',
                currentLanguage === language.code && 'bg-accent'
              )}
            >
              <span className="mr-2">{language.flag}</span>
              <span className="flex-1">{language.name}</span>
              {currentLanguage === language.code && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

LanguageSelector.displayName = 'LanguageSelector'
