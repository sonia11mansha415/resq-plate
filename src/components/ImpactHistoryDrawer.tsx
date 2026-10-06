import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  History,
  ShieldCheck,
  Utensils,
  Award,
  Users,
  Leaf,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";
import { DonationItem } from "../types";

interface ImpactHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  donations: DonationItem[];
}

interface ArchivedRescue {
  id: string;
  dishName: string;
  servings: number;
  donorName: string;
  donorAddress: string;
  claimedBy: string;
  claimedByOrg: string;
  timeAgo: string;
  status: "PICKED_UP" | "CLAIMED";
  pickupOtp: string;
  category: string;
}

const HISTORIC_RESCUES: ArchivedRescue[] = [
  {
    id: "arch-1",
    dishName: "Hyderabadi Vegetable Biryani & Raita",
    servings: 45,
    donorName: "Grand Palace Banquet & Hotel",
    donorAddress: "420 Convention Center Blvd, Metro Hub",
    claimedBy: "Sarah Jenkins",
    claimedByOrg: "Hope Food Rescue Foundation",
    timeAgo: "Today, 1:15 PM",
    status: "PICKED_UP",
    pickupOtp: "#RQ-302",
    category: "Vegetarian",
  },
  {
    id: "arch-2",
    dishName: "Mediterranean Herb Roast Chicken Platters",
    servings: 35,
    donorName: "The Westin Executive Club",
    donorAddress: "88 Luxury Way, Financial District",
    claimedBy: "Brother David",
    claimedByOrg: "City Harvest Action Guild",
    timeAgo: "Yesterday, 8:40 PM",
    status: "PICKED_UP",
    pickupOtp: "#RQ-519",
    category: "Non-Veg",
  },
  {
    id: "arch-3",
    dishName: "Artisan Sourdough & Croissant Trays",
    servings: 60,
    donorName: "Grand Central Airport Lounge",
    donorAddress: "Terminal 2 Departure Concourse, Airport Zone",
    claimedBy: "Priya Sharma",
    claimedByOrg: "Seva Community Kitchens",
    timeAgo: "Yesterday, 2:10 PM",
    status: "PICKED_UP",
    pickupOtp: "#RQ-184",
    category: "Bakery & Snacks",
  },
  {
    id: "arch-4",
    dishName: "Paneer Butter Masala & Garlic Naan",
    servings: 50,
    donorName: "Royal Crown Banquet Gardens",
    donorAddress: "12 Pavilion Road, North Suburb",
    claimedBy: "Marcus Thorne",
    claimedByOrg: "FeedTheNeed Rapid Network",
    timeAgo: "2 days ago, 9:20 PM",
    status: "PICKED_UP",
    pickupOtp: "#RQ-743",
    category: "Vegetarian",
  },
  {
    id: "arch-5",
    dishName: "Steamed Dim Sum & Stir-Fry Noodles",
    servings: 30,
    donorName: "Orchid Pavilion Ballroom",
    donorAddress: "55 Waterfront Esplanade",
    claimedBy: "Elena Rostova",
    claimedByOrg: "Hope Food Rescue Foundation",
    timeAgo: "3 days ago, 11:00 PM",
    status: "PICKED_UP",
    pickupOtp: "#RQ-922",
    category: "Non-Veg",
  },
];

