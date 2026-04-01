import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCards } from '@/components/dashboard/StatsCards';

describe('StatsCards Component', () => {
  it('renders all four stat cards', () => {
    render(
      <StatsCards
        openCases={5}
        dueToday={2}
        avgResponseTime={4.5}
        newsletterFlags={12}
      />
    );

    expect(screen.getByText('Open Cases')).toBeInTheDocument();
    expect(screen.getByText('Due Today')).toBeInTheDocument();
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    expect(screen.getByText('Newsletter Flags')).toBeInTheDocument();
  });

  it('displays correct values for openCases, dueToday, avgResponseTime, newsletterFlags', () => {
    render(
      <StatsCards
        openCases={5}
        dueToday={2}
        avgResponseTime={4.5}
        newsletterFlags={12}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4.5h')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('applies red styling to dueToday when > 0', () => {
    const { container } = render(
      <StatsCards
        openCases={5}
        dueToday={3}
        avgResponseTime={4.5}
        newsletterFlags={12}
      />
    );

    // Find the Due Today card (second card)
    const cards = container.querySelectorAll('[class*="gradient-to-br"]');
    expect(cards[1]).toHaveClass('from-red-50', 'to-red-50/50');
  });

  it('shows gray styling to dueToday when = 0', () => {
    const { container } = render(
      <StatsCards
        openCases={5}
        dueToday={0}
        avgResponseTime={4.5}
        newsletterFlags={12}
      />
    );

    // Find the Due Today card (second card)
    const cards = container.querySelectorAll('[class*="gradient-to-br"]');
    expect(cards[1]).toHaveClass('from-gray-50', 'to-gray-50/50');
  });

  it('shows "0" values correctly (not empty)', () => {
    render(
      <StatsCards
        openCases={0}
        dueToday={0}
        avgResponseTime={0}
        newsletterFlags={0}
      />
    );

    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });

  it('formats avgResponseTime to 1 decimal place', () => {
    const { rerender } = render(
      <StatsCards
        openCases={5}
        dueToday={2}
        avgResponseTime={4.56789}
        newsletterFlags={12}
      />
    );

    expect(screen.getByText('4.6h')).toBeInTheDocument();

    rerender(
      <StatsCards
        openCases={5}
        dueToday={2}
        avgResponseTime={10.1234}
        newsletterFlags={12}
      />
    );

    expect(screen.getByText('10.1h')).toBeInTheDocument();
  });

  it('shows "last 7 days" subtitle on newsletter flags card', () => {
    render(
      <StatsCards
        openCases={5}
        dueToday={2}
        avgResponseTime={4.5}
        newsletterFlags={12}
      />
    );

    expect(screen.getByText('last 7 days')).toBeInTheDocument();
  });

  it('renders responsive grid layout', () => {
    const { container } = render(
      <StatsCards
        openCases={5}
        dueToday={2}
        avgResponseTime={4.5}
        newsletterFlags={12}
      />
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass(
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-4'
    );
  });
});
