import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const NAVY = [11, 19, 43]; // #0B132B
const BLUE = [37, 99, 235]; // #2563EB
const EMERALD = [16, 185, 129]; // #10B981
const RED = [239, 68, 68]; // #EF4444
const GRAY = [100, 116, 139]; // #64748B

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toISOString().split('T')[0];
  } catch {
    return 'N/A';
  }
};

/**
 * --------------------------------------------------------------------------
 * 1. FLEET VEHICLE MASTER REPORT (EXCEL & PDF)
 * --------------------------------------------------------------------------
 */

export const exportVehiclesToExcel = (vehicles, companyName = 'Lanka Fleet Logistics (Pvt) Ltd') => {
  const data = vehicles.map((v, index) => ({
    '#': index + 1,
    'Registration No': v.registrationNo || '',
    'Make': v.make || '',
    'Model': v.model || '',
    'Year': v.year || '',
    'Category': v.category || '',
    'Status': v.status || '',
    'Fuel Type': v.fuelType || '',
    'Transmission': v.transmission || '',
    'Current Odometer (km)': Number(v.currentOdometer || 0),
    'Assigned Driver': v.assignedDriver || 'Unassigned',
    'Driver Contact': v.driverContact || 'N/A',
    'Department': v.department || 'Operations',
    'VIN / Chassis No': v.vin || 'N/A',
    'Engine No': v.engineNo || 'N/A',
    'Purchase Date': formatDate(v.purchaseDate),
    'Purchase Price': v.purchasePrice ? Number(v.purchasePrice) : 0,
    'Total Expenses': Number(v.totalExpenditure || 0),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 4 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 6 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 15 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fleet Vehicles');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Fleet_Vehicles_Master_Report_${today}.xlsx`);
};

export const exportVehiclesToPDF = (vehicles, companyName = 'El-Toro Roofing Products Ltd.') => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Top header banner
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), 14, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FLEET VEHICLE INVENTORY & SPECIFICATIONS AUDIT REPORT', 14, 16);

  doc.setFontSize(8);
  doc.text(`Generated: ${dateStr} | Confidential Fleet Audit`, 220, 10);
  doc.text(`Total Vehicles: ${vehicles.length}`, 220, 16);

  // Summary Metrics Bar
  const activeCount = vehicles.filter((v) => v.status === 'ACTIVE').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'UNDER_MAINTENANCE').length;
  const outOfService = vehicles.filter((v) => v.status === 'OUT_OF_SERVICE' || v.status === 'DECOMMISSIONED').length;
  const totalKm = vehicles.reduce((sum, v) => sum + Number(v.currentOdometer || 0), 0);

  doc.setFillColor(248, 250, 252);
  doc.rect(14, 28, 269, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 28, 269, 12, 'D');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Fleet: ${vehicles.length}`, 20, 35);
  doc.setTextColor(...EMERALD);
  doc.text(`Active: ${activeCount}`, 75, 35);
  doc.setTextColor(245, 158, 11);
  doc.text(`In Maintenance: ${maintenanceCount}`, 125, 35);
  doc.setTextColor(...RED);
  doc.text(`Out of Service: ${outOfService}`, 185, 35);
  doc.setTextColor(...BLUE);
  doc.text(`Total Odometer: ${totalKm.toLocaleString()} km`, 235, 35);

  // Table rows
  const tableRows = vehicles.map((v, i) => [
    i + 1,
    v.registrationNo,
    `${v.make} ${v.model}`,
    v.year || '-',
    v.category || 'CAR',
    v.status?.replace(/_/g, ' ') || 'ACTIVE',
    `${Number(v.currentOdometer || 0).toLocaleString()} km`,
    v.assignedDriver || 'Unassigned',
    v.department || 'Operations',
    v.fuelType || '-',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Reg No', 'Make & Model', 'Year', 'Category', 'Status', 'Odometer', 'Driver', 'Department', 'Fuel']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Color-code Status column (index 5)
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'ACTIVE') {
          data.cell.styles.textColor = EMERALD;
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'UNDER MAINTENANCE') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'OUT OF SERVICE' || val === 'DECOMMISSIONED') {
          data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = BLUE;
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(
        `FleetGuard Pro Monitoring System • Official Fleet Report • Page ${data.pageNumber} of ${pageCount}`,
        14,
        205
      );
      doc.text(`Authorized Officer Signature: __________________________`, 200, 205);
    },
  });

  const todayIso = today.toISOString().split('T')[0];
  doc.save(`Fleet_Vehicles_Report_${todayIso}.pdf`);
};

/**
 * --------------------------------------------------------------------------
 * 2. MAINTENANCE & EXPENDITURE AUDIT REPORT (EXCEL & PDF)
 * --------------------------------------------------------------------------
 */

export const exportExpenditureToExcel = (events, companyName = 'Lanka Fleet Logistics (Pvt) Ltd') => {
  const data = events.map((e, index) => ({
    '#': index + 1,
    'Event ID': e.id,
    'Vehicle Reg': e.vehicle?.registrationNo || '',
    'Vehicle Model': e.vehicle ? `${e.vehicle.make} ${e.vehicle.model}` : '',
    'Date': formatDate(e.eventDate),
    'Category': e.eventType?.replace(/_/g, ' ') || '',
    'Event Title': e.title || '',
    'Service Provider': e.serviceProvider || '',
    'Technician': e.technicianName || '',
    'Odometer at Event (km)': Number(e.odometerAtEvent || 0),
    'Labor Cost': Number(e.laborCost || 0),
    'Parts Cost': Number(e.partsCost || 0),
    'Other Cost': Number(e.otherCost || 0),
    'Total Cost': Number(e.totalCost || 0),
    'Currency': e.currency || 'LKR',
    'Work Performed': e.workPerformed || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 4 },
    { wch: 15 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 25 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 15 },
    { wch: 10 },
    { wch: 35 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenditure Audit');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Fleet_Expenditure_Audit_${today}.xlsx`);
};

