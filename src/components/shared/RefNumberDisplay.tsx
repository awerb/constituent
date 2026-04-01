'use client'

import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface RefNumberDisplayProps {
  refNumber: string
  caseLink?: string
  showCopy?: boolean
  className?: string
}

export const RefNumberDisplay = React.forwardRef<
  HTMLDivElement,
  RefNumberDisplayProps
>(({ refNumber, caseLink, showCopy = true, className }, ref) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const content = (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2',
        className
      )}
    >
      <code className="font-mono text-sm font-semibold text-foreground">
        {refNumber}
      </code>
      {showCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
          title="Copy reference number"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )

  if (caseLink) {
    return (
      <Link href={caseLink} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
})

RefNumberDisplay.displayName = 'RefNumberDisplay'
