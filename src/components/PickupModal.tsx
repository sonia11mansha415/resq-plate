import { DonationItem } from "../types";
import {
  X,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  FileText,
  AlertTriangle,
  Copy,
  Check
} from "lucide-react";
import { useState } from "react";
import CountdownBadge from "./CountdownBadge";

// Local ExpandableText component with simple state toggling as per Issue #22
const ExpandableText = ({
  text,
  maxLines = 2,
  charLimit,
}: {
  text?: string | null;
  maxLines?: number;
  charLimit?: number;
}) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const limit = charLimit ?? 90;
  if (text.length <= limit) return <span>{text}</span>;
  return (
    <span>
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

interface PickupModalProps {
  donation: DonationItem | null;
  onClose: () => void;
  isConfirming?: boolean;
  onConfirmClaim?: (donation: DonationItem) => void;
  onMarkPickedUp?: (donationId: string) => void;
  currentUserName?: string;
}

const isNotSpecified = (val?: string | null): boolean => {
  if (!val) return true;
  const lower = val.trim().toLowerCase();
  return (
    lower === "" ||
    lower === "not specified" ||
    lower === "not specified." ||
    lower === "not provided" ||
    lower === "not provided by donor" ||
    lower === "not provided by donor." ||
    lower === "none" ||
    lower === "null" ||
    lower === "undefined" ||
    lower.startsWith("not specified") ||
    lower.startsWith("not provided")
  );
};

export default function PickupModal({
  donation,
  onClose,
  isConfirming = false,
  onConfirmClaim,
  onMarkPickedUp,
  currentUserName,
}: PickupModalProps) {
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  if (!donation) return null;

  const handleCopyOtp = () => {
    if (donation.pickupOtp) {
      navigator.clipboard?.writeText(donation.pickupOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  const isAlreadyClaimed =
    donation.status === "CLAIMED" ||
    donation.status === "claimed" ||
    donation.status === "PICKED_UP" ||
    donation.status === "picked_up";

  const isPickedUp =
    donation.status === "PICKED_UP" || donation.status === "picked_up";

  return (
    <div
      id="pickup-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="pickup-modal-card"
        className="bg-white w-[92%] sm:w-full max-w-md sm:max-w-xl mx-auto rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header banner */}
        <div
          className={`p-4 sm:p-5 text-white flex items-start justify-between shrink-0 ${
            isConfirming
              ? "bg-gradient-to-r from-slate-900 to-emerald-950"
              : isPickedUp
              ? "bg-gradient-to-r from-blue-900 to-slate-900"
              : "bg-gradient-to-r from-emerald-800 to-teal-900"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {donation.isDemo && (
                <span
                  id="pickup-modal-demo-badge"
                  data-testid="demo-sample-badge"
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white border border-amber-300 shadow-xs select-none"
                >
                  [DEMO SAMPLE]
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isConfirming
                    ? "bg-amber-500/20 text-amber-200 border-amber-400/30"
                    : isPickedUp
                    ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                    : "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                }`}
              >
                {isConfirming
                  ? "Confirm Rescue Dispatch"
                  : isPickedUp
                  ? "Rescue Mission Completed"
                  : "Rescue Mission Dispatched"}
              </span>
              <span className="text-xs text-emerald-300 font-semibold">
                {donation.distanceKm} km away
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">{donation.dishName}</h3>
            <p className="text-xs text-emerald-100">
              {isConfirming ? (
                <span>
                  Confirming volunteer assignment for:{" "}
                  <strong className="text-white font-bold">
                    {currentUserName || "NGO Volunteer"}
                  </strong>
                </span>
              ) : (
                <span>
                  Claimed by:{" "}
                  <span className="font-bold">
                    {donation.claimedBy || "Hope Food Rescue Foundation"}
                  </span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            id="pickup-modal-close-x"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          {/* If Confirming Mode: Instructions Banner */}
          {isConfirming ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Pickup Confirmation & Dispatch Commitment</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                By confirming this claim, your organization commits to dispatching a volunteer to collect this donation before the consumption timer runs out. Upon confirmation, a unique verification PIN will be generated for kitchen dock handover.
              </p>
            </div>
          ) : (
            /* Post-Claim Verification PIN */
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                  Verification Handover PIN (Show to Kitchen Dock)
                </span>
                <span
                  id="pickup-verification-pin"
                  className="text-2xl font-black text-emerald-800 tracking-wider font-mono"
                >
                  {donation.pickupOtp || "#RQ-482"}
                </span>
              </div>
              <button
                type="button"
                id="btn-copy-pickup-pin"
                onClick={handleCopyOtp}
                className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                {copiedOtp ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy PIN</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Countdown & Portions */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Portions & Consumption Window
              </span>
              <span className="text-xs text-slate-700 font-semibold">
                {donation.servings} portions ready for transport
              </span>
            </div>
            <CountdownBadge expiryTimestamp={donation.expiryTimestamp} size="md" />
          </div>

          {/* Location & Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Pickup Location & Dock Directions</span>
            </h4>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  {donation.donorName}
                </span>
                <p className="text-slate-600 mt-0.5">{donation.donorAddress}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium">{donation.donorPhone}</span>
                  <span className="text-slate-400">({donation.donorContactPerson})</span>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    donation.donorName + " " + donation.donorAddress
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Google Maps Route</span>
                </a>
              </div>
            </div>
          </div>

          {/* Handover & Driver Step-by-Step Instructions */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
            <span className="font-bold text-slate-800 block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Handover Instructions & Dock Steps:</span>
            </span>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                  1
                </span>
                <span>Drive {donation.distanceKm} km to {donation.donorName} via the commercial service entrance.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                  2
                </span>
                <span>
                  Notify security/dispatch dock and display verification PIN:{" "}
                  <strong className="text-slate-900 font-mono">
                    {donation.pickupOtp || "#RQ-482"}
                  </strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                  3
                </span>
                <span className="flex-1">
                  <ExpandableText
                    text={`Loading staff (${donation.donorContactPerson && donation.donorContactPerson !== "Not provided by donor" ? donation.donorContactPerson : "donor representative"}) will transfer packaged containers directly to your vehicle.`}
                    maxLines={2}
                    charLimit={95}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Preparation & Storage Log */}
          <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">Kitchen Holding Log:</span>
            <div className="text-slate-600">
              <ExpandableText
                text={
                  donation.cookingDetails && !isNotSpecified(donation.cookingDetails)
                    ? donation.cookingDetails
                    : "Not provided by donor"
                }
                maxLines={2}
                charLimit={90}
              />
            </div>
          </div>

          {/* Handling & Volunteer Advice */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>HACCP Volunteer Transport Protocol:</span>
            </div>
            <div className="text-emerald-900">
              <ExpandableText
                text={
                  donation.packagingAdvice && !isNotSpecified(donation.packagingAdvice)
                    ? donation.packagingAdvice
                    : "Not provided by donor"
                }
                maxLines={2}
                charLimit={90}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          {isConfirming ? (
            <>
              <button
                type="button"
                id="btn-cancel-claim"
                onClick={onClose}
                className="w-full sm:w-auto h-11 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-pickup"
                onClick={() => onConfirmClaim && onConfirmClaim(donation)}
                className="w-full sm:w-auto h-11 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Pickup & Dispatch</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  Status:{" "}
                  <strong
                    className={
                      isPickedUp ? "text-blue-700" : "text-amber-700"
                    }
                  >
                    {isPickedUp ? "Picked Up / Completed" : "Pickup in Progress • En Route"}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!isPickedUp && onMarkPickedUp && (
                  <button
                    type="button"
                    id="btn-mark-picked-up"
                    onClick={() => onMarkPickedUp(donation.id)}
                    className="flex-1 sm:flex-initial h-11 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Mark as Picked Up</span>
                  </button>
                )}
                <button
                  type="button"
                  id="btn-close-pickup-modal"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial h-11 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer flex items-center justify-center"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
