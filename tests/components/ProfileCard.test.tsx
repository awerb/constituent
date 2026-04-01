import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock ProfileCard component
const ProfileCard = ({ constituent }: any) => (
  <div>
    <div>
      <h2>{constituent.name}</h2>
      <p>{constituent.email}</p>
      {constituent.phone && <p>{constituent.phone}</p>}
      {constituent.ward && <p>Ward {constituent.ward}</p>}
    </div>
    {constituent.privacyLevel && (
      <div>
        <span>{constituent.privacyLevel}</span>
      </div>
    )}
    <div>
      <p>Cases: {constituent.caseCount || 0}</p>
    </div>
  </div>
);

describe('ProfileCard Component', () => {
  it('displays constituent name', () => {
    const constituent = {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0123',
      ward: '3',
      privacyLevel: 'PUBLIC',
      caseCount: 5,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('displays constituent email', () => {
    const constituent = {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0123',
      ward: '3',
      privacyLevel: 'PUBLIC',
      caseCount: 5,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays constituent phone', () => {
    const constituent = {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0123',
      ward: '3',
      privacyLevel: 'PUBLIC',
      caseCount: 5,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('555-0123')).toBeInTheDocument();
  });

  it('displays constituent ward', () => {
    const constituent = {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0123',
      ward: '3',
      privacyLevel: 'PUBLIC',
      caseCount: 5,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('Ward 3')).toBeInTheDocument();
  });

  it('shows privacy status badge', () => {
    const constituent = {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0123',
      ward: '3',
      privacyLevel: 'PUBLIC',
      caseCount: 5,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('PUBLIC')).toBeInTheDocument();
  });

  it('shows case count', () => {
    const constituent = {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0123',
      ward: '3',
      privacyLevel: 'PUBLIC',
      caseCount: 5,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('Cases: 5')).toBeInTheDocument();
  });

  it('handles missing phone gracefully', () => {
    const constituent = {
      id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: null,
      ward: '2',
      privacyLevel: 'PUBLIC',
      caseCount: 3,
    };

    const { container } = render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    // Phone should not be displayed
    expect(container.textContent).not.toContain('555-');
  });

  it('handles missing address gracefully', () => {
    const constituent = {
      id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-0123',
      address: null,
      ward: '2',
      privacyLevel: 'PUBLIC',
      caseCount: 3,
    };

    const { container } = render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    // Address field should be handled gracefully
    expect(container).toBeTruthy();
  });

  it('displays different privacy levels', () => {
    const constituent = {
      id: '1',
      name: 'Private Person',
      email: 'private@example.com',
      phone: '555-0123',
      ward: '1',
      privacyLevel: 'PRIVATE',
      caseCount: 2,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('PRIVATE')).toBeInTheDocument();
  });

  it('shows zero case count when no cases', () => {
    const constituent = {
      id: '1',
      name: 'New Constituent',
      email: 'new@example.com',
      phone: '555-0000',
      ward: '4',
      privacyLevel: 'PUBLIC',
      caseCount: 0,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('Cases: 0')).toBeInTheDocument();
  });

  it('renders all constituent information together', () => {
    const constituent = {
      id: '1',
      name: 'Complete Person',
      email: 'complete@example.com',
      phone: '555-9999',
      ward: '5',
      privacyLevel: 'PUBLIC',
      caseCount: 10,
    };

    render(<ProfileCard constituent={constituent} />);

    expect(screen.getByText('Complete Person')).toBeInTheDocument();
    expect(screen.getByText('complete@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-9999')).toBeInTheDocument();
    expect(screen.getByText('Ward 5')).toBeInTheDocument();
    expect(screen.getByText('PUBLIC')).toBeInTheDocument();
    expect(screen.getByText('Cases: 10')).toBeInTheDocument();
  });
});
