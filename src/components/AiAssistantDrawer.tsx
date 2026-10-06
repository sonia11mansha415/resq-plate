import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Sparkles,
  Bot,
  ShieldCheck,
  Package,
  HelpCircle,
  Loader2,
  Trash2,
  Info
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role?: "donor" | "volunteer" | "ngo";
}

const DONOR_SUGGESTIONS = [
  "What is the purpose of this app?",
  "What packaging is accepted for curries & hot food?",
  "HACCP temperature holding limits for surplus meals",
  "Can I donate untouched buffet trays?",
  "How does volunteer pickup & handoff work?",
];

const VOLUNTEER_SUGGESTIONS = [
  "What is the purpose of this app?",
  "HACCP temperature holdings during delivery",
  "Volunteer hygiene & clean food rescue tips",
  "How to safely transport hot curries & gravies?",
  "How to verify allergens and dietary labels?",
];

export const PRESET_RESPONSES: Record<string, string> = {
  "what is the purpose of this app?":
    `**ResQ-Plate Surplus Food Rescue Mission:**\n\n` +
    `• **Direct Connection:** Bridges the gap between banquet hotels/restaurants and nearby verified NGOs & volunteers to prevent edible food from ending up in landfills.\n` +
    `• **AI Safety Verification:** Uses Google Gemini vision analysis to inspect dish freshness, temperature suitability, and remaining safe consumption hours.\n` +
    `• **Verified Chain of Custody:** Tracks donor handoff and volunteer delivery with dynamic pickup OTP verification.`,

  "haccp temperature holdings during delivery":
    `**HACCP Temperature Standards During Delivery:**\n\n` +
    `• **Hot Food Holding:** Must remain at or above **60°C (140°F)** until final distribution.\n` +
    `• **Chilled Food:** Must stay at or below **4°C (40°F)** in insulated cold carriers.\n` +
    `• **The 2-Hour Rule:** Perishable cooked foods must be distributed and served within 2 hours of leaving commercial holding equipment.\n` +
    `• **Thermal Barriers:** Never mix hot dishes and chilled items in the same carrier crate.`,

  "volunteer hygiene & clean food rescue tips":
    `**Volunteer Hygiene & Clean Food Rescue Tips:**\n\n` +
    `• **Hand Hygiene:** Wash hands with soap and water or use 70%+ alcohol sanitizer prior to food collection.\n` +
    `• **Food-Grade Gloves:** Always wear single-use disposable gloves when portioning or handling containers.\n` +
    `• **Clean Serving Utensils:** Use sanitized stainless steel ladles and tongs. Never touch ready-to-eat food directly.\n` +
    `• **Elevated Staging:** Keep distribution trays elevated off the ground on clean, sanitized tables.`,

  "what packaging is accepted for curries & hot food?":
    `**Approved Packaging for Curries & Hot Food:**\n\n` +
    `• **Heavy-Duty Foil:** Deep aluminum containers with double-crimped foil lids prevent leaks and retain steam.\n` +
    `• **Polycarbonate Cambros:** Insulated food pans with silicone airtight gaskets for high-volume gravies.\n` +
    `• **Thermal Wrap:** Double-layer parchment or insulated carrier wraps maintain core temperatures >60°C.\n` +
    `• **Labeling:** Always mark container with dish name, packing timestamp, and common allergen badges.`,

  "haccp temperature holding limits for surplus meals":
    `**HACCP Food Safety & Holding Limits for Donors:**\n\n` +
    `• **Hot Holding:** Maintain food at **60°C (140°F) or above** until handover to the volunteer.\n` +
    `• **Cold Storage:** Salads, dairy, and cold appetizers must be kept chilled at **4°C (40°F) or below**.\n` +
    `• **Safe Window:** Perishable cooked food at ambient temperature must be consumed within safe windows; volunteers dispatch within 15-30 minutes of publishing.\n` +
    `• **Sensory Inspection:** Verify clean steam, color, and aroma before dispatch.`,

  "can i donate untouched buffet trays?":
    `**Donating Untouched Buffet Trays:**\n\n` +
    `• **Eligible Surplus:** Yes! Unserved back-of-house kitchen batches and untouched chafing trays that remained continuously heated (≥60°C) are fully eligible.\n` +
    `• **Ineligible Items:** Food that was placed on guest dining tables or handled by dining guests cannot be accepted.\n` +
    `• **Good Samaritan Law:** Donors donating edible, wholesome food in good faith are protected under Good Samaritan food donation regulations.`,

  "how does volunteer pickup & handoff work?":
    `**Volunteer Pickup & Handoff Process:**\n\n` +
    `1. **Publish Donation:** Hotel posts surplus with portions, safe hours, and loading dock address.\n` +
    `2. **Volunteer Claim:** Nearby NGO volunteer claims the lot and receives a unique pickup OTP.\n` +
    `3. **Dock Handoff:** Volunteer arrives with insulated thermal bags; kitchen staff verifies OTP upon handover.\n` +
    `4. **Verified Distribution:** Volunteer delivers directly to the registered community shelter.`,

  "how to safely transport hot curries & gravies?":
    `**Safe Transportation for Curries & Gravies:**\n\n` +
    `• **Upright Storage:** Keep liquid containers strictly upright on level vehicle floors using non-slip liners or crate dividers.\n` +
    `• **Thermal Bags:** Seal containers inside insulated Cambro carriers or thermal delivery totes to stop cooling.\n` +
    `• **No Intermediate Stops:** Drive directly to the destination center without delays to safeguard the safety timer.\n` +
    `• **Gasket Inspection:** Check that container lids are tightly clamped before lifting.`,

  "how to verify allergens and dietary labels?":
    `**Allergen Verification & Precautions:**\n\n` +
    `• **Inspect Badges:** Check the donor's tags for common allergens: Dairy, Gluten, Peanuts, Tree Nuts, Soy, Egg, Shellfish.\n` +
    `• **Cross-Contact:** Never share serving ladles between dairy/curry trays and plain rice or allergen-safe trays.\n` +
    `• **Clear Disclosure:** Inform shelter coordinators and distribution recipients about ingredients before serving.\n` +
    `• **Default to Caution:** If a dish is unlabeled, treat it as containing common allergens until verified.`,
};

