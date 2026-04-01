# Case Detail and Constituent UI Components Guide

Complete TypeScript/React component library for the constituent-response project. All components are built with Next.js 14+ App Router, Tailwind CSS, and lucide-react icons.

## Case Components (`src/components/cases/`)

### 1. CaseDetail.tsx
Main case detail wrapper component with two-column layout.

**Props:**
- `caseData: CaseWithRelations` - Complete case with all relations
- `currentUserId: string` - ID of current user
- `departments: Array<{ id, name }>` - Available departments
- `users: Array<{ id, name, email, avatar }>` - Available users
- `onCaseUpdate: (updatedCase) => void` - Update handler
- `onMessageAdd: (content, isInternal) => Promise<void>` - Message handler
- `isAiEnabled: boolean` - AI feature toggle
- `isAiAvailable: boolean` - AI availability status
- `relatedCases: Array<{ id, referenceNumber, subject, status }>` - Related cases
- `templates: Array<{ id, name, content, category }>` - Response templates

**Features:**
- 65/35 left-right layout with responsive stacking
- Tabbed interface (Conversation/Internal Notes)
- Status controls sidebar
- Newsletter context card
- Related cases list
- Auto-scrolling conversation
- AI draft panel integration

### 2. ConversationThread.tsx
Chronological message thread display.

**Props:**
- `messages: CaseMessage[]` - Message array
- `constituentName: string` - Constituent display name

**Features:**
- Left-aligned constituent messages (light gray)
- Right-aligned staff messages (blue)
- Centered system messages (italic)
- Author name, timestamp per message
- Language badges for non-English content
- Attachment display with file size
- Auto-scroll to bottom
- Dark mode support

### 3. InternalNotes.tsx
Internal staff-only notes thread.

**Props:**
- `notes: CaseMessage[]` - Internal note messages

**Features:**
- "STAFF ONLY" prominent banner
- Yellow/amber background styling
- Public records exclusion badges
- Same layout as ConversationThread but visually distinct
- Dark mode support

### 4. AIDraftPanel.tsx
AI-powered response drafting interface.

**Props:**
- `onDraft: (tone) => Promise<string>` - AI draft generator
- `onUseDraft: (text) => void` - Draft selection handler
- `isAiEnabled: boolean` - Feature enabled toggle
- `isAiAvailable: boolean` - Service availability
- `onUseTemplate: () => void` - Template fallback
- `templates: Template[]` - Available templates
- `variables: Record<string,string>` - Template variables

**Features:**
- Three states: disabled, unavailable, available
- Tone selector (Formal, Friendly, Empathetic, Technical)
- Loading spinner during generation
- Editable textarea for draft review
- "Regenerate" with different tone
- Template fallback option
- Variable substitution support
- Dark mode support

### 5. ComposePanel.tsx
Message composition panel.

**Props:**
- `value: string` - Current text
- `onChange: (value) => void` - Text change handler
- `onSend: () => void` - Send handler
- `isLoading: boolean` - Loading state
- `placeholder: string` - Input placeholder
- `showInternalNoteBadge: boolean` - Internal note indicator

**Features:**
- Textarea input with min height
- Send button with loading state
- Internal note warning badge
- Dark mode support

### 6. TemplateSelector.tsx
Template selection with preview and variable substitution.

**Props:**
- `templates: Template[]` - Available templates
- `onSelect: (content) => void` - Selection handler
- `variables: Record<string,string>` - Template variables
- `onClose: () => void` - Close handler

**Features:**
- Search and category filtering
- Split layout: list and preview
- Variable highlighting and substitution
- Selected template indicator
- "Use Template" confirmation
- Dark mode support

### 7. StatusControls.tsx
Right sidebar case status and metadata controls.

**Props:**
- `caseData: CaseWithRelations` - Current case
- `departments: Department[]` - Available departments
- `users: User[]` - Available users
- `onUpdate: (field, value) => void` - Update handler

**Features:**
- Status dropdown (color-coded)
- Priority dropdown (colored by urgency)
- Department selector
- Assigned To selector with avatars
- SLA deadline display with countdown
- SLA breach indicator (red)
- Case age display
- Dark mode support

### 8. NewsletterContext.tsx
Newsletter context sidebar card.

**Props:**
- `newsletterSignal: NewsletterSignal` - Newsletter item data

**Features:**
- Title and truncated summary
- Flag and applaud counts with icons
- Expandable "View Full Data" section
- Links to external TC data
- Dark mode support

