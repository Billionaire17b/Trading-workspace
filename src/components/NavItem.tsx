import { NavLink } from 'react-router-dom';
import type { ReactNode, CSSProperties } from 'react';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  to: string;
  onClick?: () => void;
}

export default function NavItem({ icon, label, to, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => {
        const base: CSSProperties = {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          minHeight: '44px',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all var(--transition-fast)',
          color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
          background: isActive ? 'var(--surface-active)' : 'transparent',
          border: isActive ? '1px solid var(--border-secondary)' : '1px solid transparent',
          textDecoration: 'none',
        };
        return base;
      }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '2px',
                height: '20px',
                borderRadius: '1px',
                background: 'var(--accent-cyan)',
              }}
            />
          )}
          <span style={{ color: isActive ? 'var(--accent-cyan)' : 'inherit', display: 'flex' }}>
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
