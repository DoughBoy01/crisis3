import { useState, useEffect } from 'react';
import { getUser, logout } from '@/lib/api';
import Dashboard from './components/Dashboard';
import DiagnosticsPage from './components/DiagnosticsPage';
import HomePage from './components/HomePage';
import AdminLogin from './components/AdminLogin';

type View = 'home' | 'dashboard' | 'diagnostics' | 'admin-login';

function App() {
  const [view, setView] = useState<View>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    getUser()
      .then((data) => {
        if (data && data.user) {
          setIsAdmin(data.user.role === 'admin');
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setSessionChecked(true));
  }, []);

  if (!sessionChecked) return null;

  if (view === 'admin-login') {
    return (
      <AdminLogin
        onAuthenticated={() => {
          setIsAdmin(true);
          setView('dashboard');
        }}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'diagnostics') {
    if (!isAdmin) {
      return (
        <AdminLogin
          onAuthenticated={() => {
            setIsAdmin(true);
            setView('diagnostics');
          }}
          onBack={() => setView('dashboard')}
        />
      );
    }
    return <DiagnosticsPage onBack={() => setView('dashboard')} onHome={() => setView('home')} />;
  }

  if (view === 'dashboard') {
    return (
      <Dashboard
        onOpenDiagnostics={isAdmin ? () => setView('diagnostics') : undefined}
        onAdminLogin={!isAdmin ? () => setView('admin-login') : undefined}
        onAdminSignOut={isAdmin ? async () => {
          await logout();
          setIsAdmin(false);
        } : undefined}
        isAdmin={isAdmin}
      />
    );
  }

  return <HomePage onEnter={() => setView('dashboard')} />;
}

export default App;
