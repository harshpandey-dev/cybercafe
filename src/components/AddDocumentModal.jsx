import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, ArrowLeft, PlusCircle, X } from 'lucide-react';

export default function AddDocumentModal({
  isOpen = true,
  onClose,
  onAddImage,
  onSelectImage,
  onCancel,
  pageCount = 0,
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  if (isOpen === false) return null;

  const currentCount = typeof pageCount === 'number' && !isNaN(pageCount) ? pageCount : 0;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image photo file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (onAddImage) onAddImage(reader.result);
      if (onSelectImage) onSelectImage(reader.result);
    };
    reader.onerror = () => {
      alert('Could not read image. Please try again.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-center space-y-6 shadow-2xl relative">
        {/* Close button if modal */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Page #{currentCount + 1}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            Add Document Pages
          </h2>
          <p className="text-slate-400 text-sm">
            Take a fresh photo of the paper or select one from your device.
          </p>
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Large Buttons */}
        <div className="w-full max-w-sm mx-auto space-y-4 pt-2">
          {/* 📷 Take Photo Button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="btn-primary-xl py-6 text-xl shadow-blue-600/30 hover:scale-[1.02]"
          >
            <Camera className="w-8 h-8 text-white" />
            <span>📷 Take Photo</span>
          </button>

          {/* 🖼️ Select From Gallery Button */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="btn-secondary-xl py-6 text-xl bg-slate-800 border-slate-700 hover:bg-slate-750 hover:scale-[1.02]"
          >
            <ImageIcon className="w-8 h-8 text-blue-400" />
            <span>🖼️ Select From Gallery</span>
          </button>
        </div>

        {currentCount > 0 && (
          <button
            onClick={handleClose}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Added Pages ({currentCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
