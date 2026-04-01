'use client'

import { formatDistanceToNow } from 'date-fns'
import { Mail, Phone, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  id: string
  content: string
  authorName?: string
  authorEmail?: string
  isFromConstituent: boolean
  createdAt: Date
}

interface CaseData {
  id: string
  referenceNumber: string
  subject: string
  status: string
  priority: string
  source: 'NEWSLETTER' | 'WEB' | 'EMAIL' | 'PHONE' | 'MAIL'
  constituent: {
    id: string
    name?: string
    email: string
    phone?: string
  }
  messages: Message[]
}

interface MessagePreviewProps {
  case: CaseData
  onReply?: () => void
  onResolve?: () => void
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'NORMAL':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'LOW':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export function MessagePreview({
  case: caseData,
  onReply,
  onResolve,
}: MessagePreviewProps) {
  const lastMessage = caseData.messages[caseData.messages.length - 1]

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base">{caseData.subject}</CardTitle>
              <CardDescription className="font-mono text-xs text-primary mt-1">
                {caseData.referenceNumber}
              </CardDescription>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge className={getPriorityColor(caseData.priority)}>
              {caseData.priority}
            </Badge>
            <Badge variant="secondary">{caseData.status}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
        {/* Constituent Info */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Constituent</p>
          <p className="text-sm font-medium">{caseData.constituent.name || 'Unknown'}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {caseData.constituent.email}
          </div>
          {caseData.constituent.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {caseData.constituent.phone}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Messages</p>
          <ScrollArea className="flex-1 pr-4 border rounded-lg p-3 bg-muted/30">
            <div className="space-y-3">
              {caseData.messages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No messages yet
                </p>
              ) : (
                caseData.messages.slice(-5).map((message) => (
                  <div
                    key={message.id}
                    className={`p-2 rounded-lg text-xs ${
                      message.isFromConstituent
                        ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="font-semibold mb-1">{message.authorName || 'Unknown'}</p>
                    <p className="line-clamp-2">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Last Message Preview */}
        {lastMessage && (
          <div className="border-t pt-3 text-xs">
            <p className="text-muted-foreground font-semibold mb-1">Latest:</p>
            <p className="text-muted-foreground line-clamp-2">{lastMessage.content}</p>
          </div>
        )}
      </CardContent>

      {/* Quick Actions */}
      <div className="border-t p-4 flex gap-2">
        <Button
          onClick={onReply}
          size="sm"
          className="flex-1"
          variant="default"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Reply
        </Button>
        <Button
          onClick={onResolve}
          size="sm"
          variant="outline"
        >
          Resolve
        </Button>
      </div>
    </Card>
  )
}
