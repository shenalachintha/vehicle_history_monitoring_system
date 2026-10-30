import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  FileText,
  Download,
  DollarSign,
  Car,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { useSettings } from '../context/SettingsContext';
import {
  exportVehiclesToExcel,
  exportVehiclesToPDF,
  exportExpenditureToExcel,
  exportExpenditureToPDF,
  exportDocumentsToExcel,
  exportDocumentsToPDF,
} from '../utils/reportGenerator';

export const ReportsPage = () => {
  const { settings, formatCurrency } = useSettings();
  const [downloading, setDownloading] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // 1. Fetch real vehicles
  const { data: vehiclesRes, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles-report-data'],
    queryFn: () => api.get('/vehicles?limit=1000'),
  });

  // 2. Fetch real service events
  const { data: eventsRes, isLoading: loadingEvents } = useQuery({
    queryKey: ['events-report-data'],
    queryFn: () => api.get('/events?limit=1000'),
  });

  // 3. Fetch real compliance documents
  const { data: documentsRes, isLoading: loadingDocs } = useQuery({
    queryKey: ['documents-report-data'],
    queryFn: () => api.get('/documents'),
  });

  const vehicles = vehiclesRes?.data || [];
  const events = eventsRes?.data || [];
  const documents = documentsRes?.data || [];

  const notifySuccess = (title) => {
    setDownloadSuccess(title);
    setTimeout(() => setDownloadSuccess(''), 4000);
  };

  // Safe authenticated CSV fallback downloader
  const handleDownloadCsv = async (endpoint, filename) => {
    try {
      setDownloading(filename);
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notifySuccess(`Downloaded ${filename}`);
    } catch (err) {
      console.error('CSV download error', err);
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Fleet Intelligence & Audit Reports
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Generate official, presentation-ready PDF and Excel (.xlsx) reports with real-time fleet data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            Organization: <strong className="text-slate-800">{settings.companyName}</strong>
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {downloadSuccess} successfully generated and downloaded!
        </div>
      )}

      {/* 3 Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Fleet Vehicle Master Report */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-5 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Car className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                {loadingVehicles ? 'Loading...' : `${vehicles.length} Vehicles`}
              </span>
            </div>

            <h3 className="font-extrabold text-slate-900 text-base mt-4">
              Fleet Vehicle Master Report
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Complete inventory of all fleet vehicles including registration plates, make, model, technical specs, assigned drivers, and live odometer standings.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-[11.5px] space-y-1.5 border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Active Operating:</span>
                <strong className="text-emerald-700">{vehicles.filter(v => v.status === 'ACTIVE').length}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>In Maintenance:</span>
                <strong className="text-amber-700">{vehicles.filter(v => v.status === 'UNDER_MAINTENANCE').length}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Mileage Logged:</span>
                <strong className="text-slate-800">
                  {vehicles.reduce((s, v) => s + Number(v.currentOdometer || 0), 0).toLocaleString()} km
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  exportVehiclesToPDF(vehicles, settings.companyName);
                  notifySuccess('Fleet Vehicles PDF Report');
                }}
                disabled={vehicles.length === 0}
                className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </button>

              <button
                onClick={() => {
                  exportVehiclesToExcel(vehicles, settings.companyName);
                  notifySuccess('Fleet Vehicles Excel Workbook');
                }}
                disabled={vehicles.length === 0}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => handleDownloadCsv('/reports/export-vehicles', 'Fleet_Vehicles.csv')}
                className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 hover:underline"
              >
                Download Raw CSV Data
              </button>
            </div>
          </div>
        </div>

        {/* 2. Maintenance & Expenditure Audit Report */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-5 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {loadingEvents ? 'Loading...' : `${events.length} Services`}
              </span>
            </div>

            <h3 className="font-extrabold text-slate-900 text-base mt-4">
              Maintenance & Financial Audit
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Financial breakdown of workshop events, routine servicing, parts replacements, labor invoices, and cumulative fleet operational costs.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-[11.5px] space-y-1.5 border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Total Expenditure:</span>
                <strong className="text-blue-700">
                  {formatCurrency(events.reduce((s, e) => s + Number(e.totalCost || 0), 0))}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Labor Invoiced:</span>
                <strong className="text-slate-800">
                  {formatCurrency(events.reduce((s, e) => s + Number(e.laborCost || 0), 0))}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Parts & Consumables:</span>
                <strong className="text-slate-800">
                  {formatCurrency(events.reduce((s, e) => s + Number(e.partsCost || 0), 0))}
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  exportExpenditureToPDF(events, settings.companyName, formatCurrency);
                  notifySuccess('Maintenance Expenditure PDF Report');
                }}
                disabled={events.length === 0}
                className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </button>

              <button
                onClick={() => {
                  exportExpenditureToExcel(events, settings.companyName);
                  notifySuccess('Maintenance Expenditure Excel Workbook');
                }}
                disabled={events.length === 0}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => handleDownloadCsv('/reports/export-expenditure', 'Fleet_Expenditure.csv')}
                className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 hover:underline"
              >
                Download Raw CSV Data
              </button>
            </div>
          </div>
        </div>

        {/* 3. Document Compliance & Expiry Registry */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-5 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                {loadingDocs ? 'Loading...' : `${documents.length} Documents`}
              </span>
            </div>

            <h3 className="font-extrabold text-slate-900 text-base mt-4">
              Document Compliance Audit
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Statutory compliance records for provincial revenue licences, insurance policies, fitness certificates, and emission tests with expiry audit timelines.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-[11.5px] space-y-1.5 border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Valid & Compliant:</span>
                <strong className="text-emerald-700">
                  {documents.filter(d => !d.expiryDate || new Date(d.expiryDate) > new Date()).length}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Expired / Overdue:</span>
                <strong className="text-rose-600">
                  {documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Renewal Warning Window:</span>
                <strong className="text-slate-800">
                  {settings.documentWarningDays || 30} Days
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  exportDocumentsToPDF(documents, settings.companyName);
                  notifySuccess('Document Compliance PDF Report');
                }}
                disabled={documents.length === 0}
                className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </button>

              <button
                onClick={() => {
                  exportDocumentsToExcel(documents, settings.companyName);
                  notifySuccess('Document Compliance Excel Workbook');
                }}
                disabled={documents.length === 0}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </button>
            </div>

            <div className="text-center pt-1">
              <span className="text-[11px] font-semibold text-slate-400">
                Audit Ready &bull; Signed Formats
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
