import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  Filter,
  Eye,
  Fuel,
  Gauge,
  User,
  Building2,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const VehiclesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    registrationNo: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'CAR',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    currentOdometer: 0,
    assignedDriver: '',
    driverContact: '',
    department: '',
    branch: '',
    vin: '',
    thumbnailUrl: '',
  });
  const [formError, setFormError] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['vehicles', searchTerm, statusFilter, categoryFilter],
    queryFn: () =>
      api.get('/vehicles', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        },
      }),
  });

  const createMutation = useMutation({
    mutationFn: (newVehicle) => api.post('/vehicles', newVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      queryClient.invalidateQueries(['dashboard-summary']);
      setShowAddModal(false);
      setFormData({
        registrationNo: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        category: 'CAR',
        fuelType: 'PETROL',
        transmission: 'AUTOMATIC',
        currentOdometer: 0,
        assignedDriver: '',
        driverContact: '',
        department: '',
        branch: '',
        vin: '',
        thumbnailUrl: '',
      });
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to register vehicle.');
    },
  });

  const vehicles = response?.data || [];

  // Reset to first page when any filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, pageSize]);

  const totalItems = vehicles.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedVehicles = vehicles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    createMutation.mutate({
      ...formData,
      year: Number(formData.year),
      currentOdometer: Number(formData.currentOdometer),
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Vehicle Registry</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage company vehicles, operational assignments, and profile configurations.
          </p>
        </div>

        {hasRole(['ADMIN', 'FLEET_MANAGER']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Register Vehicle
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by registration number, make, model, driver..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Categories</option>
            <option value="CAR">Car</option>
            <option value="VAN">Van</option>
            <option value="PICKUP">Pickup</option>
            <option value="LORRY">Lorry</option>
            <option value="BUS">Bus</option>
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="SPECIALIZED">Specialized</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400">Loading fleet registry...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No vehicles found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or register a new company vehicle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedVehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/vehicles/${v.id}`)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={v.thumbnailUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=100&auto=format&fit=crop&q=80'}
                      alt={v.registrationNo}
                      className="w-14 h-10 object-cover rounded-lg border border-slate-200"
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {v.registrationNo}
                      </h4>
                      <p className="text-xs font-medium text-slate-500">
                        {v.make} {v.model} ({v.year})
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${
                      v.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : v.status === 'UNDER_MAINTENANCE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {v.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-800">{Number(v.currentOdometer).toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Fuel className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="capitalize">{v.fuelType.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 truncate">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{v.assignedDriver || 'No Driver'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 truncate">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{v.department || 'HQ Fleet'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-blue-600 font-bold group-hover:underline">
                <span>View Complete Profile</span>
                <Eye className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
              of <strong className="text-slate-800">{totalItems}</strong> vehicles
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value={6}>6 per page</option>
              <option value={9}>9 per page</option>
              <option value={15}>15 per page</option>
              <option value={30}>30 per page</option>
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

      {/* Register Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register New Company Vehicle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WP CA 1234"
                    value={formData.registrationNo}
                    onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">VIN / Chassis No.</label>
                  <input
                    type="text"
                    placeholder="17-character VIN"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Make *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corolla"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Year</label>
                  <input
                    type="number"
                    min="1950"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Odometer (km) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 50000"
                    value={formData.currentOdometer}
                    onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="CAR">Car</option>
                    <option value="VAN">Van</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="LORRY">Lorry</option>
                    <option value="BUS">Bus</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="SPECIALIZED">Specialized</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Driver</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={formData.assignedDriver}
                    onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Contact</label>
                  <input
                    type="text"
                    placeholder="e.g. 077 123 4567"
                    value={formData.driverContact}
                    onChange={(e) => setFormData({ ...formData, driverContact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/vehicle-photo.jpg"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  <span className="text-[10.5px] text-slate-400">
                    Paste a publicly accessible image link. The image will be shown in the fleet list and vehicle details.
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
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Registering...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
