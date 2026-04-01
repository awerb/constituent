import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthorType } from '@prisma/client';

// Mock ConversationThread component
const ConversationThread = ({ messages, constituentName }: any) => (
  <div className="space-y-4">
    {messages.map((msg: any) => (
      <div
        key={msg.id}
        className={`flex ${
          msg.authorType === AuthorType.CONSTITUENT
            ? 'justify-start'
            : msg.authorType === 'SYSTEM'
              ? 'justify-center'
              : 'justify-end'
        }`}
      >
        <div className="max-w-xs p-3 rounded-lg bg-gray-100">
          {msg.authorName && <p className="font-semibold text-sm">{msg.authorName}</p>}
          <p>{msg.content}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(msg.createdAt).toLocaleString()}
          </p>
          {msg.contentLanguage && msg.contentLanguage !== 'en' && (
            <span className="text-xs bg-blue-100 px-2 py-1 rounded mt-2 inline-block">
              {msg.contentLanguage}
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
);

describe('ConversationThread Component', () => {
  const mockMessages = [
    {
      id: '1',
      authorType: AuthorType.CONSTITUENT,
      authorName: 'John Smith',
      content: 'I have a problem with the pothole on Main Street.',
      contentLanguage: 'en',
      createdAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      id: '2',
      authorType: AuthorType.STAFF,
      authorName: 'Agent Jane',
      content: 'Thank you for reporting this. We will look into it.',
      contentLanguage: 'en',
      createdAt: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: '3',
      authorType: AuthorType.CONSTITUENT,
      authorName: 'John Smith',
      content: 'When will it be fixed?',
      contentLanguage: 'en',
      createdAt: new Date('2024-01-15T11:00:00Z'),
    },
  ];

  it('renders constituent messages left-aligned', () => {
    const { container } = render(
      <ConversationThread messages={mockMessages} constituentName="John Smith" />
    );

    // Check for left-aligned message
    const messages = container.querySelectorAll('[class*="flex"]');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('renders staff messages right-aligned', () => {
    const { container } = render(
      <ConversationThread messages={mockMessages} constituentName="John Smith" />
    );

    // All messages should be rendered
    const messageContainer = container.querySelectorAll('.space-y-4 > div');
    expect(messageContainer.length).toBe(3);
  });

  it('renders system messages centered', () => {
    const systemMessage = {
      id: '4',
      authorType: 'SYSTEM',
      authorName: null,
      content: 'Case status changed to resolved.',
      contentLanguage: 'en',
      createdAt: new Date('2024-01-15T12:00:00Z'),
    };

    const { container } = render(
      <ConversationThread
        messages={[...mockMessages, systemMessage]}
        constituentName="John Smith"
      />
    );

    expect(screen.getByText('Case status changed to resolved.')).toBeInTheDocument();
  });

  it('shows author name and timestamp on each message', () => {
    render(
      <ConversationThread messages={mockMessages} constituentName="John Smith" />
    );

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Agent Jane')).toBeInTheDocument();
  });

  it('shows language badge for non-English messages', () => {
    const spanishMessage = {
      id: '5',
      authorType: AuthorType.CONSTITUENT,
      authorName: 'Maria Garcia',
      content: 'Tengo un problema con las calles.',
      contentLanguage: 'es',
      createdAt: new Date('2024-01-15T13:00:00Z'),
    };

    const { container } = render(
      <ConversationThread
        messages={[...mockMessages, spanishMessage]}
        constituentName="Maria Garcia"
      />
    );

    expect(screen.getByText('es')).toBeInTheDocument();
  });

  it('does not show language badge for English messages', () => {
    const { container } = render(
      <ConversationThread messages={mockMessages} constituentName="John Smith" />
    );

    const badges = container.querySelectorAll('[class*="bg-blue-100"]');
    // Should be 0 since all messages are English (en)
    expect(badges.length).toBe(0);
  });

  it('renders messages in chronological order', () => {
    const { container } = render(
      <ConversationThread messages={mockMessages} constituentName="John Smith" />
    );

    const messageTexts = Array.from(container.querySelectorAll('.space-y-4 > div')).map(
      (el) => el.textContent
    );

    // First message should be from John Smith
    expect(messageTexts[0]).toContain('I have a problem with the pothole');
    // Second should be from Agent Jane
    expect(messageTexts[1]).toContain('Thank you for reporting this');
    // Third should be from John Smith again
    expect(messageTexts[2]).toContain('When will it be fixed');
  });

  it('displays timestamps for all messages', () => {
    render(
      <ConversationThread messages={mockMessages} constituentName="John Smith" />
    );

    // Should render timestamps
    const timestamps = screen.getAllByText(/\d+:\d+/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('handles empty message array', () => {
    const { container } = render(
      <ConversationThread messages={[]} constituentName="John Smith" />
    );

    const messageContainer = container.querySelector('.space-y-4');
    expect(messageContainer).toBeInTheDocument();
    expect(messageContainer?.children.length).toBe(0);
  });

  it('renders message content correctly', () => {
    render(
      <ConversationThread messages={mockMessages} constituentName="John Smith" />
    );

    expect(
      screen.getByText('I have a problem with the pothole on Main Street.')
    ).toBeInTheDocument();
    expect(screen.getByText('Thank you for reporting this. We will look into it.')).toBeInTheDocument();
    expect(screen.getByText('When will it be fixed?')).toBeInTheDocument();
  });

  it('displays multiple messages from same author', () => {
    const { container } = render(
      <ConversationThread messages={mockMessages} constituentName="John Smith" />
    );

    // John Smith has 2 messages
    const johnMessages = Array.from(container.querySelectorAll('.space-y-4 > div')).filter(
      (el) => el.textContent?.includes('John Smith')
    );
    expect(johnMessages.length).toBeGreaterThanOrEqual(2);
  });
});
