import React from 'react';
import { Search, Wrench, FileUp, BarChart3, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActionRibbon = ({ onOpenServiceModal, onOpenDocModal }) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Search Vehicle',
      desc: 'Find vehicle details, history and records',
      icon: Search,
      onClick: () => navigate('/vehicles'),
    },
    {
      title: 'Add Service Record',
      desc: 'Update maintenance and service history',
      icon: Wrench,
      onClick: onOpenServiceModal || (() => navigate('/service-history?action=add')),
    },
    {
      title: 'Upload Documents',
      desc: 'Insurance, registration, permits, etc.',
      icon: FileUp,
      onClick: onOpenDocModal || (() => navigate('/documents?action=upload')),
    },
    {
      title: 'Generate Report',
      desc: 'Export and view detailed reports',
      icon: BarChart3,
      onClick: () => navigate('/reports'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.title}
            onClick={act.onClick}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                  {act.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                  {act.desc}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        );
      })}
    </div>
  );
};

