import { useState, useEffect, useCallback } from "react";
import { UserRole, DonationItem, UserProfile, AuthRole, DEFAULT_PROFILES, LightboxPhoto, ToastMessage } from "./types";
import { INITIAL_DONATIONS } from "./data/sampleData";
import Navbar from "./components/Navbar";
import DonorScreen from "./components/DonorScreen";
import NgoFeedScreen from "./components/NgoFeedScreen";
import LocationModal, { LocationConfig } from "./components/LocationModal";
import AuthModal, { GatedReason } from "./components/AuthModal";
import PhotoLightboxModal from "./components/PhotoLightboxModal";
import ToastNotification from "./components/ToastNotification";
import ImpactHistoryDrawer from "./components/ImpactHistoryDrawer";
import { Heart, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

export const sanitizeDonationItem = (item: DonationItem): DonationItem => {
  let updatedImageUrl = item.imageUrl;

  // Replace missing, local non-http, or invalid image URLs with appropriate food images
  if (!updatedImageUrl || updatedImageUrl.includes("brain") || !updatedImageUrl.startsWith("http")) {
    if (item.dishName?.toLowerCase().includes("paneer")) {
      updatedImageUrl = "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80";
    } else if (item.dishName?.toLowerCase().includes("burger")) {
      updatedImageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80";
    } else if (item.dishName?.toLowerCase().includes("biryani")) {
      updatedImageUrl = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";
    } else if (item.dishName?.toLowerCase().includes("bakery") || item.dishName?.toLowerCase().includes("croissant")) {
      updatedImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80";
    } else if (item.dishName?.toLowerCase().includes("fruit") || item.dishName?.toLowerCase().includes("salad")) {
      updatedImageUrl = "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=800&q=80";
    } else {
      updatedImageUrl = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80";
    }
  }

  // Ensure Paneer dish uses authentic paneer photo and never a burger photo
  if (
    item.dishName?.toLowerCase().includes("paneer") &&
    (updatedImageUrl.includes("photo-1568901346375-23c9450c58cd") || !updatedImageUrl.includes("photo-1631452180519-c014fe946bc7"))
  ) {
    updatedImageUrl = "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80";
  }

  return {
    ...item,
    imageUrl: updatedImageUrl,
  };
};

export default function App() {
  // Authentication & active account profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("resq_plate_auth_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id && parsed.role && parsed.organizationName) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load saved user profile:", e);
    }
    // Default to unauthenticated guest viewer as specified in Issue #7
    return DEFAULT_PROFILES.guest;
  });

  // Active navigation view tab (Donor or NGO feed)
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem("resq_plate_active_role");
      if (saved === "donor" || saved === "ngo") {
        return saved;
      }
    } catch (e) {}
    // If not set, start on NGO feed so guest viewers immediately see live listings
    return "ngo";
  });

  // Action gating & Auth Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authGatedReason, setAuthGatedReason] = useState<GatedReason | null>(null);
  const [pendingClaimItem, setPendingClaimItem] = useState<DonationItem | null>(null);
  const [resolvedClaimedItem, setResolvedClaimedItem] = useState<DonationItem | null>(null);

  const [donations, setDonations] = useState<DonationItem[]>(() => {
    const cleanInitial = INITIAL_DONATIONS.map(sanitizeDonationItem);
    try {
      // Step 3: Clear localStorage on reload so these 6 clean, distinct sample items load fresh into the feed
      localStorage.setItem("resq_plate_donations", JSON.stringify(cleanInitial));
    } catch (e) {
      console.error("Failed to reset localStorage donations:", e);
    }
    return cleanInitial;
  });

  // Location and search radius configuration
  const [locationConfig, setLocationConfig] = useState<LocationConfig>(() => {
    try {
      const saved = localStorage.getItem("resq_plate_location_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.areaName && typeof parsed.radiusKm === "number") {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load saved location:", e);
    }
    return {
      areaName: "",
      radiusKm: 5,
    };
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // Prototype Enhancements: Lightbox Modal, Toasts & Impact Drawer
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<LightboxPhoto | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isImpactHistoryOpen, setIsImpactHistoryOpen] = useState<boolean>(false);

  const addToast = useCallback(
    (title: string, message: string, type: "success" | "info" | "warning" = "success") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, message, type, timestamp: Date.now() }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Persist currentUser to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("resq_plate_auth_user", JSON.stringify(currentUser));
    } catch (e) {
      console.error("Failed to save user profile to localStorage:", e);
    }
  }, [currentUser]);

  // Persist activeRole to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("resq_plate_active_role", activeRole);
    } catch (e) {
      console.error("Failed to save active role to localStorage:", e);
    }
  }, [activeRole]);

  // Persist donations to localStorage whenever they change
  useEffect(() => {
    try {
      const sanitized = donations.map(sanitizeDonationItem);
      localStorage.setItem("resq_plate_donations", JSON.stringify(sanitized));
    } catch (e) {
      console.error("Failed to save donations to localStorage:", e);
    }
  }, [donations]);

  // Persist locationConfig to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("resq_plate_location_config", JSON.stringify(locationConfig));
    } catch (e) {
      console.error("Failed to save location to localStorage:", e);
    }
  }, [locationConfig]);

  // Real-Time Cross-Tab Synchronization via window storage event listener
  useEffect(() => {
    (window as any).resetDemoData = () => {
      try {
        localStorage.removeItem("resq_plate_donations");
      } catch (e) {
        console.error(e);
      }
      setDonations(INITIAL_DONATIONS.map(sanitizeDonationItem));
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resq_plate_donations" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setDonations(parsed.map(sanitizeDonationItem));
          }
        } catch (err) {
          console.error("Failed to parse synchronized donations from storage event:", err);
        }
      } else if (e.key === "resq_plate_auth_user" && e.newValue) {
        try {
          const parsedUser = JSON.parse(e.newValue);
          if (parsedUser.id && parsedUser.role) {
            setCurrentUser(parsedUser);
          }
        } catch (err) {
          console.error("Failed to parse synchronized user from storage event:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const availableCount = donations.filter(
    (d) => (d.status || "").toUpperCase() === "AVAILABLE"
  ).length;

  const totalMealsRescued = donations.reduce((acc, curr) => {
    const st = (curr.status || "").toUpperCase();
    return acc + (st === "CLAIMED" || st === "PICKED_UP" ? curr.servings : 0);
  }, 280);

  // Donor publishes new donation
  const handlePublishDonation = (newDonation: DonationItem) => {
    const cleanDonation = sanitizeDonationItem(newDonation);
    setDonations((prev) => [cleanDonation, ...prev]);
    addToast(
      "Donation Published!",
      `${cleanDonation.dishName} (${cleanDonation.servings} portions) is now live on the NGO rescue feed.`,
      "info"
    );
  };

  // NGO claims donation with dynamic PIN assignment & verification tracking
  const handleClaimDonation = (
    donationId: string,
    claimedByName: string,
    customPin?: string
  ) => {
    const targetItem = donations.find((d) => d.id === donationId);
    if (!targetItem) return;

    // Strict Double-Claim Prevention: If already CLAIMED or PICKED_UP, block re-claiming
    const currentStatus = (targetItem.status || "").toUpperCase();
    if (currentStatus === "CLAIMED" || currentStatus === "PICKED_UP") {
      addToast(
        "Already Claimed",
        `This listing has already been reserved by ${targetItem.claimedBy || "another NGO"}.`,
        "warning"
      );
      return;
    }

    const pin = customPin || `#RQ-${Math.floor(100 + Math.random() * 900)}`;
    const dishTitle = targetItem.dishName || "surplus food";

    setDonations((prev) =>
      prev.map((item) => {
        if (item.id === donationId) {
          return {
            ...item,
            status: "CLAIMED" as const,
            claimedBy: claimedByName,
            claimedByOrg: currentUser.organizationName,
            claimedAt: Date.now(),
            pickupOtp: pin,
          };
        }
        return item;
      })
    );

    // Trigger animated slide-in Toast notification at top-right corner
    addToast(
      "Listing Claimed!",
      `${claimedByName} has reserved ${dishTitle} for pickup.`,
      "success"
    );
  };

  // Mark donation as PICKED_UP (lifecycle: AVAILABLE -> CLAIMED -> PICKED_UP)
  const handleMarkPickedUp = (donationId: string) => {
    const targetItem = donations.find((d) => d.id === donationId);
    setDonations((prev) =>
      prev.map((item) => {
        if (item.id === donationId) {
          return {
            ...item,
            status: "PICKED_UP" as const,
          };
        }
        return item;
      })
    );

    if (targetItem) {
      addToast(
        "Pickup Completed!",
        `${targetItem.dishName} has been verified and marked as picked up.`,
        "success"
      );
    }
  };

  // Triggered when an action is gated by role requirement
  const handleRequireAuth = (targetRole: AuthRole, message: string, pendingPayload?: any) => {
    setAuthGatedReason({ targetRole, message });
    if (pendingPayload) {
      setPendingClaimItem(pendingPayload);
    } else {
      setPendingClaimItem(null);
    }
    setIsAuthModalOpen(true);
  };

  // Manually opened via Navbar login / switch button
  const handleOpenManualAuth = () => {
    setAuthGatedReason(null);
    setPendingClaimItem(null);
    setIsAuthModalOpen(true);
  };

  // User selects an account role in AuthModal
  const handleSelectRole = (role: AuthRole, customData?: Partial<UserProfile>) => {
    const base = DEFAULT_PROFILES[role];
    const updatedProfile: UserProfile = {
      ...base,
      ...(customData || {}),
    };
    setCurrentUser(updatedProfile);
    setIsAuthModalOpen(false);

    // If an NGO claim was pending and user logged in as NGO, automatically claim the item!
    if (role === "ngo" && pendingClaimItem) {
      const claimerName =
        updatedProfile.name ||
        updatedProfile.organizationName ||
        "Hope Food Rescue Foundation";
      const pin = `#RQ-${Math.floor(100 + Math.random() * 900)}`;
      handleClaimDonation(pendingClaimItem.id, claimerName, pin);
      setResolvedClaimedItem({
        ...pendingClaimItem,
        status: "CLAIMED",
        claimedBy: claimerName,
        claimedByOrg: updatedProfile.organizationName,
        claimedAt: Date.now(),
        pickupOtp: pin,
      });
      setPendingClaimItem(null);
      setActiveRole("ngo");
    } else if (role === "donor" && authGatedReason?.targetRole === "donor") {
      setActiveRole("donor");
    }

    setAuthGatedReason(null);
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-200 selection:text-emerald-900 overflow-x-clip">
      {/* Top Navbar with Role Switcher, Location Button & User Profile Auth */}
      <Navbar
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        availableCount={availableCount}
        totalMealsRescued={totalMealsRescued}
        locationConfig={locationConfig}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenManualAuth}
        onOpenImpactHistory={() => setIsImpactHistoryOpen(true)}
      />

      {/* Main View Container */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
        {activeRole === "donor" ? (
          <DonorScreen
            onPublishDonation={handlePublishDonation}
            onNavigateToFeed={() => setActiveRole("ngo")}
            currentUser={currentUser}
            onRequireAuth={handleRequireAuth}
            onOpenPhotoLightbox={(photo) => setActiveLightboxPhoto(photo)}
            currentLocation={locationConfig.areaName}
            onLocationChange={(newLoc) => setLocationConfig((prev) => ({ ...prev, areaName: newLoc }))}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
          />
        ) : (
          <NgoFeedScreen
            donations={donations}
            onClaimDonation={handleClaimDonation}
            onMarkPickedUp={handleMarkPickedUp}
            onNavigateToDonor={() => setActiveRole("donor")}
            locationConfig={locationConfig}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            currentUser={currentUser}
            onRequireAuth={handleRequireAuth}
            externalClaimItem={resolvedClaimedItem}
            onClearExternalClaimItem={() => setResolvedClaimedItem(null)}
            onOpenPhotoLightbox={(photo) => setActiveLightboxPhoto(photo)}
          />
        )}
      </main>

      {/* Location Configuration Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentConfig={locationConfig}
        onSave={(newCfg) => setLocationConfig(newCfg)}
      />

      {/* Role Authentication & Quick Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthGatedReason(null);
          setPendingClaimItem(null);
        }}
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        gatedReason={authGatedReason}
      />

      {/* Food Photo Zoom / Lightbox Modal */}
      <PhotoLightboxModal
        photo={activeLightboxPhoto}
        onClose={() => setActiveLightboxPhoto(null)}
      />

      {/* In-App Toast Notification Stack */}
      <ToastNotification
        toasts={toasts}
        onDismiss={removeToast}
      />

      {/* Impact & Donation History Slide-Over Drawer */}
      <ImpactHistoryDrawer
        isOpen={isImpactHistoryOpen}
        onClose={() => setIsImpactHistoryOpen(false)}
        donations={donations}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">ResQ-Plate</span>
            <span>•</span>
            <span>Google AI Surplus Food Rescue Network</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              HACCP Thermal Standards
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Powered by Gemini 3.8 Flash
            </span>
          </div>

          <div className="text-slate-400">
            Emergency Dispatch Line: +1 (800) 555-RESQ
          </div>
        </div>
      </footer>
    </div>
  );
}

