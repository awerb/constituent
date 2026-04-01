# Components Directory

This directory contains all reusable React components for the constituent-response application.

## Directory Structure

```
components/
├── ui/                      # Base UI components (Radix UI + Tailwind)
│   ├── accordion.tsx        # Collapsible accordion sections
│   ├── avatar.tsx           # User avatars with fallbacks
│   ├── badge.tsx            # Status/priority badges
│   ├── button.tsx           # Buttons with variants
│   ├── card.tsx             # Card container components
│   ├── checkbox.tsx         # Checkboxes for forms
│   ├── dialog.tsx           # Modal dialogs
│   ├── dropdown-menu.tsx    # Dropdown menus
│   ├── input.tsx            # Text inputs
│   ├── label.tsx            # Form labels
│   ├── popover.tsx          # Popover tooltips
│   ├── scroll-area.tsx      # Scrollable areas
│   ├── select.tsx           # Select dropdowns
│   ├── separator.tsx        # Dividers
│   ├── switch.tsx           # Toggle switches
│   ├── table.tsx            # Data tables
│   ├── tabs.tsx             # Tabbed content
│   ├── textarea.tsx         # Text areas
│   ├── toast.tsx            # Toast notifications
│   └── tooltip.tsx          # Tooltips
│
├── dashboard/               # Dashboard-specific components
│   ├── StatsCards.tsx       # 4-card stat overview
│   ├── MyCases.tsx          # Table of assigned cases
│   ├── NeedsAttention.tsx   # 3-card attention indicators
│   ├── ActivityFeed.tsx     # Recent activity stream
│   ├── index.ts             # Barrel export
│   └── README (via COMPONENT_USAGE.md)
│
├── inbox/                   # Inbox-specific components
│   ├── FilterSidebar.tsx    # Filter panel with accordions
│   ├── MessageList.tsx      # Main inbox table
│   ├── MessagePreview.tsx   # Case detail preview panel
│   ├── BulkActions.tsx      # Floating bulk action toolbar
│   ├── CollisionIndicator.tsx # "Also viewing" indicator
│   ├── index.ts             # Barrel export
│   └── README (via COMPONENT_USAGE.md)
│
├── cases/                   # Case detail components
│   ├── CaseDetail.tsx
│   ├── ConversationThread.tsx
│   ├── ComposePanel.tsx
│   ├── StatusControls.tsx
│   └── ...more
│
├── constituents/            # Constituent profile components
│   ├── ProfileCard.tsx
│   ├── InteractionTimeline.tsx
│   └── ...more
│
├── layout/                  # Layout components
│   ├── DashboardLayout.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── ...more
│
├── shared/                  # Shared utility components
│   ├── LanguageSelector.tsx
│   ├── RefNumberDisplay.tsx
│   └── ...more
│
├── COMPONENT_USAGE.md       # Comprehensive usage documentation
└── README.md               # This file
```

## New Dashboard & Inbox Components

### Dashboard Components (in `dashboard/`)

#### 1. **StatsCards** (StatsCards.tsx - 115 lines)
Row of 4 stat cards showing key metrics:
- Open Cases (blue)
- Due Today (red if > 0)
- Average Response Time (purple, in hours)
- Newsletter Flags (amber, last 7 days)

**Props**: `{ openCases, dueToday, avgResponseTime, newsletterFlags }`

#### 2. **MyCases** (MyCases.tsx - 188 lines)
Data table of cases assigned to current user:
- Columns: Ref#, Subject, Priority, Status, SLA Countdown, Last Updated
- Sorted by SLA urgency (breached first, then closest deadline)
- Clickable rows navigate to case detail
- Color-coded badges for priority and status
- Empty state with link to inbox

**Props**: `{ cases: Case[] }`

#### 3. **NeedsAttention** (NeedsAttention.tsx - 111 lines)
Three attention cards:
- Unassigned Cases (with filter link)
- Overdue Cases (with filter link)
- High Priority New (with filter link)
- Red/orange styling when count > 0

**Props**: `{ unassignedCount, overdueCount, highPriorityNewCount }`

#### 4. **ActivityFeed** (ActivityFeed.tsx - 130 lines)
Recent activity stream showing team updates:
- Action icons with color coding
- Shows action, user name, case ref, relative timestamp
- Max 20 items with scroll area
- Format: "Jane Smith assigned CR-2024-00147 2 hours ago"
- Action types: case.created, case.assigned, response.sent, case.resolved, etc.

**Props**: `{ activities: Activity[] }`

### Inbox Components (in `inbox/`)

#### 1. **FilterSidebar** (FilterSidebar.tsx - 251 lines)
Left filter panel:
- Filter groups: Source, Status, Priority, Date Range
- Accordion-style collapsible sections
- Checkboxes for multi-select
- Date range picker
- Clear All Filters button
- Mobile toggle on small screens
- Sticky on desktop

**Props**: `{ filters: FilterState, onFilterChange }`

#### 2. **MessageList** (MessageList.tsx - 220 lines)
Main inbox table:
- Columns: Checkbox, Source icon, Constituent, Subject, Priority, Status, SLA, Assigned, Last Message, Updated
- Source icons: Flag (Newsletter), Globe (Web), Mail (Email), Phone, FileText (Mail)
- Color-coded priority/status badges
- Red SLA countdown when breached
- Select/deselect all functionality
- Click row to navigate to case detail
- Empty state message
- Responsive horizontal scroll

**Props**: `{ cases, selectedIds, onSelect, onSelectAll, onCaseClick }`

