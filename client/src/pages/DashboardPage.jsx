import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Wrench, AlertTriangle, Calendar } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusDonutChart } from '../components/dashboard/StatusDonutChart';
import { MaintenanceTrendsChart } from '../components/dashboard/MaintenanceTrendsChart';
import { FleetMapWidget } from '../components/dashboard/FleetMapWidget';
import { RecentVehiclesTable } from '../components/dashboard/RecentVehiclesTable';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { QuickActionRibbon } from '../components/dashboard/QuickActionRibbon';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      setCurrentDateTime(now.toLocaleDateString('en-GB', options).replace(',', ''));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: summaryResponse, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/reports/dashboard-summary'),
    refetchInterval: 30000,
  });

  const summary = summaryResponse?.data || {};
  const kpi = summary.kpi || {};

  return (
    <div className="space-y-7 max-w-[1600px] mx-auto pb-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome, {user?.fullName || 'Shenal Achintha'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Here's an overview of your vehicle monitoring system.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            {currentDateTime || 'Thu, 23 Oct 2025 02:24 PM'}
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Vehicles"
          value={kpi.totalVehicles ?? 48}
          trend="↑ 6%"
          isPositive={true}
          icon={Car}
          iconBgColor="bg-blue-600"
        />
        <MetricCard
          title="Under Maintenance"
          value={kpi.underMaintenance ?? 7}
          trend="↑ 2%"
          isPositive={true}
          icon={Wrench}
          iconBgColor="bg-emerald-500"
        />
        <MetricCard
          title="Expired Documents"
          value={kpi.expiredDocuments ?? 3}
          trend="↓ 1%"
          isPositive={false}
          icon={AlertTriangle}
          iconBgColor="bg-amber-500"
        />
        <MetricCard
          title="This Month Services"
          value={kpi.thisMonthServices ?? 12}
          trend={`↑ ${kpi.serviceGrowthPercent ?? 4}%`}
          isPositive={true}
          icon={Calendar}
          iconBgColor="bg-indigo-600"
        />
      </div>

      {/* Middle Grid: Charts & Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 h-full">
          <StatusDonutChart
            data={summary.statusOverview}
            totalVehicles={kpi.totalVehicles ?? 48}
          />
        </div>
        <div className="lg:col-span-4 h-full">
          <MaintenanceTrendsChart data={summary.maintenanceTrends} />
        </div>
        <div className="lg:col-span-4 h-full">
          <FleetMapWidget vehicles={summary.liveVehicles} />
        </div>
      </div>

      {/* Bottom Grid: Recent Vehicles & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <RecentVehiclesTable vehicles={summary.recentVehicles} />
          <QuickActionRibbon />
        </div>
        <div className="lg:col-span-4 h-full">
          <RecentActivityFeed activities={summary.recentActivities} />
        </div>
      </div>
    </div>
  );
};

