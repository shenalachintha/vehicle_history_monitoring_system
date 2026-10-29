import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  X,
  Search,
  Check,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: 'password123',
    fullName: '',
    role: 'VIEWER',
    department: 'Operations',
    phone: '',
  });

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get('/auth/users'),
  });

  const createUserMutation = useMutation({
    mutationFn: (newUser) => api.post('/auth/register', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries(['users-list']);
      setShowAddModal(false);
      setFormData({
        email: '',
        password: 'password123',
        fullName: '',
        role: 'VIEWER',
        department: 'Operations',
        phone: '',
      });
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to create user account.');
    },
  });

  const defaultUsers = [
    {
      id: '1',
      fullName: 'Shenal Achintha',
      email: 'admin@fleetguard.com',
      role: 'ADMIN',
      department: 'Executive Fleet Operations',
      phone: '+94 77 123 4567',
      isActive: true,
      createdAt: '2025-01-10T00:00:00.000Z',
    },
    {
      id: '2',
      fullName: 'Kavindu Silva',
      email: 'manager@fleetguard.com',
      role: 'FLEET_MANAGER',
      department: 'Logistics & Dispatch',
      phone: '+94 77 987 6543',
      isActive: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: '3',
      fullName: 'Tharindu Jayasinghe',
      email: 'officer@fleetguard.com',
      role: 'MAINTENANCE_OFFICER',
      department: 'Technical & Engineering',
      phone: '+94 71 456 7890',
      isActive: true,
      createdAt: '2025-02-01T00:00:00.000Z',
    },
    {
      id: '4',
      fullName: 'Saman Kumara',
      email: 'recorder@fleetguard.com',
      role: 'MILEAGE_RECORDER',
      department: 'Field Operations',
      phone: '+94 78 234 5678',
      isActive: true,
      createdAt: '2025-02-10T00:00:00.000Z',
    },
    {
      id: '5',
      fullName: 'Chandima Fernando',
      email: 'viewer@fleetguard.com',
      role: 'VIEWER',
      department: 'Corporate Management',
      phone: '+94 77 567 8901',
      isActive: true,
      createdAt: '2025-02-15T00:00:00.000Z',
    },
  ];

  const rawUsers = usersRes?.data || [];
  const users = rawUsers.length > 0 ? rawUsers : defaultUsers;

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FLEET_MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MAINTENANCE_OFFICER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MILEAGE_RECORDER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">User Accounts & Access Control</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage system roles, administrative permissions, department assignments, and authorized officers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      {/* Role Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[
          { role: 'System Admin', count: users.filter(u => u.role === 'ADMIN').length, desc: 'Full system control & configuration', color: 'border-purple-200 bg-purple-50/40 text-purple-700' },
          { role: 'Fleet Manager', count: users.filter(u => u.role === 'FLEET_MANAGER').length, desc: 'Schedules, fleet directory, rules', color: 'border-blue-200 bg-blue-50/40 text-blue-700' },
          { role: 'Maintenance Officer', count: users.filter(u => u.role === 'MAINTENANCE_OFFICER').length, desc: 'Service events & work orders', color: 'border-amber-200 bg-amber-50/40 text-amber-700' },
          { role: 'Mileage Recorder', count: users.filter(u => u.role === 'MILEAGE_RECORDER').length, desc: 'Weekly odometer submissions', color: 'border-emerald-200 bg-emerald-50/40 text-emerald-700' },
          { role: 'Executive Viewer', count: users.filter(u => u.role === 'VIEWER').length, desc: 'Read-only analytics & reporting', color: 'border-slate-200 bg-slate-50 text-slate-700' },
        ].map((item) => (
          <div key={item.role} className={`p-4 rounded-2xl border ${item.color} flex flex-col justify-between`}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{item.role}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{item.count}</p>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium mt-2">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Search & Users Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name, email, department..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">User Name</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">System Role</th>
                <th className="pb-3">Assigned Department</th>
                <th className="pb-3">Contact Phone</th>
                <th className="pb-3">Account Status</th>
                <th className="pb-3 pr-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        {u.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{u.fullName}</span>
                        {currentUser?.email === u.email && (
                          <span className="text-[10px] text-blue-600 font-bold">(You)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600">{u.email}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${getRoleBadge(u.role)}`}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-700">{u.department || 'HQ Fleet'}</td>
                  <td className="py-3.5 text-slate-500">{u.phone || '-'}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 pr-2 text-right text-slate-400 font-medium text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Fleet User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate(formData);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Rajapaksha"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="ADMIN">System Admin</option>
                    <option value="FLEET_MANAGER">Fleet Manager</option>
                    <option value="MAINTENANCE_OFFICER">Maintenance Officer</option>
                    <option value="MILEAGE_RECORDER">Mileage Recorder</option>
                    <option value="VIEWER">Viewer / Management</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Logistics"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 077 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
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
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

