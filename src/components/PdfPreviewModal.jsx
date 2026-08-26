import React from 'react';
import { X, Download, FileText } from 'lucide-react';

export default function PdfPreviewModal({ pdfUrl, onSavePdf, onClose }) {
  if (!pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Modal Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="font-heading font-bold text-white text-base">
            PDF Document Preview
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSavePdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs active:scale-95 transition-all shadow-md shadow-blue-600/30"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF View Container */}
      <div className="flex-1 bg-slate-900 border-x border-b border-slate-800 rounded-b-2xl overflow-hidden relative">
        <iframe
          src={pdfUrl}
          title="PDF Document Preview"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
}
