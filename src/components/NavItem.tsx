import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from './NavItem.module.css';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  to: string;
  onClick?: () => void;
  end?: boolean;
}

export default function NavItem({ icon, label, to, onClick, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className={styles.activeIndicator} />}
          <span className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`}>
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
