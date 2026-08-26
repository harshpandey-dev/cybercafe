import React, { useState, useEffect } from 'react';
import { Download, Mail, ShieldCheck, FileText, AlertTriangle, Clock } from 'lucide-react';
import { generateMailtoLink } from '../utils/uidaiEmail';
import { decodeCasePayload } from '../utils/caseEncoder';

export default function CustomerCaseView({ caseId }) {
  const [caseData, setCaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    async function fetchCase() {
      const searchParams = new URLSearchParams(window.location.search);
      const encodedData = searchParams.get('d');

      try {
        const res = await fetch(`/api/cases/${caseId}`);
        if (res.ok) {
          const data = await res.json();
          setCaseData(data);
          setSecondsLeft(data.remainingSeconds || 0);
          setIsLoading(false);
          return;
        }

        if (encodedData) {
          const fallbackData = decodeCasePayload(encodedData);
          if (fallbackData && Date.now() < fallbackData.expiresAt) {
            setCaseData(fallbackData);
            setSecondsLeft(Math.max(0, Math.floor((fallbackData.expiresAt - Date.now()) / 1000)));
            setIsLoading(false);
            return;
          }
        }

        setIsExpired(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching case:', err);
        if (encodedData) {
          const fallbackData = decodeCasePayload(encodedData);
          if (fallbackData && Date.now() < fallbackData.expiresAt) {
            setCaseData(fallbackData);
            setSecondsLeft(Math.max(0, Math.floor((fallbackData.expiresAt - Date.now()) / 1000)));
            setIsLoading(false);
            return;
          }
        }
        setIsExpired(true);
        setIsLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTimer = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Smartphone PDF Download handler
  const handleDownload = async () => {
    if (!caseData || isDownloading) return;
    setIsDownloading(true);

    try {
      // 1. Direct Base64 blob download if available in fallback mode
      if (caseData.pdfBase64) {
        const base64Str = caseData.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        const binaryStr = atob(base64Str);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        triggerBlobDownload(blob, caseData.pdfFilename || 'Aadhaar_Document_Merged.pdf');
        setIsDownloading(false);
        return;
      }

      // 2. Fetch PDF blob directly from API to trigger instant mobile download
      const downloadUrl = `/api/cases/${caseId}/download`;
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error('Download request failed');
      }

      const blob = await response.blob();
      triggerBlobDownload(blob, caseData.pdfFilename || 'Aadhaar_Document_Merged.pdf');
    } catch (err) {
      console.error('Download error:', err);
      // Direct navigation fallback
      window.location.href = `/api/cases/${caseId}/download`;
    } finally {
      setIsDownloading(false);
    }
  };

  function triggerBlobDownload(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 5000);
  }

  const handleOpenEmailApp = () => {
    if (!caseData) return;
    const recipient = caseData.emailTo || 'help@uidai.gov.in';
    const mailtoUrl = generateMailtoLink(recipient, caseData.emailSubject, caseData.emailBody);
    window.location.href = mailtoUrl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-heading font-bold text-lg">Loading your Aadhaar document...</p>
      </div>
    );
  }

  if (isExpired || !caseData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-white">
            This link has expired
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            For privacy and document security, temporary links expire after 10 minutes. Please ask the cyber café operator to generate a new QR code.
          </p>
        </div>
      </div>
    );
  }

  const recipient = caseData.emailTo || 'help@uidai.gov.in';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 max-w-md mx-auto w-full space-y-5 py-6">
      {/* Top Expiry Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold text-slate-300">Official UIDAI Request</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>{formatTimer(secondsLeft)}</span>
        </div>
      </div>

      {/* SECTION 1: YOUR DOCUMENTS ARE READY */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 border-b border-slate-800 pb-3">
          <FileText className="w-6 h-6" />
          <h3 className="font-heading font-extrabold text-lg text-white">
            YOUR DOCUMENTS ARE READY
          </h3>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Single Merged PDF
            </span>
            <p className="text-sm font-bold text-white truncate">
              📄 {caseData.pdfFilename}
            </p>
          </div>
        </div>

        {/* Large Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-primary-xl py-5 text-xl shadow-blue-600/40 active:scale-95 disabled:opacity-50"
        >
          <Download className="w-7 h-7 text-white" />
          <span>{isDownloading ? 'Downloading PDF...' : 'Download PDF'}</span>
        </button>
      </div>

      {/* SECTION 2: YOUR EMAIL IS READY */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-green-400 border-b border-slate-800 pb-3">
          <Mail className="w-6 h-6" />
          <h3 className="font-heading font-extrabold text-lg text-white">
            YOUR EMAIL IS READY
          </h3>
        </div>

        <div className="space-y-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="font-bold text-slate-400">To:</span>
            <span className="font-mono font-bold text-blue-400 text-sm">
              {recipient}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-bold text-slate-400">Subject:</span>
            <p className="font-bold text-white text-xs leading-tight">
              {caseData.emailSubject}
            </p>
          </div>
        </div>

        {/* Large Open Email App Button */}
        <button
          onClick={handleOpenEmailApp}
          className="btn-success-xl py-5 text-xl shadow-green-600/40 active:scale-95"
        >
          <Mail className="w-7 h-7 text-white" />
          <span>✉️ Open Email App</span>
        </button>
      </div>

      {/* SECTION 3: 4-STEP EASY INSTRUCTIONS CARD */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
        <h4 className="font-heading font-extrabold text-sm text-amber-400 uppercase tracking-wider">
          📌 Final Steps to Send Email:
        </h4>

        <div className="space-y-2.5 text-xs text-slate-200">
          <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
              1
            </span>
            <div>
              <p className="font-bold text-white">Download the PDF</p>
              <p className="text-slate-400 text-[11px]">Tap the blue "Download PDF" button above.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
              2
            </span>
            <div>
              <p className="font-bold text-white">Open your Email App</p>
              <p className="text-slate-400 text-[11px]">Tap the green "Open Email App" button to launch Gmail/Mail.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
              3
            </span>
            <div>
              <p className="font-bold text-white">Attach the downloaded PDF</p>
              <p className="text-slate-400 text-[11px]">Tap paperclip icon in Gmail & select the downloaded PDF.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
              4
            </span>
            <div>
              <p className="font-bold text-white">Send the email</p>
              <p className="text-slate-400 text-[11px]">Verify recipient is help@uidai.gov.in and tap Send!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
