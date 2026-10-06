import React, { useState, useEffect, ReactNode } from "react";
import { DonationItem, UserProfile, AuthRole, LightboxPhoto } from "../types";
import CountdownBadge from "./CountdownBadge";
import PickupModal from "./PickupModal";
import AiAssistantDrawer from "./AiAssistantDrawer";
import { LocationConfig } from "./LocationModal";
import {
  MapPin,
  Utensils,
  CheckCircle,
  Navigation,
  ShieldAlert,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  PhoneCall,
  SlidersHorizontal,
  Compass,
  Lock,
  ZoomIn
} from "lucide-react";

interface NgoFeedScreenProps {
  donations: DonationItem[];
  onClaimDonation: (donationId: string, claimedByName: string, customPin?: string) => void;
  onMarkPickedUp?: (donationId: string) => void;
  onNavigateToDonor: () => void;
  locationConfig: LocationConfig;
  onOpenLocationModal: () => void;
  currentUser: UserProfile;
  onRequireAuth: (targetRole: AuthRole, message: string, pendingPayload?: any) => void;
  externalClaimItem?: DonationItem | null;
  onClearExternalClaimItem?: () => void;
  onOpenPhotoLightbox?: (photo: LightboxPhoto) => void;
}

const isNotSpecified = (val?: string | null): boolean => {
  if (!val) return true;
  const lower = val.trim().toLowerCase();
  return (
    lower === "" ||
    lower === "not specified" ||
    lower === "not specified." ||
    lower === "not provided" ||
    lower === "not provided." ||
    lower === "not provided by donor" ||
    lower === "not provided by donor." ||
    lower === "none" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "standard room temp (unrecorded)" ||
    lower.includes("unrecorded") ||
    lower.startsWith("not specified") ||
    lower.startsWith("not provided")
  );
};

// Local ExpandableText component with simple state toggling as per Issue #22
const ExpandableText = ({
  text,
  maxLines = 2,
  prefix,
  charLimit,
}: {
  text?: string | null;
  maxLines?: number;
  prefix?: ReactNode;
  charLimit?: number;
}) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const limit = charLimit ?? 90;
  if (text.length <= limit) return <span>{prefix}{text}</span>;
  return (
    <span>
      {prefix}
      {open ? text : `${text.slice(0, limit)}...`}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 ml-1 underline cursor-pointer"
      >
        {open ? "Show less" : "Read more"}
      </button>
    </span>
  );
};