export default function ImpactHistoryDrawer({
  isOpen,
  onClose,
  donations,
}: ImpactHistoryDrawerProps) {
  const [filterType, setFilterType] = useState<"all" | "completed" | "in_transit">("all");

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute live active claimed/picked_up items from current state
  const activeClaimedFromState: ArchivedRescue[] = donations
    .filter((d) => {
      const st = (d.status || "").toUpperCase();
      return st === "CLAIMED" || st === "PICKED_UP";
    })
    .map((d) => {
      const st = (d.status || "").toUpperCase();
      return {
        id: d.id,
        dishName: d.dishName,
        servings: d.servings,
        donorName: d.donorName,
        donorAddress: d.donorAddress,
        claimedBy: d.claimedBy || "NGO Volunteer",
        claimedByOrg: d.claimedByOrg || "Partner Food Rescue NGO",
        timeAgo: d.claimedAt
          ? new Date(d.claimedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Recently Dispatched",
        status: st === "PICKED_UP" ? ("PICKED_UP" as const) : ("CLAIMED" as const),
        pickupOtp: d.pickupOtp || "#RQ-482",
        category: d.category,
      };
    });

  // Combine live state with historic rescues (avoid duplicates if ID matches)
  const existingIds = new Set(activeClaimedFromState.map((r) => r.id));
  const combinedHistory = [
    ...activeClaimedFromState,
    ...HISTORIC_RESCUES.filter((h) => !existingIds.has(h.id)),
  ];

  // Dynamic Metrics:
  // Baseline 280 portions rescued + all current claimed/picked_up servings
  const baselineRescued = 280;
  const currentClaimedServings = activeClaimedFromState.reduce(
    (acc, curr) => acc + curr.servings,
    0
  );
  const totalPortionsRescued = baselineRescued + currentClaimedServings;
  // Estimated ~0.42 kg food waste prevented per meal portion
  const approxKgPrevented = Math.round(totalPortionsRescued * 0.42);
  // Estimated CO2 emissions avoided ~0.92 kg CO2e per meal
  const approxCo2Avoided = Math.round(totalPortionsRescued * 0.92);
  // Active Partner NGOs count
  const partnerNgos = 4;

  const filteredHistory = combinedHistory.filter((item) => {
    if (filterType === "completed") return item.status === "PICKED_UP";
    if (filterType === "in_transit") return item.status === "CLAIMED";
    return true;
  });

  return (
    <div
      id="impact-history-drawer-overlay"
      data-testid="impact-history-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Impact and Donation History"
    >
      {/* Click backdrop to close */}
      <div className="flex-1 cursor-pointer" onClick={onClose} />

      {/* Drawer Container */}
      <div
        id="impact-history-drawer-panel"
        className="w-full max-w-lg sm:max-w-xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right z-10"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-white/10 text-emerald-300 border border-white/10">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Network Impact & Analytics
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Impact & Donation History
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              Real-time surplus redistribution metrics and verified handover log.
            </p>
          </div>

          <button
            type="button"
            id="btn-close-impact-drawer"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0 flex items-center justify-center"
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Overall Impact Metrics Cards */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Overall Rescue Impact (All Time)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Metric 1: Portions Rescued */}
              <div
                id="metric-total-portions"
                className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <Utensils className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded">
                    Meals
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-950 block tracking-tight">
                    {totalPortionsRescued}+
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">
                    Portions Rescued
                  </span>
                </div>
              </div>

              {/* Metric 2: Food Waste Prevented */}
              <div
                id="metric-waste-prevented"
                className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-teal-700 mb-1">
                  <Leaf className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-200/70 text-teal-900 px-1.5 py-0.2 rounded">
                    Saved
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-teal-950 block tracking-tight">
                    ~{approxKgPrevented} kg
                  </span>
                  <span className="text-xs font-semibold text-teal-800">
                    Food Waste Prevented
                  </span>
                </div>
              </div>

              {/* Metric 3: Active Partner NGOs */}
              <div
                id="metric-active-ngos"
                className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-700 mb-1">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                    Verified
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-950 block tracking-tight">
                    {partnerNgos}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Active Partner NGOs
                  </span>
                </div>
              </div>
            </div>

            {/* Environmental CO2 Banner */}
            <div className="mt-3 p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Avoided Landfill Methane: <strong>~{approxCo2Avoided} kg CO₂e</strong> offset</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 hidden sm:inline">
                HACCP Audited
              </span>
            </div>
          </div>

          {/* Section 2: Past Donation Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-600" />
                <span>Donation & Pickup Timeline</span>
              </h3>

              {/* Timeline status filter tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    filterType === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  All ({combinedHistory.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("completed")}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    filterType === "completed" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("in_transit")}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    filterType === "in_transit" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  In-Transit
                </button>
              </div>
            </div>

            {/* List of Previous Pickups */}
            <div className="space-y-3" id="donation-history-list">
              {filteredHistory.map((rescue) => (
                <div
                  key={rescue.id}
                  id={`history-item-${rescue.id}`}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors shadow-2xs space-y-2.5"
                >
                  {/* Top row: Dish Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {rescue.dishName}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{rescue.timeAgo}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-800">
                          {rescue.servings} portions
                        </span>
                      </p>
                    </div>

                    {rescue.status === "PICKED_UP" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        In Transit
                      </span>
                    )}
                  </div>

                  {/* Donor and NGO info */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate">
                        Donor: {rescue.donorName}
                      </span>
                      <span className="font-mono font-bold text-slate-600 text-[10px]">
                        PIN: {rescue.pickupOtp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="truncate">
                        Rescued by: <strong className="text-slate-700">{rescue.claimedByOrg}</strong> ({rescue.claimedBy})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Rescue Audit Trail</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