#### 3. **MessagePreview** (MessagePreview.tsx - 163 lines)
Optional preview panel (for future split view):
- Shows case header with subject, ref number, priority, status
- Constituent info box with email/phone
- Scrollable message list (last 5 messages)
- Color-coded messages (constituent vs. agent)
- Quick action buttons: Reply, Resolve

**Props**: `{ case: CaseData, onReply?, onResolve? }`

#### 4. **BulkActions** (BulkActions.tsx - 82 lines)
Floating toolbar for bulk operations:
- Shows when cases selected
- Buttons: Assign to..., Set Priority..., Batch Respond..., Clear
- Fixed position at bottom right
- Shows "[N] cases selected" count
- Dark slate background

**Props**: `{ selectedCount, onAssign?, onSetPriority?, onBatchRespond?, onClear }`

#### 5. **CollisionIndicator** (CollisionIndicator.tsx - 72 lines)
Shows other viewers on same case:
- Yellow warning bar with alert icon
- Text: "Also viewing: Jane, Bob"
- Avatar group (up to 3 avatars)
- +N indicator for additional viewers
- Only renders when viewers array not empty

**Props**: `{ viewers: Viewer[] }`

## UI Components

All dashboard and inbox components use these base UI components (in `ui/`):

- **Card** - Rounded container with border and shadow
- **Badge** - Colored labels for status/priority
- **Table** - Data table structure with scrolling
- **Checkbox** - Form checkbox input
- **Avatar** - User avatar with initials fallback
- **Button** - Various button variants
- **Input** - Text and date inputs
- **Label** - Form labels
- **Accordion** - Collapsible sections
- **ScrollArea** - Scrollable container

## Styling & Design

### Colors
- **Priority**: URGENT=red, HIGH=orange, NORMAL=blue, LOW=gray
- **Status**: NEW=blue, ASSIGNED=purple, IN_PROGRESS=yellow, AWAITING_RESPONSE=orange, RESOLVED=green, CLOSED=gray
- **SLA**: Red when breached or overdue

### Responsive Design
- **Mobile** (< 640px): Single column, collapsed filters
- **Tablet** (640px - 1024px): 2 columns, sticky sidebar
- **Desktop** (> 1024px): Full layout, 4 columns where applicable

### Dark Mode
All components support dark mode with `dark:` Tailwind prefix:
- Background colors adjust (e.g., `dark:bg-slate-950`)
- Text colors adjust (e.g., `dark:text-white`)
- Borders adjust (e.g., `dark:border-gray-900`)

## Key Features

### Dashboard Components
- **Real-time metrics** with visual indicators
- **Priority sorting** for cases by SLA urgency
- **Color-coded** status indicators
- **Quick navigation** to related views
- **Relative timestamps** using date-fns
- **Empty states** with helpful links
- **Gradient backgrounds** for visual interest
- **Dark mode** support throughout

### Inbox Components
- **Multi-filter support** with accordion UI
- **Bulk selection** with select-all
- **Floating bulk actions** toolbar
- **Real-time collision detection** for concurrent editing
- **Source-aware icons** for different input channels
- **SLA deadline tracking** with breach indicators
- **Mobile-responsive** filter sidebar
- **Smooth interactions** with hover states

## Data Flow

### Props Only (No Direct API Calls)
All components are **presentational** - they receive data as props and don't make direct tRPC/API calls.

This pattern allows:
- Easy testing with mock data
- Flexible data fetching strategies
- Reuse in different contexts
- Server-side rendering compatibility

**Example**:
```tsx
// Parent page component (server or client)
const data = await fetchDashboardData()  // or from tRPC query

// Pass to component
<StatsCards
  openCases={data.openCases}
  dueToday={data.dueToday}
  avgResponseTime={data.avgResponseTime}
  newsletterFlags={data.newsletterFlags}
/>
```

## Type Safety

All components use **TypeScript interfaces** for strict type checking:
- Props interfaces defined in each component
- Enum values for status/priority (matching Prisma schema)
- Date objects for all timestamps
- Optional properties for nullable data

## Accessibility

Components follow accessibility best practices:
- Semantic HTML (table, button, input elements)
- ARIA labels where appropriate
- Keyboard navigation support
- Focus indicators for keyboard users
- Color isn't the only indicator (icons + text)

## Performance

### Optimization Techniques
- **Memoization**: Components wrap expensive renders
- **Lazy loading**: ScrollArea for long lists
- **Conditional rendering**: Only show bulk actions when needed
- **Responsive grids**: Minimize reflows
- **Date formatting**: Done on client (safe in 'use client' components)

## Dependencies

### Installed Dependencies (from package.json)
- `lucide-react` - Icons
- `date-fns` - Date formatting and calculations
- `@radix-ui/*` - Unstyled accessible components
- `tailwindcss` - Styling
- `next` - Framework

### No External Libraries Added
All components use existing project dependencies.

## File Locations

- **Dashboard components**: `/src/components/dashboard/`
- **Inbox components**: `/src/components/inbox/`
- **UI components**: `/src/components/ui/`
- **Usage guide**: `/src/components/COMPONENT_USAGE.md`
- **Example page**: `/EXAMPLE_DASHBOARD_PAGE.tsx` (root of project)

## Next Steps

To use these components:

1. Import from `@/components/dashboard` or `@/components/inbox`
2. Prepare data in parent component (via tRPC, server query, or props)
3. Pass data to component as props
4. Handle callbacks (onSelect, onFilterChange, onCaseClick, etc.)
5. Integrate with your routing (Next.js Link component)

See `COMPONENT_USAGE.md` for detailed examples and `EXAMPLE_DASHBOARD_PAGE.tsx` for a complete working example.
