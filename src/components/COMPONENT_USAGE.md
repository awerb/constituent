# Dashboard and Inbox Components Usage Guide

## Dashboard Components

### 1. StatsCards

Displays 4 stat cards showing key metrics.

**Props:**
```typescript
interface StatsCardsProps {
  openCases: number
  dueToday: number
  avgResponseTime: number        // in hours
  newsletterFlags: number        // last 7 days count
}
```

**Example:**
```tsx
import { StatsCards } from '@/components/dashboard'

export function DashboardPage() {
  return (
    <StatsCards
      openCases={42}
      dueToday={5}
      avgResponseTime={2.5}
      newsletterFlags={12}
    />
  )
}
```

**Features:**
- Blue card: Open Cases with bar chart icon
- Red card (if dueToday > 0): Due Today with alert icon
- Purple card: Average Response Time with clock icon
- Amber card: Newsletter Flags with flag icon
- Responsive grid: 4 columns (desktop), 2 columns (tablet), 1 column (mobile)
- Dark mode support with gradient backgrounds

---

### 2. MyCases

Data table showing cases assigned to the current user.

**Props:**
```typescript
interface Case {
  id: string
  referenceNumber: string
  subject: string
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'AWAITING_RESPONSE' | 'RESOLVED' | 'CLOSED'
  slaDeadline: Date
  slaBreached: boolean
  updatedAt: Date
  constituentName: string
}

interface MyCasesProps {
  cases: Case[]
}
```

**Example:**
```tsx
import { MyCases } from '@/components/dashboard'

export function DashboardPage() {
  const cases = [
    {
      id: '1',
      referenceNumber: 'CR-2024-00147',
      subject: 'Water service complaint',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      slaBreached: false,
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      constituentName: 'John Doe',
    },
  ]

  return <MyCases cases={cases} />
}
```

**Features:**
- Table columns: Ref #, Subject, Priority, Status, SLA Countdown, Last Updated
- Sorted by SLA urgency (breached first, then closest deadline)
- Color-coded priority badges: URGENT (red), HIGH (orange), NORMAL (blue), LOW (gray)
- Color-coded status badges: NEW (blue), ASSIGNED (purple), IN_PROGRESS (yellow), AWAITING_RESPONSE (orange), RESOLVED (green), CLOSED (gray)
- Red styling for breached SLA countdown
- Click row to navigate to case detail page
- Empty state with link to inbox when no cases assigned

---

### 3. NeedsAttention

Three attention cards showing high-priority issues.

**Props:**
```typescript
interface NeedsAttentionProps {
  unassignedCount: number        // cases waiting for assignment
  overdueCount: number           // SLA deadline passed
  highPriorityNewCount: number   // urgent new cases
}
```

**Example:**
```tsx
import { NeedsAttention } from '@/components/dashboard'

export function DashboardPage() {
  return (
    <NeedsAttention
      unassignedCount={3}
      overdueCount={2}
      highPriorityNewCount={1}
    />
  )
}
```

**Features:**
- Three cards: Unassigned Cases, Overdue Cases, High Priority New
- Red styling when count > 0
- Each card links to filtered inbox view with appropriate query params
- Icons: Box, AlertCircle, Zap
- Click card or "View" link to navigate to filtered inbox

---

### 4. ActivityFeed

Recent activity stream showing team updates.

**Props:**
```typescript
interface Activity {
  id: string
  action: 'case.created' | 'case.assigned' | 'response.sent' | 'case.resolved' | 'case.status_changed' | 'case.priority_changed'
  userName: string
  caseRef: string              // e.g., 'CR-2024-00147'
  timestamp: Date
}

interface ActivityFeedProps {
  activities: Activity[]
}
```

**Example:**
```tsx
import { ActivityFeed } from '@/components/dashboard'

export function DashboardPage() {
  const activities = [
    {
      id: '1',
      action: 'case.assigned',
      userName: 'Jane Smith',
      caseRef: 'CR-2024-00147',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]

  return <ActivityFeed activities={activities} />
}
```

**Features:**
- Scrollable list (max 20 items displayed)
- Color-coded icons by action type:
  - case.created: Blue box icon
  - case.assigned: Purple user icon
  - response.sent: Green message icon
  - case.resolved: Emerald check icon
  - case.status_changed: Amber clock icon
  - case.priority_changed: Orange zap icon
