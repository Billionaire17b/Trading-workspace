import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ClickSpark from './components/ClickSpark';
import AccessPage from './pages/AccessPage';
import DashboardPage from './pages/DashboardPage';
import { lazy } from 'react';

const CalculatorsView = lazy(() => import('./features/calculators/CalculatorsView'));
const PayoutView = lazy(() => import('./features/payout/PayoutView'));
const PsychologyView = lazy(() => import('./features/psychology/PsychologyView'));
const ChecklistView = lazy(() => import('./features/checklist/ChecklistView'));
const NotesView = lazy(() => import('./features/notes/NotesView'));
const TweetSnapView = lazy(() => import('./features/tweetsnap/TweetSnapView'));

export default function App() {
  return (
    <BrowserRouter>
      <ClickSpark
        sparkColor="#22d3ee"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <Routes>
          <Route path="/" element={<AccessPage />} />
          <Route path="/dashboard" element={<DashboardPage />}>
            <Route index element={<Navigate to="calculators" replace />} />
            <Route path="calculators" element={<CalculatorsView />} />
            <Route path="payout" element={<PayoutView />} />
            <Route path="psychology" element={<PsychologyView />} />
            <Route path="checklist" element={<ChecklistView />} />
            <Route path="notes" element={<NotesView />} />
            <Route path="tweetsnap" element={<TweetSnapView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClickSpark>
    </BrowserRouter>
  );
}
