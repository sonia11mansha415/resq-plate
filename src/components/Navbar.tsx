import { useState, useEffect } from "react";
import { UserRole, UserProfile } from "../types";
import {
  Utensils,
  HeartHandshake,
  Sparkles,
  MapPin,
  ChevronDown,
  User,
  User as UserIcon,
  History,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { LocationConfig } from "./LocationModal";

interface NavbarProps {
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  availableCount: number;
  totalMealsRescued: number;
  locationConfig: LocationConfig;
  onOpenLocationModal: () => void;
  currentUser: UserProfile;
  onOpenAuthModal: () => void;
  onOpenImpactHistory: () => void;
}

export default function Navbar({
  activeRole,
  onSelectRole,
  availableCount,
  totalMealsRescued,
  locationConfig,
  onOpenLocationModal,
  currentUser,
  onOpenAuthModal,
  onOpenImpactHistory,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileMenuOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        id="main-header"
        className="sticky top-0 z-40 w-full h-16 border-b border-slate-100 bg-white/95 backdrop-blur transition-shadow"
      >
        {/* ==================================================================== */}
        {/* 1. Mobile Top Bar (< md / < 768px)                                   */}
        {/* ==================================================================== */}
        <div className="flex md:hidden h-16 items-center justify-between px-3.5 sm:px-5 w-full">
          {/* Left: Brand logo icon + "ResQ-Plate" title + Google AI tag + active role chip */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-50" />
            </div>
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight shrink-0">
              ResQ<span className="text-emerald-600">-Plate</span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span>AI</span>
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shrink-0 ${
                currentUser.role === "donor"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : currentUser.role === "ngo"
                  ? "bg-teal-100 text-teal-800 border border-teal-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {currentUser.role === "donor" ? "Donor" : currentUser.role === "ngo" ? "NGO" : "Guest"}
            </span>
          </div>

          {/* Right: Log In / Switch + Hamburger Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="mobile-auth-login-top-btn"
              onClick={onOpenAuthModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer shrink-0"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. Desktop Single-Row Unified Top Bar (>= md / >= 768px)             */}
        {/* ==================================================================== */}
        <div className="hidden md:flex h-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 items-center justify-between gap-3 lg:gap-4">
          {/* Left: ResQ-Plate Logo + Google AI badge */}
          <div id="navbar-brand-zone" className="flex items-center gap-2 lg:gap-2.5 shrink-0">
            <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs ring-1 ring-emerald-500/30 shrink-0">
              <Utensils className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-emerald-50" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 shrink-0">
                ResQ<span className="text-emerald-600">-Plate</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] lg:text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 lg:px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Google AI</span>
              </span>
            </div>
          </div>

          {/* Center: Role switcher pills (Hotel / Food Donor vs NGO / Volunteer Feed) */}
          <div id="navbar-center-zone" className="flex items-center justify-center shrink-0">
            <div className="flex items-center p-1 bg-slate-100/90 rounded-full border border-slate-200/80 shadow-inner">
              <button
                type="button"
                id="role-tab-donor"
                onClick={() => onSelectRole("donor")}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-200 cursor-pointer shrink-0 ${
                  activeRole === "donor"
                    ? "bg-white text-emerald-700 shadow-sm font-semibold ring-1 ring-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-200/50"
                }`}
              >
                <Utensils className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hotel / Food Donor</span>
              </button>

              <button
                type="button"
                id="role-tab-ngo"
                onClick={() => onSelectRole("ngo")}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-200 cursor-pointer shrink-0 ${
                  activeRole === "ngo"
                    ? "bg-white text-emerald-700 shadow-sm font-semibold ring-1 ring-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-200/50"
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>NGO / Volunteer Feed</span>
                {availableCount > 0 && (
                  <span className="ml-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs shrink-0">
                    {availableCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right: Location pill, Impact counter, User badge, and Log In / Switch button */}
          <div id="navbar-actions-zone" className="flex items-center justify-end gap-3 shrink-0">
            {/* Location Selector */}
            <button
              type="button"
              id="navbar-location-btn"
              onClick={onOpenLocationModal}
              title="Click to adjust rescue location and radius filter"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 text-xs sm:text-sm font-medium text-slate-700 hover:text-emerald-900 transition-colors shadow-xs group cursor-pointer shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate max-w-[100px] lg:max-w-[130px]">
                {locationConfig.areaName || "Location"}
              </span>
              {locationConfig.areaName && (
                <span className="text-[11px] text-slate-400 font-normal">
                  ({locationConfig.radiusKm} km)
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0" />
            </button>

            {/* Impact & History Counter Button */}
            <button
              type="button"
              id="navbar-impact-history-btn"
              onClick={onOpenImpactHistory}
              title="View network impact metrics and past donation history"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-full border border-slate-200 transition-colors shadow-xs group cursor-pointer shrink-0"
            >
              <History className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-[-20deg] transition-transform shrink-0" />
              <span className="whitespace-nowrap">Impact</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800 shrink-0">
                {totalMealsRescued}
              </span>
            </button>

            {/* User Profile Badge (Compact pill when authenticated) */}
            {currentUser.role !== "guest" && (
              <button
                type="button"
                id="btn-user-profile"
                onClick={onOpenAuthModal}
                title="Click to switch account or manage profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-800 transition-colors shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                    currentUser.role === "donor" ? "bg-emerald-700" : "bg-teal-700"
                  }`}
                >
                  {currentUser.role === "donor" ? (
                    <Utensils className="w-2.5 h-2.5" />
                  ) : (
                    <HeartHandshake className="w-2.5 h-2.5" />
                  )}
                </div>
                <span className="font-bold text-slate-900 truncate max-w-[100px] lg:max-w-[140px] xl:max-w-[180px]">
                  {currentUser.organizationName}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold shrink-0 ${
                    currentUser.role === "donor"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-teal-100 text-teal-800 border border-teal-300"
                  }`}
                >
                  {currentUser.role === "donor" ? "[Donor]" : "[NGO]"}
                </span>
              </button>
            )}

            {/* Prominent Green Log In / Switch Button (Always visible on far-right) */}
            <button
              type="button"
              id="btn-auth-login"
              onClick={onOpenAuthModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>Log In / Switch</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. Mobile Slide-Over Navigation Drawer (Escaped from header clipping) */}
      {/* ==================================================================== */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer-overlay"
          className="fixed inset-0 z-[100] flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          {/* Click backdrop to close */}
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            id="mobile-nav-drawer-panel"
            className="w-full max-w-[min(22rem,88vw)] bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out z-10 overflow-hidden animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Header */}
            <div className="h-16 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Utensils className="w-4 h-4 text-emerald-50" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-slate-900">
                    ResQ<span className="text-emerald-600">-Plate</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Google AI
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-mobile-menu"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* 1. Role Switcher: Full-width segmented toggle */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 block">
                  Active Mode
                </label>
                <div className="flex flex-col gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                  <button
                    type="button"
                    id="mobile-role-tab-donor"
                    onClick={() => {
                      onSelectRole("donor");
                      setMobileMenuOpen(false);
                    }}
                    className={`min-h-[44px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeRole === "donor"
                        ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          activeRole === "donor"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        <Utensils className="w-4 h-4" />
                      </div>
                      <span>Hotel / Food Donor</span>
                    </div>
                    {activeRole === "donor" && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    id="mobile-role-tab-ngo"
                    onClick={() => {
                      onSelectRole("ngo");
                      setMobileMenuOpen(false);
                    }}
                    className={`min-h-[44px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeRole === "ngo"
                        ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          activeRole === "ngo"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <span>NGO / Volunteer Feed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {availableCount > 0 && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {availableCount}
                        </span>
                      )}
                      {activeRole === "ngo" && (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Location Selector */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 block">
                  Rescue Location & Radius
                </label>
                <button
                  type="button"
                  id="mobile-location-btn"
                  onClick={() => {
                    onOpenLocationModal();
                    setMobileMenuOpen(false);
                  }}
                  className="min-h-[48px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 transition shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-left truncate">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {locationConfig.areaName || "Location not set (Required)"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {locationConfig.areaName ? `Radius: ${locationConfig.radiusKm} km filter` : "Tap to set dispatch venue"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                </button>
              </div>

              {/* 3. Impact & Donation History */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 block">
                  Impact Analytics
                </label>
                <button
                  type="button"
                  id="mobile-impact-history-btn"
                  onClick={() => {
                    onOpenImpactHistory();
                    setMobileMenuOpen(false);
                  }}
                  className="min-h-[48px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 transition shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <History className="w-4 h-4 group-hover:rotate-[-20deg] transition-transform" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-emerald-950 block">
                        Impact & Donation History
                      </span>
                      <span className="text-[11px] text-emerald-800/80">
                        {totalMealsRescued} Portions Rescued
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0" />
                </button>
              </div>

              {/* 4. Account & Authentication */}
              <div className="pt-2 border-t border-slate-200">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2 block">
                  Account & Authentication
                </label>
                {currentUser.role === "guest" ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span>
                        Logged in as: <strong>Guest User</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      id="mobile-auth-login-btn"
                      onClick={() => {
                        onOpenAuthModal();
                        setMobileMenuOpen(false);
                      }}
                      className="min-h-[44px] w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span>Log In / Select Role</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                            currentUser.role === "donor" ? "bg-emerald-700" : "bg-teal-700"
                          }`}
                        >
                          {currentUser.role === "donor" ? (
                            <Utensils className="w-3.5 h-3.5" />
                          ) : (
                            <HeartHandshake className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {currentUser.organizationName}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {currentUser.email}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                          currentUser.role === "donor"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-teal-100 text-teal-800 border border-teal-300"
                        }`}
                      >
                        {currentUser.role === "donor" ? "Hotel Donor" : "NGO / Volunteer"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        id="mobile-auth-switch-btn"
                        onClick={() => {
                          onOpenAuthModal();
                          setMobileMenuOpen(false);
                        }}
                        className="min-h-[44px] w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold shadow-2xs transition cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>Switch Account</span>
                      </button>

                      <button
                        type="button"
                        id="mobile-auth-logout-btn"
                        onClick={() => {
                          onOpenAuthModal();
                          setMobileMenuOpen(false);
                        }}
                        className="min-h-[40px] w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-xs font-semibold transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Log Out / Switch Role</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}




