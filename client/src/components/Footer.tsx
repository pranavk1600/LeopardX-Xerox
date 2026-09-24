import React from 'react';
import { Link } from 'react-router-dom';
import { Printer, ShieldCheck, Mail, FileText, RefreshCw, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-8 px-4 mt-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Brand Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-1.5 rounded-lg text-white">
                <Printer className="w-4 h-4" />
              </div>
              <span>Leopard<span className="text-amber-400">X</span> Xerox</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              LeopardX Technologies — Automated self-service cloud Xerox & document printing kiosks for colleges, institutes, and public hubs.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cashfree Verified Payments</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/print?machine=PUNE-COLLEGE-001" className="hover:text-amber-400 transition flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Kiosk</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-amber-400 transition flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Services & Pricing</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Us</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Policies */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">Policies & Legal</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/terms" className="hover:text-amber-400 transition flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terms & Conditions</span>
                </Link>
              </li>
              <li>
                <Link to="/refunds" className="hover:text-amber-400 transition flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Refunds & Cancellations</span>
                </Link>
              </li>
              <li>
                <a href="mailto:support@leopardx.in" className="hover:text-amber-400 transition flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Support: support@leopardx.in</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} LeopardX Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-300 transition">Terms</Link>
            <span>•</span>
            <Link to="/refunds" className="hover:text-slate-300 transition">Privacy & Refunds</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-slate-300 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
