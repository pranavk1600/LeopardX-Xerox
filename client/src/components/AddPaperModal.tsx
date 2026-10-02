import React, { useState } from 'react';
import { Layers, Plus, X, AlertCircle } from 'lucide-react';
import { addAdminMachinePaper, AdminMachine } from '../services/adminApi';

interface AddPaperModalProps {
  machine: AdminMachine;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMachine: AdminMachine) => void;
}

export const AddPaperModal: React.FC<AddPaperModalProps> = ({
  machine,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<string>('100');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numQuantity = parseInt(quantity, 10) || 0;
  const projectedStock = machine.paperStock + Math.max(0, numQuantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numQuantity <= 0) {
      setError('Please enter a valid positive number of sheets.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await addAdminMachinePaper(machine.id, numQuantity);
      onSuccess(result.machine);
      onClose();
    } catch (err: any) {
      console.error('[Add Paper Error]', err);
      setError(err.response?.data?.message || 'Failed to add paper stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const presetValues = [50, 100, 250, 500];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto box-border min-w-0 my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">Add Paper Stock</h3>
              <p className="text-slate-400 text-xs truncate">{machine.name} ({machine.machineCode})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 min-w-0 w-full">
          {/* Current vs Projected Stock Banner */}
          <div className="grid grid-cols-2 gap-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-semibold uppercase truncate">Current Stock</p>
              <p className="text-base sm:text-lg font-black text-white truncate">
                {machine.paperStock} <span className="text-xs font-normal text-slate-400">sheets</span>
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-semibold uppercase truncate">New Stock</p>
              <p className="text-base sm:text-lg font-black text-amber-400 truncate">
                {projectedStock} <span className="text-xs font-normal text-slate-400">sheets</span>
              </p>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Quick Presets</label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {presetValues.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(preset.toString())}
                  className={`py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center active:scale-95 ${
                    numQuantity === preset
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Sheets Input */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Number of Sheets to Add *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 250"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-amber-400 placeholder-slate-500 focus:outline-none focus:border-amber-500 box-border min-w-0"
            />
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="break-words min-w-0">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-xs transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || numQuantity <= 0}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 transition active:scale-95 truncate"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Add Paper</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
