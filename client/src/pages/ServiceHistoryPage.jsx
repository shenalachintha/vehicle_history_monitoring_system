import React, { useState, useEffect, useMemo } from 'react';
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
  Eye,
  ChevronLeft,
  ChevronRight,
  Car,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const ServiceHistoryPage = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const { formatCurrency, currencySymbol, settings } = useSettings();
  const [searchParams] = useSearchParams();

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(searchParams.get('vehicleId') || '');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');
  const [viewingEvent, setViewingEvent] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: searchParams.get('vehicleId') || '',
    eventType: 'ROUTINE_SERVICE',
    title: '',
    odometerAtEvent: '',
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

  const vehicles = vehiclesRes?.data || [];

  const { data: rulesRes } = useQuery({
    queryKey: ['maintenance-rules'],
    queryFn: () => api.get('/maintenance'),
  });

  const allRules = rulesRes?.data || [];
  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);
  const vehicleRules = allRules.filter(
    (r) => !r.vehicleId || r.vehicleId === formData.vehicleId || (selectedVehicle && r.vehicleCategory === selectedVehicle.category)
  );

  // Auto-fill parameters when in URL
  useEffect(() => {
    const paramVehId = searchParams.get('vehicleId');
    const paramRuleId = searchParams.get('ruleId');
    const paramTitle = searchParams.get('title');
    if (paramVehId || paramRuleId || paramTitle) {
      const match = vehicles.find((v) => v.id === paramVehId);
      setFormData((prev) => ({
        ...prev,
        vehicleId: paramVehId || prev.vehicleId,
        ruleIdToComplete: paramRuleId || prev.ruleIdToComplete || '',
        title: paramTitle || prev.title,
        odometerAtEvent: match?.currentOdometer ?? prev.odometerAtEvent,
      }));
      if (searchParams.get('action') === 'add') {
        setShowAddModal(true);
      }
    }
  }, [searchParams, vehicles]);

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
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] });
      setShowAddModal(false);
    },
  });

  const allEvents = eventsRes?.data || [];

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchesVeh = !selectedVehicleId || ev.vehicleId === selectedVehicleId;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ev.vehicle?.registrationNo?.toLowerCase().includes(q) ||
        ev.vehicle?.make?.toLowerCase().includes(q) ||
        ev.vehicle?.model?.toLowerCase().includes(q) ||
        ev.title?.toLowerCase().includes(q) ||
        ev.serviceProvider?.toLowerCase().includes(q) ||
        ev.technicianName?.toLowerCase().includes(q) ||
        ev.workPerformed?.toLowerCase().includes(q);
      return matchesVeh && matchesSearch;
    });
  }, [allEvents, selectedVehicleId, searchQuery]);

  // Pagination calculation
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedVehicleId, eventTypeFilter, pageSize]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCost = allEvents.reduce((sum, e) => sum + Number(e.totalCost || 0), 0);
    const routineCount = allEvents.filter((e) => e.eventType === 'ROUTINE_SERVICE').length;
    const repairCount = allEvents.filter((e) => e.eventType === 'REPAIR_BREAKDOWN').length;
    return {
      totalCount: allEvents.length,
      totalCost,
      routineCount,
      repairCount,
    };
  }, [allEvents]);

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
      currency: settings?.currency || 'LKR',
      odometerAtEvent:
        formData.odometerAtEvent !== '' && formData.odometerAtEvent !== null && !isNaN(Number(formData.odometerAtEvent))
          ? Number(formData.odometerAtEvent)
          : undefined,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Service & Event Hub</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Log, track, and audit maintenance events, routine servicing, and parts replacements.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Services</p>
            <p className="text-lg font-black text-slate-900">{summaryMetrics.totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Expenditure</p>
            <p className="text-lg font-black text-slate-900">{formatCurrency(summaryMetrics.totalCost)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Routine Periodic</p>
            <p className="text-lg font-black text-slate-900">{summaryMetrics.routineCount} Events</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Repairs & Breakdowns</p>
            <p className="text-lg font-black text-slate-900">{summaryMetrics.repairCount} Events</p>
          </div>
        </div>
      </div>

      {/* Modern Filter & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle reg, title, workshop or technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Vehicle Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Vehicles ({vehicles.length})</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNo} — {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Service Categories</option>
              <option value="ROUTINE_SERVICE">Routine Service</option>
              <option value="REPAIR_BREAKDOWN">Repair & Breakdown</option>
              <option value="ACCIDENT_INCIDENT">Accident / Incident</option>
              <option value="DIESEL_TUNEUP">Diesel Tune-up</option>
              <option value="CHEMICAL_ADDITIVE">Chemical Additive</option>
              <option value="BRAKE_MAINTENANCE">Brake Maintenance</option>
              <option value="TYRE_MAINTENANCE">Tyre Maintenance</option>
              <option value="INSPECTION">Inspection / Emission</option>
              <option value="PARTS_REPLACEMENT">Parts Replacement</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || selectedVehicleId || eventTypeFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900">{filteredEvents.length}</strong> matching records
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedVehicleId('');
                setEventTypeFilter('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Events Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 pl-4">Vehicle</th>
                <th className="py-3.5">Event Details</th>
                <th className="py-3.5">Mileage</th>
                <th className="py-3.5">Workshop / Technician</th>
                <th className="py-3.5">Total Cost</th>
                <th className="py-3.5">Service Date</th>
                <th className="py-3.5 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-60" />
                    <p className="font-bold text-sm text-slate-600">No service events found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or record a new service event.</p>
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setViewingEvent(ev)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 pl-4">
                      <span className="font-extrabold text-blue-600 text-xs block group-hover:underline">
                        {ev.vehicle?.registrationNo}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {ev.vehicle?.make} {ev.vehicle?.model}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{ev.title}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {ev.eventType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 mt-0.5 line-clamp-1">{ev.workPerformed}</p>
                    </td>
                    <td className="py-3.5 font-bold text-slate-800">
                      {Number(ev.odometerAtEvent).toLocaleString()} km
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold text-slate-800 block">{ev.serviceProvider}</span>
                      <span className="text-[11px] text-slate-400">{ev.technicianName || 'N/A'}</span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-extrabold text-slate-900 block text-xs">
                        {formatCurrency(ev.totalCost)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Labor: {formatCurrency(ev.laborCost)} | Parts: {formatCurrency(ev.partsCost)}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600 font-semibold text-[11.5px]">
                      {new Date(ev.eventDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingEvent(ev);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
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
                of <strong className="text-slate-800">{totalItems}</strong> entries
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

      {/* Event Details Dossier Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {viewingEvent.eventType.replace(/_/g, ' ')}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{viewingEvent.title}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {viewingEvent.vehicle?.registrationNo} — {viewingEvent.vehicle?.make} {viewingEvent.vehicle?.model}
                </p>
              </div>
              <button
                onClick={() => setViewingEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-xs">
              <div>
                <span className="text-[10.5px] text-slate-400 block font-medium">Event Date</span>
                <span className="font-bold text-slate-800">
                  {new Date(viewingEvent.eventDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400 block font-medium">Odometer</span>
                <span className="font-bold text-slate-800">
                  {Number(viewingEvent.odometerAtEvent).toLocaleString()} km
                </span>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400 block font-medium">Service Provider</span>
                <span className="font-bold text-slate-800 truncate block" title={viewingEvent.serviceProvider}>
                  {viewingEvent.serviceProvider}
                </span>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400 block font-medium">Technician</span>
                <span className="font-bold text-slate-800">
                  {viewingEvent.technicianName || 'N/A'}
                </span>
              </div>
            </div>

            {/* Work Performed */}
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-slate-900">Work Performed</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {viewingEvent.workPerformed}
              </div>
            </div>

            {/* Issue Description if any */}
            {viewingEvent.issueDescription && (
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900">Reported Issue</h4>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-rose-900 whitespace-pre-wrap leading-relaxed">
                  {viewingEvent.issueDescription}
                </div>
              </div>
            )}

            {/* Parts & Consumables itemized table */}
            {viewingEvent.items && viewingEvent.items.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">Parts, Fluids & Consumables Installed</h4>
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase">
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Brand/Spec</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Cost</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {viewingEvent.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{it.description}</td>
                          <td className="py-2 px-3 text-[10.5px] text-slate-500">{it.itemType}</td>
                          <td className="py-2 px-3 text-slate-600">{it.brand || '-'}</td>
                          <td className="py-2 px-3 text-center">{it.quantity}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(it.unitCost)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(Number(it.quantity) * Number(it.unitCost))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Cost Breakdown</h4>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Labor Charges:</span>
                  <span className="font-bold">{formatCurrency(viewingEvent.laborCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parts & Consumables:</span>
                  <span className="font-bold">{formatCurrency(viewingEvent.partsCost)}</span>
                </div>
                {Number(viewingEvent.otherCost) > 0 && (
                  <div className="flex justify-between">
                    <span>Other Ancillary Charges:</span>
                    <span className="font-bold">{formatCurrency(viewingEvent.otherCost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total Event Cost:</span>
                  <span className="text-blue-600">{formatCurrency(viewingEvent.totalCost)}</span>
                </div>
              </div>
            </div>

            {/* Recommendations if any */}
            {viewingEvent.recommendations && (
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900">Recommendations / Next Actions</h4>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-amber-900 leading-relaxed">
                  {viewingEvent.recommendations}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingEvent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matchVeh = vehicles.find((v) => v.id === selectedId);
                      setFormData({
                        ...formData,
                        vehicleId: selectedId,
                        odometerAtEvent: matchVeh?.currentOdometer !== undefined ? matchVeh.currentOdometer : '',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNo} - {v.make} {v.model} ({Number(v.currentOdometer || 0).toLocaleString()} km)
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">
                      Odometer at Event (km)
                    </label>
                    <span className="text-[10.5px] font-semibold text-slate-400">
                      Optional
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder={
                      formData.vehicleId && vehicles.find((v) => v.id === formData.vehicleId)
                        ? `Current: ${Number(vehicles.find((v) => v.id === formData.vehicleId)?.currentOdometer || 0).toLocaleString()} km`
                        : "e.g. 52400 (blank = current reading)"
                    }
                    value={formData.odometerAtEvent}
                    onChange={(e) => setFormData({ ...formData, odometerAtEvent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formData.vehicleId && vehicles.find((v) => v.id === formData.vehicleId)
                      ? `Auto-filled from vehicle profile. Leave blank to automatically use current reading.`
                      : 'Select vehicle above to auto-fill current reading.'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Fulfills Maintenance Rule & Clears Warnings (Optional)
                  </label>
                  <select
                    value={formData.ruleIdToComplete || ''}
                    onChange={(e) => {
                      const selectedRuleId = e.target.value;
                      const matchedRule = vehicleRules.find((r) => r.id === selectedRuleId);
                      setFormData({
                        ...formData,
                        ruleIdToComplete: selectedRuleId,
                        title: formData.title || (matchedRule ? matchedRule.name : ''),
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="">Auto-detect from title or complete routine maintenance</option>
                    {vehicleRules.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.intervalKm ? `${Number(r.intervalKm).toLocaleString()} km` : ''}{r.intervalMonths ? ` / ${r.intervalMonths} mo` : ''})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    Selecting this advances the rule's next due counter and immediately clears its active warnings from the vehicle profile.
                  </p>
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
                  <label className="font-bold text-slate-700 block mb-1">
                    Labor Cost ({currencySymbol || 'Rs.'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.laborCost}
                    onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Other Charges ({currencySymbol || 'Rs.'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.otherCost}
                    onChange={(e) => setFormData({ ...formData, otherCost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Estimated Total</span>
                  <span className="text-base font-black text-blue-900 truncate" title={formatCurrency(
                    Number(formData.laborCost) +
                    Number(formData.otherCost) +
                    formData.items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitCost)), 0)
                  )}>
                    {formatCurrency(
                      Number(formData.laborCost) +
                      Number(formData.otherCost) +
                      formData.items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitCost)), 0)
                    )}
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
