import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const UrgentWatchlistWidget = ({ alerts = [], expiringDocs = [] }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'MAINTENANCE' | 'DOCS'

  const now = new Date();

  // Format and tag alerts
  const alertItems = alerts.map((a) => ({
    id: `alert-${a.id}`,
    category: a.alertType === 'DOCUMENT_EXPIRY' ? 'DOCS' : 'MAINTENANCE',
    title: a.title,
    subtitle: a.message,
    vehicleReg: a.vehicle?.registrationNo || 'Fleet Vehicle',
    vehicleId: a.vehicle?.id,
    severity: a.severity,
    date: a.dueDate,
    dueKm: a.dueMileage,
    link: '/alerts',
  }));

  // Format expiring docs if not already included in alerts
  const docItems = expiringDocs
    .filter((d) => !alerts.some((a) => a.title?.includes(d.docType) && a.vehicle?.registrationNo === d.vehicle?.registrationNo))
    .map((d) => {
      const expiry = d.expiryDate ? new Date(d.expiryDate) : null;
      const diffDays = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const isExpired = diffDays < 0;

      return {
        id: `doc-${d.id}`,
        category: 'DOCS',
        title: `${d.docType.replace(/_/g, ' ')} ${isExpired ? 'Expired' : 'Expiring Soon'}`,
        subtitle: `${d.title || d.documentNumber || 'Policy Document'} (${isExpired ? Math.abs(diffDays) + 'd overdue' : diffDays + 'd remaining'})`,
        vehicleReg: d.vehicle?.registrationNo || 'Fleet Vehicle',
        vehicleId: d.vehicle?.id,
        severity: isExpired ? (diffDays <= -15 ? 'CRITICAL' : 'OVERDUE') : 'UPCOMING',
        date: d.expiryDate,
        link: '/documents',
      };
    });

  const combinedItems = [...alertItems, ...docItems];

  const filteredItems = combinedItems.filter((item) => {
    if (activeFilter === 'MAINTENANCE') return item.category === 'MAINTENANCE';
    if (activeFilter === 'DOCS') return item.category === 'DOCS';
    return true;
  });

  const criticalCount = combinedItems.filter((i) => i.severity === 'CRITICAL' || i.severity === 'OVERDUE').length;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between h-[360px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">
              Action Required & Watchlist
            </h3>
            {criticalCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                {criticalCount} Urgent
              </span>
            ) : combinedItems.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                {combinedItems.length} Notice
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> All Clear
              </span>
            )}
          </div>

          <button
            onClick={() => navigate('/alerts')}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
          >
            All Alerts
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mb-3">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({combinedItems.length})
          </button>
          <button
            onClick={() => setActiveFilter('MAINTENANCE')}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
              activeFilter === 'MAINTENANCE'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Maintenance ({combinedItems.filter((i) => i.category === 'MAINTENANCE').length})
          </button>
          <button
            onClick={() => setActiveFilter('DOCS')}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
              activeFilter === 'DOCS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Documents ({combinedItems.filter((i) => i.category === 'DOCS').length})
          </button>
        </div>
      </div>

      {/* Item List or Empty State */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <p className="font-bold text-slate-800 text-xs">Fleet in Good Standing</p>
            <p className="text-[11px] text-slate-400 max-w-[220px] mt-0.5">
              No overdue service rules or expired vehicle documents detected.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCritical = item.severity === 'CRITICAL' || item.severity === 'OVERDUE';
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.link)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isCritical
                    ? 'bg-rose-50/40 hover:bg-rose-50 border-rose-100'
                    : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-100'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.category === 'DOCS' ? (
                      <FileText className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[11px] text-slate-900 truncate">
                        {item.vehicleReg}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase tracking-wider ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : item.severity === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : item.dueKm ? `${Number(item.dueKm).toLocaleString()} km` : ''}
                  </span>
                  <span className="text-[9.5px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 mt-0.5">
                    Resolve &rarr;
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Compliance & Maintenance Status</span>
        <button
          onClick={() => navigate('/maintenance')}
          className="font-bold text-slate-700 hover:text-blue-600 transition-colors"
        >
          View Maintenance Rules &rarr;
        </button>
      </div>
    </div>
  );
};

