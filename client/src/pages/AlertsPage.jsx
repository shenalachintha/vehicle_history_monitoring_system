import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  Filter,
  Check,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const AlertsPage = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');

  const { data: alertsRes, isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, statusFilter],
    queryFn: () =>
      api.get('/alerts', {
        params: {
          severity: severityFilter || undefined,
          status: statusFilter,
        },
      }),
  });

  const ackMutation = useMutation({
    mutationFn: (id) => api.post(`/alerts/${id}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['dashboard-summary']);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }) => api.post(`/alerts/${id}/resolve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['dashboard-summary']);
    },
  });

  const alerts = alertsRes?.data || [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Alert Center</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time preventive alerts, overdue maintenance escalations, and compliance notifications.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="OPEN">Open Alerts</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved History</option>
            <option value="ALL">All Alerts</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="OVERDUE">Overdue</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="INFO">Information</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-800">No unresolved alerts in this category</p>
            <p className="text-xs text-slate-400 mt-0.5">All fleet maintenance conditions and compliance records are clear.</p>
          </div>
        ) : (
          alerts.map((al) => (
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
                      ? 'bg-rose-500 text-white'
                      : al.severity === 'OVERDUE'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{al.title}</span>
                    <span className="font-bold text-blue-600">({al.vehicle?.registrationNo})</span>
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
                  </div>
                  <p className="text-slate-600 mt-1">{al.message}</p>
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
    </div>
  );
};

