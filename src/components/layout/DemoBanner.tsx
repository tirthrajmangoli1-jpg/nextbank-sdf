import React from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useBank } from '../../context/BankContext';

export const DemoBanner: React.FC = () => {
  const { isNetworkFailureSimulated } = useBank();

  return (
    <div
      role="banner"
      className="w-full bg-navy-900 text-white text-xs py-1.5 px-4 flex items-center justify-between border-b border-navy-800 select-none"
    >
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
        </span>
        <span className="font-medium tracking-wide">
          <strong className="font-semibold text-brand-300">DEMO ONLY:</strong> Simulated
          banking environment. No real money or banking network connection.
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-3">
        {isNetworkFailureSimulated && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
            <AlertCircle className="w-3 h-3" />
            Network Failure Simulated
          </span>
        )}
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-400" />
          INR (en-IN)
        </span>
      </div>
    </div>
  );
};
