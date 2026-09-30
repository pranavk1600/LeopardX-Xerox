import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Printer, Shield, LogOut, ExternalLink, Cpu } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/admin/machines" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-2 rounded-xl text-white shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none text-white flex items-center gap-1.5">
              Leopard<span className="text-amber-400">X</span> Super Admin
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Machine & QR Management</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
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
            className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
          >
            <span>Public Kiosk</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            title="Logout Super Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
