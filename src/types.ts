export type UserRole = "donor" | "ngo";

export type AuthRole = "donor" | "ngo" | "guest";

export interface UserProfile {
  id: string;
  role: AuthRole;
  name: string;
  organizationName: string;
  email?: string;
  badgeTitle: string;
  verified: boolean;
}

export const DEFAULT_PROFILES: Record<AuthRole, UserProfile> = {
  donor: {
    id: "usr-donor-grand-palace",
    role: "donor",
    name: "Chef Marcus Vance",
    organizationName: "Grand Palace Banquet & Hotel",
    email: "kitchen@grandpalacebanquet.com",
    badgeTitle: "Hotel / Food Donor",
    verified: true,
  },
  ngo: {
    id: "usr-ngo-hope-rescue",
    role: "ngo",
    name: "Sarah Jenkins",
    organizationName: "Hope Food Rescue Foundation",
    email: "dispatch@hopefoodrescue.org",
    badgeTitle: "NGO / Shelter Volunteer",
    verified: true,
  },
  guest: {
    id: "usr-guest-public",
    role: "guest",
    name: "Public Guest",
    organizationName: "Guest Viewer",
    email: "",
    badgeTitle: "Public Guest",
    verified: false,
  },
};

export type ListingStatus = "AVAILABLE" | "CLAIMED" | "PICKED_UP";

export interface DonationItem {
  id: string;
  dishName: string;
  category: "Non-Veg" | "Vegetarian" | "Vegan" | "Bakery & Snacks";
  servings: number;
  freshnessScore: number;
  safetyStatus: string;
  initialHours: number;
  expiryTimestamp: number; // epoch ms
  donorName: string;
  donorType: string; // Hotel, Banquet, Restaurant, Caterer
  donorAddress: string;
  donorPhone: string;
  donorContactPerson: string;
  distanceKm: number;
  imageUrl: string;
  cookingDetails: string;
  packagingAdvice: string;
  volunteerTips: string[];
  allergens: string[];
  aiReasoning?: string;
  status: ListingStatus | "available" | "claimed" | "picked_up";
  claimedBy?: string;
  claimedByOrg?: string;
  claimedAt?: number;
  pickupOtp?: string;
  createdAt: number;
  isDemo?: boolean;
}

export interface AiSafetyAssessment {
  dishName: string;
  category: "Non-Veg" | "Vegetarian" | "Vegan" | "Bakery & Snacks" | string;
  estimatedServings: number;
  freshnessScore: number;
  safetyStatus: string;
  safeConsumptionHours: number;
  safe_consumption_window_hours?: number;
  preparationLog?: string | null;
  preparation_log?: string | null;
  packagingDetails?: string | null;
  packaging_info?: string | null;
  packagingAdvice: string;
  holdingNotes?: string | null;
  holding_notes?: string | null;
  volunteerHandlingTips: string[];
  allergenWarning: string[];
  aiReasoning?: string;
  is_food?: boolean;
  identificationConfidence?: "high" | "low";
  identification_confidence?: "high" | "low";
  confidenceNote?: string | null;
  confidence_note?: string | null;
}

export interface PresetFoodItem {
  id: string;
  title: string;
  category: "Non-Veg" | "Vegetarian" | "Vegan" | "Bakery & Snacks";
  servingsHint: number;
  cookingDetails: string;
  imageUrl: string;
  donorName: string;
  donorAddress: string;
  isDemo?: boolean;
}

export interface LightboxPhoto {
  imageUrl: string;
  title: string;
  subtitle?: string;
  category?: string;
  isDemo?: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: "success" | "info" | "warning";
  timestamp: number;
}
