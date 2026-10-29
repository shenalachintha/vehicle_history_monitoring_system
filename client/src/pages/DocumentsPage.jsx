import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  AlertTriangle,
  Calendar,
  FileCheck,
  X,
  Search,
  Filter,
  Pencil,
  Trash2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const DocumentsPage = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'upload');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [formVehicleCategory, setFormVehicleCategory] = useState('');
  const [editingDocument, setEditingDocument] = useState(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
    docType: 'INSURANCE',
    title: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    warningDaysBefore: 30,
    notes: '',
  });

  const { data: vehiclesRes } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: () => api.get('/vehicles'),
  });

  const { data: documentsRes, isLoading } = useQuery({
    queryKey: ['documents', vehicleCategoryFilter, docTypeFilter],
    queryFn: () =>
      api.get('/documents', {
        params: {
          vehicleCategory: vehicleCategoryFilter || undefined,
          docType: docTypeFilter || undefined,
        },
      }),
  });

  const saveDocMutation = useMutation({
    mutationFn: ({ id, data }) => id ? api.put(`/documents/${id}`, data) : api.post('/documents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowAddModal(false);
      setEditingDocument(null);
      setFormData({
        vehicleId: '',
        docType: 'INSURANCE',
        title: '',
        documentNumber: '',
        issueDate: '',
        expiryDate: '',
        warningDaysBefore: 30,
        notes: '',
      });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: (_response, deletedDocumentId) => {
      queryClient.setQueryData(['documents', vehicleCategoryFilter, docTypeFilter], (currentResponse) => {
        if (!currentResponse?.data) return currentResponse;
        return {
          ...currentResponse,
          data: currentResponse.data.filter((document) => document.id !== deletedDocumentId),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const openDocumentEditor = (document) => {
    setEditingDocument(document);
    setFormVehicleCategory(document.vehicle?.category || '');
    setFormData({
      vehicleId: document.vehicleId,
      docType: document.docType,
      title: document.title,
      documentNumber: document.documentNumber || '',
      issueDate: document.issueDate ? document.issueDate.slice(0, 10) : '',
      expiryDate: document.expiryDate ? document.expiryDate.slice(0, 10) : '',
      warningDaysBefore: document.warningDaysBefore ?? 30,
      notes: document.notes || '',
    });
    setShowAddModal(true);
  };

  const vehicles = vehiclesRes?.data || [];
  const documents = documentsRes?.data || [];
  const now = new Date();
  const filteredVehicles = vehicles.filter(
    (vehicle) => !formVehicleCategory || vehicle.category === formVehicleCategory
  );
  const filteredDocuments = documents.filter((doc) => {
    const expiry = doc.expiryDate ? new Date(doc.expiryDate) : null;
    const diffDays = expiry
      ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (expiryFilter === 'expired') return diffDays !== null && diffDays < 0;
    if (expiryFilter === 'expiring') {
      const warningDaysBefore = Number.isFinite(Number(doc.warningDaysBefore))
        ? Number(doc.warningDaysBefore)
        : 30;
      return diffDays !== null && diffDays >= 0 && diffDays <= warningDaysBefore;
    }
    if (expiryFilter === 'valid') {
      const warningDaysBefore = Number.isFinite(Number(doc.warningDaysBefore))
        ? Number(doc.warningDaysBefore)
        : 30;
      return diffDays === null || diffDays > warningDaysBefore;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Document Compliance Center
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage provincial revenue licences, comprehensive insurance policies, fitness certificates, and emission reports.
          </p>
        </div>

        {hasRole(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Register Document
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-extrabold text-slate-800">Filter registered documents</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">All document types</option>
            <option value="INSURANCE">Insurance Policy</option>
            <option value="REVENUE_LICENCE">Revenue Licence</option>
            <option value="FITNESS_CERTIFICATE">Fitness Certificate</option>
            <option value="EMISSION_TEST">Emission Test</option>
            <option value="REGISTRATION_CARD">Registration Card</option>
            <option value="LEASE_AGREEMENT">Lease Agreement</option>
            <option value="INVOICE">Service Invoice</option>
            <option value="INSPECTION_REPORT">Inspection Report</option>
            <option value="PHOTO">Photo</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            value={vehicleCategoryFilter}
            onChange={(e) => setVehicleCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">All vehicle types</option>
            <option value="CAR">Car</option>
            <option value="VAN">Van</option>
            <option value="PICKUP">Pickup</option>
            <option value="LORRY">Lorry</option>
            <option value="BUS">Bus</option>
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="SPECIALIZED">Special vehicle</option>
          </select>
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="">All expiry statuses</option>
            <option value="expiring">Expiring within each document's threshold</option>
            <option value="expired">Expired</option>
            <option value="valid">Valid</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocuments.map((doc) => {
          const expiry = doc.expiryDate ? new Date(doc.expiryDate) : null;
          const diffDays = expiry
            ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          const isExpired = diffDays !== null && diffDays < 0;
          const warningDaysBefore = Number.isFinite(Number(doc.warningDaysBefore))
            ? Number(doc.warningDaysBefore)
            : 30;
          const isExpiringSoon =
            diffDays !== null && diffDays >= 0 && diffDays <= warningDaysBefore;

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10.5px] font-bold text-blue-600 uppercase tracking-wider block">
                      {doc.docType.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {doc.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                      isExpired
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isExpiringSoon
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isExpired
                      ? 'Expired'
                      : isExpiringSoon
                      ? `${diffDays}d left`
                      : 'Valid'}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Vehicle</span>
                    <span className="font-bold text-slate-800">{doc.vehicle?.registrationNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Policy / Doc No.</span>
                    <span className="font-semibold text-slate-700">{doc.documentNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Expiry Date</span>
                    <span
                      className={`font-bold ${
                        isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-800'
                      }`}
                    >
                      {expiry ? expiry.toLocaleDateString() : 'Permanent'}
                    </span>
                  </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Alert Threshold</span>
                      <span className="font-semibold text-slate-700">{warningDaysBefore} days before expiry</span>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    {hasRole(['ADMIN', 'FLEET_MANAGER', 'MAINTENANCE_OFFICER']) && (
                      <button onClick={() => openDocumentEditor(doc)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Edit document">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {hasRole(['ADMIN', 'FLEET_MANAGER']) && (
                      <button
                        onClick={() => window.confirm('Delete this document?') && deleteDocMutation.mutate(doc.id)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>

            </div>
          );
        })}
        {!isLoading && filteredDocuments.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 bg-white rounded-2xl p-10 border border-dashed border-slate-200 text-center">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No documents match these filters</p>
            <p className="text-xs text-slate-400 mt-1">Try changing the document, vehicle, or expiry filter.</p>
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{editingDocument ? 'Update Vehicle Document' : 'Register Vehicle Document'}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveDocMutation.mutate({ id: editingDocument?.id, data: formData });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle *</label>
                <select
                  value={formVehicleCategory}
                  onChange={(e) => {
                    setFormVehicleCategory(e.target.value);
                    setFormData({ ...formData, vehicleId: '' });
                  }}
                  className="w-full mb-2 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="">All vehicle types</option>
                  <option value="CAR">Car</option>
                  <option value="VAN">Van</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="LORRY">Lorry</option>
                  <option value="BUS">Bus</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="SPECIALIZED">Special vehicle</option>
                </select>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                >
                  <option value="">Select vehicle...</option>
                  {filteredVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNo} - {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Document Type *</label>
                  <select
                    value={formData.docType}
                    onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="INSURANCE">Insurance Policy</option>
                    <option value="REVENUE_LICENCE">Revenue Licence</option>
                    <option value="FITNESS_CERTIFICATE">Fitness Certificate</option>
                    <option value="EMISSION_TEST">Emission Test</option>
                    <option value="REGISTRATION_CARD">Registration Card</option>
                    <option value="INVOICE">Service Invoice</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Fleet Insurance"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Document / Policy Number</label>
                <input
                  type="text"
                  placeholder="e.g. POL-12345-2025"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alert Threshold (Days Before Expiry) *</label>
                <input
                  type="number"
                  min="0"
                  max="3650"
                  required
                  value={formData.warningDaysBefore}
                  onChange={(e) => setFormData({ ...formData, warningDaysBefore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
                <span className="text-[10.5px] text-slate-400">
                  This threshold applies only to this document and its vehicle.
                </span>
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
                  disabled={saveDocMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 disabled:opacity-50"
                >
                  {saveDocMutation.isPending ? 'Saving...' : editingDocument ? 'Update Document' : 'Register Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
