import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Bell,
  Gauge,
  Shield,
  Save,
  CheckCircle2,
  Server,
  Database,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formSettings, setFormSettings] = useState(settings);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formSettings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Settings & Fleet Preferences</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure default preventive thresholds, operational currency, units of measurement, and compliance parameters.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          Settings successfully saved and applied to your fleet profile!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company & Regional Preferences */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Company & Operational Locale</h3>
              <p className="text-[11px] text-slate-400">Display conventions and fleet branding</p>
            </div>
          </div>

          {/* Company Logo Preview */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl">
            <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logo.jpg" alt="Company Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Official Company Brand Logo</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Active on login screen, sidebar, top navbar header, and audit reports.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company / Organization Name</label>
              <input
                type="text"
                value={formSettings.companyName || ''}
                onChange={(e) => setFormSettings({ ...formSettings, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Operational Timezone</label>
              <select
                value={formSettings.timezone || ''}
                onChange={(e) => setFormSettings({ ...formSettings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="Asia/Colombo (GMT+05:30)">Asia/Colombo (GMT+05:30)</option>
                <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
                <option value="America/New_York (EST)">America/New York (EST)</option>
                <option value="Asia/Dubai (GST+04:00)">Asia/Dubai (GST+04:00)</option>
                <option value="Asia/Singapore (SGT+08:00)">Asia/Singapore (SGT+08:00)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Display Currency</label>
              <select
                value={formSettings.currency || 'LKR'}
                onChange={(e) => setFormSettings({ ...formSettings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="LKR">LKR (Rs) - Sri Lankan Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Distance Metric</label>
              <select
                value={formSettings.distanceUnit || 'km'}
                onChange={(e) => setFormSettings({ ...formSettings, distanceUnit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="km">Kilometres (km) - Confirmed Fleet Standard</option>
                <option value="miles">Miles (mi)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preventive Alert Thresholds */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Default Preventive Alert Thresholds</h3>
              <p className="text-[11px] text-slate-400">Escalation windows for maintenance engines & document renewals</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Upcoming Lead (Days)</label>
              <input
                type="number"
                min="1"
                value={formSettings.warningDays ?? 30}
                onChange={(e) => setFormSettings({ ...formSettings, warningDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
              <span className="text-[10.5px] text-slate-400">Triggers 'UPCOMING' state</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Upcoming Lead (km)</label>
              <input
                type="number"
                min="50"
                value={formSettings.warningKm ?? 500}
                onChange={(e) => setFormSettings({ ...formSettings, warningKm: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
              <span className="text-[10.5px] text-slate-400">Triggers 'UPCOMING' distance</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Critical Overdue (Days)</label>
              <input
                type="number"
                min="1"
                value={formSettings.criticalDays ?? 15}
                onChange={(e) => setFormSettings({ ...formSettings, criticalDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
              <span className="text-[10.5px] text-slate-400">Escalates to 'CRITICAL'</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Weekly Spike Anomaly (km)</label>
              <input
                type="number"
                min="500"
                value={formSettings.anomalyDistanceLimit ?? 3000}
                onChange={(e) => setFormSettings({ ...formSettings, anomalyDistanceLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
              <span className="text-[10.5px] text-slate-400">Flags excessive weekly travel</span>
            </div>
          </div>
        </div>

        {/* System Health & Architecture */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">System Health & Connected Services</h3>
              <p className="text-[11px] text-slate-400">Backend runtime and database telemetry</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-400 block text-[10.5px] uppercase">API Server</span>
              <span className="font-extrabold text-emerald-700 text-sm flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE (Express.js)
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Port: 5000</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-400 block text-[10.5px] uppercase">Database Engine</span>
              <span className="font-extrabold text-blue-700 text-sm flex items-center gap-1.5 mt-0.5">
                <Database className="w-3.5 h-3.5" />
                MySQL (Prisma ORM)
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Provider: 127.0.0.1:3306</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-400 block text-[10.5px] uppercase">Version & Build</span>
              <span className="font-extrabold text-slate-900 text-sm block mt-0.5">v1.0.0 Enterprise</span>
              <span className="text-[11px] text-slate-500 block mt-1">React 18 + Node.js 22</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Applying Changes...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
