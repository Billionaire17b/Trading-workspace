import { useState, Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../layout/Sidebar';
import Topbar from '../layout/Topbar';
import Spinner from '../components/Spinner';
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
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner size={32} /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
