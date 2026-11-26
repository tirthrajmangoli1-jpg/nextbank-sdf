import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BankProvider } from './context/BankContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AccountsPage } from './pages/AccountsPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TransferPage } from './pages/TransferPage';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Loading NextBank session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const PublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BankProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Protected Banking Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/accounts" element={<AccountsPage />} />
                    <Route path="/transfer" element={<TransferPage />} />
                    <Route path="/beneficiaries" element={<BeneficiariesPage />} />
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </BankProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
