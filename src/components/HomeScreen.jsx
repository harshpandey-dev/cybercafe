import React from 'react';
import { Camera, Mail, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function HomeScreen({ onStart, onStartNewDocument, onEmailOnly }) {
  const handleStart = onStart || onStartNewDocument;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full text-center space-y-8 py-8">
      {/* Visual icon badge */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-40 animate-pulse" />
        <div className="relative w-24 h-24 bg-slate-800 border-2 border-slate-700/80 rounded-3xl flex items-center justify-center shadow-2xl">
          <Camera className="w-12 h-12 text-blue-400" />
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fast Cyber Cafe Scanner</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Document Assistant
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-xs mx-auto leading-relaxed">
          Scan documents into PDF or generate UIDAI email directly.
        </p>
      </div>

      {/* Two Large Buttons */}
      <div className="w-full max-w-sm space-y-4 pt-2">
        {/* 📷 Start New Document (PDF flow) */}
        <button
          onClick={handleStart}
          className="btn-primary-xl group py-5 text-xl tracking-wide shadow-blue-600/30 hover:shadow-blue-600/50"
        >
          <Camera className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
          <span>📷 Scan Document + PDF</span>
        </button>

        {/* ✉️ Email Only (skip PDF) */}
        <button
          onClick={onEmailOnly}
          className="btn-success-xl group py-5 text-xl tracking-wide shadow-green-600/30 hover:shadow-green-600/50"
        >
          <Mail className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
          <span>✉️ Email Only (No PDF)</span>
        </button>
      </div>

      {/* Quick guide cards */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3 pt-4">
        <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-3.5 text-left flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Easy Cropping</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Crop each page easily</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-3.5 text-left flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">100% Private</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Stays on your phone</p>
          </div>
        </div>
      </div>
    </div>
  );
}
