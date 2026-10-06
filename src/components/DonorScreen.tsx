import { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Sparkles,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  FileImage,
  UtensilsCrossed,
  ShieldCheck,
  Send,
  RefreshCw,
  Info,
  Clock,
  Package,
  Layers,
  Flame,
  Volume2,
  X,
  AlertOctagon,
  ShieldAlert,
  PlusCircle,
  Edit2,
  Check,
  AlertTriangle,
  MapPin,
  Crosshair,
  Loader2,
  Compass,
  Bot,
  HelpCircle,
  FileText,
  ZoomIn,
  Thermometer
} from "lucide-react";
import { AiSafetyAssessment, DonationItem, PresetFoodItem, UserProfile, AuthRole, LightboxPhoto } from "../types";
import { PRESET_FOOD_SAMPLES } from "../data/sampleData";
import CountdownBadge from "./CountdownBadge";
import LocationModal from "./LocationModal";
import AiAssistantDrawer from "./AiAssistantDrawer";

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

const POPULAR_RESCUE_AREAS = [
  "Downtown Financial & Hotel District",
  "Banquet & Convention District",
  "Airport Hospitality Zone",
  "Metro Metro Hub",
  "Industrial Area Catering Park",
  "North Suburb & University Enclave",
];

interface DonorScreenProps {
  onPublishDonation: (donation: DonationItem) => void;
  onNavigateToFeed: () => void;
  currentUser: UserProfile;
  onRequireAuth: (targetRole: AuthRole, message: string) => void;
  onOpenPhotoLightbox?: (photo: LightboxPhoto) => void;
  currentLocation?: string;
  onLocationChange?: (location: string) => void;
  onOpenLocationModal?: () => void;
}

