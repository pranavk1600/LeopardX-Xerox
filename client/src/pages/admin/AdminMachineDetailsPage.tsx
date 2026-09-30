import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { AdminHeader } from '../../components/AdminHeader';
import {
  ArrowLeft,
  Cpu,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  QrCode as QrIcon,
  Download,
  Printer as PrintIcon,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Save,
  Clock,
  DollarSign,
  FileText,
  Building2,
  Lock,
} from 'lucide-react';
import {
  getAdminMachineById,
  updateAdminMachine,
  disableAdminMachine,
  enableAdminMachine,
  AdminMachine,
} from '../../services/adminApi';

export const AdminMachineDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [machine, setMachine] = useState<AdminMachine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State for editing name & location
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // QR Code state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Fetch Machine details
  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMachineById(id);
      setMachine(data);
      setName(data.name);
      setLocation(data.location);

      // Generate 1000px x 1000px High-Res QR Code Data URL
      const publicUrl = `https://leopard-x-xerox.vercel.app/print?machine=${data.machineCode}`;
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        width: 1000,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err: any) {
      console.error('[Fetch Machine Details Error]', err);
      setError(err.response?.data?.message || 'Failed to load machine details.');
    } font: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const updated = await updateAdminMachine(machine.id, { name, location });
      setMachine((prev) => (prev ? { ...prev, name: updated.name, location: updated.location } : prev));
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Update Machine Error]', err);
      setUpdateError(err.response?.data?.message || 'Failed to update machine info.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleState = async () => {
    if (!machine) return;
    try {
      if (machine.operationalState === 'ACTIVE') {
        const updated = await disableAdminMachine(machine.id);
        setMachine((prev) => (prev ? { ...prev, operationalState: 'DISABLED' } : prev));
      } else {
        const updated = await enableAdminMachine(machine.id);
        setMachine((prev) => (prev ? { ...prev, operationalState: 'ACTIVE' } : prev));
      }
    } catch (err) {
      console.error('[Toggle State Error]', err);
    }
  };

  const publicCustomerUrl = machine
    ? `https://leopard-x-xerox.vercel.app/print?machine=${machine.machineCode}`
    : '';

  const handleCopyUrl = () => {
    if (!publicCustomerUrl) return;
    navigator.clipboard.writeText(publicCustomerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !machine) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `LeopardX-QR-${machine.machineCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintQrWindow = () => {
    if (!machine || !qrDataUrl) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print the QR Code poster.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LeopardX Xerox QR Poster - ${machine.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
              color: #0f172a;
              text-align: center;
              box-sizing: border-box;
            }
            .poster-card {
              border: 4px solid #0f172a;
              border-radius: 32px;
              padding: 40px 30px;
              max-width: 600px;
              margin: 0 auto;
              box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            }
            .brand-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 24px;
            }
            .brand-logo {
              width: 48px;
              height: 48px;
              background: linear-gradient(135deg, #f59e0b, #ea580c);
              border-radius: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 900;
              font-size: 24px;
            }
            .brand-title {
              font-size: 28px;
              font-weight: 900;
              letter-spacing: -0.5px;
              color: #0f172a;
            }
            .machine-badge {
              display: inline-block;
              background-color: #fef3c7;
              color: #92400e;
              font-weight: 800;
              padding: 6px 18px;
              border-radius: 9999px;
              font-size: 14px;
              letter-spacing: 0.5px;
              margin-bottom: 12px;
            }
            .machine-name {
              font-size: 32px;
              font-weight: 900;
              margin: 8px 0 4px 0;
            }
            .machine-location {
              font-size: 16px;
              color: #64748b;
              margin-bottom: 24px;
            }
            .qr-container {
              background: white;
              padding: 20px;
              border: 3px solid #e2e8f0;
              border-radius: 24px;
              display: inline-block;
              margin-bottom: 24px;
            }
            .qr-container img {
              width: 320px;
              height: 320px;
              display: block;
            }
            .instruction-heading {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 8px;
            }
            .instruction-sub {
              font-size: 14px;
              color: #475569;
              max-width: 420px;
              margin: 0 auto 24px auto;
            }
            .footer-info {
              border-t: 2px dashed #e2e8f0;
              padding-top: 16px;
              font-size: 12px;
              color: #94a3b8;
              font-weight: 600;
            }
            @media print {
              body { padding: 0; }
              .poster-card { border-width: 4px; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="brand-header">
              <div class="brand-logo">LX</div>
              <div class="brand-title">LeopardX Xerox</div>
            </div>

            <div class="machine-badge">${machine.machineCode}</div>
            <div class="machine-name">${machine.name}</div>
            <div class="machine-location">📍 ${machine.location}</div>

            <div class="qr-container">
              <img src="${qrDataUrl}" alt="Scan QR Code to Print" />
            </div>

            <div class="instruction-heading">📲 SCAN QR CODE TO PRINT</div>
            <div class="instruction-sub">
              1. Open Phone Camera or Any QR Scanner<br/>
              2. Upload your PDF Document & Select Options<br/>
              3. Pay via UPI & Pick Up Printed Copies
            </div>

            <div class="footer-info">
              Standard A4 Monochrome Printing • ₹2.00 / Page • LeopardX Xerox Kiosk
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <AdminHeader />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Loading Machine Details & QR Code...</p>
        </main>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <AdminHeader />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Machine Not Found</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {error || 'The requested machine could not be retrieved or does not exist.'}
          </p>
          <Link
            to="/admin/machines"
            className="inline-flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Machines List
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AdminHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/machines"
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{machine.name}</h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    machine.operationalState === 'ACTIVE'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-950/60 text-red-400 border-red-500/30'
                  }`}
                >
                  {machine.operationalState}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="text-amber-400 font-mono font-bold">{machine.machineCode}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {machine.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status badge */}
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                machine.status === 'ONLINE'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {machine.status === 'ONLINE' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 🟢 ONLINE
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> 🔴 OFFLINE
                </>
              )}
            </span>

            {/* Enable/Disable Button */}
            <button
              type="button"
              onClick={handleToggleState}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center gap-2 transition ${
                machine.operationalState === 'ACTIVE'
                  ? 'text-red-400 bg-red-950/40 border-red-500/30 hover:bg-red-900/40'
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30 hover:bg-emerald-900/40'
              }`}
            >
              {machine.operationalState === 'ACTIVE' ? (
                <>
                  <ToggleLeft className="w-4 h-4" /> Disable Kiosk
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" /> Enable Kiosk
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <p className="text-slate-500 text-[10px] font-medium uppercase">Total Jobs</p>
            <p className="text-xl font-black text-white">{machine.totalJobs}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <p className="text-slate-500 text-[10px] font-medium uppercase">Successful</p>
            <p className="text-xl font-black text-emerald-400">{machine.successfulJobs}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <p className="text-slate-500 text-[10px] font-medium uppercase">Failed</p>
            <p className="text-xl font-black text-red-400">{machine.failedJobs}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <p className="text-slate-500 text-[10px] font-medium uppercase">Total Revenue</p>
            <p className="text-xl font-black text-amber-400">₹{machine.revenue}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <p className="text-slate-500 text-[10px] font-medium uppercase">Pages Printed</p>
            <p className="text-xl font-black text-white">{machine.pagesPrinted}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <p className="text-slate-500 text-[10px] font-medium uppercase">Last Activity</p>
            <p className="text-xs font-bold text-slate-300 truncate">
              {machine.lastActivity ? new Date(machine.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Main 2-Column Section: QR Code Management vs Machine Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* QR Code Management Card (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30">
                  <QrIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Customer QR Code Management</h3>
                  <p className="text-slate-400 text-[11px]">High-Res QR Code for Machine Display Poster</p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase">
                1000px × 1000px PNG
              </span>
            </div>

            {/* QR Code Preview Box */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              {qrDataUrl ? (
                <div className="bg-white p-3 rounded-2xl border-2 border-amber-500/40 shadow-lg flex-shrink-0">
                  <img src={qrDataUrl} alt="Machine QR Code" className="w-44 h-44 object-contain rounded-lg" />
                </div>
              ) : (
                <div className="w-44 h-44 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-xs">
                  Generating QR...
                </div>
              )}

              <div className="space-y-3 flex-1 text-left">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Customer Public Print URL
                  </label>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 break-all select-all flex items-center justify-between gap-2">
                    <span className="truncate">{publicCustomerUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="p-1 text-slate-400 hover:text-white transition flex-shrink-0"
                      title="Copy URL"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Scanning this QR code directs customer mobile phones to the LeopardX Xerox print kiosk interface linked to machine code <strong className="text-white">{machine.machineCode}</strong>.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-3 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Code</span>
              </button>

              <button
                type="button"
                onClick={handlePrintQrWindow}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <PrintIcon className="w-4 h-4 text-amber-400" />
                <span>Print QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied ? 'Copied!' : 'Copy Customer URL'}</span>
              </button>
            </div>
          </div>

          {/* Machine Info Edit Form Card (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Kiosk Details</h3>
                  <p className="text-slate-400 text-[11px]">Update machine name and physical location</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" /> Machine Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location / Address
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Machine Code (Public Identifier)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={machine.machineCode}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-500 font-mono font-bold cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Machine Code cannot be casually edited because physical QR posters encode this identifier.
                  </p>
                </div>

                {updateError && (
                  <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                {updateSuccess && (
                  <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Machine details updated successfully!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 mt-2"
                >
                  {updating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Machine Changes</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Recent Print Jobs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Recent Print Jobs</span>
            </h3>
            <span className="text-xs text-slate-400">
              Showing latest {machine.recentJobs?.length || 0} activity logs
            </span>
          </div>

          {!machine.recentJobs || machine.recentJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No print jobs logged for this kiosk machine yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Job ID</th>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Pages</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Print Status</th>
                    <th className="py-3 px-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {machine.recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-semibold text-white max-w-[180px] truncate">
                        {job.fileName || 'document.pdf'}
                      </td>
                      <td className="py-3 px-4">{job.totalPages || 1} pages</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">₹{(job.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            job.paymentStatus === 'PAID' || job.payment?.status === 'SUCCESS'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {job.paymentStatus || job.payment?.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                              : job.status === 'FAILED'
                              ? 'bg-red-950/60 text-red-400 border border-red-500/30'
                              : 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
