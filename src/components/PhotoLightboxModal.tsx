import { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, MapPin, Sparkles } from "lucide-react";
import { LightboxPhoto } from "../types";

interface PhotoLightboxModalProps {
  photo: LightboxPhoto | null;
  onClose: () => void;
}

export default function PhotoLightboxModal({ photo, onClose }: PhotoLightboxModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Reset zoom when new photo is opened
  useEffect(() => {
    setZoomLevel(1);
  }, [photo]);

  // Handle escape key to close
  useEffect(() => {
    if (!photo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        setZoomLevel((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === "-") {
        setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
      } else if (e.key === "0") {
        setZoomLevel(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photo, onClose]);

  if (!photo) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div
      id="photo-lightbox-modal"
      data-testid="photo-lightbox-modal"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo viewer: ${photo.title}`}
    >
      {/* Top Bar with Caption & Actions */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/80 border-b border-white/10 z-10 text-white">
        <div className="flex items-center gap-2 sm:gap-3 truncate pr-2">
          {photo.isDemo && (
            <span
              id="lightbox-demo-badge"
              data-testid="demo-sample-badge"
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-white shadow-xs border border-amber-400 shrink-0"
            >
              [DEMO SAMPLE]
            </span>
          )}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-sm">
              {photo.title}
            </h3>
            {photo.subtitle && (
              <p className="text-xs text-slate-300 truncate max-w-md">
                {photo.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden xs:flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10 text-xs">
            <button
              type="button"
              id="photo-lightbox-zoom-out"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.75}
              title="Zoom Out (-)"
              className="p-1.5 hover:bg-white/20 disabled:opacity-30 rounded-md transition cursor-pointer text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="photo-lightbox-reset"
              onClick={handleResetZoom}
              title="Reset Zoom (0)"
              className="px-2 py-1 font-mono text-[11px] font-bold text-emerald-300 hover:bg-white/20 rounded-md transition cursor-pointer"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              id="photo-lightbox-zoom-in"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              title="Zoom In (+)"
              className="p-1.5 hover:bg-white/20 disabled:opacity-30 rounded-md transition cursor-pointer text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            id="photo-lightbox-close"
            onClick={onClose}
            title="Close Lightbox (Esc)"
            className="min-h-[44px] min-w-[44px] rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center cursor-pointer ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 w-full overflow-auto flex items-center justify-center p-4 sm:p-8 cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          // If clicking background canvas, close
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out">
          <img
            id="photo-lightbox-image"
            src={photo.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"}
            alt={photo.title}
            onError={(e) => {
              const target = e.currentTarget;
              target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80";
            }}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 0.18s ease-out",
            }}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl ring-1 ring-white/10 select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Mobile Floating Zoom Bar */}
      <div className="xs:hidden w-full flex items-center justify-center gap-3 py-3 bg-slate-900/90 border-t border-white/10 text-white z-10">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.75}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold flex items-center gap-1"
        >
          <ZoomOut className="w-3.5 h-3.5" />
          <span>Zoom Out</span>
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold flex items-center gap-1"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>Zoom In</span>
        </button>
      </div>
    </div>
  );
}
