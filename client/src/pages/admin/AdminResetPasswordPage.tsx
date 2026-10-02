import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { resetAdminPassword } from '../../services/adminApi';

export const AdminResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing password reset token. Please request a new password reset.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields match.');
      return;
    }

    setLoading(true);

    try {
      await resetAdminPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error('[Reset Password Error]', err);
      setError(
        err.response?.data?.message ||
          'Invalid or expired reset link. Please request a new password reset.'
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
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
            Reset Password
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            Create a new password for your Super Admin account
          </p>
        </div>

        {!token ? (
          <div className="space-y-4">
            <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <span>Invalid Link</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                No reset token was provided. Please use the reset link sent to your email or request a new one.
              </p>
            </div>

            <Link
              to="/admin/forgot-password"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider box-border"
            >
              <span>Request New Reset Link</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-5">
            <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs space-y-2 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white text-sm">Password Reset Complete!</h3>
              <p className="leading-relaxed text-slate-300">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
            </div>

            <button
              onClick={() => navigate('/admin/login')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-95 box-border"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 min-w-0 w-full">
            <div className="min-w-0 w-full">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="min-w-0 w-full">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Confirm New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  <span className="truncate">UPDATE PASSWORD</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
