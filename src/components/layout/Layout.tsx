import React from 'react';
import { Outlet } from 'react-router-dom';
import { InactivityWarningModal } from '../bank/InactivityWarningModal';
import { ToastContainer } from '../ui/ToastContainer';
import { BottomNav } from './BottomNav';
import { DemoBanner } from './DemoBanner';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      {/* Persistent Disclaimer Banner */}
      <DemoBanner />

      {/* Main Header */}
      <Header />

      {/* Body Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Dynamic Route Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Inactivity Modal */}
      <InactivityWarningModal />

      {/* Floating Toast Alerts */}
      <ToastContainer />
    </div>
  );
};
