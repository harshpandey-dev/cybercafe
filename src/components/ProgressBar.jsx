import React from 'react';

const STEPS = [
  { id: 1, label: 'Create PDF', icon: '📄' },
  { id: 2, label: 'Aadhaar Details', icon: '✍️' },
  { id: 3, label: 'Review Email', icon: '✉️' },
  { id: 4, label: 'Scan QR', icon: '📱' },
];

export default function ProgressBar({ currentStep }) {
  // Map internal app state steps to 1..4 range
  const getActiveStepNumber = () => {
    switch (currentStep) {
      case 'HOME':
        return 0;
      case 'ADD_PAGE':
      case 'CROP':
      case 'PAGE_LIST':
      case 'PDF_READY':
        return 1;
      case 'AADHAAR_DETAILS':
        return 2;
      case 'REVIEW_EMAIL':
        return 3;
      case 'QR_CODE':
        return 4;
      default:
        return 1;
    }
  };

  const activeNum = getActiveStepNumber();

  if (currentStep === 'HOME') return null;

  return (
    <div className="w-full bg-slate-800/80 backdrop-blur border-b border-slate-700/60 py-3 px-4 sticky top-16 z-20">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = activeNum > step.id;
          const isCurrent = activeNum === step.id;

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110 shadow-lg'
                      : isCompleted
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-medium text-center ${
                    isCurrent
                      ? 'text-blue-400 font-bold'
                      : isCompleted
                      ? 'text-green-400'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Line connector */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 -mt-4 rounded transition-all duration-300 ${
                    activeNum > step.id ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
