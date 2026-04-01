# Component Library Quick Start

## Overview

Complete component system for the Constituent Response Dashboard with 27 production-ready components.

**Created Components:**
- 21 shadcn/ui components (UI library)
- 4 layout components (Sidebar, Header, NotificationBell, DashboardLayout)
- 2 shared components (LanguageSelector, RefNumberDisplay)

## Installation/Setup

All components are already created and ready to use. No additional installation needed.

Dependencies already in package.json:
- @radix-ui/* - Accessibility primitives
- tailwindcss - Styling
- lucide-react - Icons
- class-variance-authority - Variants
- next-themes - Dark mode

## File Locations

```
src/components/
├── ui/          (21 shadcn/ui components)
├── layout/      (4 dashboard layout components)
└── shared/      (2 shared utility components)
```

## Quick Import Examples

### UI Components
```tsx
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Dialog,
  Input,
  Select,
  Badge
} from '@/components/ui'
```

### Layout Components
```tsx
import {
  DashboardLayout,
  Sidebar,
  Header,
  NotificationBell
} from '@/components/layout'
```

### Shared Components
```tsx
import {
  LanguageSelector,
  RefNumberDisplay
} from '@/components/shared'
```

## Basic Page Example

```tsx
'use client'

import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'

export default function CasesPage() {
  return (
    <DashboardLayout
      title="Cases"
      userName="Jane Doe"
      userEmail="jane@example.com"
      cityName="San Francisco"
      onSignOut={() => {/* handle sign out */}}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">5</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Button>Create New Case</Button>
      </div>
    </DashboardLayout>
  )
}
```

## Component Categories

### Form Components
- Button, Input, Textarea, Label
- Checkbox, Switch, Select
- Popover

### Layout Components
- Card, Badge, Separator
- ScrollArea, Table
- Accordion

### Dialog Components
- Dialog (modal)
- DropdownMenu
- Tooltip

### Display Components
- Avatar, Tabs
- Toast, Skeleton

### Dashboard Layout
- Sidebar (navigation)
- Header (top bar)
- NotificationBell (notifications)
- DashboardLayout (complete wrapper)

## Common Tasks

### Create a Form
```tsx
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'

export function CaseForm() {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" placeholder="Case subject" />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="housing">Housing</SelectItem>
            <SelectItem value="benefits">Benefits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" />
      </div>

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Display a Modal
```tsx
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui'

export function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to proceed?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Show a Data Table
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'

export function CasesTable({ cases }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Constituent</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((c) => (
          <TableRow key={c.id}>
            <TableCell>{c.ref}</TableCell>
            <TableCell>{c.constituent}</TableCell>
            <TableCell>{c.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Use Language Selector
```tsx
import { LanguageSelector } from '@/components/shared'

export function LanguageSwitcher() {
  const [lang, setLang] = useState('en')

  return (
    <LanguageSelector
      currentLanguage={lang}
      onChange={setLang}
      compact={true}
    />
  )
}
```

### Display Reference Number
```tsx
import { RefNumberDisplay } from '@/components/shared'

export function CaseHeader({ caseRef }) {
  return (
    <div>
      <h1>Case Details</h1>
      <RefNumberDisplay
        refNumber={caseRef}
        caseLink={`/cases/${caseRef}`}
        showCopy={true}
      />
    </div>
  )
}
```

## Styling & Theming

### Colors
Components use CSS variables from `src/app/globals.css`:
- `--primary`: Main color (blue)
- `--destructive`: Danger color (red)
- `--secondary`: Secondary color
- `--accent`: Accent color
- `--muted`: Muted/disabled color

### Dark Mode
Automatically handled by next-themes:
```tsx
// In layout.tsx or similar
<html className={isDark ? 'dark' : ''}>
```

### Customizing Components
```tsx
import { Button } from '@/components/ui'

// Use variants
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">More</Button>

// Use sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">📄</Button>
```

## TypeScript

All components have full TypeScript support:
```tsx
import { Button } from '@/components/ui'
import type { ButtonProps } from '@/components/ui'

function MyButton(props: ButtonProps & { special?: boolean }) {
  return <Button {...props} />
}
```

## Accessibility

All components follow WCAG 2.1 standards:
- ✓ Keyboard navigation (Tab, Enter, Escape)
- ✓ Screen reader support (ARIA labels)
- ✓ Focus indicators
- ✓ Color contrast
- ✓ Semantic HTML

## Resources

- **Full Documentation:** See `COMPONENTS.md`
- **File Manifest:** See `COMPONENT_FILES.txt`
- **Examples:** Check individual component code in `src/components/`

## Next Steps

1. Create pages using `DashboardLayout`
2. Build forms with form components
3. Add dialogs and modals as needed
4. Use shared components for common patterns
5. Customize colors in `src/app/globals.css` if needed

All components are production-ready and can be used immediately!
