import type { CSSProperties } from 'react';

interface AvatarProps {
  name: string;
  size?: number;
}

export default function Avatar({ name, size = 32 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: size * 0.4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 2px var(--border-secondary), 0 0 12px rgba(34, 211, 238, 0.15)',
    flexShrink: 0,
    transition: 'box-shadow 0.3s ease, transform 0.2s ease',
    cursor: 'pointer',
  };

  return <div style={style}>{initials}</div>;
}