- Relative timestamps using date-fns formatDistanceToNow
- Format: "Jane Smith assigned CR-2024-00147 2 hours ago"
- Empty state with clock icon

---

## Inbox Components

### 1. FilterSidebar

Left filter sidebar with multiple filter options.

**Props:**
```typescript
interface FilterState {
  sources: string[]             // e.g., ['Newsletter', 'Web', 'Email']
  department?: string
  statuses: string[]
  priorities: string[]
  dateFrom?: string             // YYYY-MM-DD
  dateTo?: string               // YYYY-MM-DD
}

interface FilterSidebarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}
```

**Example:**
```tsx
import { useState } from 'react'
import { FilterSidebar } from '@/components/inbox'

export function InboxPage() {
  const [filters, setFilters] = useState({
    sources: [],
    statuses: [],
    priorities: [],
  })

  return (
    <div className="flex gap-4">
      <FilterSidebar filters={filters} onFilterChange={setFilters} />
      {/* MessageList component */}
    </div>
  )
}
```

**Features:**
- Source filter: Newsletter, Web, Email, Phone, Mail
- Status filter: NEW, ASSIGNED, IN_PROGRESS, AWAITING_RESPONSE, RESOLVED, CLOSED
- Priority filter: URGENT, HIGH, NORMAL, LOW
- Date range filter: From and To date pickers
- "Clear All Filters" button (only shows when filters active)
- Collapsible filter groups using Accordion component
- Mobile responsive: toggle button on mobile, sticky sidebar on desktop
- Dark mode support

---

### 2. MessageList

Main inbox list showing all cases.

**Props:**
```typescript
interface Case {
  id: string
  referenceNumber: string
  source: 'NEWSLETTER' | 'WEB' | 'EMAIL' | 'PHONE' | 'MAIL'
  constituentName: string
  subject: string
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'AWAITING_RESPONSE' | 'RESOLVED' | 'CLOSED'
  slaDeadline: Date
  slaBreached: boolean
  assignedTo?: { id: string; name: string; avatarUrl?: string } | null
  lastMessagePreview: string
  updatedAt: Date
}

interface MessageListProps {
  cases: Case[]
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onCaseClick?: (caseId: string) => void
}
```

**Example:**
```tsx
import { useState } from 'react'
import { MessageList } from '@/components/inbox'

export function InboxPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const cases = [
    {
      id: '1',
      referenceNumber: 'CR-2024-00147',
      source: 'EMAIL' as const,
      constituentName: 'Jane Doe',
      subject: 'Pothole repair request',
      priority: 'HIGH' as const,
      status: 'NEW' as const,
      slaDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      slaBreached: false,
      assignedTo: null,
      lastMessagePreview: 'There is a dangerous pothole on 5th Street...',
      updatedAt: new Date(),
    },
  ]

  return (
    <MessageList
      cases={cases}
      selectedIds={selectedIds}
      onSelect={(id, selected) => {
        const newIds = new Set(selectedIds)
        if (selected) newIds.add(id)
        else newIds.delete(id)
        setSelectedIds(newIds)
      }}
      onSelectAll={(selected) => {
        if (selected) {
          setSelectedIds(new Set(cases.map((c) => c.id)))
        } else {
          setSelectedIds(new Set())
        }
      }}
      onCaseClick={(caseId) => {
        window.location.href = `/dashboard/cases/${caseId}`
      }}
    />
  )
}
```

**Features:**
- Table columns: Checkbox, Source icon, Constituent, Subject, Priority, Status, SLA Deadline, Assigned, Last Message, Updated
- Source icons: Flag (Newsletter), Globe (Web), Mail (Email), Phone, FileText (Mail)
- Color-coded priority and status badges
- Red SLA countdown when breached
- Select/deselect individual rows with checkboxes
- Select all checkbox in header
- Hover state on rows
- Avatar with initials for assigned agent
- "Unassigned" text when no assignee
- Click row to navigate to case detail
- Empty state with no cases message
- Responsive table with horizontal scroll on small screens

---

### 3. MessagePreview

Optional preview panel showing case details and messages (for future split view).

**Props:**
```typescript
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
```

