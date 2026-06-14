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
    boxShadow: '0 0 0 2px var(--border-secondary)',
    flexShrink: 0,
  };

  return <div style={style}>{initials}</div>;
}