export default function DonorScreen({
  onPublishDonation,
  onNavigateToFeed,
  currentUser,
  onRequireAuth,
  onOpenPhotoLightbox,
  currentLocation = "",
  onLocationChange,
  onOpenLocationModal,
}: DonorScreenProps) {
  // Input states - Location and venue strictly empty by default to prevent guessing mock locations
  const [selectedImage, setSelectedImage] = useState<string>(
    PRESET_FOOD_SAMPLES[0].imageUrl
  );
  const setImagePreview = setSelectedImage;
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_FOOD_SAMPLES[0].id);
  const [cookingDetails, setCookingDetails] = useState<string>(PRESET_FOOD_SAMPLES[0].cookingDetails);
  const [donorHotelName, setDonorHotelName] = useState<string>(
    currentUser.role === "donor" ? currentUser.organizationName : ""
  );
  const [donorAddress, setDonorAddress] = useState<string>(currentLocation || "");
  const [donorContact, setDonorContact] = useState<string>("");

  // Sync state if currentLocation prop updates
  useEffect(() => {
    if (currentLocation !== undefined) {
      setDonorAddress(currentLocation);
      if (currentLocation.trim()) {
        setLocationValidationError(null);
      }
    }
  }, [currentLocation]);

  const updateAddress = (newAddr: string) => {
    setDonorAddress(newAddr);
    if (onLocationChange) {
      onLocationChange(newAddr);
    }
    if (newAddr.trim()) {
      setLocationValidationError(null);
    }
  };

  useEffect(() => {
    if (currentUser.role === "donor" && !donorHotelName.trim() && currentUser.organizationName) {
      setDonorHotelName(currentUser.organizationName);
    }
  }, [currentUser]);

  // Location validation and GPS detection states
  const [locationValidationError, setLocationValidationError] = useState<string | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Non-food rejection state
  const [foodRejectionError, setFoodRejectionError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  // Voice note recording and speech detection state
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceTimeSec, setVoiceTimeSec] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [voiceAlert, setVoiceAlert] = useState<{
    type: "warning" | "success";
    message: string;
  } | null>(null);

  const voiceTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>("");
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCheckIntervalRef = useRef<any>(null);
  const speechDetectedRef = useRef<boolean>(false);

  // Clean up recording and audio streams on unmount
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (audioCheckIntervalRef.current) clearInterval(audioCheckIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState<number>(0);
  const [aiSafetyCard, setAiSafetyCard] = useState<AiSafetyAssessment | null>(null);
  const [calculatedExpiryTimestamp, setCalculatedExpiryTimestamp] = useState<number | null>(null);
  const [publishedSuccess, setPublishedSuccess] = useState<boolean>(false);
  const [lastPublishedDish, setLastPublishedDish] = useState<string>("");
  const [apiAnalysisError, setApiAnalysisError] = useState<string | null>(null);

  // Core structured food states (ensures downstream state is tracked & resettable)
  const [dishTitle, setDishTitle] = useState<string | null>(null);
  const [freshnessScore, setFreshnessScore] = useState<number | null>(null);
  const [portions, setPortions] = useState<number | null>(null);
  const [prepLog, setPrepLog] = useState<string | null>(null);

  // Manual editing state for preparation, packaging & holding fields
  const [editingManualField, setEditingManualField] = useState<"prep" | "packaging" | "holding" | null>(null);
  const [manualInputVal, setManualInputVal] = useState<string>("");

  // Manual dish name confirmation & editing states
  const [manualDishNameInput, setManualDishNameInput] = useState<string>("");
  const [isEditingDishName, setIsEditingDishName] = useState<boolean>(false);
  const [dishNameValidationError, setDishNameValidationError] = useState<string | null>(null);
  const dishNameInputRef = useRef<HTMLInputElement>(null);

  const handleStartEditDishName = () => {
    setIsEditingDishName(true);
    setManualDishNameInput(
      aiSafetyCard?.dishName && !aiSafetyCard.dishName.toLowerCase().includes("unable to confidently identify")
        ? aiSafetyCard.dishName
        : ""
    );
    setDishNameValidationError(null);
    setTimeout(() => {
      dishNameInputRef.current?.focus();
    }, 60);
  };

  const handleSaveDishName = () => {
    const trimmed = manualDishNameInput.trim();
    if (!trimmed) {
      setDishNameValidationError("Please enter a specific dish name before saving.");
      return;
    }
    if (aiSafetyCard) {
      setAiSafetyCard({
        ...aiSafetyCard,
        dishName: trimmed,
        identificationConfidence: "high",
        confidenceNote: null,
      });
    }
    setDishTitle(trimmed);
    setDishNameValidationError(null);
    setIsEditingDishName(false);
  };

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

  const handleStartManualEdit = (field: "prep" | "packaging" | "holding") => {
    setEditingManualField(field);
    if (field === "prep") {
      const existing = aiSafetyCard?.preparation_log || aiSafetyCard?.preparationLog;
      setManualInputVal(existing && !isNotSpecified(existing) ? existing : "");
    } else if (field === "packaging") {
      const existing = aiSafetyCard?.packaging_info || aiSafetyCard?.packagingDetails || aiSafetyCard?.packagingAdvice;
      setManualInputVal(existing && !isNotSpecified(existing) ? existing : "");
    } else {
      const existing = aiSafetyCard?.holding_notes || aiSafetyCard?.holdingNotes;
      setManualInputVal(existing && !isNotSpecified(existing) ? existing : "");
    }
  };

  const handleSaveManualEdit = (field: "prep" | "packaging" | "holding") => {
    if (!aiSafetyCard) return;
    const val = manualInputVal.trim();
    if (val) {
      if (field === "prep") {
        setAiSafetyCard({
          ...aiSafetyCard,
          preparationLog: val,
          preparation_log: val,
        });
        setCookingDetails((prev) => (prev ? `${prev}. ${val}` : val));
      } else if (field === "packaging") {
        setAiSafetyCard({
          ...aiSafetyCard,
          packagingDetails: val,
          packaging_info: val,
          packagingAdvice: val,
        });
      } else {
        setAiSafetyCard({
          ...aiSafetyCard,
          holdingNotes: val,
          holding_notes: val,
        });
      }
    }
    setEditingManualField(null);
  };

  const analysisSteps = [
    "Gemini Multimodal Vision: Inspecting dish texture & steam...",
    "Thermal Decay Check: Calculating HACCP holding temperature...",
    "Volumetric Sizing: Estimating adult rescue portions...",
    "Generating volunteer packaging & allergen warnings...",
  ];

  // Handle file picker & drag drop
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = handleImageChange;

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid food image (JPG, PNG, or WEBP).");
      return;
    }
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Immediately update preview image state
        setImagePreview(reader.result);
        setSelectedPresetId("");
        // Clear previous error banner ("Non-Food Image Detected") so new image can be freshly analyzed
        setFoodRejectionError(null);
        // Reset analysis state so user can click "Analyze Food Safety & Portions" on the new photo
        setIsAnalyzing(false);
        setAnalysisStepIndex(0);
        setAiSafetyCard(null);
        setDishTitle(null);
        setFreshnessScore(null);
        setPortions(null);
        setPrepLog(null);
        setCalculatedExpiryTimestamp(null);
        setPublishedSuccess(false);
        setManualDishNameInput("");
        setIsEditingDishName(false);
        setDishNameValidationError(null);
        setApiAnalysisError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Preset quick selection - sets sample food image & notes only; DOES NOT guess or auto-fill location
  const handleSelectPreset = (preset: PresetFoodItem) => {
    setUploadedFileName("");
    setFoodRejectionError(null);
    setSelectedPresetId(preset.id);
    setSelectedImage(preset.imageUrl);
    setCookingDetails(preset.cookingDetails);
    // Location remains strictly for the donor to provide manually or via GPS
    setDishTitle(null);
    setFreshnessScore(null);
    setPortions(null);
    setPrepLog(null);
    setAiSafetyCard(null);
    setCalculatedExpiryTimestamp(null);
    setPublishedSuccess(false);
    setManualDishNameInput("");
    setIsEditingDishName(false);
    setDishNameValidationError(null);
  };

  // Device GPS Location Handler
  const handleUseDeviceGps = () => {
    setIsLocatingGps(true);
    setGpsStatusMessage("Requesting device GPS coordinates...");
    setLocationValidationError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setIsLocatingGps(false);
      setGpsStatusMessage("Geolocation is not supported by your browser. Please enter location manually.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);
        const detected = `GPS Location (${lat}°, ${lng}°)`;
        updateAddress(detected);
        setIsLocatingGps(false);
        setGpsStatusMessage(`GPS location acquired (${lat}°, ${lng}°).`);
        setLocationValidationError(null);
      },
      (error) => {
        console.warn("GPS error / denied:", error.message);
        setIsLocatingGps(false);
        // CRITICAL REQUIREMENT: Leave field empty and prompt for manual entry. Do NOT guess mock locations.
        setGpsStatusMessage("GPS permission denied or unavailable. Please enter venue address manually.");
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // Preset Area selection handler
  const handleSelectArea = (area: string) => {
    updateAddress(area);
    setLocationValidationError(null);
    setGpsStatusMessage(null);
  };

  // Start real voice recording with Web Speech API and audio energy monitoring
  const startVoiceRecording = async () => {
    setVoiceAlert(null);
    setLiveTranscript("");
    currentTranscriptRef.current = "";
    speechDetectedRef.current = false;
    setVoiceTimeSec(0);

    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    let micStreamStarted = false;

    // 1. Audio stream & analyser buffer analysis for real-time sound/silence threshold check
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        micStreamStarted = true;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          audioCheckIntervalRef.current = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            // Background room silence is typically < 10; spoken voice spikes significantly higher
            if (avg > 15) {
              speechDetectedRef.current = true;
            }
          }, 100);
        }
      }
    } catch (err: any) {
      console.warn("Microphone access could not be initialized:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setVoiceAlert({
          type: "warning",
          message: "Microphone permission was denied. Please allow microphone access in your browser.",
        });
        return;
      }
    }

    // 2. Initialize Web Speech API for genuine speech-to-text transcription
    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let fullStr = "";
          for (let i = 0; i < event.results.length; i++) {
            fullStr += event.results[i][0].transcript + " ";
          }
          const cleaned = fullStr.trim();
          if (cleaned.length > 0) {
            currentTranscriptRef.current = cleaned;
            speechDetectedRef.current = true;
            setLiveTranscript(cleaned);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition event error:", event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("Failed to start SpeechRecognition:", err);
      }
    } else if (!micStreamStarted) {
      setVoiceAlert({
        type: "warning",
        message: "Speech recognition is not supported in this browser. Please type details manually.",
      });
      return;
    }

    setIsRecordingVoice(true);

    // 3. Start recording timer
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    voiceTimerRef.current = setInterval(() => {
      setVoiceTimeSec((prev) => prev + 1);
    }, 1000);
  };

  // Stop voice recording and process speech vs silence
  const stopVoiceRecording = () => {
    // 1. Clear intervals
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (audioCheckIntervalRef.current) {
      clearInterval(audioCheckIntervalRef.current);
      audioCheckIntervalRef.current = null;
    }

    // 2. Stop Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    // 3. Stop audio media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // 4. Close AudioContext
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    setIsRecordingVoice(false);

    // 5. Check if real speech words were transcribed
    const capturedText = currentTranscriptRef.current.trim();
    const hasSpokenWords = capturedText.length > 0;

    if (!hasSpokenWords) {
      // SILENCE / NO SPEECH DETECTED:
      // DO NOT insert any text into cooking details input. Keep field untouched.
      setVoiceAlert({
        type: "warning",
        message: "No speech detected. Please speak into your microphone.",
      });
      return;
    }

    // GENUINE SPOKEN WORDS DETECTED:
    // Transcribe and append or set cooking details
    setCookingDetails((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${capturedText}` : capturedText;
    });

    setVoiceAlert({
      type: "success",
      message: `Transcribed: "${capturedText}"`,
    });
  };

  // Voice note toggle
  const toggleVoiceNote = () => {
    if (isRecordingVoice) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Analyze with Gemini AI
  const handleAnalyzeWithGemini = async () => {
    // If filename was flagged as non-food by app-level guard, strictly reject
    if (
      uploadedFileName &&
      /(logo|screenshot|laptop|computer|car|document|invoice|receipt|badge|icon|symbol|diagram|flowchart|pdf|avatar|profile|sign|id_card|poster|device|desk)/i.test(
        uploadedFileName
      )
    ) {
      setAiSafetyCard(null);
      setCalculatedExpiryTimestamp(null);
      setLastPublishedDish("");
      setCookingDetails("");
      setSelectedPresetId("");
      setFoodRejectionError(
        "This image does not appear to contain food. Please upload a clear food image."
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStepIndex(0);
    setAiSafetyCard(null);
    setCalculatedExpiryTimestamp(null);
    setFoodRejectionError(null);
    setApiAnalysisError(null);
    setPublishedSuccess(false);

    const effectiveCookingNotes = cookingDetails.trim() || "Not provided by donor";

    // Step-by-step loading simulation for user transparency
    const stepInterval = setInterval(() => {
      setAnalysisStepIndex((prev) => (prev + 1) % analysisSteps.length);
    }, 650);

    try {
      const geminiVisionPrompt = `Step 1: Check if the image clearly contains edible food. If the image is non-food, irrelevant, an object, text, or a random scene, respond ONLY with JSON: { "is_food": false, "error": "non_food" }.

When analyzing valid food:
- Provide \`confidence\`: 'high' | 'low'.
- If confidence is 'high', return the identified \`dish_name\`.
- If the dish is ambiguous, mixed, or unclear, set \`confidence\`: 'low', \`dish_name\`: 'Unable to confidently identify this food item.'.`;

      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: selectedImage,
          cookingDetails: effectiveCookingNotes,
          dishHint: selectedPresetId
            ? PRESET_FOOD_SAMPLES.find((p) => p.id === selectedPresetId)?.title
            : undefined,
          fileName: uploadedFileName,
          prompt: geminiVisionPrompt,
        }),
      });

      if (!response.ok) {
        let errDetail = `HTTP ${response.status}: Failed to reach food safety analysis service.`;
        try {
          const errJson = await response.json();
          if (errJson?.error) errDetail = errJson.error;
        } catch (_) {}
        throw new Error(errDetail);
      }

      let result: any = null;
      try {
        result = await response.json();
      } catch (_jsonErr) {
        throw new Error("Unable to parse response from AI safety analysis service.");
      }
      clearInterval(stepInterval);

      // Strict Non-Food Classification & Response Handling:
      // If the response indicates non-food or error is 'non_food':
      if (
        result.is_food === false ||
        result.error === "non_food" ||
        (result.data && (result.data.is_food === false || result.data.error === "non_food"))
      ) {
        // Set an error banner with the exact text:
        setFoodRejectionError(
          "This image does not appear to contain food. Please upload a clear food image."
        );
        // Reset all downstream state: dishTitle = null, freshnessScore = null, portions = null, prepLog = null
        setDishTitle(null);
        setFreshnessScore(null);
        setPortions(null);
        setPrepLog(null);
        setAiSafetyCard(null);
        setCalculatedExpiryTimestamp(null);
        setLastPublishedDish("");
        setCookingDetails("");
        setSelectedPresetId("");
        setManualDishNameInput("");
        setIsEditingDishName(false);
        setDishNameValidationError(null);
        return;
      }

      // Strict App-Level Food Validation Guard:
      // Verify is_food boolean from Gemini structured response
      const isFoodConfirmed =
        result.is_food === true ||
        (result.success === true && result.data && result.data.is_food === true);

      if (!isFoodConfirmed) {
        // If the result explicitly has an error or unsuccessful flag
        if (result.error && !result.is_food && result.error !== "non_food") {
          throw new Error(result.error);
        }
        // App-Level Guard for non-food
        setFoodRejectionError(
          "This image does not appear to contain food. Please upload a clear food image."
        );
        setDishTitle(null);
        setFreshnessScore(null);
        setPortions(null);
        setPrepLog(null);
        setAiSafetyCard(null);
        setCalculatedExpiryTimestamp(null);
        setLastPublishedDish("");
        setCookingDetails("");
        setSelectedPresetId("");
        setManualDishNameInput("");
        setIsEditingDishName(false);
        setDishNameValidationError(null);
        return;
      }

      // If is_food: true, proceed normally
      setFoodRejectionError(null);
      setApiAnalysisError(null);
      const data = result.data || result;

      // Identification confidence & manual confirmation handling
      const rawConf = (data.confidence || data.identification_confidence || data.identificationConfidence || "").toLowerCase();
      const rawDishName = (data.dish_name || data.dishName || "").trim();
      
      const isUnableToIdentify =
        rawDishName.toLowerCase().includes("unable to confidently identify") ||
        rawDishName.toLowerCase().includes("unable to identify");

      const isAmbiguousOrGeneric =
        !rawDishName ||
        isUnableToIdentify ||
        rawDishName.toLowerCase() === "assorted cooked dish" ||
        rawDishName.toLowerCase() === "surplus food meal" ||
        rawDishName.toLowerCase() === "surplus prepared meal";

      const identificationConfidence: "high" | "low" =
        rawConf === "low" || isAmbiguousOrGeneric ? "low" : "high";

      const confidenceNote =
        data.confidence_note ||
        data.confidenceNote ||
        (identificationConfidence === "low"
          ? "Unable to confidently identify this food item."
          : null);

      // If low confidence or ambiguous, avoid false certainty; allow donor to type exact name
      const resolvedDishName =
        identificationConfidence === "low"
          ? (isUnableToIdentify ? "Unable to confidently identify this food item." : (rawDishName || "Unable to confidently identify this food item."))
          : (rawDishName || "Surplus Prepared Meal");

      const servings = data.estimated_servings ?? data.estimatedServings ?? 25;
      const freshness = data.freshness_score ?? data.freshnessScore ?? 9.0;
      const safeHours = data.safe_hours ?? data.safeConsumptionHours ?? 2.5;

      const rawPrep = data.preparation_log ?? data.preparationLog ?? null;
      const normalizedPrep = rawPrep && !isNotSpecified(rawPrep) ? String(rawPrep).trim() : null;

      const rawPack = data.packaging_info ?? data.packagingDetails ?? data.packagingAdvice ?? null;
      const normalizedPack = rawPack && !isNotSpecified(rawPack) ? String(rawPack).trim() : null;

      const rawHold = data.holding_notes ?? data.holdingNotes ?? null;
      const normalizedHold = rawHold && !isNotSpecified(rawHold) ? String(rawHold).trim() : null;

      const safeWindowHours = data.safe_consumption_window_hours ?? data.safe_hours ?? data.safeConsumptionHours ?? safeHours;

      const normalizedAssessment: AiSafetyAssessment = {
        dishName: resolvedDishName,
        identificationConfidence,
        identification_confidence: identificationConfidence,
        confidenceNote,
        confidence_note: confidenceNote,
        category: data.category || "Vegetarian",
        estimatedServings: servings,
        freshnessScore: freshness,
        safetyStatus: data.safetyStatus || "Safe",
        safeConsumptionHours: safeWindowHours,
        safe_consumption_window_hours: safeWindowHours,
        preparationLog: normalizedPrep,
        preparation_log: normalizedPrep,
        packagingDetails: normalizedPack,
        packaging_info: normalizedPack,
        packagingAdvice: normalizedPack || "Not specified",
        holdingNotes: normalizedHold,
        holding_notes: normalizedHold,
        volunteerHandlingTips:
          Array.isArray(data.volunteerHandlingTips) && data.volunteerHandlingTips.length > 0
            ? data.volunteerHandlingTips
            : [
                "Sanitize hands and wear nitrile gloves before inspection",
                "Ensure containers stay sealed to preserve safety during transit",
                "Deliver immediately to nearby recipient shelter",
              ],
        allergenWarning: Array.isArray(data.allergenWarning) ? data.allergenWarning : [],
        aiReasoning: data.aiReasoning || `Visual inspection of ${resolvedDishName || "surplus food item"}.`,
        is_food: true,
      };

      setAiSafetyCard(normalizedAssessment);
      setFreshnessScore(freshness);
      setPortions(servings);
      setPrepLog(normalizedPrep);
      const hours = normalizedAssessment.safeConsumptionHours || 2.5;
      const expiryMs = Date.now() + hours * 60 * 60 * 1000;
      setCalculatedExpiryTimestamp(expiryMs);

      // UI & Manual Confirmation Handling:
      // If low confidence or unable to identify, show manual input and auto-focus
      const isUnclearDish =
        identificationConfidence === "low" ||
        isUnableToIdentify ||
        !resolvedDishName ||
        resolvedDishName.toLowerCase().includes("unable to confidently identify");

      if (isUnclearDish) {
        setIsEditingDishName(true);
        setManualDishNameInput(isUnableToIdentify ? "" : resolvedDishName);
        setDishTitle(isUnableToIdentify ? null : (resolvedDishName || null));
        setDishNameValidationError(null);
        setTimeout(() => {
          dishNameInputRef.current?.focus();
        }, 120);
      } else {
        setIsEditingDishName(false);
        setManualDishNameInput(resolvedDishName);
        setDishTitle(resolvedDishName);
        setDishNameValidationError(null);
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      clearInterval(stepInterval);

      // Network, Rate Limit, or API Service Failure:
      setDishTitle(null);
      setFreshnessScore(null);
      setPortions(null);
      setPrepLog(null);
      setAiSafetyCard(null);
      setCalculatedExpiryTimestamp(null);
      setLastPublishedDish("");
      setFoodRejectionError(null);
      setApiAnalysisError(
        "Unable to complete AI food safety analysis due to network or service limits. You can retry the scan or manually enter the details below to proceed."
      );
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
    }
  };

  // Publish donation to nearby NGOs
  const handlePublish = () => {
    // 0. Action Gate 1: Role Authentication Check
    if (currentUser.role !== "donor") {
      onRequireAuth(
        "donor",
        "Please log in with a Hotel / Food Donor account to publish surplus food."
      );
      return;
    }

    // 1. Mandatory Pickup Location Validation Guard
    const effectiveLocation = (donorAddress || currentLocation || "").trim();
    if (!effectiveLocation) {
      setLocationValidationError("Pickup location is required. Please enable GPS or enter your venue address manually.");
      if (onOpenLocationModal) {
        onOpenLocationModal();
      } else {
        setIsAreaModalOpen(true);
      }
      const locInput = document.getElementById("pickup-location-input");
      if (locInput) {
        locInput.focus();
        locInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!aiSafetyCard || !calculatedExpiryTimestamp || foodRejectionError) return;

    // 2. Strict Dish Name Validation Guard: Requires a non-empty dish name (AI or manual)
    const effectiveDishName = (
      (manualDishNameInput && manualDishNameInput.trim()) ||
      (aiSafetyCard.dishName && !aiSafetyCard.dishName.toLowerCase().includes("unable to confidently identify") ? aiSafetyCard.dishName.trim() : "")
    ).trim();

    if (!effectiveDishName) {
      setDishNameValidationError("Please enter a specific dish name before publishing.");
      setIsEditingDishName(true);
      setTimeout(() => {
        dishNameInputRef.current?.focus();
        dishNameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setDishNameValidationError(null);

    setLocationValidationError(null);

    const effectiveDonorName = donorHotelName.trim() || currentUser.organizationName || donorAddress.trim();

    const effectiveContactPerson =
      currentUser.role === "donor" && currentUser.name && currentUser.name !== "Public Guest"
        ? currentUser.name
        : "Not provided by donor";
    const effectivePhone = donorContact.trim() || (currentUser.email ? currentUser.email : "Not provided by donor");

    const effectivePrepLog =
      aiSafetyCard.preparation_log && !isNotSpecified(aiSafetyCard.preparation_log)
        ? aiSafetyCard.preparation_log.trim()
        : aiSafetyCard.preparationLog && !isNotSpecified(aiSafetyCard.preparationLog)
        ? aiSafetyCard.preparationLog.trim()
        : cookingDetails.trim() && !isNotSpecified(cookingDetails)
        ? cookingDetails.trim()
        : "Not provided by donor";

    const effectivePackaging =
      aiSafetyCard.packaging_info && !isNotSpecified(aiSafetyCard.packaging_info)
        ? aiSafetyCard.packaging_info.trim()
        : aiSafetyCard.packagingDetails && !isNotSpecified(aiSafetyCard.packagingDetails)
        ? aiSafetyCard.packagingDetails.trim()
        : aiSafetyCard.packagingAdvice && !isNotSpecified(aiSafetyCard.packagingAdvice)
        ? aiSafetyCard.packagingAdvice.trim()
        : "Not specified";

    const newDonation: DonationItem = {
      id: `don-${Date.now()}`,
      dishName: effectiveDishName,
      category: (aiSafetyCard.category as any) || "Vegetarian",
      servings: aiSafetyCard.estimatedServings,
      freshnessScore: aiSafetyCard.freshnessScore,
      safetyStatus: aiSafetyCard.safetyStatus,
      initialHours: aiSafetyCard.safeConsumptionHours,
      expiryTimestamp: calculatedExpiryTimestamp,
      donorName: effectiveDonorName,
      donorType: "Hotel & Banquet Hub",
      donorAddress: donorAddress.trim(),
      donorPhone: effectivePhone,
      donorContactPerson: effectiveContactPerson,
      distanceKm: +(1.2 + Math.random() * 2.5).toFixed(1),
      imageUrl: selectedImage,
      cookingDetails: effectivePrepLog,
      packagingAdvice: effectivePackaging,
      volunteerTips: aiSafetyCard.volunteerHandlingTips,
      allergens: aiSafetyCard.allergenWarning || [],
      aiReasoning: aiSafetyCard.aiReasoning,
      status: "AVAILABLE",
      createdAt: Date.now(),
      isDemo: !!selectedPresetId,
    };

    onPublishDonation(newDonation);
    setPublishedSuccess(true);
    setLastPublishedDish(effectiveDishName);
    setDishTitle(effectiveDishName);
    setAiSafetyCard((prev) =>
      prev
        ? {
            ...prev,
            dishName: effectiveDishName,
            identificationConfidence: "high",
            confidenceNote: null,
          }
        : null
    );
  };

  return (
    <div id="donor-screen-container" className="w-full">
      {/* Clean Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              HOTEL & CATERING PORTAL
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ResQ-Plate <span className="text-slate-400 font-light">|</span> Donate Surplus Food
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
              Prevent food waste instantly. Upload a photo of banquet or buffet surplus, let Google Gemini AI assess safe consumption windows, and dispatch directly to verified local NGOs.
            </p>
          </div>

          <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-slate-700">
              12 NGOs Listening Nearby
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {publishedSuccess && (
        <div
          id="publish-success-banner"
          className="mb-6 sm:mb-8 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Donation Broadcasted to Nearby NGO Network!
              </h3>
              <p className="text-xs text-emerald-800">
                "{lastPublishedDish}" is now live on the volunteer feed. You can monitor volunteer claims in real-time.
              </p>
            </div>
          </div>
          <button
            id="btn-view-ngo-feed"
            onClick={onNavigateToFeed}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View in NGO Feed</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Prominent Non-Food Rejection Banner */}
      {foodRejectionError && (
        <div
          id="non-food-rejection-banner"
          data-testid="non-food-rejection-banner"
          className="mb-6 sm:mb-8 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                Non-Food Image Detected
              </h3>
              <p id="non-food-banner-text" className="text-xs text-rose-800 font-semibold mt-0.5">
                {foodRejectionError}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-banner-upload-food"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset value so the same or new image can always be selected
                fileInputRef.current.click();
              }
            }}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Clear Food Image</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">
        {/* Left Column: Form & Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Food Picture Upload */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileImage className="w-4 h-4 text-emerald-600" />
                <span>1. Surplus Food Picture</span>
              </label>
              <span className="text-xs text-slate-500">Live Camera or File</span>
            </div>

            {/* Dedicated Hidden File Input Element */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange} 
            />

            {/* Drag and Drop Zone */}
            <div
              id="food-dropzone"
              onDragOver={isAnalyzing ? undefined : handleDragOver}
              onDragLeave={isAnalyzing ? undefined : handleDragLeave}
              onDrop={isAnalyzing ? undefined : handleDrop}
              onClick={() => {
                if (!isAnalyzing && !selectedImage && fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              className={`relative w-full aspect-video sm:h-64 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden ${
                isAnalyzing
                  ? "border-slate-200 bg-slate-100/60 opacity-60 cursor-not-allowed pointer-events-none"
                  : isDragging
                  ? "border-emerald-500 bg-emerald-50/50 cursor-pointer"
                  : "border-slate-300 hover:border-emerald-500 bg-slate-50/50 cursor-pointer"
              }`}
            >
              {selectedImage ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xs cursor-pointer group">
                  <div
                    id="donor-image-preview-container"
                    role="button"
                    tabIndex={0}
                    title="Click to zoom enlarged photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPhotoLightbox?.({
                        imageUrl: selectedImage,
                        title: aiSafetyCard?.dishName || (selectedPresetId ? PRESET_FOOD_SAMPLES.find(p => p.id === selectedPresetId)?.title.split("(")[0] || "Food Sample" : "Kitchen Surplus Photo"),
                        subtitle: selectedPresetId ? "Preset Demo Sample • Click +/- to zoom" : "Donor Uploaded Photo • Click +/- to zoom",
                        isDemo: Boolean(selectedPresetId),
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        e.preventDefault();
                        onOpenPhotoLightbox?.({
                          imageUrl: selectedImage,
                          title: aiSafetyCard?.dishName || (selectedPresetId ? PRESET_FOOD_SAMPLES.find(p => p.id === selectedPresetId)?.title.split("(")[0] || "Food Sample" : "Kitchen Surplus Photo"),
                          subtitle: selectedPresetId ? "Preset Demo Sample • Click +/- to zoom" : "Donor Uploaded Photo • Click +/- to zoom",
                          isDemo: Boolean(selectedPresetId),
                        });
                      }
                    }}
                    className="relative w-full h-full"
                  >
                    <img
                      id="donor-preview-image"
                      src={selectedImage}
                      alt="Food preview"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Hover Zoom Cue */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-lg border border-white/20">
                        <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Click to Zoom</span>
                      </span>
                    </div>

                    {selectedPresetId && (
                      <div className="absolute top-3 right-3">
                        <span
                          id="preset-image-demo-badge"
                          data-testid="demo-sample-badge"
                          className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-md border border-amber-300 select-none"
                        >
                          [DEMO SAMPLE]
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between text-white text-xs font-semibold gap-2 z-10">
                      <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-xs truncate max-w-[60%] text-[11px] sm:text-xs">
                        {selectedPresetId ? "Demo Preset Loaded" : "Custom Food Photo Loaded"}
                      </span>
                      <button
                        type="button"
                        id="btn-change-photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''; // Reset value so the same or new image can always be selected
                            fileInputRef.current.click();
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 active:bg-emerald-700 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1 shrink-0 shadow-xs cursor-pointer relative z-10 transition-colors"
                      >
                        <FileImage className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Drop food picture here, or{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                          fileInputRef.current.click();
                        }
                      }}
                      className="text-emerald-700 underline font-bold hover:text-emerald-800 cursor-pointer"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG, WEBP from kitchen cameras
                  </p>
                </div>
              )}
            </div>

            {/* Quick Test Presets */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Quick Sample Presets (1-Click Test):
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                  Demo Presets
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_FOOD_SAMPLES.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      id={`preset-btn-${preset.id}`}
                      disabled={isAnalyzing}
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-2 rounded-xl border text-xs transition-all ${
                        isAnalyzing
                          ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50"
                          : isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500 cursor-pointer"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                      }`}
                    >
                      <div className="relative h-14 w-full rounded-md overflow-hidden mb-1.5 bg-slate-100">
                        <img
                          src={preset.imageUrl}
                          alt={preset.title}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80";
                          }}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 right-1 px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-2xs border border-amber-300 select-none">
                          [DEMO SAMPLE]
                        </span>
                      </div>
                      <p className="truncate font-semibold">{preset.title.split("(")[0]}</p>
                      <span className="text-[10px] text-slate-500 block">
                        ~{preset.servingsHint} portions
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Non-Food Rejection Inline Alert in Section 1 */}
            {foodRejectionError && (
              <div
                id="food-rejection-alert"
                className="mt-4 p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start justify-between gap-3 animate-in fade-in duration-200"
              >
                <div className="flex items-start gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                      Food Verification Rejected
                    </h4>
                    <p className="text-xs font-semibold text-rose-700 mt-1 leading-relaxed">
                      {foodRejectionError}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-dismiss-rejection-error"
                  onClick={() => setFoodRejectionError(null)}
                  className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer transition"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Cooking & Holding Details */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                <span>2. Cooking Details & Holding Log</span>
              </label>

              {/* Voice-note recording button */}
              <button
                type="button"
                id="voice-note-toggle-btn"
                onClick={toggleVoiceNote}
                className={`h-11 sm:h-12 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isRecordingVoice
                    ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
                title="Record voice note for kitchen staff"
              >
                {isRecordingVoice ? (
                  <>
                    <MicOff className="w-4 h-4 text-rose-600" />
                    <span>Stop Recording ({voiceTimeSec}s)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>Voice Note Log</span>
                  </>
                )}
              </button>
            </div>

            {isRecordingVoice && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <div className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                  </div>
                  <div className="text-xs text-rose-900">
                    <span className="font-bold">Listening:</span>{" "}
                    {liveTranscript ? (
                      <span className="italic font-semibold text-rose-950">"{liveTranscript}"</span>
                    ) : (
                      <span className="text-rose-700">Speak cooking & holding details into your microphone...</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-rose-700 shrink-0 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                  {voiceTimeSec}s
                </span>
              </div>
            )}

            {voiceAlert && (
              <div
                id="voice-speech-alert"
                className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                  voiceAlert.type === "warning"
                    ? "bg-amber-50 border border-amber-300 text-amber-900"
                    : "bg-emerald-50 border border-emerald-300 text-emerald-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {voiceAlert.type === "warning" ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>{voiceAlert.message}</span>
                </div>
                <button
                  type="button"
                  id="close-voice-alert-btn"
                  onClick={() => setVoiceAlert(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="relative">
              <textarea
                id="cooking-details-textarea"
                rows={3}
                value={cookingDetails}
                onChange={(e) => setCookingDetails(e.target.value)}
                placeholder="e.g. Cooked 2 hours ago at banquet, kept warm in covered stainless chafing dishes at 65°C. Untouched surplus..."
                className="w-full min-h-[90px] p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition text-slate-800 resize-y"
              />
            </div>

            {/* Fast suggestion chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 py-1">Suggestions:</span>
              {[
                "Cooked 2 hours ago at banquet, kept warm",
                "Prepared 1.5h ago for corporate lunch, hot holding",
                "Bakery snacks leftover from 3 PM high tea",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setCookingDetails(chip)}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 transition"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Donor Location & Venue Details */}
            <div id="donor-location-section" className="pt-3 border-t border-slate-100 space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label htmlFor="pickup-location-input" className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pickup Location / Address <span className="text-red-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    id="btn-use-device-gps"
                    onClick={handleUseDeviceGps}
                    disabled={isLocatingGps}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-lg transition cursor-pointer disabled:opacity-60"
                  >
                    {isLocatingGps ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-3 h-3 text-emerald-700" />
                        <span>Use Current Device Location (GPS)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Location Status: Display "Location not set (Required)" with active "Set Location" button */}
                {!donorAddress || !donorAddress.trim() ? (
                  <div
                    id="location-status-unset"
                    data-testid="location-status-unset"
                    className="mb-2.5 p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl flex items-center justify-between gap-2 animate-in fade-in"
                  >
                    <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Location not set (Required)</span>
                    </div>
                    <button
                      type="button"
                      id="btn-set-location"
                      data-testid="btn-set-location"
                      onClick={() => {
                        if (onOpenLocationModal) {
                          onOpenLocationModal();
                        } else {
                          setIsAreaModalOpen(true);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Set Location</span>
                    </button>
                  </div>
                ) : (
                  <div
                    id="location-status-set"
                    data-testid="location-status-set"
                    className="mb-2.5 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 animate-in fade-in"
                  >
                    <div className="flex items-center gap-2 text-emerald-950 font-medium text-xs truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Location set: <strong className="font-bold text-emerald-900">{donorAddress}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        id="btn-change-location"
                        onClick={() => {
                          if (onOpenLocationModal) {
                            onOpenLocationModal();
                          } else {
                            setIsAreaModalOpen(true);
                          }
                        }}
                        className="px-2 py-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100 rounded-md transition cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        id="btn-clear-location"
                        onClick={() => {
                          updateAddress("");
                          setGpsStatusMessage(null);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Clear location"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    id="pickup-location-input"
                    value={donorAddress}
                    onChange={(e) => {
                      updateAddress(e.target.value);
                    }}
                    placeholder="Enter venue or pickup address (e.g. 5th Ave Convention Hall, Loading Dock 2)..."
                    className={`w-full p-2.5 pr-8 bg-slate-50 border rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition ${
                      locationValidationError ? "border-red-400 bg-red-50/30 ring-1 ring-red-300" : "border-slate-200"
                    }`}
                  />
                  {donorAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        updateAddress("");
                        setGpsStatusMessage(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Clear location"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {gpsStatusMessage && (
                  <p id="gps-status-message" className="text-[11px] text-slate-600 font-medium mt-1 animate-in fade-in">
                    {gpsStatusMessage}
                  </p>
                )}

                {locationValidationError && (
                  <div
                    id="pickup-location-validation-error"
                    className="mt-2 p-2.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-in fade-in"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{locationValidationError}</span>
                  </div>
                )}

                {/* Popular Area Selection Chips */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Select Popular Area:
                    </span>
                    <button
                      type="button"
                      id="btn-open-area-modal"
                      onClick={() => {
                        if (onOpenLocationModal) {
                          onOpenLocationModal();
                        } else {
                          setIsAreaModalOpen(true);
                        }
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Compass className="w-3 h-3" />
                      <span>Browse All Areas</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_RESCUE_AREAS.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => handleSelectArea(area)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition cursor-pointer ${
                          donorAddress === area
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                            : "bg-slate-100 hover:bg-emerald-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Venue Name and Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="donor-venue-input" className="block text-slate-500 font-medium mb-1">
                    Donor Venue / Business Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="donor-venue-input"
                    value={donorHotelName}
                    onChange={(e) => setDonorHotelName(e.target.value)}
                    placeholder="e.g. Grand Ballroom or Kitchen Name"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label htmlFor="donor-contact-input" className="block text-slate-500 font-medium mb-1">
                    Contact Phone / Person <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="donor-contact-input"
                    value={donorContact}
                    onChange={(e) => setDonorContact(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Action Button: Primary Food Safety & Portions Analysis */}
            <div className="pt-2">
              <button
                type="button"
                id="analyze-with-gemini-btn"
                data-testid="analyze-food-safety"
                disabled={isAnalyzing}
                onClick={handleAnalyzeWithGemini}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-75 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-100" />
                    <span>Analyzing Food Safety & Portions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span>Analyze Food Safety & Portions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Safety Card & Publish Action */}
        <div className="lg:col-span-5 space-y-6">
          {isAnalyzing && (
            <div
              id="ai-analysis-skeleton"
              className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-sm space-y-5 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Google Gemini Safety Analysis in Progress
                  </h4>
                  <p className="text-xs text-slate-500">Processing visual & HACCP telemetry</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full w-3/4 animate-pulse" />
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                <span>{analysisSteps[analysisStepIndex]}</span>
              </div>

              {/* Pulsing Placeholder Content Blocks */}
              <div className="space-y-3 pt-2">
                <div className="h-20 bg-slate-100 rounded-xl w-full" />
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-12 bg-slate-100 rounded-xl w-full" />
              </div>
            </div>
          )}

          {/* Graceful API / Network Error State: Retry Scan & Manual Input Unblocked */}
          {!isAnalyzing && apiAnalysisError && (
            <div
              id="ai-api-error-card"
              className="bg-white p-6 sm:p-7 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Temporary Service Limit</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                AI Food Safety Analysis Interrupted
              </h3>
              <p
                id="api-error-description"
                className="text-xs text-amber-900/80 max-w-sm mt-1.5 mb-5 font-medium leading-relaxed"
              >
                {apiAnalysisError}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center mb-4">
                <button
                  type="button"
                  id="btn-retry-ai-scan"
                  onClick={handleAnalyzeWithGemini}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Scan</span>
                </button>
                <button
                  type="button"
                  id="btn-dismiss-api-error"
                  onClick={() => setApiAnalysisError(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Dismiss & Edit Notes
                </button>
              </div>

              <div className="w-full pt-3 border-t border-slate-100 text-left">
                <p className="text-[11px] text-slate-500 font-medium">
                  💡 <span className="font-bold text-slate-700">Tip:</span> You can fill in the preparation time and holding notes manually in the left panel.
                </p>
              </div>
            </div>
          )}

          {/* Rejection State: When image is not food */}
          {!isAnalyzing && foodRejectionError && (
            <div
              id="ai-rejection-card"
              className="bg-white p-8 rounded-2xl border-2 border-rose-300 shadow-sm text-center flex flex-col items-center justify-center min-h-[380px] animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-4">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Verification Rejected</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Non-Food Image Detected
              </h3>
              <p
                id="non-food-rejection-msg"
                className="text-xs text-rose-700 max-w-sm mt-2 mb-6 font-semibold leading-relaxed"
              >
                {foodRejectionError}
              </p>
              <button
                type="button"
                id="btn-reupload-food"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Reset value so the same or new image can always be selected
                    fileInputRef.current.click();
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer mb-5"
              >
                <FileImage className="w-4 h-4" />
                <span>Upload Clear Food Image</span>
              </button>
              <div className="w-full pt-4 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-publish-donation"
                  disabled
                  className="w-full py-3.5 px-6 rounded-xl font-extrabold text-slate-400 bg-slate-100 border border-slate-200 text-xs cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-slate-400" />
                  <span>Publish Donation (Disabled - Valid Food Required)</span>
                </button>
              </div>
            </div>
          )}

          {!isAnalyzing && !aiSafetyCard && !foodRejectionError && !apiAnalysisError && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                AI Safety Verification Ready
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                Click <span className="font-bold text-emerald-700">"Analyze Food Safety & Portions"</span> adjacent to the food details to inspect dish freshness, portion count, remaining consumption window, and packaging advice.
              </p>
            </div>
          )}

          {/* AI Safety Card Result */}
          {!isAnalyzing && aiSafetyCard && (
            <div
              id="ai-safety-card"
              className="bg-white rounded-2xl border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            >
              {/* Card Header with Gemini Badge */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-400 border border-emerald-400/40">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                      Gemini Verified Safety Card
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPresetId && (
                      <span
                        id="ai-card-demo-badge"
                        data-testid="demo-sample-badge"
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white border border-amber-300 shadow-xs select-none"
                      >
                        [DEMO SAMPLE]
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      HACCP Standard
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  {/* Inline confidence banner if low confidence or unable to identify */}
                  {(aiSafetyCard.identificationConfidence === "low" ||
                    !aiSafetyCard.dishName ||
                    aiSafetyCard.dishName.toLowerCase().includes("unable to confidently identify")) && (
                    <div
                      id="dish-confidence-low-badge"
                      data-testid="dish-confidence-low-badge"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/25 border border-amber-400/60 text-amber-200 text-xs font-bold mb-2.5 animate-in fade-in"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Unable to confidently identify this food item.</span>
                    </div>
                  )}

                  {/* High confidence badge indicator */}
                  {aiSafetyCard.identificationConfidence === "high" &&
                    aiSafetyCard.dishName &&
                    !aiSafetyCard.dishName.toLowerCase().includes("unable to confidently identify") && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Identified</span>
                    </div>
                  )}

                  {/* Editing or Manual Input Mode */}
                  {isEditingDishName ||
                  !aiSafetyCard.dishName ||
                  aiSafetyCard.identificationConfidence === "low" ||
                  aiSafetyCard.dishName.toLowerCase().includes("unable to confidently identify") ? (
                    <div className="space-y-2 mt-1 bg-slate-950/60 p-3 rounded-xl border-2 border-amber-400/60 ring-1 ring-amber-400/30">
                      <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Dish Name / Description (Manual Entry)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={dishNameInputRef}
                          type="text"
                          id="input-manual-dish-name"
                          data-testid="input-manual-dish-name"
                          value={manualDishNameInput}
                          onChange={(e) => {
                            setManualDishNameInput(e.target.value);
                            setDishTitle(e.target.value.trim() || null);
                            if (dishNameValidationError) setDishNameValidationError(null);
                          }}
                          placeholder="Dish Name / Description (Manual Entry) (e.g. Mixed Vegetable Curry or Grilled Chicken Rice)"
                          className="flex-1 px-3 py-2 text-sm bg-slate-900 text-white border-2 border-amber-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400 font-semibold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveDishName();
                            if (
                              e.key === "Escape" &&
                              aiSafetyCard.dishName &&
                              !aiSafetyCard.dishName.toLowerCase().includes("unable to confidently identify")
                            ) {
                              setIsEditingDishName(false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          id="btn-save-dish-name"
                          data-testid="btn-save-dish-name"
                          onClick={handleSaveDishName}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                        {aiSafetyCard.dishName &&
                          !aiSafetyCard.dishName.toLowerCase().includes("unable to confidently identify") && (
                          <button
                            type="button"
                            id="btn-cancel-edit-dish-name"
                            onClick={() => {
                              setIsEditingDishName(false);
                              setManualDishNameInput(aiSafetyCard.dishName);
                            }}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {dishNameValidationError && (
                        <p id="dish-name-error-inline" className="text-xs text-rose-300 font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{dishNameValidationError}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Display Identified Dish Name with Edit Pencil */
                    <div className="flex items-center gap-2.5">
                      <h3
                        id="ai-card-dish-name"
                        data-testid="ai-card-dish-name"
                        className="text-xl font-black text-white tracking-tight"
                      >
                        {aiSafetyCard.dishName}
                      </h3>
                      <button
                        type="button"
                        id="btn-edit-dish-name"
                        data-testid="btn-edit-dish-name"
                        onClick={handleStartEditDishName}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs font-medium"
                        title="Edit dish name"
                        aria-label="Edit dish name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Edit</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        aiSafetyCard.category === "Non-Veg"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {aiSafetyCard.category}
                    </span>
                    <span className="text-xs text-slate-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {aiSafetyCard.estimatedServings} Portions
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics and Detail Breakdown */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* 1. AI VISUAL ASSESSMENT GROUP */}
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>AI Visual Assessment</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      Gemini Vision
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Freshness & Safety Score */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Freshness Score
                      </span>
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-xl sm:text-2xl font-black text-emerald-700">
                          {aiSafetyCard.freshnessScore.toFixed(1)}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">/ 10</span>
                        <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 ml-auto">
                          {aiSafetyCard.safetyStatus}
                        </span>
                      </div>
                    </div>

                    {/* Estimated Servings */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Portion Estimate
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-slate-900">
                          {aiSafetyCard.estimatedServings}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">Portions</span>
                      </div>
                    </div>

                    {/* Safe Consumption Window with LIVE COUNTDOWN */}
                    <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          Safe Window
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          ~{aiSafetyCard.safeConsumptionHours}h
                        </span>
                      </div>

                      {calculatedExpiryTimestamp && (
                        <div className="pt-0.5">
                          <CountdownBadge
                            expiryTimestamp={calculatedExpiryTimestamp}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Allergen Tagging */}
                  {aiSafetyCard.allergenWarning && aiSafetyCard.allergenWarning.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                      <span className="font-bold text-slate-700">Allergen Scan:</span>
                      {aiSafetyCard.allergenWarning.map((all) => (
                        <span
                          key={all}
                          className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold"
                        >
                          {all}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Reasoning */}
                  {aiSafetyCard.aiReasoning && (
                    <div className="p-2.5 rounded-lg bg-emerald-100/60 text-[11px] text-emerald-950 leading-relaxed border border-emerald-200">
                      <span className="font-bold block mb-0.5">Visual Finding Note:</span>
                      <ExpandableText text={aiSafetyCard.aiReasoning} maxLines={2} charLimit={85} />
                    </div>
                  )}
                </div>

                {/* 2. DONOR-REPORTED DETAILS GROUP */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>Donor-Reported Details</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">
                      Self-Reported
                    </span>
                  </div>

                  {/* Venue & Contact Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-2.5 rounded-lg bg-white border border-slate-200">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Donor Venue:</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {donorHotelName.trim() || currentUser.organizationName || "Not provided by donor"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Contact Phone / Person:</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {donorContact.trim() || (currentUser.role === "donor" && currentUser.name !== "Public Guest" ? currentUser.name : "Not provided by donor")}
                      </span>
                    </div>
                  </div>

                {/* Preparation Log */}
                <div id="preparation-log-card" className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Preparation Log:</span>
                    </div>
                    {isNotSpecified(aiSafetyCard.preparation_log || aiSafetyCard.preparationLog) ? (
                      <span
                        id="prep-log-badge"
                        className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/60"
                      >
                        Unconfirmed
                      </span>
                    ) : (
                      <span
                        id="prep-log-badge"
                        className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                      >
                        Donor Specified
                      </span>
                    )}
                  </div>

                  {isNotSpecified(aiSafetyCard.preparation_log || aiSafetyCard.preparationLog) ? (
                    <div className="flex items-center justify-between pt-1">
                      <span id="prep-log-status" className="text-slate-500 italic font-medium">
                        Not provided by donor
                      </span>
                      <button
                        type="button"
                        id="btn-add-prep-log"
                        onClick={() => handleStartManualEdit("prep")}
                        className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Prep Time</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 pt-1">
                      <div id="prep-log-value" className="text-slate-700 leading-relaxed font-medium flex-1">
                        <ExpandableText
                          text={aiSafetyCard.preparation_log || aiSafetyCard.preparationLog || ""}
                          maxLines={2}
                          charLimit={90}
                        />
                      </div>
                      <button
                        type="button"
                        id="btn-edit-prep-log"
                        onClick={() => handleStartManualEdit("prep")}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer shrink-0"
                        title="Edit preparation log"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {editingManualField === "prep" && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2">
                      <input
                        type="text"
                        id="input-manual-prep"
                        value={manualInputVal}
                        onChange={(e) => setManualInputVal(e.target.value)}
                        placeholder="e.g. Cooked at 6 PM in banquet kitchen"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveManualEdit("prep");
                          if (e.key === "Escape") setEditingManualField(null);
                        }}
                      />
                      <button
                        type="button"
                        id="btn-save-manual-prep"
                        onClick={() => handleSaveManualEdit("prep")}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingManualField(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Packaging Details */}
                <div id="packaging-details-card" className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>Packaging Info:</span>
                    </div>
                    {isNotSpecified(aiSafetyCard.packaging_info || aiSafetyCard.packagingDetails || aiSafetyCard.packagingAdvice) ? (
                      <span
                        id="packaging-badge"
                        className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/60"
                      >
                        Unconfirmed
                      </span>
                    ) : (
                      <span
                        id="packaging-badge"
                        className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                      >
                        Donor Specified
                      </span>
                    )}
                  </div>

                  {isNotSpecified(aiSafetyCard.packaging_info || aiSafetyCard.packagingDetails || aiSafetyCard.packagingAdvice) ? (
                    <div className="flex items-center justify-between pt-1">
                      <span id="packaging-status" className="text-slate-500 italic font-medium">
                        Not specified
                      </span>
                      <button
                        type="button"
                        id="btn-add-packaging"
                        onClick={() => handleStartManualEdit("packaging")}
                        className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Specify Packaging</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 pt-1">
                      <div id="packaging-value" className="text-slate-700 leading-relaxed font-medium flex-1">
                        <ExpandableText
                          text={
                            aiSafetyCard.packaging_info ||
                            aiSafetyCard.packagingDetails ||
                            aiSafetyCard.packagingAdvice ||
                            ""
                          }
                          maxLines={2}
                          charLimit={90}
                        />
                      </div>
                      <button
                        type="button"
                        id="btn-edit-packaging"
                        onClick={() => handleStartManualEdit("packaging")}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer shrink-0"
                        title="Edit packaging details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {editingManualField === "packaging" && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2">
                      <input
                        type="text"
                        id="input-manual-packaging"
                        value={manualInputVal}
                        onChange={(e) => setManualInputVal(e.target.value)}
                        placeholder="e.g. Sealed food-grade stainless containers"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveManualEdit("packaging");
                          if (e.key === "Escape") setEditingManualField(null);
                        }}
                      />
                      <button
                        type="button"
                        id="btn-save-manual-packaging"
                        onClick={() => handleSaveManualEdit("packaging")}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingManualField(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {aiSafetyCard.volunteerHandlingTips &&
                    aiSafetyCard.volunteerHandlingTips.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80">
                        <span className="font-bold text-slate-700 block mb-1">
                          Volunteer Dispatch Protocol:
                        </span>
                        <ul className="space-y-1 text-slate-600 list-disc list-inside">
                          {aiSafetyCard.volunteerHandlingTips.map((tip, idx) => (
                            <li key={idx} className="leading-snug">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Holding Temperature */}
                <div id="holding-notes-card" className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-emerald-600" />
                      <span>Holding Temperature:</span>
                    </div>
                    {isNotSpecified(aiSafetyCard.holding_notes || aiSafetyCard.holdingNotes) ? (
                      <span
                        id="holding-badge"
                        className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/60"
                      >
                        Unrecorded
                      </span>
                    ) : (
                      <span
                        id="holding-badge"
                        className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                      >
                        Donor Specified
                      </span>
                    )}
                  </div>

                  {isNotSpecified(aiSafetyCard.holding_notes || aiSafetyCard.holdingNotes) ? (
                    <div className="flex items-center justify-between pt-1">
                      <span id="holding-notes-status" className="text-slate-500 italic font-medium">
                        Standard room temp (unrecorded)
                      </span>
                      <button
                        type="button"
                        id="btn-add-holding"
                        onClick={() => handleStartManualEdit("holding")}
                        className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Holding Temp</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 pt-1">
                      <div id="holding-notes-value" className="text-slate-700 leading-relaxed font-medium flex-1">
                        <ExpandableText
                          text={aiSafetyCard.holding_notes || aiSafetyCard.holdingNotes || ""}
                          maxLines={2}
                          charLimit={90}
                        />
                      </div>
                      <button
                        type="button"
                        id="btn-edit-holding"
                        onClick={() => handleStartManualEdit("holding")}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer shrink-0"
                        title="Edit holding temperature"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {editingManualField === "holding" && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2">
                      <input
                        type="text"
                        id="input-manual-holding"
                        value={manualInputVal}
                        onChange={(e) => setManualInputVal(e.target.value)}
                        placeholder="e.g. Kept in hot chafing pans at 68°C"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveManualEdit("holding");
                          if (e.key === "Escape") setEditingManualField(null);
                        }}
                      />
                      <button
                        type="button"
                        id="btn-save-manual-holding"
                        onClick={() => handleSaveManualEdit("holding")}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingManualField(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Publish Donation Button */}
                <div className="pt-3">
                  {dishNameValidationError && (
                    <div
                      id="publish-dish-name-validation-error"
                      data-testid="publish-dish-name-validation-error"
                      className="mb-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-900 font-bold flex items-center gap-2 animate-in fade-in"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{dishNameValidationError}</span>
                    </div>
                  )}
                  {locationValidationError && (
                    <div
                      id="publish-inline-validation-error"
                      className="mb-3 p-3 bg-red-50 border-2 border-red-300 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2 animate-in fade-in"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{locationValidationError}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    id="btn-publish-donation"
                    disabled={Boolean(foodRejectionError || !aiSafetyCard)}
                    onClick={handlePublish}
                    className="w-full py-3.5 px-6 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publish Donation to Nearby NGOs</span>
                  </button>
                  <p className="text-center text-[11px] text-slate-500 mt-2">
                    Notifies registered NGOs within 5 km immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Area & Location Selection Modal */}
      {isAreaModalOpen && (
        <LocationModal
          isOpen={isAreaModalOpen}
          onClose={() => setIsAreaModalOpen(false)}
          currentConfig={{
            areaName: donorAddress,
            radiusKm: 5,
          }}
          onSave={(newConfig) => {
            updateAddress(newConfig.areaName.trim());
          }}
        />
      )}

      {/* Floating AI Assistant Action Button (Bottom-Right Corner) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end group">
        {/* Help Tooltip */}
        <div className="mb-2 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-slate-900 text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-1.5 whitespace-nowrap">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Packaging tips, food safety guidelines & donation criteria</span>
          </div>
        </div>

        <button
          type="button"
          id="btn-ask-ai-assistant"
          onClick={() => setIsAiDrawerOpen(true)}
          title="Ask AI Assistant: Packaging tips, safety guidelines, and donation criteria"
          className="flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs rounded-full shadow-xl shadow-slate-950/20 border border-slate-700/80 hover:border-emerald-500/50 hover:shadow-emerald-900/20 transition-all cursor-pointer transform hover:scale-105"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-tight">Ask AI Assistant</span>
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300" />
        </button>
      </div>

      {/* Slide-over AI Assistant Panel */}
      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </div>
  );
}
