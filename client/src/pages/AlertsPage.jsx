import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  Filter,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const AlertsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: alertsRes, isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, statusFilter],
    queryFn: () =>
      api.get('/alerts', {
        params: {
          severity: severityFilter || undefined,
          status: statusFilter,
          limit: 100, // fetch sufficient items for client pagination
        },
      }),
  });

  const ackMutation = useMutation({
    mutationFn: (id) => api.post(`/alerts/${id}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['navbar-alerts']);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }) => api.post(`/alerts/${id}/resolve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['navbar-alerts']);
    },
  });

  const allAlerts = alertsRes?.data || [];

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((al) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        al.title?.toLowerCase().includes(q) ||
        al.message?.toLowerCase().includes(q) ||
        al.vehicle?.registrationNo?.toLowerCase().includes(q) ||
        al.vehicle?.assignedDriver?.toLowerCase().includes(q) ||
        al.rule?.name?.toLowerCase().includes(q)
      );
    });
  }, [allAlerts, searchQuery]);

  // Reset to first page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, severityFilter, statusFilter, pageSize]);

  // Pagination
  const totalItems = filteredAlerts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAlerts.slice(start, start + pageSize);
  }, [filteredAlerts, currentPage, pageSize]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let criticalCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;

    for (const a of allAlerts) {
      if (a.severity === 'CRITICAL') criticalCount++;
      else if (a.severity === 'OVERDUE') overdueCount++;
      else if (a.severity === 'UPCOMING') upcomingCount++;
    }

    return {
      total: allAlerts.length,
      criticalCount,
      overdueCount,
      upcomingCount,
    };
  }, [allAlerts]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Alert Center</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time preventive alerts, overdue maintenance escalations, and compliance notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
            {summaryMetrics.criticalCount + summaryMetrics.overdueCount} Requiring Action
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Total in View</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{summaryMetrics.total}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-rose-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <p className="text-[10.5px] font-bold uppercase tracking-wider">Critical</p>
          </div>
          <p className="text-xl font-black text-rose-600 mt-0.5">{summaryMetrics.criticalCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            <p className="text-[10.5px] font-bold uppercase tracking-wider">Overdue</p>
          </div>
          <p className="text-xl font-black text-amber-600 mt-0.5">{summaryMetrics.overdueCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-blue-600">
            <Bell className="w-3.5 h-3.5" />
            <p className="text-[10.5px] font-bold uppercase tracking-wider">Upcoming</p>
          </div>
          <p className="text-xl font-black text-blue-600 mt-0.5">{summaryMetrics.upcomingCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle reg, alert title, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          {/* Status Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="OPEN">Open Alerts</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved History</option>
              <option value="ALL">All Alerts</option>
            </select>
          </div>

          {/* Severity Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="UPCOMING">Upcoming Only</option>
              <option value="INFO">Information Only</option>
            </select>
          </div>
        </div>

        {(searchQuery || severityFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900">{filteredAlerts.length}</strong> matching alerts
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSeverityFilter('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Alerts List Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 space-y-3">
          {paginatedAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800">No unresolved alerts in this category</p>
              <p className="text-xs text-slate-400 mt-0.5">All fleet maintenance conditions and compliance records are clear.</p>
            </div>
          ) : (
            paginatedAlerts.map((al) => (
              <div
                key={al.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-all ${
                  al.severity === 'CRITICAL'
                    ? 'bg-rose-50/50 border-rose-200'
                    : al.severity === 'OVERDUE'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      al.severity === 'CRITICAL'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : al.severity === 'OVERDUE'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-blue-500 text-white shadow-xs'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">{al.title}</span>
                      {al.vehicle?.registrationNo && (
                        <span
                          onClick={() => al.vehicleId && navigate(`/vehicles/${al.vehicleId}`)}
                          className="font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          ({al.vehicle.registrationNo})
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          al.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : al.severity === 'OVERDUE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {al.severity}
                      </span>
                      {al.status === 'ACKNOWLEDGED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{al.message}</p>
                    {al.alertType === 'DOCUMENT_EXPIRY' ? (
                      <div className="mt-2">
                        <button
                          onClick={() => navigate(`/documents?search=${encodeURIComponent(al.vehicle?.registrationNo || '')}`)}
                          className="text-[11.5px] font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          📄 Go to Documents & Update Expiry Date →
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <button
                          onClick={() => navigate(`/service-history?action=add&vehicleId=${al.vehicleId}&ruleId=${al.ruleId || ''}&title=${encodeURIComponent(al.rule?.name || al.title || '')}`)}
                          className="text-[11.5px] font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          🛠️ Record Service to Clear Alert →
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1.5 font-medium">
                      <span>Driver: {al.vehicle?.assignedDriver || 'N/A'}</span>
                      <span>Created: {new Date(al.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {al.status !== 'RESOLVED' && hasRole(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']) && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {al.status === 'OPEN' && (
                      <button
                        onClick={() => ackMutation.mutate(al.id)}
                        disabled={ackMutation.isPending}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 text-xs"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => resolveMutation.mutate({ id: al.id, notes: 'Resolved via Alert Center' })}
                      disabled={resolveMutation.isPending}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">
                Showing{' '}
                <strong className="text-slate-800">
                  {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800">
                  {Math.min(currentPage * pageSize, totalItems)}
                </strong>{' '}
                of <strong className="text-slate-800">{totalItems}</strong> alerts
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-700 text-xs">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
