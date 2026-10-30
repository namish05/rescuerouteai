import React, { useState } from 'react';
import { Siren, ShieldAlert, X, AlertTriangle } from 'lucide-react';

export const SosModal = ({ isOpen, onClose, onConfirm, ambulanceId = 'AMB-101' }) => {
  const [reason, setReason] = useState('Critical Cardiac STEMI / Unstable Patient');
  const [confirmedSafeguard, setConfirmedSafeguard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmedSafeguard) return;
    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-navy-900 border-2 border-red-600 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-navy-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-red-600/20 border border-red-500 rounded-xl">
            <Siren className="w-7 h-7 text-red-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-500 tracking-tight">CRITICAL SOS PANIC BROADCAST</h3>
            <p className="text-xs text-slate-400 font-mono">Vehicle: {ambulanceId} | High Priority Override</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-950/60 border border-red-500/30 rounded-xl p-3 mb-4 text-xs text-red-200 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p>
            Triggering SOS immediately sounds alarms at Central Traffic Police Command and Hospital ER Shock Trauma Bays. Use strictly for critical life-threatening emergencies.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Emergency Condition Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="Critical Cardiac STEMI / Unstable Patient">Critical Cardiac STEMI / Unstable Patient</option>
              <option value="Severe Polytrauma with Massive Hemorrhage">Severe Polytrauma with Massive Hemorrhage</option>
              <option value="Acute Stroke Code / Neuro Critical">Acute Stroke Code / Neuro Critical</option>
              <option value="Pediatric Respiratory Failure / Hypoxia">Pediatric Respiratory Failure / Hypoxia</option>
              <option value="Severe Gridlock Impediment / Immediate Police Escort Needed">Severe Gridlock Impediment / Immediate Police Escort Needed</option>
            </select>
          </div>

          {/* Safeguard Checkbox */}
          <div className="bg-navy-950/80 p-3 rounded-lg border border-slate-800">
            <label className="flex items-start space-x-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={confirmedSafeguard}
                onChange={(e) => setConfirmedSafeguard(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-red-600 rounded bg-navy-900 border-slate-700 focus:ring-red-500"
              />
              <span>
                I confirm this is an active Category-1 emergency requiring immediate green corridor clearance and trauma bay reservation.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-navy-800 text-slate-300 hover:bg-navy-700 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmedSafeguard || isSubmitting}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition ${
                confirmedSafeguard && !isSubmitting
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 animate-pulse'
                  : 'bg-red-950/40 text-red-500/50 cursor-not-allowed border border-red-900/30'
              }`}
            >
              <Siren className="w-4 h-4" />
              <span>{isSubmitting ? 'BROADCASTING...' : 'BROADCAST SOS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
