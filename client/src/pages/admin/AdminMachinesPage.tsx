import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../../components/AdminHeader';
import {
  Plus,
  Search,
  Cpu,
  CheckCircle2,
  AlertCircle,
  QrCode,
  DollarSign,
  Printer,
  ChevronRight,
  X,
  ToggleLeft,
  ToggleRight,
  Building2,
  MapPin,
  Tag,
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      const data = await getAdminMachines();
      setMachines(data);
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
      const created = await createAdminMachine({
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AdminHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-6 h-6 text-amber-400" />
              <span>Machine Management</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Create, configure, and monitor LeopardX Xerox kiosks & QR codes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition text-xs uppercase tracking-wider active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Machine</span>
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-slate-400 text-[11px] font-medium">Total Machines</p>
            <p className="text-2xl font-black text-white">{machines.length}</p>
            <p className="text-[10px] text-amber-400">{activeCount} Active • {machines.length - activeCount} Disabled</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-slate-400 text-[11px] font-medium">Connection Status</p>
            <p className="text-2xl font-black text-emerald-400">{onlineCount} Online</p>
            <p className="text-[10px] text-slate-500">{machines.length - onlineCount} Offline</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-slate-400 text-[11px] font-medium">Total Print Jobs</p>
            <p className="text-2xl font-black text-white">{totalJobs}</p>
            <p className="text-[10px] text-slate-400">Across all kiosks</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
            <p className="text-slate-400 text-[11px] font-medium">Total Revenue</p>
            <p className="text-2xl font-black text-amber-400">₹{totalRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-400">Verified Cashfree Sales</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by machine name, code (e.g. PUNE-COLLEGE-002), or location..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Machine Cards / Table List */}
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400">Loading Kiosk Machines...</p>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Machines Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No kiosk machines matched your search filter or no machines have been registered yet.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Add First Machine
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMachines.map((m) => (
              <div
                key={m.id}
                className={`bg-slate-900 border rounded-3xl p-5 space-y-4 transition ${
                  m.operationalState === 'DISABLED'
                    ? 'border-red-950/60 opacity-80'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base tracking-tight">{m.name}</h3>
                    </div>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">{m.machineCode}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{m.location}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
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

                {/* Stats Summary Row */}
                <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-slate-500">Jobs</p>
                    <p className="font-bold text-white">{m.totalJobs}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Success</p>
                    <p className="font-bold text-emerald-400">{m.successfulJobs}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Failed</p>
                    <p className="font-bold text-red-400">{m.failedJobs}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Revenue</p>
                    <p className="font-bold text-amber-400">₹{m.revenue}</p>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleToggleState(m)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
                      m.operationalState === 'ACTIVE'
                        ? 'text-red-400 bg-red-950/40 border-red-500/30 hover:bg-red-900/40'
                        : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30 hover:bg-emerald-900/40'
                    }`}
                  >
                    {m.operationalState === 'ACTIVE' ? (
                      <>
                        <ToggleLeft className="w-4 h-4" /> Disable Kiosk
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4" /> Enable Kiosk
                      </>
                    )}
                  </button>

                  <Link
                    to={`/admin/machines/${m.id}`}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Details & QR</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/20 text-amber-400 p-1.5 rounded-lg border border-amber-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Add New Kiosk Machine</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" /> Machine Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pune College Xerox"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" /> Machine Code (Must be unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.machineCode}
                  onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                  placeholder="e.g. PUNE-COLLEGE-002"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-mono font-bold placeholder-slate-500 uppercase focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Encoded into public customer QR: <code>https://leopard-x-xerox.vercel.app/print?machine=&lt;CODE&gt;</code>
                </p>
              </div>

              {formError && (
                <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Create Machine</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
