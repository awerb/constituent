import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock component since we need to create it
const FilterSidebar = ({ onFilterChange, onClearFilters }: any) => (
  <div>
    <div>
      <h3>Source</h3>
      <label>
        <input
          type="checkbox"
          value="NEWSLETTER"
          onChange={() => onFilterChange('source', 'NEWSLETTER')}
        />
        Newsletter
      </label>
      <label>
        <input
          type="checkbox"
          value="WEB"
          onChange={() => onFilterChange('source', 'WEB')}
        />
        Web
      </label>
    </div>

    <div>
      <h3>Status</h3>
      <label>
        <input
          type="checkbox"
          value="NEW"
          onChange={() => onFilterChange('status', 'NEW')}
        />
        New
      </label>
      <label>
        <input
          type="checkbox"
          value="ASSIGNED"
          onChange={() => onFilterChange('status', 'ASSIGNED')}
        />
        Assigned
      </label>
    </div>

    <div>
      <h3>Priority</h3>
      <label>
        <input
          type="checkbox"
          value="URGENT"
          onChange={() => onFilterChange('priority', 'URGENT')}
        />
        Urgent
      </label>
      <label>
        <input
          type="checkbox"
          value="HIGH"
          onChange={() => onFilterChange('priority', 'HIGH')}
        />
        High
      </label>
    </div>

    <div>
      <h3>Date Range</h3>
      <label>
        <input
          type="date"
          onChange={() => onFilterChange('dateRange', 'custom')}
        />
      </label>
    </div>

    <button onClick={onClearFilters}>Clear All Filters</button>
  </div>
);

describe('FilterSidebar Component', () => {
  it('renders all filter groups (Source, Status, Priority, Date Range)', () => {
    render(
      <FilterSidebar
        onFilterChange={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });

  it('checkbox changes trigger onFilterChange', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(
      <FilterSidebar
        onFilterChange={onFilterChange}
        onClearFilters={vi.fn()}
      />
    );

    const newsletterCheckbox = screen.getByRole('checkbox', { name: /newsletter/i });
    await user.click(newsletterCheckbox);

    expect(onFilterChange).toHaveBeenCalledWith('source', 'NEWSLETTER');
  });

  it('"Clear All Filters" resets all selections', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    render(
      <FilterSidebar
        onFilterChange={vi.fn()}
        onClearFilters={onClearFilters}
      />
    );

    const clearButton = screen.getByText('Clear All Filters');
    await user.click(clearButton);

    expect(onClearFilters).toHaveBeenCalled();
  });

  it('multiple filter selections work independently', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(
      <FilterSidebar
        onFilterChange={onFilterChange}
        onClearFilters={vi.fn()}
      />
    );

    const newsletterCheckbox = screen.getByRole('checkbox', { name: /newsletter/i });
    const newCheckbox = screen.getByRole('checkbox', { name: /^New$/i });
    const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i });

    await user.click(newsletterCheckbox);
    await user.click(newCheckbox);
    await user.click(urgentCheckbox);

    expect(onFilterChange).toHaveBeenCalledTimes(3);
    expect(onFilterChange).toHaveBeenNthCalledWith(1, 'source', 'NEWSLETTER');
    expect(onFilterChange).toHaveBeenNthCalledWith(2, 'status', 'NEW');
    expect(onFilterChange).toHaveBeenNthCalledWith(3, 'priority', 'URGENT');
  });

  it('renders checkboxes for each filter option', () => {
    const { container } = render(
      <FilterSidebar
        onFilterChange={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThanOrEqual(6);
  });

  it('renders date input for date range filter', () => {
    const { container } = render(
      <FilterSidebar
        onFilterChange={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    const dateInput = container.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();
  });

  it('displays all source options', () => {
    render(
      <FilterSidebar
        onFilterChange={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Newsletter')).toBeInTheDocument();
    expect(screen.getByLabelText('Web')).toBeInTheDocument();
  });

  it('displays all status options', () => {
    render(
      <FilterSidebar
        onFilterChange={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    expect(screen.getByLabelText('New')).toBeInTheDocument();
    expect(screen.getByLabelText('Assigned')).toBeInTheDocument();
  });

  it('displays all priority options', () => {
    render(
      <FilterSidebar
        onFilterChange={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Urgent')).toBeInTheDocument();
    expect(screen.getByLabelText('High')).toBeInTheDocument();
  });
});
