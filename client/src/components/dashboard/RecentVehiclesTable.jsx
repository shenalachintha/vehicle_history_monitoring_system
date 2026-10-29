import React from 'react';
import { Eye, MoreVertical, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RecentVehiclesTable = ({ vehicles = [] }) => {
  const navigate = useNavigate();

  const sampleList = [
    {
      id: '1',
      registrationNo: 'WP CA 1234',
      make: 'Toyota',
      model: 'Corolla',
      assignedDriver: 'Nimal Perera',
      driverContact: '077 123 4567',
      status: 'ACTIVE',
      updatedAt: '23 Oct 2025 14:12',
      thumbnailUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '2',
      registrationNo: 'WP KA 5678',
      make: 'Honda',
      model: 'Civic',
      assignedDriver: 'Kavindu Silva',
      driverContact: '077 987 6543',
      status: 'ACTIVE',
      updatedAt: '23 Oct 2025 13:50',
      thumbnailUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '3',
      registrationNo: 'WP LB 9012',
      make: 'Nissan',
      model: 'Note',
      assignedDriver: 'Tharindu Jayasinghe',
      driverContact: '071 456 7890',
      status: 'UNDER_MAINTENANCE',
      updatedAt: '23 Oct 2025 11:20',
      thumbnailUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '4',
      registrationNo: 'WP NC 3456',
      make: 'Isuzu',
      model: 'D-Max',
      assignedDriver: 'Saman Kumara',
      driverContact: '078 234 5678',
      status: 'ACTIVE',
      updatedAt: '23 Oct 2025 10:45',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '5',
      registrationNo: 'WP PF 7890',
      make: 'Suzuki',
      model: 'Alto',
      assignedDriver: 'Chandima Fernando',
      driverContact: '077 567 8901',
      status: 'EXPIRED_DOC',
      updatedAt: '23 Oct 2025 09:30',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=100&auto=format&fit=crop&q=80',
    },
  ];

  const list = vehicles.length > 0 ? vehicles : sampleList;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case 'UNDER_MAINTENANCE':
      case 'MAINTENANCE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Maintenance
          </span>
        );
      case 'EXPIRED_DOC':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Expired Doc
          </span>
        );
      case 'OUT_OF_SERVICE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Out of Service
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">Recent Vehicles</h3>
        <button
          onClick={() => navigate('/vehicles')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
        >
          View All Vehicles
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pl-2">Vehicle No.</th>
              <th className="pb-3">Make / Model</th>
              <th className="pb-3">Owner / Driver</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Last Updated</th>
              <th className="pb-3 pr-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-xs font-medium text-slate-700">
            {list.map((v) => (
              <tr key={v.id || v.registrationNo} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 pl-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={v.thumbnailUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=100&auto=format&fit=crop&q=80'}
                      alt={v.registrationNo}
                      className="w-10 h-7 object-cover rounded-md border border-slate-200 shadow-xs"
                    />
                    <span className="font-bold text-slate-900 tracking-tight">
                      {v.registrationNo}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 font-semibold text-slate-800">
                  {v.make} {v.model}
                </td>
                <td className="py-3.5">
                  <p className="font-medium text-slate-900">{v.assignedDriver || 'Unassigned'}</p>
                  <p className="text-[11px] text-slate-400">{v.driverContact || '-'}</p>
                </td>
                <td className="py-3.5">
                  {renderStatusBadge(v.status)}
                </td>
                <td className="py-3.5 text-slate-500 font-medium text-[11.5px]">
                  {typeof v.updatedAt === 'string' && v.updatedAt.includes('T')
                    ? new Date(v.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : v.updatedAt}
                </td>
                <td className="py-3.5 pr-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/vehicles/${v.id || 1}`)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