export const exportExpenditureToPDF = (events, companyName = 'El-Toro Roofing Products Ltd.', formatCurrency = (val) => `$${Number(val).toFixed(2)}`) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Top header banner
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), 14, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('MAINTENANCE & FINANCIAL EXPENDITURE AUDIT REPORT', 14, 16);

  const totalExpenditure = events.reduce((sum, e) => sum + Number(e.totalCost || 0), 0);
  const totalLabor = events.reduce((sum, e) => sum + Number(e.laborCost || 0), 0);
  const totalParts = events.reduce((sum, e) => sum + Number(e.partsCost || 0), 0);

  doc.setFontSize(8);
  doc.text(`Generated: ${dateStr} | Financial Audit Period`, 210, 10);
  doc.text(`Total Records: ${events.length}`, 210, 16);

  // Financial summary banner
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 28, 269, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 28, 269, 12, 'D');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Service Events: ${events.length}`, 20, 35);
  doc.setTextColor(...BLUE);
  doc.text(`Total Labor: ${formatCurrency(totalLabor)}`, 75, 35);
  doc.setTextColor(217, 119, 6);
  doc.text(`Total Parts: ${formatCurrency(totalParts)}`, 140, 35);
  doc.setTextColor(...EMERALD);
  doc.text(`Grand Total Expenditure: ${formatCurrency(totalExpenditure)}`, 205, 35);

  const tableRows = events.map((e, i) => [
    i + 1,
    formatDate(e.eventDate),
    e.vehicle?.registrationNo || 'N/A',
    e.eventType?.replace(/_/g, ' ') || 'SERVICE',
    e.title || 'Maintenance',
    e.serviceProvider || 'Workshop',
    `${Number(e.odometerAtEvent || 0).toLocaleString()} km`,
    formatCurrency(e.laborCost || 0),
    formatCurrency(e.partsCost || 0),
    formatCurrency(e.totalCost || 0),
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Date', 'Vehicle', 'Category', 'Event Title', 'Provider', 'Odometer', 'Labor', 'Parts', 'Total Cost']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = BLUE;
      }
      if (data.section === 'body' && data.column.index === 9) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(
        `FleetGuard Pro Monitoring System • Maintenance Expenditure Audit • Page ${data.pageNumber} of ${pageCount}`,
        14,
        205
      );
      doc.text(`Finance Controller Signature: __________________________`, 195, 205);
    },
  });

  const todayIso = today.toISOString().split('T')[0];
  doc.save(`Fleet_Expenditure_Audit_${todayIso}.pdf`);
};

/**
 * --------------------------------------------------------------------------
 * 3. DOCUMENT COMPLIANCE & EXPIRY AUDIT (EXCEL & PDF)
 * --------------------------------------------------------------------------
 */

export const exportDocumentsToExcel = (documents, companyName = 'Lanka Fleet Logistics (Pvt) Ltd') => {
  const now = new Date();
  const data = documents.map((d, index) => {
    const expiry = d.expiryDate ? new Date(d.expiryDate) : null;
    const diffDays = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    let status = 'Valid';
    if (diffDays !== null) {
      if (diffDays < 0) status = `Expired (${Math.abs(diffDays)}d ago)`;
      else if (diffDays <= 30) status = `Expiring Soon (${diffDays}d left)`;
    }

    return {
      '#': index + 1,
      'Vehicle Reg': d.vehicle?.registrationNo || '',
      'Document Type': d.docType?.replace(/_/g, ' ') || '',
      'Title': d.title || '',
      'Policy / Document Number': d.documentNumber || 'N/A',
      'Issue Date': formatDate(d.issueDate),
      'Expiry Date': formatDate(d.expiryDate),
      'Days Until Expiry': diffDays !== null ? diffDays : 'Permanent',
      'Compliance Status': status,
      'Notes': d.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 4 },
    { wch: 15 },
    { wch: 22 },
    { wch: 25 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 24 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Document Compliance');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Document_Compliance_Audit_${today}.xlsx`);
};

