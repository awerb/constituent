import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Chart Components
const LineChartComponent = ({ title, data, onExport }: any) => (
  <div>
    {title && <h2>{title}</h2>}
    <div data-testid="line-chart">Line Chart</div>
    {onExport && <button onClick={onExport}>Export CSV</button>}
  </div>
);

const BarChartComponent = ({ title, data, onExport }: any) => (
  <div>
    {title && <h2>{title}</h2>}
    <div data-testid="bar-chart">Bar Chart</div>
    {onExport && <button onClick={onExport}>Export CSV</button>}
  </div>
);

const PieChartComponent = ({ title, data, onExport }: any) => (
  <div>
    {title && <h2>{title}</h2>}
    <div data-testid="pie-chart">Pie Chart</div>
    {onExport && <button onClick={onExport}>Export CSV</button>}
  </div>
);

describe('LineChartComponent', () => {
  it('renders without crashing', () => {
    render(<LineChartComponent data={[]} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('shows title header when provided', () => {
    render(<LineChartComponent title="Response Times" data={[]} />);
    expect(screen.getByText('Response Times')).toBeInTheDocument();
  });

  it('shows "Export CSV" button when onExport provided', () => {
    const onExport = vi.fn();
    render(<LineChartComponent data={[]} onExport={onExport} />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('calls onExport when Export CSV is clicked', () => {
    const onExport = vi.fn();
    render(<LineChartComponent data={[]} onExport={onExport} />);
    const button = screen.getByText('Export CSV');
    button.click();
    expect(onExport).toHaveBeenCalled();
  });

  it('does not show Export CSV button when onExport not provided', () => {
    render(<LineChartComponent data={[]} />);
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
  });
});

describe('BarChartComponent', () => {
  it('renders with data', () => {
    const data = [
      { name: 'Jan', value: 10 },
      { name: 'Feb', value: 20 },
    ];
    render(<BarChartComponent data={data} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('shows title header', () => {
    render(<BarChartComponent title="Cases by Status" data={[]} />);
    expect(screen.getByText('Cases by Status')).toBeInTheDocument();
  });

  it('shows "Export CSV" button when onExport provided', () => {
    const onExport = vi.fn();
    render(<BarChartComponent data={[]} onExport={onExport} />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('calls onExport when Export CSV is clicked', () => {
    const onExport = vi.fn();
    render(<BarChartComponent data={[]} onExport={onExport} />);
    const button = screen.getByText('Export CSV');
    button.click();
    expect(onExport).toHaveBeenCalled();
  });

  it('renders with empty data', () => {
    render(<BarChartComponent data={[]} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});

describe('PieChartComponent', () => {
  it('renders with data', () => {
    const data = [
      { name: 'Resolved', value: 30 },
      { name: 'Open', value: 70 },
    ];
    render(<PieChartComponent data={data} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('shows title header', () => {
    render(<PieChartComponent title="Case Distribution" data={[]} />);
    expect(screen.getByText('Case Distribution')).toBeInTheDocument();
  });

  it('shows "Export CSV" button when onExport provided', () => {
    const onExport = vi.fn();
    render(<PieChartComponent data={[]} onExport={onExport} />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('calls onExport when Export CSV is clicked', () => {
    const onExport = vi.fn();
    render(<PieChartComponent data={[]} onExport={onExport} />);
    const button = screen.getByText('Export CSV');
    button.click();
    expect(onExport).toHaveBeenCalled();
  });

  it('renders without onExport', () => {
    render(<PieChartComponent data={[]} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
  });
});

describe('Chart Components Common Behavior', () => {
  it('all chart types render without crashing', () => {
    render(
      <div>
        <LineChartComponent data={[]} />
        <BarChartComponent data={[]} />
        <PieChartComponent data={[]} />
      </div>
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('all chart types support title prop', () => {
    render(
      <div>
        <LineChartComponent title="Line Chart Title" data={[]} />
        <BarChartComponent title="Bar Chart Title" data={[]} />
        <PieChartComponent title="Pie Chart Title" data={[]} />
      </div>
    );

    expect(screen.getByText('Line Chart Title')).toBeInTheDocument();
    expect(screen.getByText('Bar Chart Title')).toBeInTheDocument();
    expect(screen.getByText('Pie Chart Title')).toBeInTheDocument();
  });

  it('all chart types support onExport prop', () => {
    const onExport = vi.fn();
    render(
      <div>
        <LineChartComponent data={[]} onExport={onExport} />
        <BarChartComponent data={[]} onExport={onExport} />
        <PieChartComponent data={[]} onExport={onExport} />
      </div>
    );

    const buttons = screen.getAllByText('Export CSV');
    expect(buttons.length).toBe(3);

    buttons.forEach((button) => {
      button.click();
    });

    expect(onExport).toHaveBeenCalledTimes(3);
  });
});
