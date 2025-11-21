"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type RaceCardProps = {
  title: string;
  round: number;
  circuit: string;
  city: string;
  country: string;
  when: string | null;
  isNext?: boolean;
  sessions: {
    fp1?: string | null;
    fp2?: string | null;
    fp3?: string | null;
    qualifying?: string | null;
    sprint?: string | null;
  };
};

function formatSessionTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RaceCard({
  title,
  round,
  circuit,
  city,
  country,
  when,
  isNext,
  sessions,
}: RaceCardProps) {
  const [showSessions, setShowSessions] = useState(false);
  const hasSessions = sessions.fp1 || sessions.fp2 || sessions.fp3 || sessions.qualifying || sessions.sprint;

  return (
    <Card
      className={
        isNext
          ? "relative border-primary/40 bg-gradient-to-b from-primary/10 to-transparent"
          : "relative"
      }
    >
      {isNext && (
        <div className="absolute right-3 top-3">
          <Badge className="bg-primary text-white">Next</Badge>
        </div>
      )}
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div className="font-display text-base sm:text-lg">{title}</div>
          <div className="text-xs text-muted-foreground">Round {round}</div>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{circuit}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {city}, {country}
        </div>
        <div className="mt-3 text-sm font-medium text-foreground/80">
          Race: {when ?? "TBD"}
        </div>

        {hasSessions && (
          <div className="mt-3">
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <span>Sessions</span>
              {showSessions ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showSessions && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {sessions.fp1 && (
                  <div className="flex justify-between">
                    <span className="font-medium">FP1:</span>
                    <span>{formatSessionTime(sessions.fp1)}</span>
                  </div>
                )}
                {sessions.fp2 && (
                  <div className="flex justify-between">
                    <span className="font-medium">FP2:</span>
                    <span>{formatSessionTime(sessions.fp2)}</span>
                  </div>
                )}
                {sessions.fp3 && (
                  <div className="flex justify-between">
                    <span className="font-medium">FP3:</span>
                    <span>{formatSessionTime(sessions.fp3)}</span>
                  </div>
                )}
                {sessions.sprint && (
                  <div className="flex justify-between">
                    <span className="font-medium text-orange-500">Sprint:</span>
                    <span>{formatSessionTime(sessions.sprint)}</span>
                  </div>
                )}
                {sessions.qualifying && (
                  <div className="flex justify-between">
                    <span className="font-medium">Qualifying:</span>
                    <span>{formatSessionTime(sessions.qualifying)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

