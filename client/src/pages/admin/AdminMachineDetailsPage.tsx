import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { AdminHeader } from '../../components/AdminHeader';
import {
  ArrowLeft,
  MapPin,
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
  FileText,
  Building2,
  Lock,
  Calendar,
  Layers,
  Plus,
  History,
} from 'lucide-react';
import { AddPaperModal } from '../../components/AddPaperModal';
import {
  getAdminMachineById,
  updateAdminMachine,
  disableAdminMachine,
  enableAdminMachine,
  updateAdminMachineThreshold,
  getAdminMachineRefillHistory,
  AdminMachine,
  PaperRefill,
} from '../../services/adminApi';

const formatISTDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(d);

  let day = '', month = '', year = '', hour = '', minute = '', second = '';
  for (const part of parts) {
    if (part.type === 'day') day = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'year') year = part.value;
    if (part.type === 'hour') hour = part.value;
    if (part.type === 'minute') minute = part.value;
    if (part.type === 'second') second = part.value;
  }

  return `${day}/${month}/${year}, ${hour}:${minute}:${second}`;
};

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

  // Date Filter State for Payment History ('today', '7days', 'all')
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'all'>('today');

  // Paper Stock State
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<string>('30');
  const [updatingThreshold, setUpdatingThreshold] = useState(false);
  const [thresholdSuccess, setThresholdSuccess] = useState(false);
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [refills, setRefills] = useState<PaperRefill[]>([]);

  // Fetch Machine details & refill history
  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMachineById(id);
      setMachine(data);
      setName(data.name);
      setLocation(data.location);
      setThresholdInput((data.lowPaperThreshold || 30).toString());

      // Fetch Refill History
      try {
        const refillData = await getAdminMachineRefillHistory(id);
        setRefills(refillData);
      } catch (rErr) {
        console.error('[Fetch Refills Error]', rErr);
      }

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdateThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;
    const val = parseInt(thresholdInput, 10);
    if (isNaN(val) || val < 0) {
      setThresholdError('Please enter a valid non-negative threshold number.');
      return;
    }
    setUpdatingThreshold(true);
    setThresholdError(null);
    setThresholdSuccess(false);

    try {
      const updated = await updateAdminMachineThreshold(machine.id, val);
      setMachine((prev) =>
        prev
          ? {
              ...prev,
              lowPaperThreshold: updated.lowPaperThreshold,
              paperStatus: updated.paperStatus,
            }
          : prev
      );
      setThresholdSuccess(true);
      setTimeout(() => setThresholdSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Update Threshold Error]', err);
      setThresholdError(err.response?.data?.message || 'Failed to update low paper threshold.');
    } finally {
      setUpdatingThreshold(false);
    }
  };

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
        await disableAdminMachine(machine.id);
        setMachine((prev) => (prev ? { ...prev, operationalState: 'DISABLED' } : prev));
      } else {
        await enableAdminMachine(machine.id);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden box-border">
      <AdminHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 box-border min-w-0">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <Link
              to="/admin/machines"
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {machine.name}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border flex-shrink-0 ${
                    machine.operationalState === 'ACTIVE'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-950/60 text-red-400 border-red-500/30'
                  }`}
                >
                  {machine.operationalState}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap min-w-0">
                <span className="text-amber-400 font-mono font-bold whitespace-nowrap">{machine.machineCode}</span>
                <span>•</span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{machine.location}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap min-w-0">
            {/* Connection status badge */}
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border flex-shrink-0 ${
                machine.status === 'ONLINE'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {machine.status === 'ONLINE' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> 🟢 ONLINE
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> 🔴 OFFLINE
                </>
              )}
            </span>

            {/* Enable/Disable Button */}
            <button
              type="button"
              onClick={handleToggleState}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center gap-2 transition flex-shrink-0 ${
                machine.operationalState === 'ACTIVE'
                  ? 'text-red-400 bg-red-950/40 border-red-500/30 hover:bg-red-900/40'
                  : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30 hover:bg-emerald-900/40'
              }`}
            >
              {machine.operationalState === 'ACTIVE' ? (
                <>
                  <ToggleLeft className="w-4 h-4 flex-shrink-0" /> Disable Kiosk
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 flex-shrink-0" /> Enable Kiosk
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 min-w-0">
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-3.5 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-500 text-[10px] font-medium uppercase truncate">Total Jobs</p>
            <p className="text-lg sm:text-xl font-black text-white truncate">{machine.totalJobs}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-3.5 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-500 text-[10px] font-medium uppercase truncate">Successful</p>
            <p className="text-lg sm:text-xl font-black text-emerald-400 truncate">{machine.successfulJobs}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-3.5 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-500 text-[10px] font-medium uppercase truncate">Failed</p>
            <p className="text-lg sm:text-xl font-black text-red-400 truncate">{machine.failedJobs}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-3.5 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-500 text-[10px] font-medium uppercase truncate">Total Revenue</p>
            <p className="text-lg sm:text-xl font-black text-amber-400 truncate">₹{machine.revenue}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-3.5 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-500 text-[10px] font-medium uppercase truncate">Pages Printed</p>
            <p className="text-lg sm:text-xl font-black text-white truncate">{machine.pagesPrinted}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-3.5 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-500 text-[10px] font-medium uppercase truncate">Last Activity</p>
            <p className="text-xs font-bold text-slate-300 truncate">
              {machine.lastActivity
                ? new Date(machine.lastActivity).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Main 2-Column Section: QR Code Management vs Machine Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
          {/* QR Code Management Card (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col justify-between shadow-xl min-w-0 box-border">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30 flex-shrink-0">
                  <QrIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm sm:text-base truncate">Customer QR Management</h3>
                  <p className="text-slate-400 text-[11px] truncate">High-Res QR Code Poster</p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase flex-shrink-0">
                1000px × 1000px
              </span>
            </div>

            {/* QR Code Preview Box */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 overflow-hidden min-w-0">
              {qrDataUrl ? (
                <div className="bg-white p-3 rounded-2xl border-2 border-amber-500/40 shadow-lg flex-shrink-0">
                  <img
                    src={qrDataUrl}
                    alt="Machine QR Code"
                    className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-36 h-36 sm:w-44 sm:h-44 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-xs flex-shrink-0">
                  Generating QR...
                </div>
              )}

              <div className="space-y-3 flex-1 min-w-0 w-full text-center sm:text-left">
                <div className="space-y-1.5 w-full min-w-0">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                    Customer Public Print URL
                  </label>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-amber-400 flex items-center justify-between gap-2 w-full min-w-0 overflow-hidden">
                    <span
                      className="truncate flex-1 min-w-0 font-mono text-[10px] sm:text-[11px] text-amber-400 select-all"
                      title={publicCustomerUrl}
                    >
                      {publicCustomerUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition flex-shrink-0"
                      title="Copy URL"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Scanning this QR code directs customer mobile phones to print kiosk interface for machine code{' '}
                  <strong className="text-white font-mono">{machine.machineCode}</strong>.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 min-w-0">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 sm:py-2.5 px-3 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Download QR</span>
              </button>

              <button
                type="button"
                onClick={handlePrintQrWindow}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 sm:py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <PrintIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate">Print QR Poster</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-3 sm:py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <span className="truncate">{copied ? 'Copied!' : 'Copy Customer URL'}</span>
              </button>
            </div>
          </div>

          {/* Machine Info Edit Form Card (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl flex flex-col justify-between min-w-0 box-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 min-w-0">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30 flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm sm:text-base truncate">Edit Kiosk Details</h3>
                  <p className="text-slate-400 text-[11px] truncate">Update machine name and location</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 min-w-0 w-full">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> Machine Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> Location / Address
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /> Machine Code (Public ID)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={machine.machineCode}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono font-bold cursor-not-allowed box-border min-w-0"
                  />
                </div>

                {updateError && (
                  <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words min-w-0">{updateError}</span>
                  </div>
                )}

                {updateSuccess && (
                  <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="break-words min-w-0">Machine details updated successfully!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 sm:py-2.5 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 mt-2 min-w-0"
                >
                  {updating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">Save Machine Changes</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Paper Stock & Threshold Control Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl min-w-0 box-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-amber-500/20 text-amber-400 p-2.5 rounded-2xl border border-amber-500/30 flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">Paper Stock Management</h3>
                <p className="text-slate-400 text-xs truncate">
                  Monitor inventory & configure alert thresholds
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPaperModalOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 sm:py-2.5 px-4 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Add Paper Stock</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
            {/* Stock Level Card */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                  Current Paper Level
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border flex-shrink-0 ${
                    machine.paperStock === 0
                      ? 'bg-red-950/80 text-red-400 border-red-500/30'
                      : machine.paperStock <= (machine.lowPaperThreshold || 30)
                      ? 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {machine.paperStock === 0
                    ? 'OUT OF PAPER'
                    : machine.paperStock <= (machine.lowPaperThreshold || 30)
                    ? 'LOW PAPER WARNING'
                    : 'IN STOCK'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                <span className="text-3xl sm:text-4xl font-black text-white">{machine.paperStock}</span>
                <span className="text-xs sm:text-sm font-bold text-slate-400">sheets remaining</span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Paper stock decreases automatically by 1 sheet per physical page printed upon print completion.
              </p>
            </div>

            {/* Low Paper Threshold Form */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 min-w-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block truncate">
                Low-Paper Alert Threshold
              </span>

              <form onSubmit={handleUpdateThreshold} className="space-y-3 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0">
                  <div className="flex-1 min-w-0">
                    <input
                      type="number"
                      min="0"
                      required
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500 box-border min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={updatingThreshold}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0 active:scale-95"
                  >
                    {updatingThreshold ? (
                      <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Set Threshold</span>
                      </>
                    )}
                  </button>
                </div>

                {thresholdSuccess && (
                  <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Threshold updated!
                  </p>
                )}
                {thresholdError && (
                  <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1 min-w-0">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {thresholdError}
                  </p>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  When stock falls below or equal to <strong className="text-white">{machine.lowPaperThreshold} sheets</strong>, yellow warning badges trigger across Super Admin dashboard.
                </p>
              </form>
            </div>
          </div>

          {/* Paper Refill History Log Table */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <History className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <h4 className="font-bold text-white text-xs uppercase tracking-wider truncate">
                Paper Refill History Logs
              </h4>
            </div>

            {refills.length === 0 ? (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
                No paper refills recorded yet for this machine.
              </div>
            ) : (
              <div className="overflow-x-auto min-w-0 rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300 min-w-[500px]">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">DATE & TIME</th>
                      <th className="py-2.5 px-4">ADDED</th>
                      <th className="py-2.5 px-4">PREVIOUS STOCK</th>
                      <th className="py-2.5 px-4">NEW STOCK</th>
                      <th className="py-2.5 px-4">ADDED BY (ADMIN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {refills.map((refill) => (
                      <tr key={refill.id} className="hover:bg-slate-950/80 transition">
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatISTDate(refill.createdAt)}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-emerald-400 whitespace-nowrap">
                          +{refill.quantityAdded} sheets
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                          {refill.previousStock} sheets
                        </td>
                        <td className="py-2.5 px-4 font-bold text-white whitespace-nowrap">
                          {refill.newStock} sheets
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          {refill.adminEmail || 'Admin'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Successful Payment & Print History Table */}
        {(() => {
          const filteredJobs = (machine.recentJobs || []).filter((job) => {
            const payStatus = job.paymentStatus || job.payment?.status;
            if (payStatus !== 'SUCCESS' && payStatus !== 'PAID') return false;

            const txnTimestamp = job.paymentDate || job.createdAt;
            const jobDate = new Date(txnTimestamp);
            const now = new Date();

            if (dateFilter === 'today') {
              return (
                jobDate.getFullYear() === now.getFullYear() &&
                jobDate.getMonth() === now.getMonth() &&
                jobDate.getDate() === now.getDate()
              );
            }

            if (dateFilter === '7days') {
              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return jobDate >= sevenDaysAgo;
            }

            return true; // 'all'
          });

          return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl min-w-0 box-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <h3 className="font-bold text-white text-sm sm:text-base truncate">Payment & Print History</h3>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap min-w-0">
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <label className="text-[11px] text-slate-400 font-medium">Filter:</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as any)}
                      className="bg-transparent text-amber-400 font-semibold text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="today" className="bg-slate-900 text-white">Today</option>
                      <option value="7days" className="bg-slate-900 text-white">Last 7 Days</option>
                      <option value="all" className="bg-slate-900 text-white">All Time</option>
                    </select>
                  </div>

                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {filteredJobs.length} successful {filteredJobs.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                  <p className="font-semibold text-slate-400">
                    No successful transactions found for {dateFilter === 'today' ? 'Today' : dateFilter === '7days' ? 'the Last 7 Days' : 'this machine'}.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Select "Last 7 Days" or "All Time" in the filter above to view earlier successful payment records.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto min-w-0 rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300 min-w-[600px]">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">JOB ID</th>
                        <th className="py-3 px-4">PAGES</th>
                        <th className="py-3 px-4">PRICE</th>
                        <th className="py-3 px-4">PAYMENT STATUS</th>
                        <th className="py-3 px-4">PRINT STATUS</th>
                        <th className="py-3 px-4">CREATED AT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-950/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap" title={job.id}>
                            {job.id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                            {job.totalPages || 1} {job.totalPages === 1 ? 'page' : 'pages'}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-400 whitespace-nowrap">
                            ₹{(job.price || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                              SUCCESS
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
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
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formatISTDate(job.paymentDate || job.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* Add Paper Modal */}
      {isPaperModalOpen && machine && (
        <AddPaperModal
          machine={machine}
          isOpen={isPaperModalOpen}
          onClose={() => setIsPaperModalOpen(false)}
          onSuccess={async () => {
            setIsPaperModalOpen(false);
            await fetchDetails();
          }}
        />
      )}
    </div>
  );
};
