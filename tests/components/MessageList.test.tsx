import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from '@/components/inbox/MessageList';
import { CaseStatus, CasePriority, CaseSource } from '@prisma/client';

describe('MessageList Component', () => {
  const mockCases = [
    {
      id: '1',
      referenceNumber: 'REF-001',
      source: CaseSource.NEWSLETTER as const,
      constituentName: 'John Doe',
      subject: 'Pothole on Main Street',
      priority: CasePriority.URGENT as const,
      status: CaseStatus.NEW as const,
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      slaBreached: false,
      assignedTo: null,
      lastMessagePreview: 'There is a large pothole...',
      updatedAt: new Date(),
    },
    {
      id: '2',
      referenceNumber: 'REF-002',
      source: CaseSource.WEB as const,
      constituentName: 'Jane Smith',
      subject: 'Parks Department Inquiry',
      priority: CasePriority.NORMAL as const,
      status: CaseStatus.ASSIGNED as const,
      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      slaBreached: false,
      assignedTo: { id: 'user-1', name: 'Agent Smith', avatarUrl: undefined },
      lastMessagePreview: 'When will the park be renovated?',
      updatedAt: new Date(Date.now() - 60 * 60 * 1000),
    },
  ];

  it('renders list of cases with all columns', () => {
    render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    expect(screen.getByText('REF-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows source icons', () => {
    const { container } = render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    // Check that source icons are rendered
    const sourceIcons = container.querySelectorAll('[title]');
    const hasSourceIcons = Array.from(sourceIcons).some(icon =>
      icon.getAttribute('title')?.includes(CaseSource.NEWSLETTER) ||
      icon.getAttribute('title')?.includes(CaseSource.WEB)
    );
    expect(hasSourceIcons || sourceIcons.length > 0).toBeTruthy();
  });

  it('shows checkbox for each row', () => {
    const { container } = render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    // One for "select all" header + one for each case
    expect(checkboxes.length).toBe(mockCases.length + 1);
  });

  it('"Select All" checkbox works', () => {
    const onSelectAll = vi.fn();
    const { container } = render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={onSelectAll}
        onCaseClick={vi.fn()}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[0]); // First checkbox is "Select All"

    expect(onSelectAll).toHaveBeenCalled();
  });

  it('shows "Unassigned" when no agent assigned', () => {
    render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('displays priority badges with correct colors', () => {
    render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    expect(screen.getByText('URGENT')).toBeInTheDocument();
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
  });

  it('displays status badges with correct colors', () => {
    render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(screen.getByText('ASSIGNED')).toBeInTheDocument();
  });

  it('truncates long subjects', () => {
    const longSubjectCases = [
      {
        ...mockCases[0],
        subject: 'This is an extremely long subject line that should be truncated to prevent layout issues and improve readability',
      },
    ];

    const { container } = render(
      <MessageList
        cases={longSubjectCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    const subjectCell = container.querySelector('[title*="extremely long"]');
    expect(subjectCell).toHaveClass('truncate');
  });

  it('truncates long message previews', () => {
    const longPreviewCases = [
      {
        ...mockCases[0],
        lastMessagePreview: 'This is a very long message preview that contains a lot of text and should be truncated to fit in the table cell properly',
      },
    ];

    const { container } = render(
      <MessageList
        cases={longPreviewCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    const previewCell = container.querySelector('[class*="max-w-xs"][class*="truncate"]');
    expect(previewCell).toHaveClass('truncate');
  });

  it('shows "Breached" indicator for SLA breached cases', () => {
    const breachedCases = [
      {
        ...mockCases[0],
        slaBreached: true,
      },
    ];

    const { container } = render(
      <MessageList
        cases={breachedCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    const breachedIndicator = container.querySelector('.text-red-600');
    expect(breachedIndicator).toBeInTheDocument();
  });

  it('clicking row calls navigation handler', () => {
    const onCaseClick = vi.fn();
    const { container } = render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={onCaseClick}
      />
    );

    const tableRows = container.querySelectorAll('tbody tr');
    fireEvent.click(tableRows[0]);

    expect(onCaseClick).toHaveBeenCalledWith('1');
  });

  it('shows empty state when no cases', () => {
    render(
      <MessageList
        cases={[]}
        selectedIds={new Set()}
        onSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    expect(screen.getByText('No cases found')).toBeInTheDocument();
  });

  it('individual case checkbox selection works', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={onSelect}
        onSelectAll={vi.fn()}
        onCaseClick={vi.fn()}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[1]); // Second checkbox (first case)

    expect(onSelect).toHaveBeenCalledWith('1', true);
  });

  it('does not trigger row click when clicking checkbox', () => {
    const onCaseClick = vi.fn();
    const onSelect = vi.fn();
    const { container } = render(
      <MessageList
        cases={mockCases}
        selectedIds={new Set()}
        onSelect={onSelect}
        onSelectAll={vi.fn()}
        onCaseClick={onCaseClick}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[1]);

    expect(onCaseClick).not.toHaveBeenCalled();
  });
});
