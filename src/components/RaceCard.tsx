"use client";

import { NormalizedRace } from "@/lib/f1";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  MapPin,
  ChevronDown,
  ChevronUp,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResultsModal } from "./ResultsModal";

type RaceCardProps = {
  race: NormalizedRace;
  isNext?: boolean;
};

export function RaceCard({ race, isNext }: RaceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null);
  const [selectedSessionName, setSelectedSessionName] = useState<string>("");

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "TBA";
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "TBA";
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFinished = (isoString: string | null) => {
    if (!isoString) return false;
    // Assume session is finished 2 hours after start
    const endTime = new Date(new Date(isoString).getTime() + 2 * 60 * 60 * 1000);
    return new Date() > endTime;
  };

  const handleShowResults = (key: number | null, name: string) => {
    if (key) {
      setSelectedSessionKey(key);
      setSelectedSessionName(name);
      setResultsModalOpen(true);
    }
  };

  const sessions = [
    { name: "Practice 1", data: race.sessions.fp1 },
    { name: "Practice 2", data: race.sessions.fp2 },
    { name: "Practice 3", data: race.sessions.fp3 },
    { name: "Sprint", data: race.sessions.sprint },
    { name: "Qualifying", data: race.sessions.qualifying },
    { name: "Race", data: race.sessions.race },
  ].filter((s) => s.data?.time); // Only show scheduled sessions

  const raceFinished = isFinished(race.sessions.race.time);

  // Find the latest finished session to link the main button to
  const latestFinishedSession = [...sessions].reverse().find(s => isFinished(s.data?.time));

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300",
          isNext ? "ring-2 ring-primary/20" : "hover:border-primary/50"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={isNext ? "default" : "secondary"}>
                  Round {race.round}
                </Badge>
                {raceFinished && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Finished
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl sm:text-2xl font-display">
                {race.name}
              </CardTitle>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-medium">
                {formatDate(race.utcStart)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(race.utcStart)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {race.circuit}
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {race.city}, {race.country}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between hover:bg-muted/50"
                onClick={() => setExpanded(!expanded)}
              >
                <span className="text-sm font-medium">Session Schedule</span>
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {expanded && (
              <div className="grid gap-2 pt-2 animate-in slide-in-from-top-2 duration-200">
                {sessions.map((session) => {
                  const finished = isFinished(session.data!.time);
                  return (
                    <div
                      key={session.name}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{session.name}</span>
                      </div>
                      <div className="text-sm font-mono text-muted-foreground">
                        {formatDate(session.data!.time)} •{" "}
                        {formatTime(session.data!.time)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {latestFinishedSession && latestFinishedSession.data?.key && (
              <Button
                className="w-full mt-4 gap-2"
                variant="outline"
                onClick={() => handleShowResults(latestFinishedSession.data!.key!, latestFinishedSession.name)}
              >
                <Trophy className="h-4 w-4" />
                View Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ResultsModal
        isOpen={resultsModalOpen}
        onClose={() => setResultsModalOpen(false)}
        race={race}
        initialSessionKey={selectedSessionKey}
      />
    </>
  );
}
