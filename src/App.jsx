/**
 * Root Application Component.
 * Integrates theme management, top navigation header, and React Router routes
 * for CPU Scheduling, Deadlock, and Memory Allocation modules.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/common/Header.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { SchedulingPage } from './pages/SchedulingPage.jsx';
import { DeadlockPage } from './pages/DeadlockPage.jsx';
import { MemoryPage } from './pages/MemoryPage.jsx';
import { useTheme } from './hooks/useTheme.js';

export function App() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="app-wrapper">
      <Header isDark={isDark} onToggleTheme={toggleTheme} />
      <main className="app-container">
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <SchedulingPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/scheduling"
            element={
              <ErrorBoundary>
                <SchedulingPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/deadlock"
            element={
              <ErrorBoundary>
                <DeadlockPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/memory"
            element={
              <ErrorBoundary>
                <MemoryPage />
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
