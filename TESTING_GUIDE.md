# Testing Guide - Constituent Response

Complete test suite for the Constituent Response project using Vitest + React Testing Library.

## Test Files Created

### Global Setup
- **tests/setup.ts** - Global test configuration with mocks for Next.js, IntersectionObserver, window APIs

### Helper Files
- **tests/helpers/factories.ts** - Test data factories for creating realistic mock objects
- **tests/helpers/mocks.ts** - Mock creators for Prisma, Redis, and tRPC contexts

### Component Tests (tests/components/)

#### 1. StatsCards.test.tsx
Tests the dashboard statistics cards component.

**Coverage:**
- Renders all four stat cards (Open Cases, Due Today, Avg Response Time, Newsletter Flags)
- Displays correct numerical values
- Applies red styling to "Due Today" when value > 0
- Formats avgResponseTime to 1 decimal place (e.g., 4.5h)
- Shows "last 7 days" subtitle on newsletter flags card
- Renders responsive grid layout (grid-cols-1, md:grid-cols-2, lg:grid-cols-4)
- Shows "0" values correctly (not empty)

**Run:**
```bash
npm test tests/components/StatsCards.test.tsx
```

#### 2. MessageList.test.tsx
Tests the inbox message list component with case data.

**Coverage:**
- Renders table with correct columns (Ref#, Source, Constituent, Subject, Priority, Status, SLA, Assigned, Last Message, Updated)
- Shows source icons (Flag for newsletter, Globe for web, etc.)
- Shows checkbox for each row and "Select All" functionality
- Displays priority badges with correct colors (URGENT=red, HIGH=orange, NORMAL=default, LOW=secondary)
- Displays status badges with correct colors
- Shows "Breached" indicator for SLA breached cases
- Truncates long subjects and message previews
- Shows "Unassigned" when no agent assigned
- Clicking row calls navigation handler
- Shows empty state when no cases

**Run:**
```bash
npm test tests/components/MessageList.test.tsx
```

#### 3. SetupWizard.test.tsx
Tests the 7-step admin setup wizard.

**Coverage:**
- Renders step 1 (admin account) by default
- Shows step indicator with 7 steps
- Validates required fields before advancing
- Validates password match on step 1
- Validates password minimum length (8 characters)
- "Next" advances to next step
- "Back" returns to previous step
- Step 4 shows pre-populated department list (Public Works, Police, Fire, Planning & Development, etc.)
- Step 4 allows adding new department
- Step 4 allows removing department
- Final step shows "Launch" button
- Displays all step labels below indicator

**Run:**
```bash
npm test tests/components/SetupWizard.test.tsx
```

#### 4. DistrictSummary.test.tsx
Tests the elected officials district summary component.

**Coverage:**
- Renders 4 stat cards (Flagged Issues, Applauded Actions, Open Cases, Avg Response Time)
- Shows trend arrows (up/down/flat)
- Displays correct values for flags, applauds, cases, response time
- Applies correct trend colors (green for positive, red for negative)
- Renders responsive grid layout
- Shows trend labels with percentage changes

**Run:**
```bash
npm test tests/components/DistrictSummary.test.tsx
```

#### 5. ConversationThread.test.tsx
Tests the message conversation component.

**Coverage:**
- Renders constituent messages left-aligned
- Renders staff messages right-aligned
- Renders system messages centered
- Shows author name and timestamp on each message
- Shows language badge for non-English messages
- Does not show language badge for English messages
- Renders messages in chronological order
- Handles empty message array
- Displays message content correctly

**Run:**
```bash
npm test tests/components/ConversationThread.test.tsx
```

#### 6. FilterSidebar.test.tsx
Tests the case filter sidebar component.

**Coverage:**
- Renders all filter groups (Source, Status, Priority, Date Range)
- Checkbox changes trigger onFilterChange callback
- "Clear All Filters" resets all selections
- Multiple filter selections work independently
- Renders checkboxes for each filter option
- Renders date input for date range filter
- Displays all source/status/priority options

**Run:**
```bash
npm test tests/components/FilterSidebar.test.tsx
```

#### 7. ProfileCard.test.tsx
Tests the constituent profile card component.

**Coverage:**
- Displays constituent name, email, phone, ward
- Shows privacy status badge (PUBLIC, PRIVATE, etc.)
- Shows case count
- Handles missing phone gracefully (no phone field shown)
- Handles missing address gracefully
- Displays different privacy levels correctly
- Shows zero case count when no cases
- Renders all information together

**Run:**
```bash
npm test tests/components/ProfileCard.test.tsx
```

#### 8. Charts.test.tsx
Tests chart components (Line, Bar, Pie).

**Coverage:**
- LineChartComponent renders without crashing
- BarChartComponent renders with data
- PieChartComponent renders with data
- All chart types show title header
- All chart types show "Export CSV" button when onExport provided
- Export button calls onExport when clicked
- Charts render with empty data

**Run:**
```bash
npm test tests/components/Charts.test.tsx
```

### Integration Tests (tests/integration/)

#### 1. signal-to-case.test.ts
End-to-end test for the full signal processing flow.

**Coverage:**
- POST to /api/v1/signals with FLAG creates: constituent + newsletter item + signal + case
- Second FLAG from different constituent adds message to existing case
- APPLAUD records signal without creating case
- Idempotent: same FLAG twice returns same signal
- Case is routed to correct department by topic tags
- SLA deadline is set on new case (7 days default)
- Creates audit log for signal processing

**Run:**
```bash
npm test tests/integration/signal-to-case.test.ts
```

#### 2. case-lifecycle.test.ts
End-to-end test for case lifecycle management.

**Coverage:**
- Create case -> assign -> respond -> resolve -> close workflow
- Each status transition creates audit log
- firstRespondedAt set on first response
- resolvedAt set on resolution
- SLA breach detected when deadline passed
- Case merge moves messages and closes source
- Case priority can be escalated
- Assigned user receives notification
- Case history tracks all changes

**Run:**
```bash
npm test tests/integration/case-lifecycle.test.ts
```

#### 3. privacy-flow.test.ts
End-to-end test for privacy request handling.

**Coverage:**
- Constituent requests data export -> receives JSON with all their data
- Constituent requests deletion -> PII replaced with [REDACTED]
- After deletion, case structure preserved but PII gone
- After deletion, constituent can no longer be found by email
- Audit log created for data export request
- Audit log created for data deletion request
- Messages from deleted constituent are redacted but case remains
- Redacted constituent cannot log in
- Export file is encrypted and contains timestamp

**Run:**
```bash
npm test tests/integration/privacy-flow.test.ts
```

#### 4. multi-tenant-isolation.test.ts
End-to-end test for tenant isolation and security.

**Coverage:**
- City A cannot see City B's cases
- City A cannot see City B's constituents
- City A's user cannot access City B's data via tRPC
- SUPER_ADMIN can access both cities
- Department isolation within city
- User from city B cannot impersonate user from city A
- API key isolation between cities
- Audit logs show city context
- Data backups are isolated by city
- Cross-city search is prevented

**Run:**
```bash
npm test tests/integration/multi-tenant-isolation.test.ts
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test tests/components/StatsCards.test.tsx
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Only Component Tests
```bash
npm test tests/components/
```

### Run Only Integration Tests
```bash
npm test tests/integration/
```

## Test Data Factories

Located in `tests/helpers/factories.ts`, these create realistic test objects:

```typescript
// Import and use factories
import {
  createTestCity,
  createTestUser,
  createTestConstituent,
  createTestCase,
  createTestDepartment,
  // ... more
} from '../helpers/factories';

// Create with defaults
const user = createTestUser();

// Create with overrides
const admin = createTestUser({
  role: Role.SUPER_ADMIN,
  email: 'admin@example.com'
});
```

## Mock Helpers

Located in `tests/helpers/mocks.ts`:

```typescript
import {
  createMockPrisma,
  createMockRedis,
  createMockContext,
  createMockTRPCClient
} from '../helpers/mocks';

const mockContext = createMockContext({
  user: { role: Role.ADMIN },
  cityId: 'test-city'
});
```

## Component Test Patterns

### Testing React Components
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('renders content', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<button onClick={handleClick}>Click</button>);

    await user.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing with Async Operations
```typescript
it('loads data', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});
```

## Integration Test Patterns

### Testing Service Chains
```typescript
describe('Service Integration', () => {
  it('processes signal to case', async () => {
    // Setup mocks
    mockContext.prisma.constituent.findUnique.mockResolvedValueOnce(null);
    mockContext.prisma.constituent.create.mockResolvedValueOnce(newConstituent);
    mockContext.prisma.case.create.mockResolvedValueOnce(newCase);

    // Execute service chain
    // Assert
    expect(mockContext.prisma.constituent.create).toHaveBeenCalled();
    expect(mockContext.prisma.case.create).toHaveBeenCalled();
  });
});
```

## Coverage Goals

- **Component Tests**: Aim for 80%+ coverage
- **Integration Tests**: Cover critical user flows
- **Utils/Helpers**: Aim for 90%+ coverage

## Debugging Tests

### Run Single Test
```bash
npm test -- --reporter=verbose tests/components/StatsCards.test.tsx
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/vitest run tests/components/StatsCards.test.tsx
```

### Check Mock Calls
```typescript
expect(mockContext.prisma.case.create).toHaveBeenCalledWith(
  expect.objectContaining({ status: 'NEW' })
);
```

## Configuration

**vitest.config.ts** already configured with:
- JSDOM environment for DOM testing
- Global test setup in tests/setup.ts
- Path alias support (@/...)
- Coverage reporting (v8)

**tsconfig.json** already configured for:
- ES2020 target
- React JSX support
- Path aliases

## Best Practices

1. **Use Factories Over Manual Objects** - Ensures consistency
2. **Mock External Dependencies** - Redis, Prisma, external APIs
3. **Test User Interactions** - Use userEvent, not fireEvent
4. **Avoid Implementation Details** - Test behavior, not internals
5. **Group Related Tests** - Use describe() blocks
6. **Name Tests Clearly** - Describe what is being tested
7. **Keep Tests Independent** - Don't rely on test execution order
8. **Use beforeEach for Setup** - Keep tests DRY

## Troubleshooting

### Module Not Found
Check that path aliases in tsconfig.json match vitest.config.ts

### Next.js Components Not Rendering
Ensure next/navigation is mocked in tests/setup.ts

### Async Tests Hanging
Use waitFor() with a timeout for async operations

### Mock Not Being Called
Verify the mock was properly resolved/returned before assertion

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