export function findPresetAnswer(query: string, isVolunteer: boolean): string | null {
  const q = query.trim().toLowerCase().replace(/[\?\.\,\!\:\;]/g, "");

  // Direct matches
  for (const [key, value] of Object.entries(PRESET_RESPONSES)) {
    const k = key.toLowerCase().replace(/[\?\.\,\!\:\;]/g, "");
    if (q === k || q.includes(k) || k.includes(q)) {
      return value;
    }
  }

  // Keyword-based fast matches
  if (q.includes("purpose") || q.includes("about this app") || q.includes("what is this app")) {
    return PRESET_RESPONSES["what is the purpose of this app?"];
  }

  if (
    q.includes("haccp") ||
    (q.includes("temp") && (q.includes("hold") || q.includes("deliver") || q.includes("limit") || q.includes("degree")))
  ) {
    return isVolunteer
      ? PRESET_RESPONSES["haccp temperature holdings during delivery"]
      : PRESET_RESPONSES["haccp temperature holding limits for surplus meals"];
  }

  if (q.includes("hygiene") || q.includes("glove") || q.includes("clean food")) {
    return PRESET_RESPONSES["volunteer hygiene & clean food rescue tips"];
  }

  if (q.includes("packag") || q.includes("container") || q.includes("foil")) {
    return PRESET_RESPONSES["what packaging is accepted for curries & hot food?"];
  }

  if (q.includes("buffet") || q.includes("untouched") || q.includes("can i donate")) {
    return PRESET_RESPONSES["can i donate untouched buffet trays?"];
  }

  if (q.includes("pickup") || q.includes("handoff") || q.includes("otp")) {
    return PRESET_RESPONSES["how does volunteer pickup & handoff work?"];
  }

  if (q.includes("transport") || q.includes("curries") || q.includes("gravies")) {
    return PRESET_RESPONSES["how to safely transport hot curries & gravies?"];
  }

  if (q.includes("allergen") || q.includes("dietary") || q.includes("label")) {
    return PRESET_RESPONSES["how to verify allergens and dietary labels?"];
  }

  return null;
}

const getWelcomeMessage = (isVolunteer: boolean): ChatMessage => ({
  id: "welcome",
  role: "assistant",
  content: isVolunteer
    ? "Hello! I am your **ResQ-Plate Volunteer & NGO Rescue Assistant**. Ask me anything about:\n\n" +
      "• **Safe Food Transport:** Insulated carriers, cambros, preventing spills & temperature management\n" +
      "• **Storage & Holding:** Safe temperatures (Hot ≥ 60°C / 140°F, Cold ≤ 4°C / 40°F) & consumption windows\n" +
      "• **Distribution Hygiene:** Gloves, clean serving utensils & food handover protocols\n" +
      "• **Allergen Precautions:** Identifying common allergens and sensitive dietary disclosures\n\n" +
      "How can I assist your food rescue mission today?"
    : "Hello! I am your **ResQ-Plate AI Assistant**. Ask me anything about:\n\n" +
      "• **Packaging Tips:** Approved containers, lids, foil trays & leak-proofing\n" +
      "• **Food Safety Guidelines:** HACCP thermal holding and safe consumption windows\n" +
      "• **Donation Criteria:** Eligibility for untouched kitchen surplus and Good Samaritan protection\n\n" +
      "How can I assist your kitchen team today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
});

