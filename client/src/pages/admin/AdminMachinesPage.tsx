import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../../components/AdminHeader';
import { AddPaperModal } from '../../components/AddPaperModal';
import {
  Plus,
  Search,
  Cpu,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ChevronRight,
  X,
  ToggleLeft,
  ToggleRight,
  Building2,
  MapPin,
  Tag,
  Layers,
} from 'lucide-react';
import {
  getAdminMachines,
  createAdminMachine,
  disableAdminMachine,
  enableAdminMachine,
  AdminMachine,
} from '../../services/adminApi';

export const AdminMachinesPage: React.FC = () => {
  const [machines, setMachines] = useState<AdminMachine[]>([]);
  const [paperSummary, setPaperSummary] = useState<
    { normalCount: number; lowPaperCount: number; outOfPaperCount: number } | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Paper Modal State
  const [paperModalMachine, setPaperModalMachine] = useState<AdminMachine | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    machineCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await getAdminMachines();
      setMachines(res.data);
      setPaperSummary(res.paperSummary);
    } catch (err) {
      console.error('[Admin Fetch Machines Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.machineCode) {
      setFormError('All fields are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createAdminMachine({
        name: formData.name,
        location: formData.location,
        machineCode: formData.machineCode.trim().toUpperCase(),
      });

      setIsModalOpen(false);
      setFormData({ name: '', location: '', machineCode: '' });
      await fetchMachines();
    } catch (err: any) {
      console.error('[Create Machine Error]', err);
      setFormError(err.response?.data?.message || 'Failed to create machine. Ensure code is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleState = async (m: AdminMachine) => {
    try {
      if (m.operationalState === 'ACTIVE') {
        await disableAdminMachine(m.id);
      } else {
        await enableAdminMachine(m.id);
      }
      await fetchMachines();
    } catch (err) {
      console.error('[Toggle Machine State Error]', err);
    }
  };

  const filteredMachines = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.machineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = machines.reduce((acc, m) => acc + (m.revenue || 0), 0);
  const totalJobs = machines.reduce((acc, m) => acc + (m.totalJobs || 0), 0);
  const activeCount = machines.filter((m) => m.operationalState === 'ACTIVE').length;
  const onlineCount = machines.filter((m) => m.status === 'ONLINE').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden box-border">
      <AdminHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 box-border min-w-0">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 truncate">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 flex-shrink-0" />
              <span className="truncate">Machine Management</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
              Create, configure, and monitor LeopardX Xerox kiosks & QR codes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 sm:py-2.5 px-4 rounded-xl shadow-md transition text-xs uppercase tracking-wider active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Add New Machine</span>
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 min-w-0">
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium truncate">Total Machines</p>
            <p className="text-xl sm:text-2xl font-black text-white truncate">{machines.length}</p>
            <p className="text-[10px] text-amber-400 truncate">{activeCount} Active • {machines.length - activeCount} Off</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium truncate">Connection</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 truncate">{onlineCount} Online</p>
            <p className="text-[10px] text-slate-500 truncate">{machines.length - onlineCount} Offline</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-1 col-span-2 sm:col-span-1 min-w-0">
            <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium truncate">Paper Stock</p>
            <p className="text-xl sm:text-2xl font-black text-white truncate">
              {paperSummary ? paperSummary.normalCount : machines.filter((m) => (m.paperStock || 0) > (m.lowPaperThreshold || 30)).length}
              <span className="text-xs text-slate-400 font-normal ml-1">Normal</span>
            </p>
            <p className="text-[10px] flex items-center gap-1 truncate">
              <span className="text-amber-400 font-semibold truncate">
                {paperSummary ? paperSummary.lowPaperCount : machines.filter((m) => (m.paperStock || 0) > 0 && (m.paperStock || 0) <= (m.lowPaperThreshold || 30)).length} Low
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-red-400 font-semibold truncate">
                {paperSummary ? paperSummary.outOfPaperCount : machines.filter((m) => (m.paperStock || 0) === 0).length} Empty
              </span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium truncate">Total Jobs</p>
            <p className="text-xl sm:text-2xl font-black text-white truncate">{totalJobs}</p>
            <p className="text-[10px] text-slate-400 truncate">Across kiosks</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-1 min-w-0">
            <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium truncate">Total Revenue</p>
            <p className="text-xl sm:text-2xl font-black text-amber-400 truncate">₹{totalRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-400 truncate">Verified Sales</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full min-w-0">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 sm:top-3 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by machine name, code, or location..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
          />
        </div>

        {/* Machine Cards / Table List */}
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-3 min-w-0">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400">Loading Kiosk Machines...</p>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-3 min-w-0">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Machines Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              No kiosk machines matched your search filter or no machines have been registered yet.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition"
            >
              <Plus className="w-4 h-4" /> Add First Machine
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            {filteredMachines.map((m) => (
              <div
                key={m.id}
                className={`bg-slate-900 border rounded-3xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 transition min-w-0 box-border ${
                  m.operationalState === 'DISABLED'
                    ? 'border-red-950/60 opacity-80'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base tracking-tight truncate">{m.name}</h3>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5 font-mono">{m.machineCode}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-1.5 flex-shrink-0">
                    {/* Operational State Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        m.operationalState === 'ACTIVE'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-950/60 text-red-400 border-red-500/30'
                      }`}
                    >
                      {m.operationalState}
                    </span>

                    {/* Connection Status Badge */}
                    <span
                      className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                        m.status === 'ONLINE'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {m.status === 'ONLINE' ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> 🟢 ONLINE
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-2.5 h-2.5 text-slate-400" /> 🔴 OFFLINE
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Paper Stock Row */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2.5 text-xs min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg border flex-shrink-0 ${
                        (m.paperStock || 0) === 0
                          ? 'bg-red-950/60 border-red-500/40 text-red-400'
                          : (m.paperStock || 0) <= (m.lowPaperThreshold || 30)
                          ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                          : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-medium truncate">Paper Stock</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-white text-xs sm:text-sm whitespace-nowrap">
                          {m.paperStock || 0} <span className="text-[10px] font-normal text-slate-400">sheets</span>
                        </span>
                        {(m.paperStock || 0) === 0 ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30 whitespace-nowrap">
                            OUT OF PAPER
                          </span>
                        ) : (m.paperStock || 0) <= (m.lowPaperThreshold || 30) ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            LOW PAPER
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaperModalMachine(m)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-xl transition shadow flex items-center gap-1 active:scale-95 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">Add Paper</span>
                  </button>
                </div>

                {/* Stats Summary Row */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 bg-slate-950 p-2.5 sm:p-3 rounded-2xl border border-slate-800 text-center text-xs min-w-0">
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">Jobs</p>
                    <p className="font-bold text-white text-xs sm:text-sm truncate">{m.totalJobs}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">Success</p>
                    <p className="font-bold text-emerald-400 text-xs sm:text-sm truncate">{m.successfulJobs}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">Failed</p>
                    <p className="font-bold text-red-400 text-xs sm:text-sm truncate">{m.failedJobs}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">Revenue</p>
                    <p className="font-bold text-amber-400 text-xs sm:text-sm truncate">₹{m.revenue}</p>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleState(m)}
                    className={`w-full sm:w-auto text-xs font-semibold px-3 py-2 sm:py-1.5 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                      m.operationalState === 'ACTIVE'
                        ? 'text-red-400 bg-red-950/40 border-red-500/30 hover:bg-red-900/40'
                        : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30 hover:bg-emerald-900/40'
                    }`}
                  >
                    {m.operationalState === 'ACTIVE' ? (
                      <>
                        <ToggleLeft className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Disable Kiosk</span>
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Enable Kiosk</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/admin/machines/${m.id}`}
                    className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold text-xs px-3.5 py-2 sm:py-1.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">View Details & QR</span>
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto box-border min-w-0 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-amber-500/20 text-amber-400 p-1.5 rounded-lg border border-amber-500/30 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base truncate">Add New Kiosk Machine</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 min-w-0 w-full">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> Machine Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pune College Xerox"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> Machine Code (Must be unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.machineCode}
                  onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                  placeholder="e.g. PUNE-COLLEGE-002"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold placeholder-slate-500 uppercase focus:outline-none focus:border-amber-500 box-border min-w-0"
                />
                <p className="text-[10px] text-slate-400 mt-1 break-words">
                  Encoded into public customer QR link.
                </p>
              </div>

              {formError && (
                <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="break-words min-w-0">{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-xs transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 truncate"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="truncate">Create Machine</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Paper Modal */}
      {paperModalMachine && (
        <AddPaperModal
          machine={paperModalMachine}
          isOpen={!!paperModalMachine}
          onClose={() => setPaperModalMachine(null)}
          onSuccess={async () => {
            setPaperModalMachine(null);
            await fetchMachines();
          }}
        />
      )}
    </div>
  );
};
