import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Mail, Phone, MapPin, Building2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col justify-center space-y-10">
        {/* Page Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>LeopardX Technologies Support</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Contact Us</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Have questions about our self-service Xerox kiosks, order payments, or print issues? Get in touch with the LeopardX team.
          </p>
        </div>

        {/* Contact Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-slate-700 transition shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="bg-amber-500/10 text-amber-400 w-12 h-12 rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-lg">Email Support</h3>
              <p className="text-slate-400 text-xs">Direct support & refund queries:</p>
            </div>
            <p className="text-amber-400 font-bold text-sm break-all pt-2 border-t border-slate-800/80">
              leopardxtechnology@gmail.com
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-slate-700 transition shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="bg-amber-500/10 text-amber-400 w-12 h-12 rounded-2xl flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-lg">Helpline Phone</h3>
              <p className="text-slate-400 text-xs">Mon - Sat: 8:00 AM - 10:00 PM IST</p>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-amber-400 font-bold text-base">9022711058</p>
              <p className="text-slate-500 font-medium text-[11px] mt-0.5">Kiosk Emergency Support</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-slate-700 transition shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="bg-amber-500/10 text-amber-400 w-12 h-12 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-lg">Headquarters</h3>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed pt-2 border-t border-slate-800/80">
              <strong className="text-white block mb-1">LeopardX Technologies</strong>
              At Post Khanapur,<br />
              Taluka Bhor,<br />
              District Pune,<br />
              Maharashtra, India
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