### 9. RelatedCases.tsx
Related cases sidebar list.

**Props:**
- `cases: Array<{ id, referenceNumber, subject, status }>` - Related cases

**Features:**
- Status badges with color coding
- Clickable case cards
- Reference number display
- Subject truncation
- Hover effects
- Dark mode support

### 10. ManualEntryForm.tsx
Manual case entry form.

**Props:**
- `departments: Department[]` - Available departments
- `onSubmit: (data) => Promise<void>` - Form submission handler

**Form Fields:**
- Constituent Email (required, validated)
- Constituent Name (required)
- Phone (optional)
- Subject (required)
- Description (textarea, required)
- Source (dropdown: Phone, Walk-in, Mail, Manual)
- Department (required, dropdown)
- Priority (Medium default, dropdown)

**Features:**
- Email format validation
- Field-level error display
- Required field indicators
- Submit button with loading state
- Form reset on success
- Dark mode support

### 11. BatchRespondDialog.tsx
Batch response dialog for multiple cases.

**Props:**
- `cases: CaseSummary[]` - Cases to respond to
- `onSend: (text) => Promise<void>` - Send handler
- `onClose: () => void` - Close handler
- `isOpen: boolean` - Dialog visibility

**Features:**
- Shows case count
- Scrollable case list
- Personalization note
- Response textarea
- Character count
- Confirmation button with case count
- Dark mode support

## Constituent Components (`src/components/constituents/`)

### 1. ProfileCard.tsx
Constituent profile card with edit capability.

**Props:**
- `constituent: ConstituentDetail` - Constituent data
- `caseCount: number` - Associated case count
- `onUpdate: (updated) => Promise<void>` - Update handler
- `onViewCases: () => void` - View cases handler

**Features:**
- Name, email, phone, address display
- Ward and district fields
- Language preference display
- Privacy status badge
- Inline edit mode with validation
- Save/Cancel buttons in edit mode
- "View Cases" button
- Dark mode support

### 2. InteractionTimeline.tsx
Timeline of all constituent interactions.

**Props:**
- `interactions: TimelineInteraction[]` - Interaction events

**Interaction Types:**
- case_created
- message_sent
- response_received
- case_resolved
- signal_sent
- note_added

**Features:**
- Vertical timeline with icons
- Color-coded by type
- Chronological display
- Type labels
- Case reference links
- Relative time display
- Dark mode support

### 3. PrivacyBadge.tsx
Privacy status indicator.

**Props:**
- `status: PrivacyStatus` - Privacy status (ACTIVE, EXPORT_REQUESTED, DELETION_REQUESTED, ANONYMIZED)
- `compact: boolean` - Compact mode toggle

**Statuses:**
- **ACTIVE** (green): All data retained and accessible
- **EXPORT_REQUESTED** (yellow): Data export in progress
- **DELETION_REQUESTED** (red): Scheduled for deletion
- **ANONYMIZED** (gray): Data anonymized and inaccessible

**Features:**
- Two modes: full card and compact badge
- Status-specific colors and icons
- Description text
- Dark mode support

## Styling & Dark Mode

All components include:
- Tailwind CSS styling with utility classes
- Dark mode support via `dark:` prefix
- Responsive design (mobile-first approach)
- Consistent spacing and typography
- Accessible color contrasts
- Smooth transitions and animations

## Dependencies

- Next.js 14+
- React 18+
- TailwindCSS 3+
- lucide-react (icons)
- date-fns (date formatting)
- Prisma (type definitions)

## Usage Example

```tsx
import { CaseDetail, StatusControls } from '@/components/cases';
import { ProfileCard } from '@/components/constituents';

export default function CasePage() {
  const caseData = { /* ... */ };
  const departments = [ /* ... */ ];

  return (
    <div>
      <CaseDetail
        caseData={caseData}
        currentUserId={userId}
        departments={departments}
        isAiEnabled={true}
        isAiAvailable={true}
      />
    </div>
  );
}
```

## Type Definitions

All components are fully typed with TypeScript. Key types are imported from:
- `@/types` - Application types
- `@/types/case` - Case-specific types
- `@/types/constituent` - Constituent-specific types
- `@prisma/client` - Prisma-generated types

## Implementation Notes

- All components use "use client" directive where needed for interactivity
- Props data is received as props (no internal API calls)
- Event handlers are async-ready for backend calls
- Form validation is performed client-side
- Error states are displayable via component state
- Loading states are handled by parent components