export default function AiAssistantDrawer({
  isOpen,
  onClose,
  role = "donor",
}: AiAssistantDrawerProps) {
  const isVolunteer = role === "volunteer" || role === "ngo";
  const suggestions = isVolunteer ? VOLUNTEER_SUGGESTIONS : DONOR_SUGGESTIONS;

  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage(isVolunteer)]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  // Clear typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  // Sync welcome message if role changes and conversation is fresh
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "welcome") {
      setMessages([getWelcomeMessage(isVolunteer)]);
    }
  }, [isVolunteer]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fast typing effect for instant, zero-delay responses
  const streamBotMessage = (fullText: string) => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    const botId = `bot-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Split into readable words
    const words = fullText.split(" ");
    const chunkSize = 4; // stream 4 words every 16ms for ultra-responsive fluid typing
    let currentIndex = chunkSize;

    setMessages((prev) => [
      ...prev,
      {
        id: botId,
        role: "assistant",
        content: words.slice(0, chunkSize).join(" "),
        timestamp,
      },
    ]);

    if (currentIndex >= words.length) {
      setIsLoading(false);
      return;
    }

    typingTimerRef.current = window.setInterval(() => {
      currentIndex += chunkSize;
      const nextSlice = words.slice(0, currentIndex).join(" ");
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, content: nextSlice } : m))
      );

      if (currentIndex >= words.length) {
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
        }
        setIsLoading(false);
      }
    }, 16);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // 1. Instant Preset Cache (Zero Delay for Demo/Suggested Prompts):
    const presetAnswer = findPresetAnswer(text, isVolunteer);
    if (presetAnswer) {
      // 0ms delay: stream response immediately without any network call or waiting spinner
      streamBotMessage(presetAnswer);
      return;
    }

    // 2. Fallback to live API call with short loading state and fast fallback
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // Fast 3.5s ceiling

      const response = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role: isVolunteer ? "volunteer" : "donor",
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      const reply = data.reply || (
        isVolunteer
          ? "Maintain safe food temperatures (≥60°C hot, ≤4°C cold), verify tamper seals, and distribute within the timer window."
          : "Keep surplus food held safely above 60°C or chilled below 4°C, and pack in clean food-grade containers."
      );

      streamBotMessage(reply);
    } catch (err) {
      console.warn("AI Assistant fast fallback engaged:", err);
      const fallbackReply = isVolunteer
        ? "**Volunteer Food Safety Standards:**\n\n" +
          "• Keep hot food above **60°C (140°F)** and cold items below **4°C (40°F)** during transport.\n" +
          "• Always wear clean food-grade disposable gloves during handover.\n" +
          "• Distribute and serve promptly within the active countdown window to ensure recipient safety."
        : "**Food Safety Quick Guideline:**\n\n" +
          "• Maintain hot food above **60°C (140°F)** and chilled items below **4°C (40°F)**.\n" +
          "• Pack in clean, food-grade airtight containers.\n" +
          "• Only untouched kitchen surplus or unserved buffet food is eligible for donation.";

      streamBotMessage(fallbackReply);
    }
  };

  const handleClearHistory = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setIsLoading(false);
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: isVolunteer
          ? "Chat cleared. What can I help you with regarding safe transport, holding temperatures, distribution hygiene, or allergens?"
          : "Chat cleared. What can I help you with regarding packaging, food safety, or donation criteria?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        id="ai-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Slide-over panel */}
      <div
        id="ai-assistant-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-drawer-title"
        className="relative w-full max-w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="ai-drawer-title" className="text-sm font-bold tracking-tight text-white">
                  Ask AI Assistant
                </h3>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/30 text-emerald-300 rounded-md">
                  {isVolunteer ? "Volunteer Helper" : "Gemini Helper"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {isVolunteer
                  ? "Safe transport • Storage temperatures • Distribution hygiene"
                  : "Packaging tips • Food safety • Donation criteria"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-clear-ai-chat"
              onClick={handleClearHistory}
              title="Clear chat conversation"
              className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-close-ai-drawer"
              onClick={onClose}
              title="Close AI Assistant"
              className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Banner */}
        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 text-[11px] text-emerald-900 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>General advisory tool only. Does not modify or override your current food assessment.</span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-xs shadow-xs"
                    : "bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/80"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content.split("\n").map((line, lIdx) => {
                    // Simple formatting for bold text
                    if (!line) return <div key={lIdx} className="h-1.5" />;
                    const formattedLine = line.replace(/\*\*(.*?)\*\*/g, "$1");
                    const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
                    return (
                      <div
                        key={lIdx}
                        className={isBullet ? "pl-2 py-0.5 text-slate-700" : line.includes("**") ? "font-semibold text-slate-900 mb-1" : ""}
                      >
                        {formattedLine}
                      </div>
                    );
                  })}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div
              id="ai-fast-typing-state"
              className="flex items-center gap-2 text-emerald-800 bg-emerald-50/90 px-3 py-2 rounded-xl border border-emerald-200/80 w-fit text-xs font-semibold animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>Generating quick response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
            Suggested Questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(sug)}
                disabled={isLoading}
                className="text-[11px] text-left px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-lg text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              id="ai-assistant-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isVolunteer
                  ? "Ask about transport, temperatures, hygiene, or allergens..."
                  : "Ask about packaging, safety, or criteria..."
              }
              disabled={isLoading}
              className="flex-1 h-11 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-medium transition"
            />
            <button
              type="submit"
              id="btn-send-ai-question"
              disabled={!inputValue.trim() || isLoading}
              className="min-w-[44px] h-11 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center transition cursor-pointer shadow-xs"
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
