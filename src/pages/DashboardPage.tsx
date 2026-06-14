import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../layout/Sidebar';
import Topbar from '../layout/Topbar';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { isAuthed } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthed) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Topbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
