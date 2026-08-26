import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, AlertTriangle, FileText } from 'lucide-react';

export default function Header({ currentStep, onBack, onReset, pageCount }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {/* Back button */}
          {currentStep !== 'HOME' ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-sm transition-all"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5 text-blue-400" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-heading font-bold text-lg text-white">
                Document Assistant
              </span>
            </div>
          )}

          {/* Center Title in process */}
          {currentStep !== 'HOME' && (
            <div className="text-center">
              <h1 className="font-heading text-base sm:text-lg font-bold text-white leading-tight">
                {currentStep === 'ADD_PAGE' && 'Add Pages'}
                {currentStep === 'CROP' && 'Crop Page'}
                {currentStep === 'PAGE_LIST' && `Manage (${pageCount} Pages)`}
                {currentStep === 'PDF_READY' && 'PDF Complete'}
              </h1>
            </div>
          )}

          {/* Reset button if pages exist */}
          {currentStep !== 'HOME' && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-950/40 border border-red-800/50 hover:bg-red-900/60 active:scale-95 text-red-300 text-xs font-semibold transition-all"
              title="Start Over"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Start Over</span>
            </button>
          )}
        </div>
      </header>

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h3 className="font-heading text-xl font-bold text-white">
              Start New Document?
            </h3>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              This will clear all current pages and start fresh. This action cannot be undone.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 text-sm active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  onReset();
                }}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 font-semibold text-white text-sm active:scale-95 transition-all shadow-lg shadow-red-600/30"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
