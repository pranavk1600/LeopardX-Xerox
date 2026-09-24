import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Printer, MapPin, CheckCircle2, AlertCircle, Menu, X, FileText, PhoneCall, ShieldAlert, Tag } from 'lucide-react';
import { KioskMachine } from '../types';

interface HeaderProps {
  machine?: KioskMachine | null;
}

export const Header: React.FC<HeaderProps> = ({ machine }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/print?machine=PUNE-COLLEGE-001', label: 'Print Kiosk', icon: Printer },
    { path: '/services', label: 'Services & Pricing', icon: Tag },
    { path: '/contact', label: 'Contact Us', icon: PhoneCall },
    { path: '/terms', label: 'Terms', icon: FileText },
    { path: '/refunds', label: 'Refunds', icon: ShieldAlert },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/print?machine=PUNE-COLLEGE-001" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-2 rounded-xl text-white shadow-sm group-hover:scale-105 transition-transform">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none text-white flex items-center gap-1">
              Leopard<span className="text-amber-400">X</span> Xerox
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Self-Service Kiosk</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path.split('?')[0];
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Machine Status & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {machine && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-xs font-semibold">
                {machine.status === 'ONLINE' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> ONLINE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30 text-[11px]">
                    <AlertCircle className="w-3 h-3" /> OFFLINE
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5 truncate max-w-[110px]">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{machine.name}</span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path.split('?')[0];
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-amber-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
