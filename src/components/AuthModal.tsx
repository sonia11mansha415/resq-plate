import { useState } from "react";
import { AuthRole, UserProfile, DEFAULT_PROFILES } from "../types";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Utensils,
  HeartHandshake,
  User,
  Check,
  Building2,
  Sparkles,
  ArrowRight,
  LogOut,
  Info
} from "lucide-react";

export interface GatedReason {
  targetRole: AuthRole;
  message: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectRole: (role: AuthRole, customData?: Partial<UserProfile>) => void;
  gatedReason?: GatedReason | null;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onSelectRole,
  gatedReason,
}: AuthModalProps) {
  const [customOrgName, setCustomOrgName] = useState<string>("");
  const [customContactName, setCustomContactName] = useState<string>("");
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelect = (role: AuthRole) => {
    if (isCustomizing && customOrgName.trim()) {
      onSelectRole(role, {
        organizationName: customOrgName.trim(),
        name: customContactName.trim() || DEFAULT_PROFILES[role].name,
      });
    } else {
      onSelectRole(role);
    }
    onClose();
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-card"
        className="bg-white w-[92%] sm:w-full max-w-md sm:max-w-xl mx-auto rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 p-4 sm:p-5 text-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Account & Role Switcher
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  Role Auth
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Switch user identity to test verified Donor publishing vs NGO volunteer claim permissions
              </p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* Action Gate Warning Banner (Shown when gated) */}
          {gatedReason && (
            <div
              id="auth-gate-alert"
              className={`p-4 rounded-xl border-2 flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
                gatedReason.targetRole === "donor"
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-teal-50 border-teal-300 text-teal-950"
              }`}
            >
              {gatedReason.targetRole === "donor" ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider">
                  {gatedReason.targetRole === "donor"
                    ? "Hotel / Food Donor Account Required"
                    : "Verified NGO Account Required"}
                </h4>
                <p id="auth-gate-message" className="text-xs font-semibold leading-relaxed">
                  {gatedReason.message}
                </p>
              </div>
            </div>
          )}

          {/* Quick 1-Click Role Switch Bar */}
          <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Fast Profile Switcher (1-Click Test):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-fast-switch-donor"
                data-testid="btn-fast-switch-donor"
                onClick={() => handleSelect("donor")}
                className={`px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentUser.role === "donor"
                    ? "bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300"
                }`}
              >
                <Utensils className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Hotel Donor: Grand Palace</span>
              </button>
              <button
                type="button"
                id="btn-fast-switch-ngo"
                data-testid="btn-fast-switch-ngo"
                onClick={() => handleSelect("ngo")}
                className={`px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentUser.role === "ngo"
                    ? "bg-teal-700 text-white shadow-xs ring-2 ring-teal-400"
                    : "bg-white text-teal-800 hover:bg-teal-50 border border-teal-300"
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">NGO Volunteer: Hope Food</span>
              </button>
              <button
                type="button"
                id="btn-fast-switch-guest"
                data-testid="btn-fast-switch-guest"
                onClick={() => handleSelect("guest")}
                className={`px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentUser.role === "guest"
                    ? "bg-slate-700 text-white shadow-xs ring-2 ring-slate-400"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"
                }`}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">Browse as Guest</span>
              </button>
            </div>
          </div>

          {/* Detailed Profile Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Select Active Account Role
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Current: <strong className="text-slate-800">{currentUser.organizationName}</strong>
              </span>
            </div>

            {/* Option 1: Hotel / Food Donor */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                currentUser.role === "donor"
                  ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                  : gatedReason?.targetRole === "donor"
                  ? "bg-amber-50/40 border-amber-400 hover:border-amber-500"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Grand Palace Banquet & Hotel
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        [Donor Account]
                      </span>
                      {currentUser.role === "donor" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Chef Marcus Vance • Executive Banquet Chef
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Full publishing authority • Runs Gemini AI HACCP assessments • Dispatches to nearby NGOs
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-login-donor"
                  onClick={() => handleSelect("donor")}
                  className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
                    currentUser.role === "donor"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                      : gatedReason?.targetRole === "donor"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400/40"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>{currentUser.role === "donor" ? "Continue as Donor" : "Log in as Hotel Donor"}</span>
                </button>
              </div>
            </div>

            {/* Option 2: NGO / Volunteer */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                currentUser.role === "ngo"
                  ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                  : gatedReason?.targetRole === "ngo"
                  ? "bg-teal-50/40 border-teal-400 hover:border-teal-500"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Hope Food Rescue Foundation
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                        [NGO Account]
                      </span>
                      {currentUser.role === "ngo" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-300">
                          <Check className="w-3 h-3 text-teal-600" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Sarah Jenkins • Senior Rescue Coordinator
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Verified 501(c)(3) Shelter • Claims active food trays • Generates OTP pickup verification
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-login-ngo"
                  onClick={() => handleSelect("ngo")}
                  className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
                    currentUser.role === "ngo"
                      ? "bg-teal-100 text-teal-800 border border-teal-300 hover:bg-teal-200"
                      : gatedReason?.targetRole === "ngo"
                      ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-400/40"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>{currentUser.role === "ngo" ? "Continue as NGO" : "Log in as NGO Volunteer"}</span>
                </button>
              </div>
            </div>

            {/* Option 3: Guest / Public Viewer */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                currentUser.role === "guest"
                  ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Public Guest Viewer
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                        [Guest / Unauthenticated]
                      </span>
                      {currentUser.role === "guest" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-300">
                          <Check className="w-3 h-3 text-slate-600" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Anonymous Community Visitor
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Read-only live feed viewing • Testing action-gated barriers for publishing and claiming
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-login-guest"
                  onClick={() => handleSelect("guest")}
                  className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
                    currentUser.role === "guest"
                      ? "bg-slate-200 text-slate-800 border border-slate-300"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentUser.role === "guest" ? "Currently Guest" : "Log out / Browse as Guest"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional Custom Organization Details Collapsible */}
          <div className="pt-2 border-t border-slate-100">
            {!isCustomizing ? (
              <button
                type="button"
                onClick={() => setIsCustomizing(true)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Need to test with a custom Hotel or NGO name?</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Custom Organization Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomizing(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Organization / Venue Name
                    </label>
                    <input
                      type="text"
                      value={customOrgName}
                      onChange={(e) => setCustomOrgName(e.target.value)}
                      placeholder="e.g. The Ritz-Carlton Banquet"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Representative Name
                    </label>
                    <input
                      type="text"
                      value={customContactName}
                      onChange={(e) => setCustomContactName(e.target.value)}
                      placeholder="e.g. Chef Anthony"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Role status is safely stored in local state and persists across sessions.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-11 px-5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center shrink-0"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
