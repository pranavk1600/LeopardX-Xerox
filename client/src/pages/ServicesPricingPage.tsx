import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Tag, CheckCircle2, ChevronRight, Layers, FileText, Smartphone, ShieldCheck } from 'lucide-react';

export const ServicesPricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5" />
            <span>Transparent Pricing in INR (₹)</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Services & Pricing</h1>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">
            LeopardX Xerox provides automated, instant self-service document printing kiosks. Affordable, pay-per-page pricing with zero wait times.
          </p>
        </div>

        {/* Pricing Card: Black & White Only */}
        <div className="max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-slate-800 text-white p-3 rounded-2xl">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <span className="bg-slate-800 text-slate-300 text-[11px] font-semibold px-3 py-1 rounded-full">Standard A4</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Black & White Printing</h3>
              <p className="text-slate-400 text-xs mt-1">High-contrast Monochrome laser document printout for notes, assignments, reports & forms.</p>
            </div>
            <div className="flex items-baseline gap-1 pt-2">
              <span className="text-4xl font-black text-amber-400">₹2.00</span>
              <span className="text-xs text-slate-400 font-medium">/ page (A4)</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Crisp 600 DPI monochrome laser quality</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Supports custom page range selection</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Instant PDF document preview & page controls</span>
              </li>
            </ul>
          </div>
          <Link
            to="/print?machine=PUNE-COLLEGE-001"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            <span>Start Printing Now</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Paper Size & Options Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Pricing Rate Breakdown</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Print Mode</th>
                  <th className="py-3 px-4">Paper Size</th>
                  <th className="py-3 px-4">Rate Per Page</th>
                  <th className="py-3 px-4">Instant Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Single Side (Monochrome B&W)</td>
                  <td className="py-3 px-4">A4 (210 × 297 mm)</td>
                  <td className="py-3 px-4 text-amber-400 font-bold">₹2.00</td>
                  <td className="py-3 px-4 text-emerald-400 font-medium">Included free</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Back to Back (Duplex B&W)</td>
                  <td className="py-3 px-4">A4 (210 × 297 mm)</td>
                  <td className="py-3 px-4 text-amber-400 font-bold">₹4.00</td>
                  <td className="py-3 px-4 text-emerald-400 font-medium">Included free</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* How It Works Kiosk Features */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white text-center">Why Use LeopardX Xerox Self-Service Kiosks?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <Smartphone className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-white">1. Scan Kiosk QR</h4>
              <p className="text-slate-400">Scan the QR code printed on the physical kiosk machine with your mobile phone.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-white">2. Upload & Customise</h4>
              <p className="text-slate-400">Upload your PDF document, preview pages, select copies, and page range.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-white">3. Cashfree UPI & Print</h4>
              <p className="text-slate-400">Pay securely via Cashfree UPI or cards. Your document prints instantly at the kiosk.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
