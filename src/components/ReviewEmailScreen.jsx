import React from 'react';
import { Mail, FileText, ArrowLeft, QrCode, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { generateEmailSubject, generateEmailBody } from '../utils/uidaiEmail';

export default function ReviewEmailScreen({
  aadhaarDetails,
  pdfFilename,
  emailRecipient,
  onEditDetails,
  onCreateQr,
  isCreatingCase,
  hasPdf,
}) {
  const subject = generateEmailSubject(aadhaarDetails);
  const body = generateEmailBody(aadhaarDetails);

  const showPdfAttachment = hasPdf && pdfFilename;

  return (
    <div className="flex-1 flex flex-col p-4 max-w-xl mx-auto w-full space-y-6">
      {/* Title */}
      <div className="space-y-1 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Review Before Customer Sends</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
          Review UIDAI Email
        </h2>
        <p className="text-slate-400 text-sm">
          Check details below before generating customer QR code.
        </p>
      </div>

      {/* Email Container Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        {/* Recipient */}
        <div className="border-b border-slate-700 pb-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recipient (TO)
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" />
              Configured recipient
            </span>
          </div>
          <p className="text-lg font-bold text-blue-400 font-mono">
            {emailRecipient || 'help@uidai.gov.in'}
          </p>
        </div>

        {/* Subject */}
        <div className="border-b border-slate-700 pb-3 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Subject
          </span>
          <p className="text-sm sm:text-base font-bold text-white leading-snug break-all">
            {subject}
          </p>
        </div>

        {/* Body Preview */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Email Body Text
          </span>
          <div className="bg-slate-900 border border-slate-750 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {body}
          </div>
        </div>

        {/* Attachment badge — only when PDF exists */}
        {showPdfAttachment ? (
          <div className="bg-slate-900/60 border border-slate-750 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Attached Document PDF
              </span>
              <p className="text-xs font-bold text-white truncate">
                📎 {pdfFilename}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-amber-400 uppercase">
                No PDF Attached
              </span>
              <p className="text-xs font-bold text-slate-300">
                Email only mode — customer will send email without document attachment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => onCreateQr({ subject, body })}
          disabled={isCreatingCase}
          className="btn-success-xl py-5 text-xl shadow-green-600/30 active:scale-95 disabled:opacity-50"
        >
          <QrCode className="w-7 h-7 text-white" />
          <span>{isCreatingCase ? 'Creating Case...' : 'Create Customer QR →'}</span>
        </button>

        <button
          onClick={onEditDetails}
          className="btn-secondary-xl py-4 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
          <span>← Edit Details</span>
        </button>
      </div>
    </div>
  );
}
