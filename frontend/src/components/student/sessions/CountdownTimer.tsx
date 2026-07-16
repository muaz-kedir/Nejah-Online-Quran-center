import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetTime: string | Date;
  className?: string;
  onExpired?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: string | Date): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
        <span className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-white/60 mt-1.5 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ targetTime, className, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = calculateTimeLeft(targetTime);
      setTimeLeft(next);
      if (next.days === 0 && next.hours === 0 && next.minutes === 0 && next.seconds === 0) {
        onExpired?.();
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTime, onExpired]);

  const isExpired =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <div className={cn("text-center", className)}>
        <p className="text-sm font-semibold text-white/80">Class is starting now</p>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      {timeLeft.days > 0 && <CountdownUnit value={timeLeft.days} label="Days" />}
      <CountdownUnit value={timeLeft.hours} label="Hrs" />
      <span className="text-xl font-bold text-white/40 mt-[-1rem]">:</span>
      <CountdownUnit value={timeLeft.minutes} label="Min" />
      <span className="text-xl font-bold text-white/40 mt-[-1rem]">:</span>
      <CountdownUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
}
