import { useState, type ReactNode, type CSSProperties } from 'react';

interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  style?: CSSProperties;
}

export default function IconButton({ children, onClick, title, style }: IconButtonProps) {
  const [hovered, setHovered] = useState(false);

  const baseStyle: CSSProperties = {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    background: hovered ? 'var(--surface-hover)' : 'transparent',
    border: `1px solid ${hovered ? 'var(--border-secondary)' : 'transparent'}`,
    color: hovered ? 'var(--accent-cyan)' : 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    ...style,
  };

  return (
    <button
      onClick={onClick}
      title={title}
      style={baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}
