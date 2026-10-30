import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  X,
  Play,
  Car,
  Layers,
  Globe,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const SERVICE_CATEGORIES = [
  'Routine Service',
  'Diesel Fuel System Maintenance & Tune-up',
  'Chemical Additive Treatment',
  'Brake System Maintenance',
  'Engine & Transmission Maintenance',
  'Tyre & Wheel Maintenance',
  'Battery & Electrical Maintenance',
  'Cooling System Maintenance',
  'Inspection & Emission Testing',
  'Insurance & Licence Renewal',
  'Parts Replacement & Overhaul',
  'Repair & Breakdown Follow-up',
  'Other / Custom',
];

export const MaintenancePage = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScopeTab, setSelectedScopeTab] = useState('ALL'); // 'ALL' | 'FLEET' | 'CATEGORY' | 'VEHICLE'
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'CRITICAL' | 'OVERDUE' | 'UPCOMING' | 'OK'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Modal scope selection: 'FLEET' | 'CATEGORY' | 'VEHICLE'
  const [scopeType, setScopeType] = useState('FLEET');
  const [customCategory, setCustomCategory] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Routine Service',
    vehicleId: '',
    vehicleCategory: 'CAR',
    conditionType: 'DATE_OR_MILEAGE',
    intervalMonths: 6,
    intervalKm: 5000,
    warningDaysBefore: 30,
    warningKmBefore: 500,
    instructions: '',
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['maintenance-rules'],
    queryFn: () => api.get('/maintenance'),
  });

  const { data: vehiclesRes } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: () => api.get('/vehicles'),
  });

  const saveRuleMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? api.put(`/maintenance/${id}`, data) : api.post('/maintenance', data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowAddModal(false);
      setEditingRule(null);
      setScopeType('FLEET');
      setCustomCategory('');
      setFormData({
        name: '',
        category: 'Routine Service',
        vehicleId: '',
        vehicleCategory: 'CAR',
        conditionType: 'DATE_OR_MILEAGE',
        intervalMonths: 6,
        intervalKm: 5000,
        warningDaysBefore: 30,
        warningKmBefore: 500,
        instructions: '',
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => api.delete(`/maintenance/${id}`),
    onSuccess: (_response, deletedRuleId) => {
      queryClient.setQueryData(['maintenance-rules'], (currentResponse) => {
        if (!currentResponse?.data) return currentResponse;
        return {
          ...currentResponse,
          data: currentResponse.data.filter((r) => r.id !== deletedRuleId),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const evaluateAlertsMutation = useMutation({
    mutationFn: () => api.post('/alerts/evaluate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      alert('Fleet maintenance audit complete. Active alerts updated.');
    },
  });

  const allRules = response?.data || [];
  const vehicles = vehiclesRes?.data || [];

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let fleetCount = 0;
    let categoryCount = 0;
    let vehicleCount = 0;
    let attentionCount = 0;

    for (const r of allRules) {
      if (r.vehicleId) vehicleCount++;
      else if (r.vehicleCategory) categoryCount++;
      else fleetCount++;

      const status = r.evaluation?.status;
      if (status === 'CRITICAL' || status === 'OVERDUE' || status === 'UPCOMING') {
        attentionCount++;
      }
    }

    return {
      total: allRules.length,
      fleetCount,
      categoryCount,
      vehicleCount,
      attentionCount,
    };
  }, [allRules]);

  // Filtering
  const filteredRules = useMemo(() => {
    return allRules.filter((r) => {
      // Scope tab filter
      if (selectedScopeTab === 'FLEET' && (r.vehicleId || r.vehicleCategory)) return false;
      if (selectedScopeTab === 'CATEGORY' && !r.vehicleCategory) return false;
      if (selectedScopeTab === 'VEHICLE' && !r.vehicleId) return false;

      // Status filter
      if (statusFilter) {
        const evalStatus = r.evaluation?.status || 'OK';
        if (statusFilter === 'ATTENTION' && !['CRITICAL', 'OVERDUE', 'UPCOMING'].includes(evalStatus)) return false;
        if (statusFilter !== 'ATTENTION' && evalStatus !== statusFilter) return false;
      }

      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = r.name?.toLowerCase().includes(term);
        const matchesCat = r.category?.toLowerCase().includes(term);
        const matchesVeh = r.vehicle?.registrationNo?.toLowerCase().includes(term) ||
          r.vehicle?.make?.toLowerCase().includes(term) ||
          r.vehicle?.model?.toLowerCase().includes(term);
        const matchesVehCat = r.vehicleCategory?.toLowerCase().includes(term);
        if (!matchesName && !matchesCat && !matchesVeh && !matchesVehCat) return false;
      }

      return true;
    });
  }, [allRules, selectedScopeTab, statusFilter, searchTerm]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedScopeTab, statusFilter, searchTerm, pageSize]);

  // Pagination calculation
  const totalItems = filteredRules.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, currentPage, pageSize]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      intervalMonths: formData.intervalMonths ? Number(formData.intervalMonths) : null,
      intervalKm: formData.intervalKm ? Number(formData.intervalKm) : null,
      warningDaysBefore: Number(formData.warningDaysBefore),
      warningKmBefore: Number(formData.warningKmBefore),
      vehicleId: scopeType === 'VEHICLE' ? formData.vehicleId : null,
      vehicleCategory: scopeType === 'CATEGORY' ? formData.vehicleCategory : null,
    };

    saveRuleMutation.mutate({
      id: editingRule?.id,
      data: payload,
    });
  };

  const openRuleEditor = (rule) => {
    setEditingRule(rule);
    if (rule.vehicleId) setScopeType('VEHICLE');
    else if (rule.vehicleCategory) setScopeType('CATEGORY');
    else setScopeType('FLEET');

    setCustomCategory(!SERVICE_CATEGORIES.slice(0, -1).includes(rule.category) ? rule.category : '');
    setFormData({
      name: rule.name,
      category: rule.category,
      vehicleId: rule.vehicleId || '',
      vehicleCategory: rule.vehicleCategory || 'CAR',
      conditionType: rule.conditionType,
      intervalMonths: rule.intervalMonths || '',
      intervalKm: rule.intervalKm || '',
      warningDaysBefore: rule.warningDaysBefore,
      warningKmBefore: rule.warningKmBefore,
      instructions: rule.instructions || '',
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Preventive Maintenance Engine</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure calendar & mileage scheduling criteria, threshold windows, and automatic triggers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => evaluateAlertsMutation.mutate()}
            disabled={evaluateAlertsMutation.isPending}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {evaluateAlertsMutation.isPending ? 'Auditing Fleet...' : 'Run Audit Now'}
          </button>

          {hasRole(['ADMIN', 'FLEET_MANAGER']) && (
            <button
              onClick={() => {
                setEditingRule(null);
                setScopeType('FLEET');
                setCustomCategory('');
                setFormData({
                  name: '',
                  category: 'Routine Service',
                  vehicleId: '',
                  vehicleCategory: 'CAR',
                  conditionType: 'DATE_OR_MILEAGE',
                  intervalMonths: 6,
                  intervalKm: 5000,
                  warningDaysBefore: 30,
                  warningKmBefore: 500,
                  instructions: '',
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New Maintenance Rule
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setSelectedScopeTab('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedScopeTab === 'ALL'
              ? 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}
        >
          <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Total Rules</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{summaryMetrics.total}</p>
        </div>

        <div
          onClick={() => setSelectedScopeTab('FLEET')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedScopeTab === 'FLEET'
              ? 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-slate-500">
            <Globe className="w-3.5 h-3.5" />
            <p className="text-[10.5px] font-bold uppercase tracking-wider">Fleet-Wide</p>
          </div>
          <p className="text-xl font-black text-slate-900 mt-0.5">{summaryMetrics.fleetCount}</p>
        </div>

        <div
          onClick={() => setSelectedScopeTab('CATEGORY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedScopeTab === 'CATEGORY'
              ? 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-indigo-600">
            <Layers className="w-3.5 h-3.5" />
            <p className="text-[10.5px] font-bold uppercase tracking-wider">By Category</p>
          </div>
          <p className="text-xl font-black text-slate-900 mt-0.5">{summaryMetrics.categoryCount}</p>
        </div>

        <div
          onClick={() => setSelectedScopeTab('VEHICLE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedScopeTab === 'VEHICLE'
              ? 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-blue-600">
            <Car className="w-3.5 h-3.5" />
            <p className="text-[10.5px] font-bold uppercase tracking-wider">Vehicle Specific</p>
          </div>
          <p className="text-xl font-black text-slate-900 mt-0.5">{summaryMetrics.vehicleCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'ATTENTION' ? '' : 'ATTENTION')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'ATTENTION'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-rose-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <p className="text-[10.5px] font-bold uppercase tracking-wider">Due / Overdue</p>
          </div>
          <p className="text-xl font-black text-rose-600 mt-0.5">{summaryMetrics.attentionCount}</p>
        </div>
      </div>

      {/* Scope Navigation Tabs & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Scope Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setSelectedScopeTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedScopeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Rules ({allRules.length})
            </button>
            <button
              onClick={() => setSelectedScopeTab('FLEET')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedScopeTab === 'FLEET'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Fleet-Wide ({summaryMetrics.fleetCount})
            </button>
            <button
              onClick={() => setSelectedScopeTab('CATEGORY')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedScopeTab === 'CATEGORY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              By Category ({summaryMetrics.categoryCount})
            </button>
            <button
              onClick={() => setSelectedScopeTab('VEHICLE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedScopeTab === 'VEHICLE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Vehicle-Specific ({summaryMetrics.vehicleCount})
            </button>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Showing <strong className="text-slate-900">{filteredRules.length}</strong> rules
          </span>
        </div>

        {/* Search & Status Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs pt-1">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by rule name, category, or vehicle registration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ATTENTION">Needs Attention (Overdue / Upcoming)</option>
              <option value="CRITICAL">Critical Overdue Only</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="UPCOMING">Upcoming Only</option>
              <option value="OK">Normal (OK) Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rules Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 pl-4">Rule Name</th>
                <th className="py-3.5">Scope / Target</th>
                <th className="py-3.5">Condition Logic</th>
                <th className="py-3.5">Intervals</th>
                <th className="py-3.5">Warning Windows</th>
                <th className="py-3.5">Calculated Next Due</th>
                <th className="py-3.5">Live Status</th>
                <th className="py-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedRules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <CalendarDays className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-60" />
                    <p className="font-bold text-sm text-slate-600">No maintenance rules found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing your filters or create a new preventive rule.</p>
                  </td>
                </tr>
              ) : (
                paginatedRules.map((rule) => {
                  const evalStatus = rule.evaluation?.status || 'OK';
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-4">
                        <p className="font-bold text-slate-900 text-xs">{rule.name}</p>
                        <p className="text-[11px] text-slate-400">{rule.category}</p>
                      </td>
                      <td className="py-3.5">
                        {rule.vehicle ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10.5px]">
                            <Car className="w-3 h-3" />
                            <span>{rule.vehicle.registrationNo}</span>
                          </div>
                        ) : rule.vehicleCategory ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10.5px]">
                            <Layers className="w-3 h-3" />
                            <span>All {rule.vehicleCategory}s</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10.5px]">
                            <Globe className="w-3 h-3" />
                            <span>Entire Fleet</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {rule.conditionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {rule.intervalMonths ? `${rule.intervalMonths} mo` : ''}
                        {rule.intervalMonths && rule.intervalKm ? ' / ' : ''}
                        {rule.intervalKm ? `${Number(rule.intervalKm).toLocaleString()} km` : ''}
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px]">
                        {rule.warningDaysBefore}d / {Number(rule.warningKmBefore).toLocaleString()} km
                      </td>
                      <td className="py-3.5 font-semibold text-slate-800">
                        {rule.nextDueDate ? new Date(rule.nextDueDate).toLocaleDateString() : 'N/A'}{' '}
                        {rule.nextDueKm ? (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            ({Number(rule.nextDueKm).toLocaleString()} km)
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            evalStatus === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : evalStatus === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : evalStatus === 'UPCOMING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {evalStatus}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasRole(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']) && (
                            <>
                              <button
                                onClick={() => openRuleEditor(rule)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit rule"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Delete maintenance rule "${rule.name}"? Any active alerts generated by this rule will be permanently deleted.`
                                    )
                                  ) {
                                    deleteRuleMutation.mutate(rule.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                of <strong className="text-slate-800">{totalItems}</strong> rules
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

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRule ? 'Update Preventive Maintenance Rule' : 'Create Preventive Maintenance Rule'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Configure fleet-wide or vehicle-specific triggers.</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCustomCategory('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 text-xs">
              {/* Scope Selector: Fleet-Wide, By Category, or Specific Vehicle */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Rule Application Scope *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScopeType('FLEET')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      scopeType === 'FLEET'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Entire Fleet
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeType('CATEGORY')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      scopeType === 'CATEGORY'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    By Category
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeType('VEHICLE')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      scopeType === 'VEHICLE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    Specific Vehicle
                  </button>
                </div>
              </div>

              {/* Conditional Scope Target Fields */}
              {scopeType === 'CATEGORY' && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <label className="font-bold text-slate-800 block mb-1">Select Vehicle Category *</label>
                  <select
                    value={formData.vehicleCategory}
                    onChange={(e) => setFormData({ ...formData, vehicleCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="CAR">Cars (Passenger Vehicles)</option>
                    <option value="VAN">Vans</option>
                    <option value="PICKUP">Pickups (4x4, Utility)</option>
                    <option value="LORRY">Lorries / Trucks</option>
                    <option value="BUS">Buses / Staff Transport</option>
                    <option value="MOTORCYCLE">Motorcycles</option>
                    <option value="SPECIALIZED">Specialized Equipment</option>
                  </select>
                </div>
              )}

              {scopeType === 'VEHICLE' && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <label className="font-bold text-slate-800 block mb-1">Select Target Vehicle *</label>
                  <select
                    required={scopeType === 'VEHICLE'}
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Choose a vehicle from the fleet...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNo} — {v.make} {v.model} ({Number(v.currentOdometer).toLocaleString()} km)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5,000 km Oil & Filter Change"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Maintenance Category *</label>
                  <select
                    required
                    value={SERVICE_CATEGORIES.slice(0, -1).includes(formData.category) ? formData.category : 'Other / Custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other / Custom') {
                        setCustomCategory('');
                        setFormData({ ...formData, category: '' });
                      } else {
                        setCustomCategory('');
                        setFormData({ ...formData, category: val });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium text-slate-800"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {!SERVICE_CATEGORIES.slice(0, -1).includes(formData.category) && (
                    <input
                      type="text"
                      required
                      placeholder="Describe the custom category..."
                      value={customCategory}
                      onChange={(e) => {
                        setCustomCategory(e.target.value);
                        setFormData({ ...formData, category: e.target.value });
                      }}
                      className="w-full mt-2 px-3 py-2 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-800"
                    />
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Condition Logic *</label>
                  <select
                    value={formData.conditionType}
                    onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="DATE_OR_MILEAGE">Date OR Mileage (Whichever first)</option>
                    <option value="DATE_AND_MILEAGE">Date AND Mileage (Both required)</option>
                    <option value="DATE_ONLY">Date Only (Calendar Schedule)</option>
                    <option value="MILEAGE_ONLY">Mileage Only (Odometer Threshold)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Calendar Interval (Months)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 6 or 12"
                    value={formData.intervalMonths}
                    onChange={(e) => setFormData({ ...formData, intervalMonths: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mileage Interval (km)</label>
                  <input
                    type="number"
                    min="100"
                    placeholder="e.g. 5000 or 10000"
                    value={formData.intervalKm}
                    onChange={(e) => setFormData({ ...formData, intervalKm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Warning Lead (Days before)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warningDaysBefore}
                    onChange={(e) => setFormData({ ...formData, warningDaysBefore: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Warning Lead (km before)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warningKmBefore}
                    onChange={(e) => setFormData({ ...formData, warningKmBefore: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Instructions & Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Special workshop directions, recommended oil viscosity, filter specs..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setCustomCategory('');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveRuleMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 disabled:opacity-50"
                >
                  {saveRuleMutation.isPending ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
