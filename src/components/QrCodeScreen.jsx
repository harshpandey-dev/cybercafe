import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, ArrowLeft, Smartphone, AlertTriangle, Globe } from 'lucide-react';

export default function QrCodeScreen({ caseData, onBack }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!caseData?.expiresAt) return 600; // 10 mins
    return Math.max(0, Math.floor((caseData.expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isExpired = secondsLeft <= 0;

  // Construct clean, short target URL for mobile phone scan
  const getCustomerUrl = () => {
    if (!caseData?.caseId) return '';

    let origin = caseData.publicOrigin || window.location.origin;

    if (!origin.startsWith('https://') && caseData.localIp) {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        origin = `http://${caseData.localIp}:3000`;
      }
    }

    return `${origin}/case/${caseData.caseId}`;
  };

  const customerUrl = getCustomerUrl();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full text-center space-y-6 py-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Phone Scanner</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
          Scan With Customer's Phone
        </h2>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Customer will download the PDF and open their email from their own phone.
        </p>
      </div>

      {/* Connection Mode Indicator Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
        <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>🌐 4G/5G Internet QR Active (No Wi-Fi Needed)</span>
      </div>

      {/* QR Display Card */}
      {!isExpired ? (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 space-y-5 shadow-2xl w-full max-w-sm flex flex-col items-center">
          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-blue-500/30 inline-block">
            <QRCodeSVG
              value={customerUrl}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Expiry Countdown Timer */}
          <div className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Expires in:</span>
            </div>
            <span className="font-mono text-xl font-extrabold text-amber-400">
              {formatTimer(secondsLeft)}
            </span>
          </div>

          {/* Customer Aadhaar Privacy badge */}
          {caseData?.aadhaarMasked && (
            <p className="text-xs font-mono text-slate-400">
              Aadhaar: <span className="text-slate-200 font-bold">{caseData.aadhaarMasked}</span>
            </p>
          )}

          {/* Direct URL copy button */}
          <div className="w-full text-left bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 truncate max-w-[200px] font-mono">{customerUrl}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(customerUrl);
                alert('Copied customer link to clipboard!');
              }}
              className="text-blue-400 font-bold px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20"
            >
              Copy Link
            </button>
          </div>
        </div>
      ) : (
        /* Expired Link State */
        <div className="bg-red-950/40 border border-red-800/60 rounded-3xl p-6 space-y-4 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="font-heading text-xl font-bold text-white">
            This QR Link Has Expired
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            The 10-minute temporary window has passed for privacy and security. Please go back and generate a fresh QR code.
          </p>
        </div>
      )}

      {/* Instructions list */}
      <div className="w-full max-w-sm text-left bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
        <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">
          Customer Phone Steps:
        </h4>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">1</span>
          <span>Open Phone Camera & Scan QR Code</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">2</span>
          <span>Tap "Download PDF" button on phone</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">3</span>
          <span>Tap "Open Email App" (Gmail/Mail)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">4</span>
          <span>Attach downloaded PDF & hit Send</span>
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="btn-secondary-xl py-4 max-w-sm border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        <ArrowLeft className="w-5 h-5 text-slate-400" />
        <span>← Back to Review Email</span>
      </button>
    </div>
  );
}
