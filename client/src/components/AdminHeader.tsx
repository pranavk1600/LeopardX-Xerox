import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, ExternalLink, Cpu, Menu, X } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Title */}
        <Link to="/admin/machines" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-2 rounded-xl text-white shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base tracking-tight leading-none text-white flex items-center gap-1">
              Leopard<span className="text-amber-400">X</span> Super Admin
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate mt-0.5">
              Machine & QR Management
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/admin/machines"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition hover:bg-amber-500/30"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Machines</span>
          </Link>

          <Link
            to="/print?machine=PUNE-COLLEGE-001"
            target="_blank"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
          >
            <span>Public Kiosk</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-xs"
            title="Logout Super Admin"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-2 shadow-xl animate-in slide-in-from-top-2">
          <Link
            to="/admin/machines"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 w-full"
          >
            <Cpu className="w-4 h-4" />
            <span>Machines</span>
          </Link>

          <Link
            to="/print?machine=PUNE-COLLEGE-001"
            target="_blank"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-900 transition w-full"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Public Kiosk</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Open Kiosk</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 border border-red-500/20 w-full transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Super Admin</span>
          </button>
        </div>
      )}
    </header>
  );
};
