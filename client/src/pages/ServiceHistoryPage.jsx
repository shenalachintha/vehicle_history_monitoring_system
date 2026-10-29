import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  DollarSign,
  Gauge,
  Calendar,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ServiceHistoryPage = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');

  const [formData, setFormData] = useState({
    vehicleId: searchParams.get('vehicleId') || '',
    eventType: 'ROUTINE_SERVICE',
    title: '',
    odometerAtEvent: 0,
    workPerformed: '',
    serviceProvider: '',
    technicianName: '',
    laborCost: 0,
    partsCost: 0,
    otherCost: 0,
    recommendations: '',
    items: [
      { description: 'Engine Oil Filter', itemType: 'PART', brand: 'OEM', quantity: 1, unitCost: 25 },
      { description: 'Synthetic Motor Oil 5W-30', itemType: 'FLUID', brand: 'Mobil 1', quantity: 4, unitCost: 15 },
    ],
  });

  const { data: vehiclesRes } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: () => api.get('/vehicles'),
  });

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['events', eventTypeFilter],
    queryFn: () =>
      api.get('/events', {
        params: { eventType: eventTypeFilter || undefined },
      }),
  });

  const createEventMutation = useMutation({
    mutationFn: (newEvent) => api.post('/events', newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['dashboard-summary']);
      queryClient.invalidateQueries(['vehicles']);
      setShowAddModal(false);
    },
  });

  const events = eventsRes?.data || [];
  const vehicles = vehiclesRes?.data || [];

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: '', itemType: 'PART', brand: '', quantity: 1, unitCost: 0 },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createEventMutation.mutate({
      ...formData,
      odometerAtEvent: Number(formData.odometerAtEvent),
      laborCost: Number(formData.laborCost),
      partsCost: Number(formData.partsCost),
      otherCost: Number(formData.otherCost),
      items: formData.items.map((it) => ({
        ...it,
        quantity: Number(it.quantity),
        unitCost: Number(it.unitCost),
      })),
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Service & Event Timeline</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Historical log of routine servicing, repairs, diesel tune-ups, additives, and parts replacements.
          </p>
        </div>

        {hasRole(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Record Service Event
          </button>
        )}
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Vehicle</th>
                <th className="pb-3">Event Details</th>
                <th className="pb-3">Odometer</th>
                <th className="pb-3">Service Provider</th>
                <th className="pb-3">Cost Breakdown</th>
                <th className="pb-3 pr-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 pl-2">
                    <span className="font-extrabold text-blue-600 text-xs block">
                      {ev.vehicle?.registrationNo}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {ev.vehicle?.make} {ev.vehicle?.model}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{ev.title}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {ev.eventType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-1">{ev.workPerformed}</p>
                  </td>
                  <td className="py-4 font-bold text-slate-800">
                    {Number(ev.odometerAtEvent).toLocaleString()} km
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-slate-800 block">{ev.serviceProvider}</span>
                    <span className="text-[11px] text-slate-400">{ev.technicianName || 'N/A'}</span>
                  </td>
                  <td className="py-4">
                    <span className="font-extrabold text-slate-900 block text-xs">
                      ${Number(ev.totalCost).toFixed(2)}
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      Labor: ${Number(ev.laborCost).toFixed(0)} | Parts: ${Number(ev.partsCost).toFixed(0)}
                    </span>
                  </td>
                  <td className="py-4 pr-2 text-right text-slate-500 font-semibold text-[11.5px]">
                    {new Date(ev.eventDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Vehicle Service / Maintenance Event</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle *</label>
                  <select
                    required
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNo} - {v.make} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Event Category *</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="ROUTINE_SERVICE">Routine Service</option>
                    <option value="REPAIR_BREAKDOWN">Repair and Breakdown</option>
                    <option value="ACCIDENT_INCIDENT">Accident and Incident</option>
                    <option value="DIESEL_TUNEUP">Diesel Fuel System Tune-up</option>
                    <option value="CHEMICAL_ADDITIVE">Chemical Additive Treatment</option>
                    <option value="BRAKE_MAINTENANCE">Brake System Maintenance</option>
                    <option value="TYRE_MAINTENANCE">Tyre Maintenance / Replacement</option>
                    <option value="INSPECTION">Inspection / Emission</option>
                    <option value="PARTS_REPLACEMENT">Parts Replacement</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50,000 km Major Service"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Odometer at Event (km) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 52400"
                    value={formData.odometerAtEvent}
                    onChange={(e) => setFormData({ ...formData, odometerAtEvent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Provider / Workshop *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota Care Center"
                    value={formData.serviceProvider}
                    onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Technician Name</label>
                  <input
                    type="text"
                    placeholder="e.g. S. Bandara"
                    value={formData.technicianName}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Performed Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detail all repairs, fluid flushes, additive doses, and inspections completed..."
                  value={formData.workPerformed}
                  onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              {/* Itemized Parts & Consumables */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">Parts, Fluids & Consumables Used</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Description"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="col-span-5 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Brand/Spec"
                        value={it.brand}
                        onChange={(e) => handleItemChange(idx, 'brand', e.target.value)}
                        className="col-span-3 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="col-span-1 px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={it.unitCost}
                        onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                        className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="col-span-1 text-slate-400 hover:text-rose-500 p-1 flex justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Labor Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.laborCost}
                    onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Other Charges ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.otherCost}
                    onChange={(e) => setFormData({ ...formData, otherCost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Estimated Total</span>
                  <span className="text-base font-black text-blue-900">
                    ${(
                      Number(formData.laborCost) +
                      Number(formData.otherCost) +
                      formData.items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitCost)), 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 disabled:opacity-50"
                >
                  {createEventMutation.isPending ? 'Logging Event...' : 'Save Service Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

