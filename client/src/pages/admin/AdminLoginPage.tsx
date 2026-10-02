import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { adminLogin } from '../../services/adminApi';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminLogin(email, password);
      navigate('/admin/machines');
    } catch (err: any) {
      console.error('[Admin Login Error]', err);
      setError(
        err.response?.data?.message ||
          'Invalid Super Admin credentials. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-6 sm:py-12 font-sans w-full max-w-full box-border overflow-x-hidden">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl box-border min-w-0">
        <div className="text-center space-y-2 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg flex-shrink-0">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
            Super Admin Portal
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            LeopardX Xerox Kiosk & Machine Management
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 min-w-0 w-full">
          <div className="min-w-0 w-full">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. kondhalkarp1600@gmail.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
            />
          </div>

          <div className="min-w-0 w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Password</span>
              </label>
              <Link
                to="/admin/forgot-password"
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 hover:underline transition"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 min-w-0 w-full">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="break-words min-w-0">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 min-w-0 active:scale-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="truncate">LOGIN TO SUPER ADMIN</span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
