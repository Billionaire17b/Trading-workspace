import NavItem from '../components/NavItem';
import { useAuth } from '../hooks/useAuth';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalcIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="10" y2="10" />
    <line x1="14" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="10" y2="14" />
    <line x1="14" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="10" y2="18" />
    <line x1="14" y1="18" x2="16" y2="18" />
  </svg>
);

const BrainIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.5 4.5-3 6l-1 3h-6l-1-3c-1.5-1.5-3-3.5-3-6a7 7 0 0 1 7-7z" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const CheckIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3 8-8" />
    <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
  </svg>
);

const NotesIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

const LogoutIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Sidebar({ isOpen, onClose }: SidebarProps) {


  const { logout } = useAuth();

  const sidebarClass = `${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`;
  const overlayClass = `${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`;




  return (
    <>
      <div className={overlayClass} onClick={onClose} />
      <aside className={sidebarClass}>
        <div>
          {/* Brand */}
          <div className={styles.brand}>
            <p className={styles.brandName}>TRADER</p>
            <p className={styles.brandSub}>Workspace v1.0</p>
          </div>

          {/* Tools Navigation */}
          <div className={styles.navGroup}>
            <p className={styles.sectionLabel}>Tools</p>
            <nav className={styles.navList}>
              <NavItem
                icon={CalcIcon}
                label="Calculators"
                to="/dashboard/calculators"
                onClick={onClose}
              />
              <NavItem
                icon={BrainIcon}
                label="Psychology"
                to="/dashboard/psychology"
                onClick={onClose}
              />
              <NavItem
                icon={CheckIcon}
                label="Checklist"
                to="/dashboard/checklist"
                onClick={onClose}
              />
              <NavItem
                icon={NotesIcon}
                label="Notes"
                to="/dashboard/notes"
                onClick={onClose}
              />
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <button className={styles.logoutBtn} onClick={logout}>
            {LogoutIcon}
            Logout
          </button>
          <div className={styles.versionBadge}>v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
