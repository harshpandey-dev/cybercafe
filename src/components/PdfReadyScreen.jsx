import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Eye, Download, PlusCircle, ShieldCheck, FileCheck2, ArrowRight } from 'lucide-react';
import PdfPreviewModal from './PdfPreviewModal';

export default function PdfReadyScreen({
  pdfInfo,
  pdfResult,
  onPreviewPdf,
  onSavePdf,
  onCreateAnother,
  onStartOver,
  onContinueToAadhaar,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const info = pdfInfo || pdfResult;
  const handleReset = onCreateAnother || onStartOver;

  // Fire celebratory confetti on page load
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#16a34a', '#3b82f6', '#22c55e'],
      });
    } catch {
      // Ignore if confetti fails
    }
  }, []);

  const handleDownloadLocal = () => {
    if (onSavePdf) {
      onSavePdf();
      return;
    }

    if (info?.pdfBlob) {
      const blobUrl = URL.createObjectURL(info.pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'Aadhaar_Document_Merged.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    }
  };

  const handlePreview = () => {
    if (onPreviewPdf) {
      onPreviewPdf();
    } else {
      setIsPreviewOpen(true);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full text-center space-y-6 py-6">
        {/* Success Badge */}
        <div className="space-y-3">
          <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500/40 rounded-3xl flex items-center justify-center mx-auto text-green-400 shadow-xl shadow-green-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
            PDF Ready ✅
          </h2>
          <p className="text-slate-400 text-base">
            Your document pages have been merged into a single PDF.
          </p>
        </div>

        {/* PDF Summary Details Card */}
        <div className="w-full max-w-sm bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 text-left space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Document Summary
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ready for Email</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-400">Total Pages</span>
              <p className="font-heading text-2xl font-bold text-white flex items-center gap-1.5">
                <FileCheck2 className="w-5 h-5 text-blue-400" />
                <span>{info?.pageCount || 1} Pages</span>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-xs text-slate-400">File Size</span>
              <p className="font-heading text-2xl font-bold text-green-400">
                {info?.sizeFormatted || 'Optimized'}
              </p>
            </div>
          </div>
        </div>

        {/* Large Action Buttons */}
        <div className="w-full max-w-sm space-y-3.5 pt-2">
          {/* Continue -> Primary Button to Aadhaar Details Form */}
          <button
            onClick={onContinueToAadhaar}
            className="btn-primary-xl py-5 text-xl shadow-blue-600/40 active:scale-95 hover:scale-[1.02]"
          >
            <span>Continue →</span>
            <ArrowRight className="w-6 h-6 text-white" />
          </button>

          {/* ⬇️ Save PDF Download Button */}
          <button
            onClick={handleDownloadLocal}
            className="btn-success-xl py-4 text-lg shadow-green-600/30 active:scale-95"
          >
            <Download className="w-6 h-6 text-white" />
            <span>⬇️ Save PDF</span>
          </button>

          {/* 📄 Preview PDF Button */}
          <button
            onClick={handlePreview}
            className="btn-secondary-xl py-4 bg-gradient-to-r from-slate-800 to-slate-750 border border-slate-700 text-blue-300 shadow-none hover:bg-slate-700"
          >
            <Eye className="w-5 h-5 text-blue-400" />
            <span>📄 Preview PDF</span>
          </button>

          {/* ➕ Create Another Document Button */}
          <button
            onClick={handleReset}
            className="btn-secondary-xl py-3.5 text-sm border-slate-700 text-slate-400 hover:bg-slate-800"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>➕ Create Another Document</span>
          </button>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {isPreviewOpen && info?.pdfBlob && (
        <PdfPreviewModal
          pdfBlob={info.pdfBlob}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
}
