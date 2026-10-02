import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestForgotPassword } from '../../services/adminApi';

export const AdminForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await requestForgotPassword(email);
      setSubmitted(true);
      setMessage(
        res.message ||
          'If an account exists with this email address, a password reset link has been sent. Please check your inbox.'
      );
    } catch (err: any) {
      console.error('[Forgot Password Error]', err);
      setError(
        err.response?.data?.message ||
          'Failed to send password reset request. Please try again later.'
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
            <KeyRound className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
            Forgot Password?
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            Enter your Super Admin email address to receive a secure password reset link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-5">
            <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span>Reset Link Sent</span>
              </div>
              <p className="leading-relaxed text-slate-300">{message}</p>
            </div>

            <Link
              to="/admin/login"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider box-border"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 min-w-0 w-full">
            <div className="min-w-0 w-full">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Super Admin Email</span>
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
                  <span className="truncate">SEND RESET LINK</span>
                  <Send className="w-4 h-4 flex-shrink-0" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
