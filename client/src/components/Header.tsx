import React from 'react';
import { Printer, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { KioskMachine } from '../types';

interface HeaderProps {
  machine: KioskMachine | null;
}

export const Header: React.FC<HeaderProps> = ({ machine }) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-brand-600 to-amber-500 p-2 rounded-xl text-white shadow-sm">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none text-white flex items-center gap-1">
              Leopard<span className="text-amber-400">X</span> Xerox
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Self-Service Print Kiosk</p>
          </div>
        </div>

        {machine && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs font-semibold">
              {machine.status === 'ONLINE' ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> ONLINE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
                  <AlertCircle className="w-3 h-3" /> OFFLINE
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 truncate max-w-[120px]">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{machine.name}</span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
