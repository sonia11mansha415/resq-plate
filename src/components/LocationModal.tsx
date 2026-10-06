import { useState, useEffect } from "react";
import {
  MapPin,
  Compass,
  Sliders,
  X,
  Check,
  Search,
  Crosshair,
  Loader2,
  Navigation,
  Building2,
  Warehouse,
  Trees,
  Plane,
  AlertCircle
} from "lucide-react";

export interface LocationConfig {
  areaName: string;
  radiusKm: number;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: LocationConfig;
  onSave: (newConfig: LocationConfig) => void;
}

const PRESET_AREAS = [
  {
    id: "downtown",
    name: "Downtown Financial & Hotel District",
    category: "Commercial & Hotels",
    icon: Building2,
    badge: "High Hotel Density",
  },
  {
    id: "metro-hub",
    name: "Metro Metro Hub",
    category: "Central Transit & Buffets",
    icon: Navigation,
    badge: "Central Transit",
  },
  {
    id: "industrial",
    name: "Industrial Area & Food Logistics Park",
    category: "Catering & Warehouses",
    icon: Warehouse,
    badge: "Bulk Catering",
  },
  {
    id: "north-suburb",
    name: "North Suburb & University Enclave",
    category: "Community & Hostels",
    icon: Trees,
    badge: "Active Shelters",
  },
  {
    id: "banquet-corridor",
    name: "Banquet & Convention District",
    category: "Weddings & Galas",
    icon: Building2,
    badge: "Large Surplus",
  },
  {
    id: "airport",
    name: "Airport Hospitality Zone",
    category: "Airline & Lounge Kitchens",
    icon: Plane,
    badge: "24/7 Operations",
  },
];

export default function LocationModal({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}: LocationModalProps) {
  const [selectedArea, setSelectedArea] = useState<string>(currentConfig.areaName);
  const [radiusKm, setRadiusKm] = useState<number>(currentConfig.radiusKm);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [modalValidationError, setModalValidationError] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedArea(currentConfig.areaName);
      setRadiusKm(currentConfig.radiusKm);
      setSearchQuery("");
      setGpsStatusMessage(null);
      setModalValidationError(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  // Filter preset areas based on search query
  const filteredPresets = PRESET_AREAS.filter((area) =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // GPS Device Location Handler
  const handleUseDeviceGps = () => {
    setIsLocatingGps(true);
    setGpsStatusMessage("Requesting device GPS coordinates...");
    setModalValidationError(null);

    if (!navigator.geolocation) {
      setIsLocatingGps(false);
      setGpsStatusMessage("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(3);
        const lng = position.coords.longitude.toFixed(3);
        const detectedName = `Current Location (GPS: ${lat}°, ${lng}°)`;
        setSelectedArea(detectedName);
        setSearchQuery(detectedName);
        setIsLocatingGps(false);
        setGpsStatusMessage("GPS lock acquired successfully!");
        setModalValidationError(null);
      },
      (error) => {
        console.warn("GPS error / denied:", error.message);
        setIsLocatingGps(false);
        // Do NOT guess or insert a mock location when GPS fails or is denied
        setGpsStatusMessage("GPS permission denied or unavailable. Please enter your location manually.");
      },
      { timeout: 6000, enableHighAccuracy: false }
    );
  };

  const handleSelectArea = (name: string) => {
    setSelectedArea(name);
    setSearchQuery(name);
    setModalValidationError(null);
  };

  const handleApply = () => {
    const finalArea = selectedArea.trim() || searchQuery.trim();
    if (!finalArea) {
      setModalValidationError("Please enter an address, select a rescue zone, or use GPS.");
      return;
    }
    setModalValidationError(null);
    onSave({
      areaName: finalArea,
      radiusKm: Number(radiusKm),
    });
    onClose();
  };

  return (
    <div
      id="location-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="location-modal-card"
        className="bg-white w-[92%] sm:w-full max-w-md sm:max-w-lg mx-auto rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-4 sm:p-5 text-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 border border-white/20 shrink-0">
              <Compass className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Set Rescue Dispatch Location
              </h3>
              <p className="text-xs text-emerald-100">
                Filter surplus donations within your NGO or hotel radius
              </p>
            </div>
          </div>
          <button
            id="close-location-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* GPS Quick Action */}
          <div>
            <button
              type="button"
              id="btn-use-device-gps"
              onClick={handleUseDeviceGps}
              disabled={isLocatingGps}
              className="w-full h-11 px-3 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isLocatingGps ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
                  <span>Detecting GPS Location...</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4 text-emerald-700" />
                  <span>Use Current Device Location (GPS)</span>
                </>
              )}
            </button>
            {gpsStatusMessage && (
              <p className="text-[11px] text-emerald-800 font-medium text-center mt-1.5 animate-in fade-in">
                {gpsStatusMessage}
              </p>
            )}
          </div>

          {/* City / Area Search and Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select or Search City / Area</span>
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="location-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedArea(e.target.value);
                  setModalValidationError(null);
                }}
                placeholder="Type your area (e.g., Downtown, Industrial Area, North Suburb)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm sm:text-base rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden text-slate-800 font-medium"
              />
            </div>

            {modalValidationError && (
              <div
                id="location-modal-error"
                className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalValidationError}</span>
              </div>
            )}

            {/* Popular Area Chips / List */}
            <div className="pt-1 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Popular Rescue Zones:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedArea.toLowerCase() === preset.name.toLowerCase();
                  const Icon = preset.icon;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      id={`area-preset-${preset.id}`}
                      onClick={() => handleSelectArea(preset.name)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-500 shadow-xs"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-emerald-700" : "text-slate-400"}`} />
                        <div className="truncate">
                          <span className="block truncate font-semibold">{preset.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{preset.category}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search Radius Slider */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="radius-slider" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Search Radius</span>
              </label>
              <div className="flex items-baseline gap-1 bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold border border-emerald-300">
                <span className="text-sm font-black">{radiusKm}</span>
                <span>km</span>
              </div>
            </div>

            <div className="pt-1">
              <input
                id="radius-slider"
                type="range"
                min="1"
                max="25"
                step="1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] font-semibold text-slate-400 pt-1">
                <span>1 km (Hyperlocal)</span>
                <span>5 km</span>
                <span>15 km</span>
                <span>25 km (Metro-Wide)</span>
              </div>
            </div>

            {/* Quick Radius Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500">Presets:</span>
              {[2, 5, 10, 20, 25].map((val) => (
                <button
                  key={val}
                  type="button"
                  id={`radius-chip-${val}`}
                  onClick={() => setRadiusKm(val)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    radiusKm === val
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {val} km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="cancel-location-btn"
              onClick={onClose}
              className="h-11 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
            {(selectedArea || searchQuery) && (
              <button
                type="button"
                id="clear-location-btn"
                onClick={() => {
                  setSelectedArea("");
                  setSearchQuery("");
                  setModalValidationError(null);
                  onSave({
                    areaName: "",
                    radiusKm: Number(radiusKm),
                  });
                  onClose();
                }}
                className="h-11 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
          <button
            type="button"
            id="apply-location-btn"
            onClick={handleApply}
            className="w-full sm:w-auto h-11 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}
