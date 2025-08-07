"use client";

import { useEffect, useMemo, useState } from "react";

function formatDuration(msRemaining: number): string {
  if (msRemaining <= 0) return "0h 0m 0s";
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function Countdown({ utcISO }: { utcISO: string }) {
  const target = useMemo(() => new Date(utcISO).getTime(), [utcISO]);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    // Avoid SSR/client mismatch by rendering a stable placeholder on the server
    return (
      <span suppressHydrationWarning aria-hidden>
        —
      </span>
    );
  }

  const diff = Math.max(0, target - now);
  return (
    <span suppressHydrationWarning aria-live="polite">
      {formatDuration(diff)}
    </span>
  );
}
