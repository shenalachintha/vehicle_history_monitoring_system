import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car,
  Calendar,
  Gauge,
  Fuel,
  Wrench,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Shield,
  Layers,
  Sparkles,
  Trash2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const VehicleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const { formatCurrency } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api.get(`/vehicles/${id}`),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId) => api.delete(`/maintenance/${ruleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicle', id]);
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['maintenance-rules']);
    },
  });

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus) => api.put(`/vehicles/${id}`, { status: newStatus }),
    onSuccess: () => {
      setStatusDropdownOpen(false);
      queryClient.invalidateQueries(['vehicle', id]);
      queryClient.invalidateQueries(['vehicles']);
      queryClient.invalidateQueries(['dashboard-summary']);
    },
  });

  const vehicle = response?.data;

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <p className="text-xs font-bold text-slate-400">Loading vehicle profile...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-bold text-slate-700">Vehicle not found</p>
        <button
          onClick={() => navigate('/vehicles')}
          className="mt-3 text-xs text-blue-600 font-bold hover:underline"
        >
          Return to fleet registry
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Technical Specs' },
    { id: 'timeline', label: 'Event Timeline' },
    { id: 'maintenance', label: 'Maintenance Rules' },
    { id: 'mileage', label: 'Mileage Log' },
    { id: 'documents', label: 'Documents' },
    { id: 'costs', label: 'Cost Analytics' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vehicles
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/service-history?action=add&vehicleId=${vehicle.id}`)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Log Service Event
          </button>
          <button
            onClick={() => navigate(`/mileage?vehicleId=${vehicle.id}`)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Gauge className="w-3.5 h-3.5" />
            Update Odometer
          </button>
        </div>
      </div>

      {/* Hero Vehicle Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={vehicle.thumbnailUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80'}
            alt={vehicle.registrationNo}
            className="w-24 h-16 object-cover rounded-2xl border border-slate-200 shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {vehicle.registrationNo}
              </h1>

              {/* Clickable Status Badge Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setStatusDropdownOpen((o) => !o)}
                  disabled={statusMutation.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all hover:opacity-80 ${
                    vehicle.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : vehicle.status === 'UNDER_MAINTENANCE'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : vehicle.status === 'OUT_OF_SERVICE'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {statusMutation.isPending ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : null}
                  {vehicle.status.replace(/_/g, ' ')}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 min-w-[190px]">
                    <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Change Vehicle Status
                    </p>
                    {[
                      { value: 'ACTIVE', label: 'Active', color: 'text-emerald-700', dot: 'bg-emerald-500' },
                      { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance', color: 'text-amber-700', dot: 'bg-amber-500' },
                      { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: 'text-rose-700', dot: 'bg-rose-500' },
                      { value: 'DECOMMISSIONED', label: 'Decommissioned', color: 'text-slate-500', dot: 'bg-slate-400' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        disabled={vehicle.status === opt.value || statusMutation.isPending}
                        onClick={() => statusMutation.mutate(opt.value)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed ${opt.color}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.dot} shrink-0`} />
                        {opt.label}
                        {vehicle.status === opt.value && (
                          <CheckCircle2 className="w-3.5 h-3.5 ml-auto opacity-70" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              {vehicle.make} {vehicle.model} • {vehicle.year} • {vehicle.category} • {vehicle.fuelType}
            </p>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Current Odometer</span>
            <span className="text-base font-extrabold text-slate-900">
              {Number(vehicle.currentOdometer).toLocaleString()} km
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Assigned Driver</span>
            <span className="text-base font-extrabold text-slate-900">
              {vehicle.assignedDriver || 'None'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block text-[11px]">Total Expenses</span>
            <span className="text-base font-extrabold text-blue-600">
              {formatCurrency(vehicle.totalExpenditure)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Active Alerts */}
            {vehicle.alerts?.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Active Warnings & Preventive Alerts ({vehicle.alerts.length})
                </div>
                <div className="space-y-2">
                  {vehicle.alerts.map((al) => (
                    <div key={al.id} className="bg-white p-3.5 rounded-xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{al.title}</p>
                        <p className="text-slate-500 mt-0.5">{al.message}</p>
                        {al.alertType?.includes('DOCUMENT') ? (
                          <button
                            onClick={() => navigate(`/documents?search=${encodeURIComponent(vehicle.registrationNo)}`)}
                            className="text-[11px] font-bold text-blue-600 hover:underline mt-1.5 inline-block"
                          >
                            📄 Renew Document to Clear Warning →
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/service-history?action=add&vehicleId=${vehicle.id}&ruleId=${al.ruleId || ''}&title=${encodeURIComponent(al.title)}`)}
                            className="text-[11px] font-bold text-blue-600 hover:underline mt-1.5 inline-block"
                          >
                            🛠️ Record Service to Clear Warning →
                          </button>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 self-start sm:self-center shrink-0">
                        {al.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Maintenance Forecast Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-4">
                Preventive Maintenance Schedule & Dues
              </h3>
              <div className="space-y-3">
                {vehicle.maintenanceRules?.map((rule) => {
                  const evalStatus = rule.evaluation?.status || 'OK';
                  return (
                    <div
                      key={rule.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{rule.name}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 text-slate-700">
                            {rule.conditionType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1">
                          Next due: {rule.nextDueDate ? new Date(rule.nextDueDate).toLocaleDateString() : 'N/A'} or {rule.nextDueKm ? `${Number(rule.nextDueKm).toLocaleString()} km` : 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10.5px] font-bold self-start sm:self-auto ${
                          evalStatus === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : evalStatus === 'OVERDUE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : evalStatus === 'UPCOMING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {evalStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Operational Location & Driver Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Assignment</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Responsible Driver</span>
                  <span className="font-bold text-slate-800">{vehicle.assignedDriver || 'None Assigned'}</span>
                  <span className="text-slate-500 block">{vehicle.driverContact || ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Assigned Department</span>
                  <span className="font-bold text-slate-800">{vehicle.department || 'HQ Operations'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Branch & Location</span>
                  <span className="font-bold text-slate-800">{vehicle.branch || 'Central'} - {vehicle.operationalLocation || 'Trincomalee'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Specs */}
      {activeTab === 'specs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-4">Technical & Purchase Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">VIN</span>
              <span className="font-bold text-slate-800">{vehicle.vin || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Chassis Number</span>
              <span className="font-bold text-slate-800">{vehicle.chassisNo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Engine Number</span>
              <span className="font-bold text-slate-800">{vehicle.engineNo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Transmission</span>
              <span className="font-bold text-slate-800">{vehicle.transmission}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Fuel Type</span>
              <span className="font-bold text-slate-800">{vehicle.fuelType}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Purchase Date</span>
              <span className="font-bold text-slate-800">{vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Purchase Price</span>
              <span className="font-bold text-slate-800">{vehicle.purchasePrice ? formatCurrency(vehicle.purchasePrice) : 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Supplier / Dealer</span>
              <span className="font-bold text-slate-800">{vehicle.supplier || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Complete Event History Timeline</h3>
            <button
              onClick={() => navigate(`/service-history?action=add&vehicleId=${vehicle.id}`)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Log New Event
            </button>
          </div>

          <div className="space-y-6">
            {vehicle.events?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No events logged for this vehicle yet.</p>
            ) : (
              vehicle.events?.map((ev) => (
                <div key={ev.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-black text-slate-900 text-sm">{ev.title}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                        {ev.eventType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-slate-500 font-semibold">
                      {new Date(ev.eventDate).toLocaleDateString()} @ {Number(ev.odometerAtEvent).toLocaleString()} km
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{ev.workPerformed}</p>

                  {/* Consumables / Parts table */}
                  {ev.items?.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs">
                      <p className="font-bold text-slate-700 text-[11px] mb-2 uppercase tracking-wider">Parts & Consumables</p>
                      <div className="space-y-1">
                        {ev.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-slate-600">
                            <span>{item.description} ({item.brand || 'Generic'}) x {Number(item.quantity)}</span>
                            <span className="font-semibold text-slate-800">{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 text-slate-500">
                    <span>Provider: <strong className="text-slate-700">{ev.serviceProvider}</strong> ({ev.technicianName || 'N/A'})</span>
                    <span className="font-black text-slate-900 text-sm">Total: {formatCurrency(ev.totalCost)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Maintenance Rules */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Maintenance Rules Applicable to this Vehicle</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Includes vehicle-specific, category-wide, and fleet-wide rules.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">🚗 This Vehicle</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">🗂️ By Category</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">🌐 Fleet-Wide</span>
            </div>
          </div>
          {(!vehicle.maintenanceRules || vehicle.maintenanceRules.length === 0) ? (
            <div className="text-center py-12 text-slate-400">
              <p className="font-semibold text-sm">No maintenance rules found.</p>
              <p className="text-xs mt-1">Create a rule from the <strong>Maintenance</strong> page and assign it to this vehicle or fleet-wide.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="pb-3">Rule Name</th>
                    <th className="pb-3">Scope</th>
                    <th className="pb-3">Condition</th>
                    <th className="pb-3">Interval</th>
                    <th className="pb-3">Last Serviced</th>
                    <th className="pb-3">Next Due</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicle.maintenanceRules?.map((r) => {
                    const status = r.evaluation?.status || 'OK';
                    const statusColors = {
                      OK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
                      OVERDUE: 'bg-red-50 text-red-700 border-red-200',
                      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
                    };
                    const scopeColors = {
                      'This Vehicle': 'bg-blue-50 text-blue-700 border-blue-200',
                      'Fleet-Wide': 'bg-slate-100 text-slate-600 border-slate-200',
                    };
                    const scopeLabel = r.scopeLabel || (r.vehicleId ? 'This Vehicle' : r.vehicleCategory ? `All ${r.vehicleCategory}s` : 'Fleet-Wide');
                    const scopeColor = r.vehicleId ? scopeColors['This Vehicle'] : r.vehicleCategory ? 'bg-violet-50 text-violet-700 border-violet-200' : scopeColors['Fleet-Wide'];
                    return (
                      <tr key={r.id} className={`hover:bg-slate-50 ${status === 'OVERDUE' || status === 'CRITICAL' ? 'bg-red-50/30' : ''}`}>
                        <td className="py-3 font-bold text-slate-900">
                          {r.name}
                          <p className="text-[10px] font-normal text-slate-400 mt-0.5">{r.category}</p>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${scopeColor}`}>
                            {scopeLabel}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-600">{r.conditionType.replace(/_/g, ' ')}</td>
                        <td className="py-3 text-slate-600">
                          {r.intervalMonths ? `${r.intervalMonths} mo` : ''}{r.intervalMonths && r.intervalKm ? ' / ' : ''}{r.intervalKm ? `${Number(r.intervalKm).toLocaleString()} km` : ''}
                        </td>
                        <td className="py-3 text-slate-600">
                          {r.lastCompletedDate ? new Date(r.lastCompletedDate).toLocaleDateString() : 'Never'}
                          <span className="block text-slate-400">{r.lastCompletedKm ? `${Number(r.lastCompletedKm).toLocaleString()} km` : ''}</span>
                        </td>
                        <td className="py-3 text-slate-800 font-semibold">
                          {r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString() : '—'}
                          <span className="block text-slate-400">{r.nextDueKm ? `${Number(r.nextDueKm).toLocaleString()} km` : ''}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${statusColors[status] || statusColors.OK}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2">
                          {hasRole(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']) && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete rule "${r.name}"? All active alerts associated with this rule will be permanently deleted.`)) {
                                  deleteRuleMutation.mutate(r.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Delete maintenance rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Mileage Log */}
      {activeTab === 'mileage' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Odometer Submission History</h3>
            <button
              onClick={() => navigate(`/mileage?vehicleId=${vehicle.id}`)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Record Reading
            </button>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                <th className="pb-3">Date</th>
                <th className="pb-3">Week</th>
                <th className="pb-3">Odometer</th>
                <th className="pb-3">Distance Travelled</th>
                <th className="pb-3">Recorded By</th>
                <th className="pb-3">Flags / Corrections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicle.mileageReadings?.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3 font-semibold text-slate-800">{new Date(m.recordedDate).toLocaleDateString()}</td>
                  <td className="py-3 text-slate-500">Wk {m.weekNumber}, {m.year}</td>
                  <td className="py-3 font-bold text-slate-900">{Number(m.odometerReading).toLocaleString()} km</td>
                  <td className="py-3 font-semibold text-emerald-600">+{Number(m.distanceTravelled).toLocaleString()} km</td>
                  <td className="py-3 text-slate-600">{m.recordedBy?.fullName || 'System'}</td>
                  <td className="py-3">
                    {m.isFlagged ? (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {m.flagReason || 'Flagged'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Compliance & Registered Documents</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Insurance, revenue licences, fitness certificates, and emission reports.</p>
            </div>
            <button
              onClick={() => navigate(`/documents?action=upload&vehicleId=${vehicle.id}`)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Register New Document
            </button>
          </div>
          {(!vehicle.documents || vehicle.documents.length === 0) ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No documents registered for this vehicle yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicle.documents?.map((doc) => {
                const now = new Date();
                const expiry = doc.expiryDate ? new Date(doc.expiryDate) : null;
                const diffDays = expiry
                  ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isExpired = diffDays !== null && diffDays < 0;
                const warningDaysBefore = Number.isFinite(Number(doc.warningDaysBefore))
                  ? Number(doc.warningDaysBefore)
                  : 30;
                const isExpiringSoon = diffDays !== null && diffDays >= 0 && diffDays <= warningDaysBefore;

                return (
                  <div key={doc.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between text-xs gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                        {doc.docType.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-slate-900 text-sm block">{doc.title}</span>
                      <p className="text-slate-500">Number: <strong className="text-slate-700">{doc.documentNumber || 'N/A'}</strong></p>
                      <p className="text-slate-500">
                        Expiry: <strong className="text-slate-700">{expiry ? expiry.toLocaleDateString() : 'Permanent / N/A'}</strong>
                      </p>
                      <button
                        onClick={() => navigate(`/documents?search=${encodeURIComponent(doc.documentNumber || doc.title)}`)}
                        className="text-[11px] font-bold text-blue-600 hover:underline pt-1 block"
                      >
                        Update / Renew Expiry →
                      </button>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold shrink-0 border ${
                        isExpired
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isExpiringSoon
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : expiry
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isExpired
                        ? `Expired (${Math.abs(diffDays)}d ago)`
                        : isExpiringSoon
                        ? `${diffDays}d left`
                        : expiry
                        ? 'Valid / Active'
                        : 'Permanent'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Cost Analytics */}
      {activeTab === 'costs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">Maintenance Expenditure Breakdown</h3>
          <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-800 text-sm">
              <span>Lifetime Maintenance Cost</span>
              <span className="text-blue-600">{formatCurrency(vehicle.totalExpenditure)}</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Calculated across all routine services, inspections, breakdown repairs, and parts replacements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

