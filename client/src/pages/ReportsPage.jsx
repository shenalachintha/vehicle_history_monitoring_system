import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  DollarSign,
  Car,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../api/client';

export const ReportsPage = () => {
  const handleDownloadVehicles = () => {
    window.open('/api/reports/export-vehicles', '_blank');
  };

  const handleDownloadExpenditure = () => {
    window.open('/api/reports/export-expenditure', '_blank');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Analytics & Exportable Reports</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Generate audit-ready fleet listings, financial expenditure records, and maintenance logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicles Report Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Complete Fleet Vehicle Master Report</h3>
              <p className="text-xs text-slate-500 mt-1">
                Full inventory of all registered vehicles with registration numbers, technical specifications, VIN, assigned driver, department, current odometer, and status.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Format: CSV / Spreadsheet</span>
            <button
              onClick={handleDownloadVehicles}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Maintenance Expenditure Report Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Maintenance & Expenditure Audit Report</h3>
              <p className="text-xs text-slate-500 mt-1">
                Itemized breakdown of all service events, labor costs, parts replacements, fluid treatments, service providers, and total expenditure.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Format: CSV / Spreadsheet</span>
            <button
              onClick={handleDownloadExpenditure}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

