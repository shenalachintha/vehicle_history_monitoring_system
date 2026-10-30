import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Wrench,
  CalendarDays,
  FileText,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  Gauge,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Vehicles', path: '/vehicles', icon: Car },
  { name: 'Service History', path: '/service-history', icon: Wrench },
  { name: 'Maintenance', path: '/maintenance', icon: CalendarDays },
  { name: 'Weekly Mileage', path: '/mileage', icon: Gauge },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Users', path: '/users', icon: Users, roles: ['ADMIN', 'FLEET_MANAGER'] },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const { hasRole } = useAuth();
  const { settings } = useSettings();

  return (
    <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 shadow-xl select-none">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/60 bg-slate-900/50">
          <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-black/30 shrink-0 overflow-hidden border border-slate-200/20">
            <img src="/logo.jpg" alt="El-Toro Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-white text-[12px] leading-tight tracking-tight truncate max-w-[155px]" title={settings.companyName || 'El-Toro Roofing Products Ltd.'}>
              {settings.companyName || 'El-Toro Roofing Products Ltd.'}
            </h1>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-wide truncate mt-0.5">Fleet Monitoring System</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3.5 py-5 space-y-1">
          {navigationItems.map((item) => {
            if (item.roles && !hasRole(item.roles)) return null;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="px-6 py-5 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">System Online</span>
          </div>
          <span className="text-slate-500 font-semibold tracking-wider text-[11px]">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

