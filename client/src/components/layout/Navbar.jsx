import React, { useState } from 'react';
import { Search, Bell, LogOut, User, CheckCircle2, AlertTriangle, Shield, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { data: alertsRes } = useQuery({
    queryKey: ['navbar-alerts'],
    queryFn: () => api.get('/alerts', { params: { status: 'OPEN', limit: 5 } }),
    refetchInterval: 30000, // refresh every 30s
  });

  const alerts = alertsRes?.data || [];
  const totalOpenCount = alertsRes?.pagination?.total ?? alerts.length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/vehicles?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-18 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Global Vehicle Search */}
      <form onSubmit={handleSearch} className="relative w-80 max-w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by vehicle number, owner name or VIN..."
          className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </form>

      {/* Company Brand Badge in Header */}
      <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50/80 border border-slate-200/70 rounded-xl shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
          <img src="/logo.jpg" alt="El-Toro Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <span className="text-xs font-extrabold text-slate-800 tracking-tight block leading-tight">El-Toro Roofing Products Ltd.</span>
          <span className="text-[10px] font-semibold text-emerald-600 block leading-tight">Fleet Division</span>
        </div>
      </div>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex items-center gap-5">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {totalOpenCount > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {totalOpenCount > 99 ? '99+' : totalOpenCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                  {totalOpenCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 font-bold text-[10px] rounded-full">
                      {totalOpenCount} Active
                    </span>
                  )}
                </div>
                <span
                  className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/alerts');
                  }}
                >
                  View all
                </span>
              </div>

              <div className="py-2 space-y-2 max-h-[340px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-semibold text-slate-600">No Pending Alerts</p>
                    <p className="text-[11px] text-slate-400">All fleet vehicles and documents are in good standing.</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const isUrgent = alert.severity === 'CRITICAL' || alert.severity === 'OVERDUE';
                    return (
                      <div
                        key={alert.id}
                        className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer border border-transparent hover:border-slate-100"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/alerts');
                        }}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            isUrgent ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{alert.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">{alert.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{timeAgo(alert.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('') : 'SA'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {user?.fullName || 'Shenal Achintha'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium capitalize">
                {user?.role ? user.role.toLowerCase().replace('_', ' ') : 'Admin'}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium mt-1"
              >
                <User className="w-4 h-4 text-slate-400" />
                Profile & Settings
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