export default function NgoFeedScreen({
  donations,
  onClaimDonation,
  onMarkPickedUp,
  onNavigateToDonor,
  locationConfig,
  onOpenLocationModal,
  currentUser,
  onRequireAuth,
  externalClaimItem,
  onClearExternalClaimItem,
  onOpenPhotoLightbox,
}: NgoFeedScreenProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "claimed" | "completed">("all");
  const [filterWithinRadiusOnly, setFilterWithinRadiusOnly] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [confirmingDonation, setConfirmingDonation] = useState<DonationItem | null>(null);
  const [activeDirectionsDonation, setActiveDirectionsDonation] = useState<DonationItem | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);

  // Status helper functions
  const isItemAvailable = (status?: string) => {
    const s = (status || "").toUpperCase();
    return s === "AVAILABLE" || s === "";
  };

  const isItemClaimed = (status?: string) => {
    const s = (status || "").toUpperCase();
    return s === "CLAIMED";
  };

  const isItemPickedUp = (status?: string) => {
    const s = (status || "").toUpperCase();
    return s === "PICKED_UP";
  };

  // Sync external claim item if login immediately resolved a claim
  useEffect(() => {
    if (externalClaimItem) {
      setActiveDirectionsDonation(externalClaimItem);
      if (onClearExternalClaimItem) {
        onClearExternalClaimItem();
      }
    }
  }, [externalClaimItem, onClearExternalClaimItem]);

  // Filtered and sorted listings
  const filteredDonations = donations.filter((item) => {
    // Radius filter
    if (filterWithinRadiusOnly && typeof item.distanceKm === "number" && item.distanceKm > locationConfig.radiusKm) {
      return false;
    }
    // Category filter
    if (filterCategory !== "all" && item.category !== filterCategory) {
      return false;
    }
    // Status filter tabs: 'all' shows all, 'available' shows unreserved, 'claimed' shows active transit, 'completed' shows picked up
    if (filterStatus === "available" && !isItemAvailable(item.status)) {
      return false;
    }
    if (filterStatus === "claimed" && !isItemClaimed(item.status)) {
      return false;
    }
    if (filterStatus === "completed" && !isItemPickedUp(item.status)) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.dishName.toLowerCase().includes(q);
      const matchDonor = item.donorName.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchDonor && !matchCat) return false;
    }
    return true;
  });

  const availableCount = donations.filter((d) => isItemAvailable(d.status)).length;
  const inRadiusCount = donations.filter(
    (d) => isItemAvailable(d.status) && (typeof d.distanceKm !== "number" || d.distanceKm <= locationConfig.radiusKm)
  ).length;
  const totalPortionsAvailable = donations
    .filter((d) => isItemAvailable(d.status))
    .reduce((acc, curr) => acc + curr.servings, 0);

  // Step 1: NGO clicks "Claim Pickup" -> Validate role & open Pickup Confirmation Modal
  const handleInitiateClaim = (item: DonationItem) => {
    // Prevent double-claiming
    if (isItemClaimed(item.status) || isItemPickedUp(item.status)) {
      return;
    }

    // Action Gate 2: Verified NGO account check
    if (currentUser.role !== "ngo") {
      onRequireAuth(
        "ngo",
        "Please log in with a verified NGO / Volunteer account to claim this food pickup.",
        item
      );
      return;
    }

    // Open the Pickup Confirmation Modal showing donor details and handover instructions
    setConfirmingDonation(item);
  };

  // Step 2: Confirmed in modal -> Immediately update status to 'CLAIMED', assign dynamic PIN, set claimedBy: currentUser.name
  const handleConfirmClaim = (item: DonationItem) => {
    const dynamicPin = `#RQ-${Math.floor(100 + Math.random() * 900)}`;
    const claimerName = currentUser.name || currentUser.organizationName || "NGO Volunteer";

    onClaimDonation(item.id, claimerName, dynamicPin);

    const updated: DonationItem = {
      ...item,
      status: "CLAIMED",
      claimedBy: claimerName,
      claimedByOrg: currentUser.organizationName,
      claimedAt: Date.now(),
      pickupOtp: dynamicPin,
    };

    setConfirmingDonation(null);
    setActiveDirectionsDonation(updated);
  };

  return (
    <div id="ngo-feed-screen-container" className="w-full pb-16 sm:pb-8">
      {/* Top Banner & Stats */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              NGO & SHELTER VOLUNTEER DISPATCH
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Surplus Food Rescue Feed <span className="text-emerald-600">| Live</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
              HACCP-verified surplus food listings from banquet halls, catering centers, and hotels within{" "}
              <span className="font-semibold text-emerald-800">{locationConfig.radiusKm} km</span>
              {locationConfig.areaName ? (
                <> of <span className="font-semibold text-slate-800">{locationConfig.areaName}</span></>
              ) : null}. Claim an active pickup to dispatch volunteers before the safe consumption window closes.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 shadow-xs text-center flex-1 sm:flex-initial">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Within {locationConfig.radiusKm} km
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700">
                {inRadiusCount}
              </span>
            </div>

            <div className="bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 shadow-xs text-center flex-1 sm:flex-initial">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Portions Ready
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {totalPortionsAvailable}
              </span>
            </div>
          </div>
        </div>

        {/* Location & Radius Dispatch Banner */}
        <div className="mt-5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-950">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Dispatch Location: <strong>{locationConfig.areaName || "Not specified"}</strong>
            </span>
            <span className="text-emerald-400">•</span>
            <span>
              Radius: <strong>{locationConfig.radiusKm} km</strong>
            </span>
            <span className="text-emerald-400 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-emerald-800">
              {inRadiusCount} donation{inRadiusCount === 1 ? "" : "s"} within range
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="feed-toggle-radius-btn"
              onClick={() => setFilterWithinRadiusOnly(!filterWithinRadiusOnly)}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterWithinRadiusOnly
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-white text-slate-700 border border-emerald-300 hover:bg-emerald-100/50"
              }`}
            >
              {filterWithinRadiusOnly ? `Filtering ≤ ${locationConfig.radiusKm} km` : "Showing All Distances"}
            </button>
            <button
              type="button"
              id="feed-change-location-btn"
              onClick={onOpenLocationModal}
              className="px-3 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-emerald-700" />
              <span>Change Area / Radius</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, hotels, or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden text-slate-800"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Items" },
              { id: "Non-Veg", label: "Non-Veg" },
              { id: "Vegetarian", label: "Vegetarian" },
              { id: "Bakery & Snacks", label: "Bakery" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  filterCategory === cat.id
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3">
            {[
              { id: "all", label: "All", count: donations.length },
              {
                id: "available",
                label: "Available",
                count: availableCount,
              },
              {
                id: "claimed",
                label: "Claimed",
                count: donations.filter((d) => isItemClaimed(d.status)).length,
              },
              {
                id: "completed",
                label: "Completed",
                count: donations.filter((d) => isItemPickedUp(d.status)).length,
              },
            ].map((st) => (
              <button
                key={st.id}
                id={`filter-status-${st.id}`}
                onClick={() => setFilterStatus(st.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  filterStatus === st.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filterStatus === st.id
                      ? "bg-slate-700 text-slate-100"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed Cards Grid */}
      {filteredDonations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Donations Found in Range</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {filterWithinRadiusOnly
              ? `No surplus food detected within ${locationConfig.radiusKm} km${locationConfig.areaName ? ` of ${locationConfig.areaName}` : ""}. Expand your search radius or reset category filters.`
              : "Try resetting your search or category filters, or publish a new donation from the Donor screen."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {filterWithinRadiusOnly && (
              <button
                type="button"
                id="empty-show-all-distances-btn"
                onClick={() => setFilterWithinRadiusOnly(false)}
                className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Show All Distances
              </button>
            )}
            <button
              type="button"
              id="empty-expand-radius-btn"
              onClick={onOpenLocationModal}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust Radius (1-25 km)</span>
            </button>
            <button
              type="button"
              id="empty-reset-filters-btn"
              onClick={() => {
                setFilterCategory("all");
                setFilterStatus("all");
                setSearchQuery("");
                setFilterWithinRadiusOnly(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-3 sm:px-6">
          {filteredDonations.map((item) => {
            const isClaimed = isItemClaimed(item.status);
            const isPickedUp = isItemPickedUp(item.status);

            return (
              <div
                key={item.id}
                id={`donation-card-${item.id}`}
                className={`flex flex-col justify-between h-full bg-white rounded-2xl border ${
                  isClaimed || isPickedUp
                    ? "border-slate-300/80 bg-slate-50/40"
                    : "border-slate-200/80 hover:border-emerald-300"
                } shadow-sm overflow-hidden hover:shadow-md transition-shadow`}
              >
                {/* Image Container (Clickable Lightbox Zoom) */}
                <div
                  id={`feed-image-container-${item.id}`}
                  onClick={() =>
                    onOpenPhotoLightbox?.({
                      imageUrl: item.imageUrl,
                      title: item.dishName,
                      subtitle: `${item.servings} portions ready • ${item.donorName}`,
                      category: item.category,
                      isDemo: item.isDemo,
                    })
                  }
                  role="button"
                  tabIndex={0}
                  title={`Click to zoom photo of ${item.dishName}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenPhotoLightbox?.({
                        imageUrl: item.imageUrl,
                        title: item.dishName,
                        subtitle: `${item.servings} portions ready • ${item.donorName}`,
                        category: item.category,
                        isDemo: item.isDemo,
                      });
                    }
                  }}
                  className="relative w-full aspect-video sm:h-48 overflow-hidden bg-slate-100 cursor-pointer group"
                >
                  <img
                    id={`feed-card-image-${item.id}`}
                    src={item.imageUrl}
                    alt={item.dishName}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80";
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                  {/* Hover Zoom Cue */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-lg border border-white/20">
                      <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Click to Zoom</span>
                    </span>
                  </div>

                  {/* Overlay Badges (Flex-wrap to avoid clipping/overlapping) */}
                  <div className="absolute top-0 inset-x-0 flex flex-wrap items-center gap-1.5 p-2.5 sm:p-3 pointer-events-auto">
                    {/* Status Lifecycle Badge */}
                    {isPickedUp ? (
                      <span
                        id={`status-badge-${item.id}`}
                        className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600/95 text-white backdrop-blur-md shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-blue-200 shrink-0" />
                        <span>Rescued / Completed</span>
                      </span>
                    ) : isClaimed ? (
                      <span
                        id={`status-badge-${item.id}`}
                        className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-600/95 text-white backdrop-blur-md shadow-xs flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-pulse" />
                        <span>Claimed</span>
                      </span>
                    ) : (
                      <span
                        id={`status-badge-${item.id}`}
                        className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600/95 text-white backdrop-blur-md shadow-xs flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
                        <span>Available for Rescue</span>
                      </span>
                    )}

                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs ${
                        item.category === "Non-Veg"
                          ? "bg-rose-500/90 text-white"
                          : "bg-emerald-700/90 text-white"
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      {item.distanceKm} km
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                      Safety: <strong className="text-emerald-200">{item.freshnessScore.toFixed(1)}/10</strong>
                    </span>
                    {item.isDemo && (
                      <span
                        id={`demo-sample-badge-${item.id}`}
                        data-testid="demo-sample-badge"
                        className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs border border-amber-300/60 backdrop-blur-xs select-none whitespace-nowrap"
                      >
                        [DEMO SAMPLE]
                      </span>
                    )}
                    <CountdownBadge expiryTimestamp={item.expiryTimestamp} size="sm" />
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col gap-2.5">
                  <div className="space-y-2.5">
                    {/* Title & Portions */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug line-clamp-2">
                        {item.dishName}
                      </h3>
                      <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                        {item.servings} portions
                      </span>
                    </div>

                    {/* Donor & Location row */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
                      <span className="font-bold text-slate-800 shrink-0">{item.donorName}</span>
                      <span>•</span>
                      <span className="truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.donorAddress}
                      </span>
                    </div>

                    {/* Cooking & Holding Log summary */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <ExpandableText
                        prefix={<span className="font-semibold text-slate-700">Prep Log: </span>}
                        text={
                          item.cookingDetails && !isNotSpecified(item.cookingDetails)
                            ? item.cookingDetails
                            : "Not provided by donor"
                        }
                        maxLines={2}
                        charLimit={85}
                      />
                    </div>

                    {/* Packaging advice excerpt */}
                    <div className="text-[11px] text-slate-500">
                      <ExpandableText
                        prefix={<span className="font-semibold text-slate-700">Packaging: </span>}
                        text={
                          item.packagingAdvice && !isNotSpecified(item.packagingAdvice)
                            ? item.packagingAdvice
                            : "Not specified"
                        }
                        maxLines={1}
                        charLimit={75}
                      />
                    </div>

                    {/* Optional AI Reasoning note */}
                    {item.aiReasoning && (
                      <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100/80 text-[11px] text-emerald-900">
                        <ExpandableText
                          prefix={<span className="font-semibold text-emerald-950">AI Note: </span>}
                          text={item.aiReasoning}
                          maxLines={2}
                          charLimit={80}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 mt-auto flex items-center gap-2.5">
                    {isClaimed || isPickedUp ? (
                      <div className="w-full space-y-2">
                        {/* Disabled Badge: Pickup in Progress • [NGO Name] En Route */}
                        <div
                          id={`claimed-badge-${item.id}`}
                          className={`w-full min-h-[44px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 cursor-not-allowed select-none shadow-2xs ${
                            isPickedUp
                              ? "bg-blue-50 border-blue-200 text-blue-800"
                              : "bg-amber-50/80 border-amber-200 text-amber-900"
                          }`}
                          aria-disabled="true"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isPickedUp ? "bg-blue-600" : "bg-amber-500 animate-pulse"
                              }`}
                            />
                            <span className="truncate">
                              {isPickedUp
                                ? `Rescued by ${item.claimedBy || "NGO Volunteer"} • Completed`
                                : `Claimed • ${item.claimedBy || "NGO Volunteer"} En Route`}
                            </span>
                          </div>
                          {item.pickupOtp && (
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-white border border-amber-300 text-amber-900 shrink-0">
                              {item.pickupOtp}
                            </span>
                          )}
                        </div>

                        {/* View Directions & Dock Details button */}
                        <button
                          type="button"
                          id={`btn-directions-${item.id}`}
                          onClick={() => setActiveDirectionsDonation(item)}
                          className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>View Directions & Dock Details</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id={`btn-claim-${item.id}`}
                        onClick={() => handleInitiateClaim(item)}
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Claim Pickup</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action: Prompt to donate if donor wants to add another */}
      <div className="mt-12 p-6 bg-emerald-900 text-white rounded-3xl shadow-lg border border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-300" />
            Are you a Banquet or Restaurant Manager?
          </h3>
          <p className="text-xs text-emerald-200 mt-0.5 max-w-xl">
            Surplus food must never be discarded. Run Gemini AI inspection on your catering trays and publish surplus donations directly to our live volunteer network.
          </p>
        </div>
        <button
          onClick={onNavigateToDonor}
          className="px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap cursor-pointer"
        >
          Donate Surplus Food Now
        </button>
      </div>

      {/* Modal 1: Review & Confirm Food Rescue Pickup */}
      {confirmingDonation && (
        <PickupModal
          donation={confirmingDonation}
          isConfirming={true}
          onClose={() => setConfirmingDonation(null)}
          onConfirmClaim={handleConfirmClaim}
          currentUserName={currentUser.name}
        />
      )}

      {/* Modal 2: Directions, Handover PIN & Dock Details */}
      {activeDirectionsDonation && (
        <PickupModal
          donation={activeDirectionsDonation}
          isConfirming={false}
          onClose={() => setActiveDirectionsDonation(null)}
          onMarkPickedUp={(id) => {
            if (onMarkPickedUp) onMarkPickedUp(id);
            setActiveDirectionsDonation((prev) =>
              prev && prev.id === id ? { ...prev, status: "PICKED_UP" } : prev
            );
          }}
          currentUserName={currentUser.name}
        />
      )}

      {/* Floating AI Assistant Trigger (Bottom-Right Corner) */}
      <button
        type="button"
        id="ngo-btn-ask-ai-assistant"
        onClick={() => setIsAiDrawerOpen(true)}
        title="Ask AI Assistant: Safe transport, holding temperatures, distribution hygiene & allergens"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer group"
      >
        <Sparkles className="w-4 h-4 text-emerald-100 group-hover:text-white transition-colors shrink-0" />
        <span className="hidden sm:inline text-xs sm:text-sm font-semibold tracking-tight">Ask AI Assistant</span>
        <span className="sm:hidden text-xs font-semibold tracking-tight">Ask AI</span>
      </button>

      {/* Slide-over Chat Drawer for NGO Volunteers */}
      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        role="volunteer"
      />
    </div>
  );
}
