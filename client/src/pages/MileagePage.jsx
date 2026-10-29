import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Gauge,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Save,
  Search,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';

export const MileagePage = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('bulk'); // 'bulk' | 'history' | 'missing'
  const [missingDaysThreshold, setMissingDaysThreshold] = useState(7);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all active vehicles for the weekly sheet
  const { data: vehiclesRes, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles-mileage'],
    queryFn: () => api.get('/vehicles'),
  });

  // Fetch missing weekly vehicles
  const { data: missingRes } = useQuery({
    queryKey: ['missing-weekly', missingDaysThreshold],
    queryFn: () => api.get(`/mileage/missing-weekly?days=${missingDaysThreshold}`),
  });

  // Fetch recent mileage logs
  const { data: logsRes } = useQuery({
    queryKey: ['mileage-logs'],
    queryFn: () => api.get('/mileage'),
  });

  const vehicles = vehiclesRes?.data || [];
  const missingVehicles = missingRes?.data || [];
  const logs = logsRes?.data || [];

  // Sheet row inputs
  const [readingsState, setReadingsState] = useState({});

  const handleInputChange = (vehicleId, field, value) => {
    setReadingsState((prev) => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        [field]: value,
      },
    }));
  };

  const recordSingleMutation = useMutation({
    mutationFn: (data) => api.post('/mileage/record', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles-mileage']);
      queryClient.invalidateQueries(['missing-weekly']);
      queryClient.invalidateQueries(['mileage-logs']);
      queryClient.invalidateQueries(['dashboard-summary']);
      setSuccessMessage('Odometer reading successfully recorded and verified.');
      setErrorMessage('');
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to record reading.');
      setSuccessMessage('');
    },
  });

  const handleSaveRow = (vehicle) => {
    const row = readingsState[vehicle.id] || {};
    const newReading = Number(row.reading);

    if (isNaN(newReading) || newReading <= 0) {
      setErrorMessage(`Please enter a valid odometer number for ${vehicle.registrationNo}.`);
      return;
    }

    const currentKm = Number(vehicle.currentOdometer);
    if (newReading < currentKm && !row.isCorrection) {
      setErrorMessage(
        `Negative distance detected for ${vehicle.registrationNo} (${newReading} km < current ${currentKm} km). If this is an authorized instrument cluster replacement or correction, check 'Authorized Correction' and provide a reason.`
      );
      return;
    }

    recordSingleMutation.mutate({
      vehicleId: vehicle.id,
      odometerReading: newReading,
      isCorrection: !!row.isCorrection,
      correctionReason: row.correctionReason || null,
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Weekly Mileage Recording & Verification
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Submit weekly odometer updates, monitor distance deltas, and audit anomalies or rollovers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            {missingVehicles.length} Vehicles Missing Updates
          </span>
        </div>
      </div>

      {/* Alerts / Feedback Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'bulk'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Weekly Bulk Entry Sheet
        </button>
        <button
          onClick={() => setActiveTab('missing')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'missing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Missing Submissions
          {missingVehicles.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {missingVehicles.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Historical Mileage Log
        </button>
      </div>

      {/* Tab 1: Weekly Bulk Entry Sheet */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Active Vehicles Entry Sheet</h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Enter current valid odometer. Delta distance is calculated automatically.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Vehicle</th>
                  <th className="pb-3">Driver</th>
                  <th className="pb-3">Previous Odometer</th>
                  <th className="pb-3">New Reading (km)</th>
                  <th className="pb-3">Distance Delta</th>
                  <th className="pb-3">Correction / Rollover?</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {vehicles.map((v) => {
                  const row = readingsState[v.id] || {};
                  const newKm = row.reading !== undefined ? Number(row.reading) : '';
                  const prevKm = Number(v.currentOdometer);
                  const delta = typeof newKm === 'number' && !isNaN(newKm) && newKm > 0 ? newKm - prevKm : null;
                  const isNegative = delta !== null && delta < 0;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-2">
                        <span className="font-bold text-slate-900 block">{v.registrationNo}</span>
                        <span className="text-[11px] text-slate-400">{v.make} {v.model}</span>
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {v.assignedDriver || 'None'}
                      </td>
                      <td className="py-3.5 font-bold text-slate-800">
                        {prevKm.toLocaleString()} km
                      </td>
                      <td className="py-3.5">
                        <input
                          type="number"
                          placeholder={`${prevKm}`}
                          value={row.reading || ''}
                          onChange={(e) => handleInputChange(v.id, 'reading', e.target.value)}
                          className={`w-32 px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 ${
                            isNegative && !row.isCorrection
                              ? 'border-rose-400 bg-rose-50 text-rose-800 focus:ring-rose-400'
                              : 'border-slate-200 bg-white text-slate-900 focus:ring-blue-500/20'
                          }`}
                        />
                      </td>
                      <td className="py-3.5">
                        {delta !== null ? (
                          <span
                            className={`font-extrabold ${
                              delta < 0
                                ? 'text-rose-600'
                                : delta > 3000
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {delta > 0 ? `+${delta.toLocaleString()} km` : `${delta.toLocaleString()} km`}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!row.isCorrection}
                              onChange={(e) => handleInputChange(v.id, 'isCorrection', e.target.checked)}
                              className="rounded text-blue-600 focus:ring-0"
                            />
                            <span className="text-[11px] font-semibold text-slate-600">Exception</span>
                          </label>

                          {row.isCorrection && (
                            <input
                              type="text"
                              placeholder="Reason for change..."
                              value={row.correctionReason || ''}
                              onChange={(e) => handleInputChange(v.id, 'correctionReason', e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-[11px] w-36"
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => handleSaveRow(v)}
                          disabled={recordSingleMutation.isPending}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Missing Weekly Submissions */}
      {activeTab === 'missing' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                Vehicles With Overdue Mileage Submissions
              </h3>
              <p className="text-[11px] text-slate-400">
                Identify vehicles with no recorded odometer updates within the selected timeframe.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Threshold:</span>
              <select
                value={missingDaysThreshold}
                onChange={(e) => setMissingDaysThreshold(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={7}>No update in &gt; 7 days (Weekly Standard)</option>
                <option value={3}>No update in &gt; 3 days</option>
                <option value={1}>No update in &gt; 1 day (Daily Tracking)</option>
                <option value={14}>No update in &gt; 14 days</option>
              </select>
            </div>
          </div>
          {missingVehicles.length === 0 ? (
            <p className="text-xs text-emerald-600 font-bold py-6 text-center">
              All company vehicles have up-to-date weekly mileage recorded!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="pb-3 pl-2">Vehicle</th>
                    <th className="pb-3">Make / Model</th>
                    <th className="pb-3">Responsible Driver</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Current Odometer</th>
                    <th className="pb-3 pr-2 text-right">Last Submission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {missingVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3.5 pl-2 font-black text-rose-600">{v.registrationNo}</td>
                      <td className="py-3.5 font-medium text-slate-800">{v.make} {v.model}</td>
                      <td className="py-3.5 font-bold text-slate-800">{v.assignedDriver || 'None'}</td>
                      <td className="py-3.5 text-slate-600">{v.driverContact || '-'}</td>
                      <td className="py-3.5 font-bold text-slate-900">{Number(v.currentOdometer).toLocaleString()} km</td>
                      <td className="py-3.5 pr-2 text-right text-slate-400 font-medium">
                        {v.odometerLastUpdated ? new Date(v.odometerLastUpdated).toLocaleDateString() : 'Never Recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Historical Log */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-4">All Historical Odometer Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="pb-3 pl-2">Vehicle</th>
                  <th className="pb-3">Recorded Date</th>
                  <th className="pb-3">Week</th>
                  <th className="pb-3">Odometer</th>
                  <th className="pb-3">Distance Delta</th>
                  <th className="pb-3">Recorded By</th>
                  <th className="pb-3 pr-2 text-right">Status / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3.5 pl-2 font-bold text-blue-600">{log.vehicle?.registrationNo}</td>
                    <td className="py-3.5 text-slate-700 font-medium">{new Date(log.recordedDate).toLocaleDateString()}</td>
                    <td className="py-3.5 text-slate-500">Wk {log.weekNumber}, {log.year}</td>
                    <td className="py-3.5 font-bold text-slate-900">{Number(log.odometerReading).toLocaleString()} km</td>
                    <td className="py-3.5 font-extrabold text-emerald-600">+{Number(log.distanceTravelled).toLocaleString()} km</td>
                    <td className="py-3.5 text-slate-600">{log.recordedBy?.fullName || 'System'}</td>
                    <td className="py-3.5 pr-2 text-right">
                      {log.isFlagged ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {log.flagReason || 'Flagged'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

