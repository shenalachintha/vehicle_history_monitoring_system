import React, { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Scope selection: 'FLEET' | 'CATEGORY' | 'VEHICLE'
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
    mutationFn: ({ id, data }) => id ? api.put(`/maintenance/${id}`, data) : api.post('/maintenance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] });
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
          data: currentResponse.data.filter((rule) => rule.id !== deletedRuleId),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const evaluateAlertsMutation = useMutation({
    mutationFn: () => api.post('/alerts/evaluate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const rules = response?.data || [];
  const vehicles = vehiclesRes?.data || [];

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      category: formData.category,
      conditionType: formData.conditionType,
      intervalMonths: formData.intervalMonths ? Number(formData.intervalMonths) : null,
      intervalKm: formData.intervalKm ? Number(formData.intervalKm) : null,
      warningDaysBefore: Number(formData.warningDaysBefore),
      warningKmBefore: Number(formData.warningKmBefore),
      instructions: formData.instructions || undefined,
      vehicleId: scopeType === 'VEHICLE' && formData.vehicleId ? formData.vehicleId : null,
      vehicleCategory: scopeType === 'CATEGORY' ? formData.vehicleCategory : null,
    };

    saveRuleMutation.mutate({ id: editingRule?.id, data: payload });
  };

  const openRuleEditor = (rule) => {
    setEditingRule(rule);
    setScopeType(rule.vehicleId ? 'VEHICLE' : rule.vehicleCategory ? 'CATEGORY' : 'FLEET');
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New Maintenance Rule
            </button>
          )}
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Rule Name</th>
                <th className="pb-3">Scope / Target</th>
                <th className="pb-3">Condition Logic</th>
                <th className="pb-3">Intervals</th>
                <th className="pb-3">Warning Windows</th>
                <th className="pb-3">Calculated Next Due</th>
                <th className="pb-3 pr-2 text-right">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
              {rules.map((rule) => {
                const evalStatus = rule.evaluation?.status || 'OK';
                return (
                  <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 pl-2">
                      <p className="font-bold text-slate-900 text-xs">{rule.name}</p>
                      <p className="text-[11px] text-slate-400">{rule.category}</p>
                    </td>
                    <td className="py-4">
                      {rule.vehicle ? (
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                          <Car className="w-3.5 h-3.5" />
                          <span>{rule.vehicle.registrationNo}</span>
                        </div>
                      ) : rule.vehicleCategory ? (
                        <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Category: {rule.vehicleCategory}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Entire Fleet (All)</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {rule.conditionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600">
                      {rule.intervalMonths ? `${rule.intervalMonths} Months` : ''}
                      {rule.intervalMonths && rule.intervalKm ? ' / ' : ''}
                      {rule.intervalKm ? `${Number(rule.intervalKm).toLocaleString()} km` : ''}
                    </td>
                    <td className="py-4 text-slate-500 text-[11.5px]">
                      {rule.warningDaysBefore} days / {Number(rule.warningKmBefore).toLocaleString()} km
                    </td>
                    <td className="py-4 font-semibold text-slate-800">
                      {rule.nextDueDate ? new Date(rule.nextDueDate).toLocaleDateString() : 'N/A'}{' '}
                      {rule.nextDueKm ? `(${Number(rule.nextDueKm).toLocaleString()} km)` : ''}
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
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
                        {hasRole(['ADMIN', 'FLEET_MANAGER']) && (
                          <>
                            <button onClick={() => openRuleEditor(rule)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit rule">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => window.confirm('Delete this maintenance rule?') && deleteRuleMutation.mutate(rule.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{editingRule ? 'Update Preventive Maintenance Rule' : 'Create Preventive Maintenance Rule'}</h3>
                <p className="text-[11px] text-slate-400 font-medium">Configure fleet-wide or vehicle-specific maintenance triggers.</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setCustomCategory(''); }}
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
                  onClick={() => { setShowAddModal(false); setCustomCategory(''); }}
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
