import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, Sparkles, Check, RefreshCw, X, Maximize2, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCroppedImg } from '../utils/imageAutoCrop';

export default function CropScreen({
  imageSrc,
  onSaveCroppedPage,
  onRetake,
  onCancel,
  initialCropData = null,
}) {
  // Crop box rectangle in percentage of image: { x, y, width, height } (0 to 100)
  const [cropPercent, setCropPercent] = useState(
    initialCropData?.cropPercent || { x: 5, y: 5, width: 90, height: 90 }
  );

  const [rotation, setRotation] = useState(initialCropData?.rotation || 0);
  const [applyScanFilter, setApplyScanFilter] = useState(initialCropData?.applyScanFilter ?? false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const activeHandleRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, initialCrop: null });

  // Load natural dimensions of source image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle Dragging Corner & Side Handles (Mouse & Touch)
  const handlePointerDown = (handle, e) => {
    e.preventDefault();
    e.stopPropagation();
    activeHandleRef.current = handle;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      initialCrop: { ...cropPercent },
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const handlePointerMove = useCallback((e) => {
    if (!activeHandleRef.current || !containerRef.current) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const screenDeltaX = ((clientX - dragStartRef.current.mouseX) / rect.width) * 100;
    const screenDeltaY = ((clientY - dragStartRef.current.mouseY) / rect.height) * 100;

    // The crop controls rotate with the image. Convert screen movement back to
    // the source image axes so dragging still adjusts the visible edge.
    let deltaX = screenDeltaX;
    let deltaY = screenDeltaY;
    if (rotation === 90) {
      deltaX = screenDeltaY;
      deltaY = -screenDeltaX;
    } else if (rotation === 180) {
      deltaX = -screenDeltaX;
      deltaY = -screenDeltaY;
    } else if (rotation === 270) {
      deltaX = -screenDeltaY;
      deltaY = screenDeltaX;
    }

    const init = dragStartRef.current.initialCrop;
    const handle = activeHandleRef.current;
    let next = { ...init };

    const minSize = 10; // Minimum 10% size

    if (handle === 'tl') {
      const newX = Math.min(Math.max(0, init.x + deltaX), init.x + init.width - minSize);
      const newY = Math.min(Math.max(0, init.y + deltaY), init.y + init.height - minSize);
      next.x = newX;
      next.y = newY;
      next.width = init.x + init.width - newX;
      next.height = init.y + init.height - newY;
    } else if (handle === 'tr') {
      const newY = Math.min(Math.max(0, init.y + deltaY), init.y + init.height - minSize);
      const newW = Math.min(Math.max(minSize, init.width + deltaX), 100 - init.x);
      next.y = newY;
      next.width = newW;
      next.height = init.y + init.height - newY;
    } else if (handle === 'bl') {
      const newX = Math.min(Math.max(0, init.x + deltaX), init.x + init.width - minSize);
      const newH = Math.min(Math.max(minSize, init.height + deltaY), 100 - init.y);
      next.x = newX;
      next.width = init.x + init.width - newX;
      next.height = newH;
    } else if (handle === 'br') {
      const newW = Math.min(Math.max(minSize, init.width + deltaX), 100 - init.x);
      const newH = Math.min(Math.max(minSize, init.height + deltaY), 100 - init.y);
      next.width = newW;
      next.height = newH;
    } else if (handle === 'top') {
      const newY = Math.min(Math.max(0, init.y + deltaY), init.y + init.height - minSize);
      next.y = newY;
      next.height = init.y + init.height - newY;
    } else if (handle === 'bottom') {
      const newH = Math.min(Math.max(minSize, init.height + deltaY), 100 - init.y);
      next.height = newH;
    } else if (handle === 'left') {
      const newX = Math.min(Math.max(0, init.x + deltaX), init.x + init.width - minSize);
      next.x = newX;
      next.width = init.x + init.width - newX;
    } else if (handle === 'right') {
      const newW = Math.min(Math.max(minSize, init.width + deltaX), 100 - init.x);
      next.width = newW;
    } else if (handle === 'move') {
      const newX = Math.min(Math.max(0, init.x + deltaX), 100 - init.width);
      const newY = Math.min(Math.max(0, init.y + deltaY), 100 - init.height);
      next.x = newX;
      next.y = newY;
    }

    setCropPercent(next);
  }, [rotation]);

  const handlePointerUp = useCallback(() => {
    activeHandleRef.current = null;
    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mouseup', handlePointerUp);
    window.removeEventListener('touchmove', handlePointerMove);
    window.removeEventListener('touchend', handlePointerUp);
  }, [handlePointerMove]);

  useEffect(() => handlePointerUp, [handlePointerUp]);

  // Arrow Nudge Button Helper (Adjust edges in steps of 3%)
  const adjustEdge = (edge, delta) => {
    setCropPercent((prev) => {
      let next = { ...prev };
      const step = 3;
      if (edge === 'top') {
        const newY = Math.min(Math.max(0, prev.y + delta * step), prev.y + prev.height - 10);
        next.y = newY;
        next.height = prev.y + prev.height - newY;
      } else if (edge === 'bottom') {
        next.height = Math.min(Math.max(10, prev.height + delta * step), 100 - prev.y);
      } else if (edge === 'left') {
        const newX = Math.min(Math.max(0, prev.x + delta * step), prev.x + prev.width - 10);
        next.x = newX;
        next.width = prev.x + prev.width - newX;
      } else if (edge === 'right') {
        next.width = Math.min(Math.max(10, prev.width + delta * step), 100 - prev.x);
      }
      return next;
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleUseFullImage = () => {
    setCropPercent({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Convert cropPercent to Pixel crop for getCroppedImg
  const handleSave = async () => {
    if (!naturalDimensions.width) return;

    try {
      setIsProcessing(true);

      const pixelCrop = {
        x: (cropPercent.x / 100) * naturalDimensions.width,
        y: (cropPercent.y / 100) * naturalDimensions.height,
        width: (cropPercent.width / 100) * naturalDimensions.width,
        height: (cropPercent.height / 100) * naturalDimensions.height,
      };

      const croppedImageBase64 = await getCroppedImg(
        imageSrc,
        pixelCrop,
        rotation,
        applyScanFilter
      );

      onSaveCroppedPage({
        croppedImage: croppedImageBase64,
        rawImageSrc: imageSrc,
        cropData: { cropPercent, rotation, applyScanFilter },
      });
    } catch (err) {
      console.error('Cropping error:', err);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 max-w-2xl mx-auto w-full select-none">
      {/* Top Bar Quick Controls */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2 px-4">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Move className="w-4 h-4 text-blue-400" />
          <span>Drag 4 Corner Handles or use Arrow buttons to adjust crop ratio</span>
        </span>

        <div className="flex items-center gap-2">
          {/* Rotate button */}
          <button
            onClick={handleRotate}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-95"
          >
            <RotateCw className="w-4 h-4 text-blue-400" />
            <span>Rotate</span>
          </button>

          {/* B&W Filter */}
          <button
            onClick={() => setApplyScanFilter(!applyScanFilter)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
              applyScanFilter
                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>B&W Scan</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center justify-center gap-3">
        <button
          onClick={handleUseFullImage}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold hover:bg-indigo-600/30 active:scale-95 transition-all"
        >
          <Maximize2 className="w-4 h-4 text-indigo-400" />
          <span>Select Full Photo (100%)</span>
        </button>

        <button
          onClick={() => setCropPercent({ x: 5, y: 5, width: 90, height: 90 })}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-750 active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Crop Box</span>
        </button>
      </div>

      {/* Interactive Canvas Cropper Display */}
      <div className="relative flex-1 min-h-[350px] sm:min-h-[420px] bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={containerRef}
          className="relative max-w-full max-h-[440px] inline-block shadow-2xl rounded-lg overflow-hidden border border-slate-800"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Main Image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Document for Crop"
            className="max-h-[400px] w-auto object-contain block pointer-events-none select-none"
          />

          {/* Dimmed Overlay outside crop area */}
          <div
            className="absolute inset-0 bg-slate-950/70 pointer-events-none"
            style={{
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                ${cropPercent.x}% ${cropPercent.y}%,
                ${cropPercent.x}% ${cropPercent.y + cropPercent.height}%,
                ${cropPercent.x + cropPercent.width}% ${cropPercent.y + cropPercent.height}%,
                ${cropPercent.x + cropPercent.width}% ${cropPercent.y}%,
                ${cropPercent.x}% ${cropPercent.y}%
              )`,
            }}
          />

          {/* Active Crop Rectangle Box */}
          <div
            className="absolute border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-move"
            style={{
              left: `${cropPercent.x}%`,
              top: `${cropPercent.y}%`,
              width: `${cropPercent.width}%`,
              height: `${cropPercent.height}%`,
            }}
            onMouseDown={(e) => handlePointerDown('move', e)}
            onTouchStart={(e) => handlePointerDown('move', e)}
          >
            {/* Grid Lines */}
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-blue-400/30" />
              <div className="border-r border-b border-blue-400/30" />
              <div className="border-b border-blue-400/30" />
              <div className="border-r border-b border-blue-400/30" />
              <div className="border-r border-b border-blue-400/30" />
              <div className="border-b border-blue-400/30" />
              <div className="border-r border-blue-400/30" />
              <div className="border-r border-blue-400/30" />
              <div />
            </div>

            {/* 4 Corner Drag Handles (Large Blue Touch Circles) */}
            {/* Top-Left Corner Handle */}
            <div
              className="absolute -top-3 -left-3 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow-lg flex items-center justify-center hover:scale-125 active:scale-150 transition-transform z-20"
              onMouseDown={(e) => handlePointerDown('tl', e)}
              onTouchStart={(e) => handlePointerDown('tl', e)}
            />

            {/* Top-Right Corner Handle */}
            <div
              className="absolute -top-3 -right-3 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize shadow-lg flex items-center justify-center hover:scale-125 active:scale-150 transition-transform z-20"
              onMouseDown={(e) => handlePointerDown('tr', e)}
              onTouchStart={(e) => handlePointerDown('tr', e)}
            />

            {/* Bottom-Left Corner Handle */}
            <div
              className="absolute -bottom-3 -left-3 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize shadow-lg flex items-center justify-center hover:scale-125 active:scale-150 transition-transform z-20"
              onMouseDown={(e) => handlePointerDown('bl', e)}
              onTouchStart={(e) => handlePointerDown('bl', e)}
            />

            {/* Bottom-Right Corner Handle */}
            <div
              className="absolute -bottom-3 -right-3 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize shadow-lg flex items-center justify-center hover:scale-125 active:scale-150 transition-transform z-20"
              onMouseDown={(e) => handlePointerDown('br', e)}
              onTouchStart={(e) => handlePointerDown('br', e)}
            />

            {/* 4 Edge Handles */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-blue-500/80 border border-white rounded-full cursor-ns-resize z-20"
              onMouseDown={(e) => handlePointerDown('top', e)}
              onTouchStart={(e) => handlePointerDown('top', e)}
            />
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-blue-500/80 border border-white rounded-full cursor-ns-resize z-20"
              onMouseDown={(e) => handlePointerDown('bottom', e)}
              onTouchStart={(e) => handlePointerDown('bottom', e)}
            />
            <div
              className="absolute top-1/2 -left-2 -translate-y-1/2 h-10 w-4 bg-blue-500/80 border border-white rounded-full cursor-ew-resize z-20"
              onMouseDown={(e) => handlePointerDown('left', e)}
              onTouchStart={(e) => handlePointerDown('left', e)}
            />
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2 h-10 w-4 bg-blue-500/80 border border-white rounded-full cursor-ew-resize z-20"
              onMouseDown={(e) => handlePointerDown('right', e)}
              onTouchStart={(e) => handlePointerDown('right', e)}
            />
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-30 text-white space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-400" />
            <p className="font-heading font-bold text-lg">Cropping Page...</p>
          </div>
        )}
      </div>

      {/* Arrow Fine-Tuning Direction Nudge Controls */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-2">
        <div className="max-w-md mx-auto flex items-center justify-around text-xs font-bold text-slate-300">
          {/* Top edge arrows */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1">Top:</span>
            <button
              onClick={() => adjustEdge('top', -1)}
              className="p-1 hover:bg-slate-700 rounded text-blue-400 active:scale-95"
              title="Expand Top"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => adjustEdge('top', 1)}
              className="p-1 hover:bg-slate-700 rounded text-blue-400 active:scale-95"
              title="Shrink Top"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom edge arrows */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1">Bottom:</span>
            <button
              onClick={() => adjustEdge('bottom', 1)}
              className="p-1 hover:bg-slate-700 rounded text-blue-400 active:scale-95"
              title="Expand Bottom"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => adjustEdge('bottom', -1)}
              className="p-1 hover:bg-slate-700 rounded text-blue-400 active:scale-95"
              title="Shrink Bottom"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Left edge arrows */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1">Left:</span>
            <button
              onClick={() => adjustEdge('left', -1)}
              className="p-1 hover:bg-slate-700 rounded text-blue-400 active:scale-95"
              title="Expand Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => adjustEdge('left', 1)}
              className="p-1 hover:bg-slate-700 rounded text-blue-400 active:scale-95"
              title="Shrink Left"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right edge arrows */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
            <span className="text-slate-400 mr-1">Right:</span>
            <button
              onClick={() => adjustEdge('right', 1)}
              className="p-1 hover:bg-slate-700 rounded text-blue-400 active:scale-95"
              title="Expand Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => adjustEdge('right', -1)}
              className="p-1 hover:bg-slate-700 rounded text-blue-400 active:scale-95"
              title="Shrink Right"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Save & Action Buttons */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
        {/* Save Page Primary Button */}
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="btn-success-xl text-xl py-4 shadow-green-600/30 active:scale-95"
        >
          <Check className="w-7 h-7 text-white" />
          <span>Save Cropped Page</span>
        </button>

        {/* Retake & Cancel */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRetake}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-base font-bold transition-all border border-slate-700 active:scale-95"
          >
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <span>Retake</span>
          </button>

          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-base font-bold transition-all border border-slate-700 active:scale-95"
          >
            <X className="w-5 h-5 text-red-400" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
