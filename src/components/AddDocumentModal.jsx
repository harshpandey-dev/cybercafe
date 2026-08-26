import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, ArrowLeft, PlusCircle } from 'lucide-react';

export default function AddDocumentModal({ onSelectImage, onCancel, pageCount }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image photo file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onSelectImage(reader.result);
    };
    reader.onerror = () => {
      alert('Could not read image. Please try again.');
    };
    reader.readAsDataURL(file);
    // Reset file input value to allow selecting same file again if retaken
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full text-center space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Page #{pageCount + 1}</span>
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
      <div className="w-full max-w-sm space-y-4 pt-2">
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

      {pageCount > 0 && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Added Pages ({pageCount})</span>
        </button>
      )}
    </div>
  );
}