**Example:**
```tsx
import { MessagePreview } from '@/components/inbox'

export function CaseDetailPage() {
  const caseData = {
    id: '1',
    referenceNumber: 'CR-2024-00147',
    subject: 'Water service complaint',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    source: 'EMAIL' as const,
    constituent: {
      id: 'c1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
    },
    messages: [
      {
        id: 'm1',
        content: 'Water has been discolored for 2 days...',
        authorName: 'John Doe',
        isFromConstituent: true,
        createdAt: new Date(),
      },
    ],
  }

  return (
    <MessagePreview
      case={caseData}
      onReply={() => console.log('Reply clicked')}
      onResolve={() => console.log('Resolve clicked')}
    />
  )
}
```

**Features:**
- Card layout with case header showing subject and reference number
- Priority and status badges
- Constituent info box with email and phone
- Scrollable message list showing last 5 messages
- Different background colors for constituent vs. agent messages
- Quick action buttons: Reply and Resolve
- Relative timestamps on messages
- Empty state when no messages

---

### 4. BulkActions

Floating toolbar for bulk actions on selected cases.

**Props:**
```typescript
interface BulkActionsProps {
  selectedCount: number
  onAssign?: () => void
  onSetPriority?: () => void
  onBatchRespond?: () => void
  onClear: () => void
}
```

**Example:**
```tsx
import { BulkActions } from '@/components/inbox'

export function InboxPage() {
  const [selectedCount, setSelectedCount] = useState(0)

  return (
    <>
      {/* MessageList component */}
      <BulkActions
        selectedCount={selectedCount}
        onAssign={() => {
          // Open assign dialog
        }}
        onSetPriority={() => {
          // Open priority dialog
        }}
        onBatchRespond={() => {
          // Open batch respond dialog
        }}
        onClear={() => {
          // Clear selection
        }}
      />
    </>
  )
}
```

**Features:**
- Floating toolbar at bottom right (fixed position)
- Shows "[N] cases selected" count
- Four action buttons: Assign to..., Set Priority..., Batch Respond..., Clear
- Dark slate background (dark gray/black)
- Only visible when selectedCount > 0
- Responsive: full width on mobile, fixed width on desktop
- Icons for each action
- Separates buttons with divider line before Clear

---

### 5. CollisionIndicator

Shows when other agents are viewing the same case.

**Props:**
```typescript
interface Viewer {
  id: string
  name: string
  avatarUrl?: string
}

interface CollisionIndicatorProps {
  viewers: Viewer[]
}
```

**Example:**
```tsx
import { CollisionIndicator } from '@/components/inbox'

export function CaseDetailPage() {
  const viewers = [
    { id: '1', name: 'Jane Smith', avatarUrl: 'https://...' },
    { id: '2', name: 'Bob Johnson', avatarUrl: 'https://...' },
  ]

  return (
    <>
      <CollisionIndicator viewers={viewers} />
      {/* Case detail content */}
    </>
  )
}
```

**Features:**
- Yellow warning bar with alert icon
- Shows "Also viewing: [names]" text
- Avatar group showing up to 3 avatars
- +N indicator for additional viewers beyond 3
- Avatars with initials fallback
- Hover tooltips on avatars
- Only renders when viewers array has items
- Dark mode support

---

## Shared UI Components

All dashboard and inbox components use base UI components from `@/components/ui/`:

- **Card**: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Badge**: With variants (default, secondary, destructive, outline, success, warning)
- **Table**: TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell
- **Checkbox**: Radix UI checkbox with Lucide check icon
- **Avatar**: AvatarImage, AvatarFallback
- **Button**: Various variants and sizes
- **Input**: Text, date inputs
- **Label**: Form labels
- **Accordion**: AccordionItem, AccordionTrigger, AccordionContent
- **ScrollArea**: Scrollable container with scroll bar

All components support:
- Dark mode (using `dark:` Tailwind prefix)
- Responsive design (mobile, tablet, desktop breakpoints)
- Accessibility features (ARIA labels, semantic HTML)
- TypeScript strict mode

## Notes

- Components receive data as props only (no direct tRPC calls within components)
- Parent pages/layouts handle data fetching and passing as props
- All dates are Date objects - format client-side for display
- All relative times use date-fns formatDistanceToNow for consistency
- Icons from lucide-react (Flag, Mail, Phone, Globe, etc.)
- Color coding is consistent across components (URGENT=red, HIGH=orange, etc.)
