import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export const InactivityWarningModal: React.FC = () => {
  const { isSessionWarningOpen, secondsRemaining, keepSessionAlive, logout } = useAuth();

  return (
    <Modal
      isOpen={isSessionWarningOpen}
      onClose={keepSessionAlive}
      showCloseButton={false}
      closeOnOutsideClick={false}
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Session Expiring Soon
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            For your security, banking sessions auto-terminate after 5 minutes of inactivity.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-sm">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Logging out in {secondsRemaining}s</span>
        </div>

        <div className="flex flex-col w-full gap-2 pt-2">
          <Button variant="primary" onClick={keepSessionAlive} className="w-full">
            Keep Me Logged In
          </Button>
          <Button variant="ghost" onClick={() => logout()} className="w-full text-xs">
            Log Out Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};
