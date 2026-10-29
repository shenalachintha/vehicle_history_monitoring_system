import React from 'react';
import {
  Wrench,
  PlusCircle,
  FileText,
  Calendar,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RecentActivityFeed = ({ activities = [] }) => {
  const navigate = useNavigate();

  const defaultActivities = [
    {
      id: 1,
      type: 'SERVICE_COMPLETED',
      title: 'Service Completed',
      subtitle: 'WP CA 1234 – Oil Change',
      timestamp: '23 Oct 2025 14:12',
      icon: Wrench,
      bgColor: 'bg-emerald-500',
    },
    {
      id: 2,
      type: 'VEHICLE_ADDED',
      title: 'Vehicle Added',
      subtitle: 'WP NC 3456 – Isuzu D-Max',
      timestamp: '23 Oct 2025 12:45',
      icon: PlusCircle,
      bgColor: 'bg-blue-500',
    },
    {
      id: 3,
      type: 'DOCUMENT_EXPIRED',
      title: 'Document Expired',
      subtitle: 'WP PF 7890 – Insurance',
      timestamp: '23 Oct 2025 09:30',
      icon: FileText,
      bgColor: 'bg-rose-500',
    },
    {
      id: 4,
      type: 'MAINTENANCE_SCHEDULED',
      title: 'Maintenance Scheduled',
      subtitle: 'WP LB 9012 – Brake Service',
      timestamp: '22 Oct 2025 16:20',
      icon: Calendar,
      bgColor: 'bg-amber-500',
    },
    {
      id: 5,
      type: 'LOCATION_UPDATED',
      title: 'Location Updated',
      subtitle: 'WP KA 5678 – Near Kinniya',
      timestamp: '22 Oct 2025 15:05',
      icon: MapPin,
      bgColor: 'bg-blue-600',
    },
  ];

  const items = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">Recent Activity</h3>
        <button
          onClick={() => navigate('/service-history')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative pl-6 space-y-5 flex-1 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100">
        {items.map((act) => {
          const Icon = act.icon || Wrench;
          return (
            <div key={act.id} className="relative flex items-start gap-3">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full ${
                  act.bgColor || 'bg-blue-500'
                } text-white flex items-center justify-center ring-4 ring-white shadow-xs`}
              >
                <Icon className="w-2.5 h-2.5 stroke-[3]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {act.title}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium truncate mt-0.5">
                  {act.subtitle || act.description}
                </p>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  {act.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

