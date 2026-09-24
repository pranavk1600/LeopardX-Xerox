import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ShieldCheck, FileText, Lock, AlertTriangle, CreditCard, Scale, HelpCircle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Terms & Conditions</h1>
          <p className="text-slate-400 text-xs">Last updated: January 2026 • LeopardX Technologies</p>
        </div>

        {/* Content Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>1. Introduction & Acceptance</span>
            </h2>
            <p>
              Welcome to <strong>LeopardX Xerox</strong>, operated by <strong>LeopardX Technologies</strong> ("Company", "we", "us", or "our"). These Terms & Conditions govern your access to and use of our self-service automated document printing kiosks, web application at <code>https://leopard-x-xerox.vercel.app</code>, and associated printing services.
            </p>
            <p>
              By scanning a kiosk QR code, uploading a document, or initiating a payment, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>2. Description of Kiosk Service & Document Privacy</span>
            </h2>
            <p>
              LeopardX Xerox enables customers to upload PDF documents via smartphone or mobile web browser, configure print settings (Color vs B&W, copies, page range), pay online via Cashfree Payments, and receive instant physical printouts at our physical kiosk machines.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-semibold text-amber-400">Strict Document Privacy Policy:</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Uploaded PDF files are strictly used for print execution and rendering preview pages.</li>
                <li>Document files are transmitted over secure TLS/HTTPS channels.</li>
                <li>All uploaded document files are automatically purged and deleted from our servers immediately after print completion or job expiration.</li>
                <li>LeopardX employees or unauthorized third parties do NOT inspect or store customer document contents.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>3. User Conduct & Acceptable Upload Policy</span>
            </h2>
            <p>You agree that you will NOT use LeopardX Xerox kiosks to print, transmit, or distribute:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li>Documents violating copyright, trademark, or intellectual property rights without authorization.</li>
              <li>Defamatory, obscene, offensive, hate-speech, or illegal materials under applicable law.</li>
              <li>Counterfeit currency, government identification documents without legal authorization, or illegal security instruments.</li>
              <li>Malicious code, executable files, or corrupted scripts.</li>
            </ul>
            <p>
              The user assumes sole legal responsibility for the authorization and legal compliance of any uploaded content.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>4. Pricing, Taxes & Cashfree Payment Terms</span>
            </h2>
            <p>
              All prices are displayed in Indian Rupees (INR ₹) inclusive of applicable taxes prior to payment checkout.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li>Standard A4 Black & White Printing: ₹2.00 per page.</li>
              <li>Standard A4 Color Printing: ₹10.00 per page.</li>
              <li>A3 Size Multiplier: 2.0× standard rate.</li>
            </ul>
            <p>
              Payments are processed securely through <strong>Cashfree Payments India Private Limited</strong> using UPI, Debit/Credit Cards, Net Banking, or Wallets. LeopardX Technologies does not store your card details, UPI PIN, or bank credentials.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>5. Equipment Availability & Limitation of Liability</span>
            </h2>
            <p>
              While we strive for 100% kiosk availability and print reliability, LeopardX Technologies is not liable for temporary service interruptions, paper jams, printer hardware failures, power outages, or network connectivity issues beyond our control.
            </p>
            <p>
              In the event of a hardware or printing failure after verified payment, eligible customers will be provided a full refund in accordance with our <a href="/refunds" className="text-amber-400 underline">Refunds & Cancellations Policy</a>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>6. Governing Law & Contact</span>
            </h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of these terms shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra.
            </p>
            <div className="pt-2 text-slate-400">
              <p>For questions or formal inquiries regarding these Terms & Conditions:</p>
              <p className="text-amber-400 font-semibold mt-1">LeopardX Technologies</p>
              <p>Email: <a href="mailto:support@leopardx.in" className="text-white underline">support@leopardx.in</a></p>
              <p>Address: IT Park, Shivaji Nagar, Pune, Maharashtra - 411001, India</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
