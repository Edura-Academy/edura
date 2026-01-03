'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown } from 'lucide-react';
import { exportToExcel, exportToPDF, exportToCSV, printTable, ExcelColumn, PDFColumn } from '@/lib/exportUtils';

interface ExportData {
  [key: string]: unknown;
}

interface ExportButtonsProps {
  data: ExportData[];
  columns: {
    header: string;
    key: string;
    width?: number;
  }[];
  filename: string;
  title: string;
  subtitle?: string;
  headerInfo?: { label: string; value: string }[];
  printElementId?: string;
  showExcel?: boolean;
  showPDF?: boolean;
  showCSV?: boolean;
  showPrint?: boolean;
}

export function ExportButtons({
  data,
  columns,
  filename,
  title,
  subtitle,
  headerInfo,
  printElementId,
  showExcel = true,
  showPDF = true,
  showCSV = true,
  showPrint = true,
}: ExportButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    await exportToExcel({
      filename,
      title,
      subtitle,
      columns: columns as ExcelColumn[],
      data,
    });
    setIsExporting(false);
    setIsOpen(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportToPDF({
      filename,
      title,
      subtitle,
      columns: columns as PDFColumn[],
      data,
      headerInfo,
    });
    setIsExporting(false);
    setIsOpen(false);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    await exportToCSV({
      filename,
      columns,
      data,
    });
    setIsExporting(false);
    setIsOpen(false);
  };

  const handlePrint = () => {
    if (printElementId) {
      printTable(printElementId, title);
    }
    setIsOpen(false);
  };

  const exportOptions = [
    {
      id: 'excel',
      label: 'Excel (.xlsx)',
      icon: FileSpreadsheet,
      onClick: handleExportExcel,
      show: showExcel,
      color: 'text-green-600',
    },
    {
      id: 'pdf',
      label: 'PDF',
      icon: FileText,
      onClick: handleExportPDF,
      show: showPDF,
      color: 'text-red-600',
    },
    {
      id: 'csv',
      label: 'CSV',
      icon: Download,
      onClick: handleExportCSV,
      show: showCSV,
      color: 'text-blue-600',
    },
    {
      id: 'print',
      label: 'Yazdır',
      icon: Printer,
      onClick: handlePrint,
      show: showPrint && !!printElementId,
      color: 'text-gray-600',
    },
  ].filter((opt) => opt.show);

  if (exportOptions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        Dışa Aktar
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-1 animate-slideDown">
            {exportOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.onClick}
                disabled={isExporting}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <option.icon className={`w-4 h-4 ${option.color}`} />
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Tek buton versiyonları
export function ExcelExportButton({
  data,
  columns,
  filename,
  title,
  subtitle,
}: Omit<ExportButtonsProps, 'showExcel' | 'showPDF' | 'showCSV' | 'showPrint' | 'printElementId'>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await exportToExcel({
      filename,
      title,
      subtitle,
      columns: columns as ExcelColumn[],
      data,
    });
    setIsExporting(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
    >
      <FileSpreadsheet className="w-4 h-4" />
      {isExporting ? 'İndiriliyor...' : 'Excel İndir'}
    </button>
  );
}

export function PDFExportButton({
  data,
  columns,
  filename,
  title,
  subtitle,
  headerInfo,
}: Omit<ExportButtonsProps, 'showExcel' | 'showPDF' | 'showCSV' | 'showPrint' | 'printElementId'>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await exportToPDF({
      filename,
      title,
      subtitle,
      columns: columns as PDFColumn[],
      data,
      headerInfo,
    });
    setIsExporting(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
    >
      <FileText className="w-4 h-4" />
      {isExporting ? 'Oluşturuluyor...' : 'PDF İndir'}
    </button>
  );
}

