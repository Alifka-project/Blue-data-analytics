"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export function RealtimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || !time) {
    return (
      <div className="flex items-center space-x-3">
        <Badge variant="outline" className="flex items-center space-x-1 px-2 py-1">
          <Clock className="h-3 w-3" />
          <span className="font-mono text-xs">--:--:--</span>
        </Badge>
        <Badge variant="secondary" className="text-xs px-2 py-1">
          Loading...
        </Badge>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-AE", {
      timeZone: "Asia/Dubai",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-AE", {
      timeZone: "Asia/Dubai",
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="flex items-center space-x-3">
      <Badge variant="outline" className="flex items-center space-x-1 px-2 py-1">
        <Clock className="h-3 w-3" />
        <span className="font-mono text-xs">{formatTime(time)}</span>
      </Badge>
      <Badge variant="secondary" className="text-xs px-2 py-1">
        {formatDate(time)}
      </Badge>
    </div>
  );
}
