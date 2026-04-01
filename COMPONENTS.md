# Components Reference

Complete component library for the Constituent Response Dashboard.

## UI Components (`src/components/ui/`)

All shadcn/ui-style components built with Radix UI primitives and Tailwind CSS.

### Form Components
- **Button** - Variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon.
- **Input** - Text input with proper focus states and disabled states
- **Textarea** - Multi-line text input
- **Label** - Form label component
- **Checkbox** - Toggle checkbox with icon indicator
- **Switch** - Toggle switch component
- **Select** - Select dropdown with scrolling support
- **Popover** - Floating popover container

### Layout Components
- **Card** - Card container with CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Badge** - Badge with variants: default, secondary, destructive, outline, success, warning
- **Separator** - Horizontal or vertical divider line
- **ScrollArea** - Scrollable container with custom scrollbar
- **Table** - Table with TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell
- **Accordion** - Collapsible accordion with AccordionItem, AccordionTrigger, AccordionContent

### Dialog Components
- **Dialog** - Modal dialog with DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
- **Dropdown Menu** - Context menu with items, labels, separators, and keyboard support

### Display Components
- **Avatar** - Avatar with AvatarImage and AvatarFallback
- **Tabs** - Tab navigation with TabsList, TabsTrigger, TabsContent
- **Tooltip** - Floating tooltip with TooltipProvider, TooltipTrigger, TooltipContent
- **Toast** - Toast notifications with Toast, ToastTitle, ToastDescription, ToastAction, ToastClose
- **Skeleton** - Loading skeleton placeholder

## Layout Components (`src/components/layout/`)

### Sidebar
Staff dashboard navigation sidebar with collapsible state.

```tsx
import { Sidebar } from '@/components/layout'

<Sidebar
  cityName="San Francisco"
  cityLogo="/logo.png"
/>
```

**Features:**
- Icon-only mode when collapsed
- 7 main navigation items (Dashboard, Inbox, Cases, Constituents, Templates, Knowledge Base, Reports)
- Active state styling (blue-600 background)
- Dark mode support
- Responsive collapse on mobile
- Tooltip hints in collapsed mode

### Header
Top header bar with page title and user controls.

```tsx
import { Header } from '@/components/layout'

<Header
  title="Dashboard"
  userName="John Doe"
  userEmail="john@example.com"
  userAvatar="/avatar.jpg"
  onProfileClick={handleProfile}
  onSignOut={handleSignOut}
/>
```

**Features:**
- Page title display (left)
- Notification bell with unread badge
- Dark mode toggle
- User profile dropdown
- Responsive design

### NotificationBell
Notification bell icon with dropdown menu.

```tsx
import { NotificationBell } from '@/components/layout'

<NotificationBell
  notifications={[
    {
      id: '1',
      message: 'New case assigned',
      timestamp: new Date(),
      read: false
    }
  ]}
  unreadCount={3}
  onMarkAllAsRead={handleMarkRead}
  onDismiss={handleDismiss}
/>
```

**Features:**
- Unread badge with count
- Notification list with timestamps
- Read/unread states
- Mark all as read
- Dismiss individual notifications

### DashboardLayout
Complete layout wrapper combining Sidebar and Header.

```tsx
import { DashboardLayout } from '@/components/layout'

<DashboardLayout
  title="Cases"
  userName="Jane Smith"
  userEmail="jane@example.com"
  cityName="Los Angeles"
  onSignOut={handleSignOut}
>
  {/* Page content */}
</DashboardLayout>
```

## Shared Components (`src/components/shared/`)

### LanguageSelector
Language dropdown with flag emojis.

```tsx
import { LanguageSelector } from '@/components/shared'

<LanguageSelector
  currentLanguage="en"
  onChange={(lang) => setLanguage(lang)}
  compact={false}
/>
```

**Supported Languages:**
- English (🇺🇸)
- Español (🇪🇸)
- Français (🇫🇷)
- Português (🇵🇹)
- 中文 (🇨🇳)
- Tiếng Việt (🇻🇳)
- 한국어 (🇰🇷)
- العربية (🇸🇦)

### RefNumberDisplay
Reference number display with copy button.

```tsx
import { RefNumberDisplay } from '@/components/shared'

<RefNumberDisplay
  refNumber="CR-2024-00147"
  caseLink="/cases/CR-2024-00147"
  showCopy={true}
/>
```

**Features:**
- Monospace font display
- Copy-to-clipboard button with feedback
- Optional link to case
- Formatted background styling

## Usage Examples

### Basic Page Layout

```tsx
'use client'

import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      userName="User Name"
      userEmail="user@example.com"
      cityName="City Name"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            Content here
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
```

### Form Example

```tsx
import { Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'

export function ContactForm() {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Your name" />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General Inquiry</SelectItem>
            <SelectItem value="complaint">Complaint</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" placeholder="Your message" />
      </div>

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Dialog Example

```tsx
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui'

export function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end">
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Styling

All components use:
- **Tailwind CSS** for styling
- **CSS Variables** for theming (see tailwind.config.ts)
- **Dark mode support** via class strategy
- **CVA (class-variance-authority)** for component variants

### Dark Mode

Components automatically support dark mode:

```tsx
// Dark mode is enabled via class in html/body element
<html className="dark">
```

### Customizing Colors

Update `src/app/globals.css` CSS variables:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --primary: 0 0% 9%;
    /* ... more colors ... */
  }

  .dark {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
    /* ... dark mode colors ... */
  }
}
```

## Accessibility

All components follow WAI-ARIA standards:
- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- Semantic HTML
- ARIA labels where appropriate

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import { Button } from '@/components/ui'
import type { ButtonProps } from '@/components/ui'

function MyButton(props: ButtonProps) {
  return <Button {...props} />
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled for interactive components
- Static components work without JavaScript