export const exportDocumentsToPDF = (documents, companyName = 'El-Toro Roofing Products Ltd.') => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Top header banner
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), 14, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('VEHICLE DOCUMENT COMPLIANCE & EXPIRATION AUDIT', 14, 16);

  const expiredCount = documents.filter((d) => d.expiryDate && new Date(d.expiryDate) < today).length;
  const expiringSoonCount = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const diff = Math.ceil((new Date(d.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length;
  const validCount = documents.length - expiredCount - expiringSoonCount;

  doc.setFontSize(8);
  doc.text(`Generated: ${dateStr} | Statutory Compliance Audit`, 210, 10);
  doc.text(`Total Documents: ${documents.length}`, 210, 16);

  // Summary Metrics Bar
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 28, 269, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 28, 269, 12, 'D');

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Documents: ${documents.length}`, 20, 35);
  doc.setTextColor(...EMERALD);
  doc.text(`Compliant (Valid): ${validCount}`, 85, 35);
  doc.setTextColor(217, 119, 6);
  doc.text(`Expiring Soon (<=30d): ${expiringSoonCount}`, 145, 35);
  doc.setTextColor(...RED);
  doc.text(`Expired / Non-Compliant: ${expiredCount}`, 215, 35);

  const tableRows = documents.map((d, i) => {
    const expiry = d.expiryDate ? new Date(d.expiryDate) : null;
    const diffDays = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
    let statusText = 'Valid';
    if (diffDays !== null) {
      if (diffDays < 0) statusText = `Expired (${Math.abs(diffDays)}d ago)`;
      else if (diffDays <= 30) statusText = `Expires in ${diffDays}d`;
    }

    return [
      i + 1,
      d.vehicle?.registrationNo || 'N/A',
      d.docType?.replace(/_/g, ' ') || 'INSURANCE',
      d.title || 'Official Document',
      d.documentNumber || 'N/A',
      formatDate(d.issueDate),
      formatDate(d.expiryDate),
      statusText,
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Vehicle', 'Document Type', 'Document Title', 'Policy / Doc No', 'Issue Date', 'Expiry Date', 'Compliance Status']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = BLUE;
      }
      if (data.section === 'body' && data.column.index === 7) {
        const val = data.cell.raw || '';
        if (val.startsWith('Expired')) {
          data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = 'bold';
        } else if (val.startsWith('Expires in')) {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = EMERALD;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(
        `FleetGuard Pro Monitoring System • Statutory Compliance Audit • Page ${data.pageNumber} of ${pageCount}`,
        14,
        205
      );
      doc.text(`Compliance Officer Signature: __________________________`, 195, 205);
    },
  });

  const todayIso = today.toISOString().split('T')[0];
  doc.save(`Document_Compliance_Report_${todayIso}.pdf`);
};

