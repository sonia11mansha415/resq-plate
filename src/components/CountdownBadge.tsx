import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownBadgeProps {
  expiryTimestamp: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function CountdownBadge({
  expiryTimestamp,
  showIcon = true,
  size = "md",
}: CountdownBadgeProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() =>
    Math.max(0, expiryTimestamp - Date.now())
  );

  useEffect(() => {
    // Tick every second
    const interval = setInterval(() => {
      const diff = Math.max(0, expiryTimestamp - Date.now());
      setTimeLeftMs(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTimestamp]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isExpired = timeLeftMs <= 0;
  const isUrgent = !isExpired && timeLeftMs < 30 * 60 * 1000; // < 30 minutes
  const isModerate = !isExpired && !isUrgent && timeLeftMs < 2 * 60 * 60 * 1000; // 30m to 2h
  const isFresh = !isExpired && timeLeftMs >= 2 * 60 * 60 * 1000; // > 2 hours

  // Format display
  const pad = (n: number) => String(n).padStart(2, "0");
  const timeString = isExpired
    ? "Window Expired"
    : `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;

  // Dynamic styling based on time left
  let badgeStyles = "";
  let iconColor = "";

  if (isExpired) {
    badgeStyles = "bg-slate-100 text-slate-600 border-slate-300";
    iconColor = "text-slate-400";
  } else if (isUrgent) {
    // Red for < 30 mins
    badgeStyles =
      "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200/60 shadow-sm animate-pulse";
    iconColor = "text-rose-600";
  } else if (isModerate) {
    // Amber/Orange for 30 mins to 2 hours
    badgeStyles = "bg-amber-50 text-amber-800 border-amber-300";
    iconColor = "text-amber-600";
  } else {
    // Green for > 2 hours
    badgeStyles =
      "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs";
    iconColor = "text-emerald-600";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-bold tracking-tight",
  }[size];

  return (
    <div
      id="countdown-badge"
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${badgeStyles} ${sizeClasses}`}
      title={
        isUrgent
          ? "Critical safety window (< 30m remaining!)"
          : isFresh
          ? "Optimal safety window (> 2h remaining)"
          : "Active rescue window"
      }
    >
      {showIcon &&
        (isUrgent ? (
          <AlertTriangle className={`w-3.5 h-3.5 ${iconColor}`} />
        ) : (
          <Clock className={`w-3.5 h-3.5 ${iconColor}`} />
        ))}
      <span className="font-mono">{timeString}</span>
      {isUrgent && !isExpired && (
        <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.2 bg-rose-200 text-rose-800 rounded">
          Urgent
        </span>
      )}
      {isFresh && size !== "sm" && (
        <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.2 bg-emerald-200 text-emerald-900 rounded">
          Fresh
        </span>
      )}
    </div>
  );
}
