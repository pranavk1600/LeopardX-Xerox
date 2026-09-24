import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { RefreshCw, CheckCircle2, XCircle, Clock, ShieldCheck, Mail, FileCheck } from 'lucide-react';

export const RefundsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Customer Protection Guarantee</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Refunds & Cancellations Policy</h1>
          <p className="text-slate-400 text-xs">LeopardX Technologies • Transparent Refund Policy</p>
        </div>

        {/* Overview Box */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 rounded-3xl p-6 text-xs text-slate-300 space-y-2">
          <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Fair Refund Promise</span>
          </h3>
          <p>
            At <strong>LeopardX Technologies</strong>, we maintain automated status tracking for every print job dispatched to our Xerox kiosks. If your payment is verified but your document fails to print due to any technical error, paper jam, or machine outage, you are <strong>100% entitled to a full refund</strong>.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: Order Cancellation Policy */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>1. Order Cancellation Policy</span>
            </h2>
            <p>
              Due to the instant, automated nature of our cloud print kiosks:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>
                <strong>Before Printing Starts:</strong> Print jobs are dispatched to the physical printer immediately upon Cashfree payment verification. Orders cannot be cancelled once payment is verified and job status moves to <code className="text-amber-400">QUEUED</code> or <code className="text-amber-400">PRINTING</code>.
              </li>
              <li>
                <strong>Pending / Failed Payment:</strong> Unpaid transactions or abandoned Cashfree payment sessions are automatically cancelled with zero charge.
              </li>
            </ul>
          </section>

          {/* Section 2: Eligible Scenarios */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>2. When are Refunds Approved? (Eligible Cases)</span>
            </h2>
            <p>A full 100% refund is processed under the following technical failure conditions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-semibold text-white">Paper Jam or Hardware Stoppage</h4>
                <p className="text-slate-400">The printer ran out of paper or experienced a physical paper jam mid-job.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-semibold text-white">Machine Offline / Power Failure</h4>
                <p className="text-slate-400">The kiosk agent lost connectivity or powered down after payment verification.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-semibold text-white">Toner / Ink Exhaustion</h4>
                <p className="text-slate-400">Print job produced unreadable output due to low toner level.</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-semibold text-white">System Software Disconnect</h4>
                <p className="text-slate-400">Payment completed but job dispatch failed on backend server.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Non-Refundable Scenarios */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>3. Non-Refundable Scenarios</span>
            </h2>
            <p>Refunds will NOT be issued under the following user-side situations:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>User uploaded the wrong PDF file or incorrect document version.</li>
              <li>User selected unintended print settings (e.g. selected Color instead of Black & White, or incorrect page range).</li>
              <li>Document printed successfully at the kiosk, but user failed to collect the paper printout from the kiosk tray.</li>
              <li>Typographical errors or existing formatting mistakes present within the user's original document file.</li>
            </ul>
          </section>

          {/* Section 4: Refund Process & Timeline */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span>4. Refund Timeline & Processing Method</span>
            </h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-white font-semibold">
                <span>Refund Method: Original Source via Cashfree</span>
                <span className="text-amber-400 text-xs">5 - 7 Business Days</span>
              </div>
              <p className="text-slate-400">
                All approved refunds are credited back directly to the original payment source (UPI account, Bank Account, Credit/Debit Card, or Wallet) used during the Cashfree checkout.
              </p>
            </div>
          </section>

          {/* Section 5: How to Claim a Refund */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>5. How to Submit a Refund Claim</span>
            </h2>
            <p>If your print job failed at any LeopardX Xerox kiosk, submit a refund ticket within 48 hours:</p>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-2 font-medium">
              <li>
                Open the <a href="/contact" className="text-amber-400 underline">Contact Us Form</a> or email <a href="mailto:support@leopardx.in" className="text-amber-400 underline">support@leopardx.in</a>.
              </li>
              <li>Include your <strong>Cashfree Payment Order ID</strong> (e.g., <code>order_1727...</code>).</li>
              <li>Specify the Kiosk Machine ID (e.g., <code>PUNE-COLLEGE-001</code>) and time of attempt.</li>
              <li>Briefly explain the issue (e.g. "Paper Jam", "Machine Offline").</li>
            </ol>
            <p className="pt-2 text-slate-400">
              Our automated system cross-references the server print spool logs. Upon verification, the refund will be triggered immediately.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
