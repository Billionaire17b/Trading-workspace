import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from './NavItem.module.css';

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
