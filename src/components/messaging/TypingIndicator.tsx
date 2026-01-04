interface TypingUser {
  name: string;
  oderId?: string;
  donorProfileId?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    }
    return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`;
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-1">
      <span>{getTypingText()}</span>
      <span className="flex gap-0.5">
        <span className="animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}>.</span>
      </span>
    </div>
  );
};
