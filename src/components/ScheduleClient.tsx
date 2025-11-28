"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { NormalizedRace, DriverStanding, ConstructorStanding } from "@/lib/f1";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Countdown from "@/components/Countdown";
import { RaceCard } from "@/components/RaceCard";
import { ChevronDown, ChevronUp, Trophy, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultsModal } from "@/components/ResultsModal";
import Leaderboard from "@/components/Leaderboard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function toDisplay(dtISO: string, use24Hour: boolean) {
  const d = new Date(dtISO);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour
  });
}

function formatSessionTime(isoString: string | null | undefined, use24Hour: boolean): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour
  });
}

function formatSessionTimeCompact(isoString: string | null | undefined, use24Hour: boolean): string {
  if (!isoString) return "";
  const date = new Date(isoString);

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour
  });
}


type NextSession = {
  name: string;
  time: string;
  race: NormalizedRace;
};

function getNextSession(races: NormalizedRace[]): NextSession | null {
  const now = Date.now();
  let nextSession: NextSession | null = null;
  let nextTime = Infinity;

  for (const race of races) {
    const sessions = [
      { name: "FP1", time: race.sessions.fp1.time },
      { name: "FP2", time: race.sessions.fp2.time },
      { name: "FP3", time: race.sessions.fp3.time },
      { name: "Qualifying", time: race.sessions.qualifying.time },
      { name: "Sprint Qualifying", time: race.sessions.sprintQualifying.time },
      { name: "Sprint", time: race.sessions.sprint.time },
      { name: "Race", time: race.utcStart },
    ];

    for (const session of sessions) {
      if (session.time) {
        const sessionTime = new Date(session.time).getTime();
        if (sessionTime > now && sessionTime < nextTime) {
          nextTime = sessionTime;
          nextSession = {
            name: session.name,
            time: session.time,
            race,
          };
        }
      }
    }
  }

  return nextSession;
}

interface ScheduleClientProps {
  races: NormalizedRace[];
  driverStandings?: DriverStanding[];
  constructorStandings?: ConstructorStanding[];
  driverImages: Record<string, string>;
}

export default function ScheduleClient({
  races,
  driverStandings,
  constructorStandings,
  driverImages
}: ScheduleClientProps) {
  const [query, setQuery] = useState("");
  // Default to 12h (false) initially to match server/default, updated by effect
  const [use24Hour, setUse24Hour] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [showWeekendSchedule, setShowWeekendSchedule] = useState(false);
  const [showLatestResults, setShowLatestResults] = useState(false);
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null);
  const [selectedRace, setSelectedRace] = useState<NormalizedRace | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Load preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("use24Hour");
    if (saved !== null) {
      setUse24Hour(saved === "true");
    }
  }, []);

  // Save preference on change
  const handleTimeToggle = (checked: boolean) => {
    setUse24Hour(checked);
    localStorage.setItem("use24Hour", String(checked));
  };

  const openResults = (key: number | null, race: NormalizedRace) => {
    if (key) {
      setSelectedSessionKey(key);
      setSelectedRace(race);
      setShowLatestResults(true);
    }
  };

  console.log("ScheduleClient races prop length:", races.length);
  const vegasRace = races.find(r => r.name.includes("Las Vegas"));
  if (vegasRace) {
    console.log("Client Vegas sessions:", vegasRace.sessions);
  } else {
    console.log("Client Vegas race NOT found");
  }

  const next = useMemo(() => {
    return races
      .filter((r) =>
        r.utcStart ? new Date(r.utcStart).getTime() > Date.now() : false
      )
      .sort(
        (a, b) =>
          new Date(a.utcStart!).getTime() - new Date(b.utcStart!).getTime()
      )[0];
  }, [races]);

  const lastSession = useMemo(() => {
    const now = Date.now();
    let latest: {
      race: NormalizedRace;
      sessionName: string;
      key: number;
      time: number;
    } | null = null;

    for (const race of races) {
      const sessions = [
        { name: "Practice 1", data: race.sessions.fp1 },
        { name: "Practice 2", data: race.sessions.fp2 },
        { name: "Practice 3", data: race.sessions.fp3 },
        { name: "Sprint", data: race.sessions.sprint },
        { name: "Sprint Qualifying", data: race.sessions.sprintQualifying },
        { name: "Qualifying", data: race.sessions.qualifying },
        { name: "Race", data: race.sessions.race },
      ];

      for (const session of sessions) {
        if (session.data?.time && session.data.key) {
          const time = new Date(session.data.time).getTime();
          // Assume session is finished 2 hours after start
          const endTime = time + 2 * 60 * 60 * 1000;

          if (now > endTime) {
            if (!latest || time > latest.time) {
              latest = {
                race,
                sessionName: session.name,
                key: session.data.key,
                time,
              };
            }
          }
        }
      }
    }
    return latest;
  }, [races]);

  const nextSession = useMemo(() => getNextSession(races), [races]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = races.slice().sort((a, b) => a.round - b.round);
    if (!q) return list;
    return list.filter((r) =>
      [r.name, r.circuit, r.city, r.country].some((s) =>
        s.toLowerCase().includes(q)
      )
    );
  }, [races, query]);

  const toggleRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {nextSession && (
        <Card className="border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <div className="inline-flex w-fit items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                  Round {nextSession.race.round}
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-display">
                  Next up: {nextSession.race.name}
                </CardTitle>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium">{nextSession.race.circuit}</span>
                  <span className="px-2 text-foreground/30">•</span>
                  <span>
                    {nextSession.race.city}, {nextSession.race.country}
                  </span>
                </div>
              </div>
              <div className="sm:pl-6 sm:ml-2 sm:border-l sm:border-primary/20 sm:text-right">
                <div className="font-f1 uppercase tracking-wide text-primary/80 text-xs sm:text-sm">
                  {nextSession.name} in
                </div>
                <div className="font-display text-2xl sm:text-4xl leading-none text-primary">
                  <Countdown utcISO={nextSession.time} />
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground mt-3">
                  {toDisplay(nextSession.time, use24Hour)}
                </div>
              </div>
            </div>
          </CardHeader>
          {/* Show all upcoming sessions for this race */}
          {(nextSession.race.sessions.fp1.time || nextSession.race.sessions.fp2.time || nextSession.race.sessions.fp3.time || nextSession.race.sessions.qualifying.time || nextSession.race.sessions.sprint.time || nextSession.race.sessions.sprintQualifying.time) && (
            <CardContent className={showWeekendSchedule ? "pt-0 pb-4" : "pt-0 pb-0"}>
              <div className={showWeekendSchedule ? "border-t border-primary/20 pt-4" : "border-t border-primary/20 pt-4"}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowWeekendSchedule(!showWeekendSchedule)}
                    className="flex items-center gap-2 text-base font-semibold text-foreground/80 hover:text-foreground transition-colors"
                  >
                    <span>Weekend Schedule</span>
                    {showWeekendSchedule ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {/* View Results Button if sessions are finished */}
                  {(() => {
                    const sessions = [
                      { name: "Race", data: nextSession.race.sessions.race },
                      { name: "Qualifying", data: nextSession.race.sessions.qualifying },
                      { name: "Sprint", data: nextSession.race.sessions.sprint },
                      { name: "Sprint Qualifying", data: nextSession.race.sessions.sprintQualifying },
                      { name: "Practice 3", data: nextSession.race.sessions.fp3 },
                      { name: "Practice 2", data: nextSession.race.sessions.fp2 },
                      { name: "Practice 1", data: nextSession.race.sessions.fp1 }
                    ];
                    // Helper to check if session is finished
                    const isFinished = (isoString: string | null) => {
                      if (!isoString) return false;
                      const endTime = new Date(new Date(isoString).getTime() + 2 * 60 * 60 * 1000);
                      return new Date() > endTime;
                    };
                    const latestFinished = sessions.find(s => isFinished(s.data.time));

                    if (latestFinished && latestFinished.data.key) {
                      // Map internal session names to display names if needed
                      const displayName = latestFinished.name === "Practice 1" ? "FP1" :
                        latestFinished.name === "Practice 2" ? "FP2" :
                          latestFinished.name === "Practice 3" ? "FP3" :
                            latestFinished.name;

                      return (
                        <Button
                          onClick={() => openResults(latestFinished.data.key, nextSession.race)}
                          variant="secondary"
                          size="sm"
                          className="gap-2 h-8"
                        >
                          <Trophy className="h-3.5 w-3.5" />
                          View {displayName} Results
                        </Button>
                      );
                    } return null;
                  })()}
                </div>

                {showWeekendSchedule && (
                  <div className="space-y-2 mt-3">
                    {nextSession.race.sessions.fp1.time && (
                      <div className="group bg-muted/50 hover:bg-muted/70 rounded-lg p-2.5 transition-colors border border-border">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-foreground/90">FP1</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {new Date(nextSession.race.sessions.fp1.time).getTime() > Date.now() && (
                              <span className="text-primary font-mono text-[10px] sm:text-xs font-medium shrink-0 bg-primary/10 px-1.5 py-0.5 rounded">
                                <Countdown utcISO={nextSession.race.sessions.fp1.time} />
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(nextSession.race.sessions.fp1.time, use24Hour)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.fp2.time && (
                      <div className="group bg-muted/50 hover:bg-muted/70 rounded-lg p-2.5 transition-colors border border-border">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-foreground/90">FP2</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {new Date(nextSession.race.sessions.fp2.time).getTime() > Date.now() && (
                              <span className="text-primary font-mono text-[10px] sm:text-xs font-medium shrink-0 bg-primary/10 px-1.5 py-0.5 rounded">
                                <Countdown utcISO={nextSession.race.sessions.fp2.time} />
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(nextSession.race.sessions.fp2.time, use24Hour)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.fp3.time && (
                      <div className="group bg-muted/50 hover:bg-muted/70 rounded-lg p-2.5 transition-colors border border-border">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-foreground/90">FP3</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {new Date(nextSession.race.sessions.fp3.time).getTime() > Date.now() && (
                              <span className="text-primary font-mono text-[10px] sm:text-xs font-medium shrink-0 bg-primary/10 px-1.5 py-0.5 rounded">
                                <Countdown utcISO={nextSession.race.sessions.fp3.time} />
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(nextSession.race.sessions.fp3.time, use24Hour)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.sprintQualifying.time && (
                      <div className="group bg-orange-500/10 hover:bg-orange-500/20 rounded-lg p-2.5 transition-colors border border-orange-500/30">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-orange-500">Sprint Qualifying</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {new Date(nextSession.race.sessions.sprintQualifying.time).getTime() > Date.now() && (
                              <span className="text-orange-500 font-mono text-[10px] sm:text-xs font-medium shrink-0 bg-orange-500/10 px-1.5 py-0.5 rounded">
                                <Countdown utcISO={nextSession.race.sessions.sprintQualifying.time} />
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(nextSession.race.sessions.sprintQualifying.time, use24Hour)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.sprint.time && (
                      <div className="group bg-orange-500/10 hover:bg-orange-500/20 rounded-lg p-2.5 transition-colors border border-orange-500/30">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-orange-500">Sprint</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {new Date(nextSession.race.sessions.sprint.time).getTime() > Date.now() && (
                              <span className="text-orange-500 font-mono text-[10px] sm:text-xs font-medium shrink-0 bg-orange-500/10 px-1.5 py-0.5 rounded">
                                <Countdown utcISO={nextSession.race.sessions.sprint.time} />
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(nextSession.race.sessions.sprint.time, use24Hour)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.qualifying.time && (
                      <div className="group bg-blue-500/10 hover:bg-blue-500/20 rounded-lg p-2.5 transition-colors border border-blue-500/30">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-blue-500">Qualifying</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {new Date(nextSession.race.sessions.qualifying.time).getTime() > Date.now() && (
                              <span className="text-blue-500 font-mono text-[10px] sm:text-xs font-medium shrink-0 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                <Countdown utcISO={nextSession.race.sessions.qualifying.time} />
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(nextSession.race.sessions.qualifying.time, use24Hour)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {nextSession.race.utcStart && (
                      <div className="group bg-primary/10 hover:bg-primary/20 rounded-lg p-2.5 transition-colors border border-primary/30">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-primary">Race</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {new Date(nextSession.race.utcStart).getTime() > Date.now() && (
                              <span className="text-primary font-mono text-[10px] sm:text-xs font-medium shrink-0 bg-primary/20 px-1.5 py-0.5 rounded">
                                <Countdown utcISO={nextSession.race.utcStart} />
                              </span>
                            )}
                            <span className="text-xs text-foreground/80 font-medium">{formatSessionTimeCompact(nextSession.race.utcStart, use24Hour)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Mobile Leaderboard (Collapsible) */}
      {driverStandings && constructorStandings && (
        <div className="block lg:hidden">
          <Collapsible
            open={isLeaderboardOpen}
            onOpenChange={setIsLeaderboardOpen}
            className="w-full space-y-2"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-semibold font-display flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Championship Standings
              </h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  {isLeaderboardOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle Leaderboard</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2">
              <Leaderboard
                driverStandings={driverStandings}
                constructorStandings={constructorStandings}
                driverImages={driverImages}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Results Modal (rendered once at root level) */}
      <ResultsModal
        isOpen={showLatestResults}
        onClose={() => setShowLatestResults(false)}
        race={selectedRace || (lastSession ? lastSession.race : null)}
        initialSessionKey={selectedSessionKey || (lastSession ? lastSession.key : null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Input
          placeholder="Search race, circuit or location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="inline-flex items-center gap-2">
          <Switch id="tz" checked={use24Hour} onCheckedChange={handleTimeToggle} />
          <Label htmlFor="tz">24-hour clock</Label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Season schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:hidden">
            {filtered.map((r) => (
              <RaceCard
                key={r.id}
                race={r}
                isNext={next?.id === r.id}
              />
            ))}
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">Round</TableHead>
                  <TableHead>Race</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">
                    Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const isExpanded = expandedRowId === r.id;
                  const hasSessions = r.sessions.fp1.time || r.sessions.fp2.time || r.sessions.fp3.time || r.sessions.qualifying.time || r.sessions.sprint.time || r.sessions.sprintQualifying.time;

                  // Helper to check if session is finished
                  const isFinished = (isoString: string | null) => {
                    if (!isoString) return false;
                    const endTime = new Date(new Date(isoString).getTime() + 2 * 60 * 60 * 1000);
                    return new Date() > endTime;
                  };

                  return (
                    <React.Fragment key={r.id}>
                      <TableRow
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${next?.id === r.id ? "bg-primary/5" : ""}`}
                        onClick={() => hasSessions && toggleRow(r.id)}
                      >
                        <TableCell>
                          {hasSessions && (
                            <button
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{r.round}</TableCell>
                        <TableCell className="font-display">{r.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">{r.circuit}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.city}, {r.country}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {r.utcStart ? toDisplay(r.utcStart, use24Hour) : "TBD"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasSessions && (
                        <TableRow key={`${r.id}-sessions`}>
                          <TableCell colSpan={5} className="bg-muted/20">
                            <div className="py-3 px-4">
                              <div className="grid grid-cols-1 gap-2">
                                {r.sessions.fp1.time && (
                                  <div className="group bg-muted/50 hover:bg-muted/70 rounded-lg p-2.5 transition-all border border-border hover:border-foreground/20">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-foreground/90">FP1</span>
                                      <div className="flex items-center gap-2">
                                        {new Date(r.sessions.fp1.time).getTime() > Date.now() && (
                                          <span className="text-primary font-mono text-[10px] font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                                            <Countdown utcISO={r.sessions.fp1.time} />
                                          </span>
                                        )}
                                        <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(r.sessions.fp1.time, use24Hour)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.fp2.time && (
                                  <div className="group bg-muted/50 hover:bg-muted/70 rounded-lg p-2.5 transition-all border border-border hover:border-foreground/20">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-foreground/90">FP2</span>
                                      <div className="flex items-center gap-2">
                                        {new Date(r.sessions.fp2.time).getTime() > Date.now() && (
                                          <span className="text-primary font-mono text-[10px] font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                                            <Countdown utcISO={r.sessions.fp2.time} />
                                          </span>
                                        )}
                                        <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(r.sessions.fp2.time, use24Hour)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.fp3.time && (
                                  <div className="group bg-muted/50 hover:bg-muted/70 rounded-lg p-2.5 transition-all border border-border hover:border-foreground/20">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-foreground/90">FP3</span>
                                      <div className="flex items-center gap-2">
                                        {new Date(r.sessions.fp3.time).getTime() > Date.now() && (
                                          <span className="text-primary font-mono text-[10px] font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                                            <Countdown utcISO={r.sessions.fp3.time} />
                                          </span>
                                        )}
                                        <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(r.sessions.fp3.time, use24Hour)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.sprintQualifying.time && (
                                  <div className="group bg-orange-500/10 hover:bg-orange-500/20 rounded-lg p-2.5 transition-all border border-orange-500/30 hover:border-orange-500/50">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-orange-500">Sprint Qualifying</span>
                                      <div className="flex items-center gap-2">
                                        {new Date(r.sessions.sprintQualifying.time).getTime() > Date.now() && (
                                          <span className="text-orange-500 font-mono text-[10px] font-medium bg-orange-500/10 px-1.5 py-0.5 rounded">
                                            <Countdown utcISO={r.sessions.sprintQualifying.time} />
                                          </span>
                                        )}
                                        <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(r.sessions.sprintQualifying.time, use24Hour)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.sprint.time && (
                                  <div className="group bg-orange-500/10 hover:bg-orange-500/20 rounded-lg p-2.5 transition-all border border-orange-500/30 hover:border-orange-500/50">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-orange-500">Sprint</span>
                                      <div className="flex items-center gap-2">
                                        {new Date(r.sessions.sprint.time).getTime() > Date.now() && (
                                          <span className="text-orange-500 font-mono text-[10px] font-medium bg-orange-500/10 px-1.5 py-0.5 rounded">
                                            <Countdown utcISO={r.sessions.sprint.time} />
                                          </span>
                                        )}
                                        <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(r.sessions.sprint.time, use24Hour)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.qualifying.time && (
                                  <div className="group bg-blue-500/10 hover:bg-blue-500/20 rounded-lg p-2.5 transition-all border border-blue-500/30 hover:border-blue-500/50">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-semibold text-blue-500">Qualifying</span>
                                      <div className="flex items-center gap-2">
                                        {new Date(r.sessions.qualifying.time).getTime() > Date.now() && (
                                          <span className="text-blue-500 font-mono text-[10px] font-medium bg-blue-500/10 px-1.5 py-0.5 rounded">
                                            <Countdown utcISO={r.sessions.qualifying.time} />
                                          </span>
                                        )}
                                        <span className="text-xs text-muted-foreground font-medium">{formatSessionTimeCompact(r.sessions.qualifying.time, use24Hour)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.race.time && (
                                  <div className="group bg-primary/10 hover:bg-primary/20 rounded-lg p-2.5 transition-all border border-primary/30 hover:border-primary/50">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-bold text-primary">Race</span>
                                      <div className="flex items-center gap-2">
                                        {new Date(r.sessions.race.time).getTime() > Date.now() && (
                                          <span className="text-primary font-mono text-[10px] font-medium bg-primary/20 px-1.5 py-0.5 rounded">
                                            <Countdown utcISO={r.sessions.race.time} />
                                          </span>
                                        )}
                                        <span className="text-xs text-foreground/80 font-medium">{formatSessionTimeCompact(r.sessions.race.time, use24Hour)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Main Results Button for Desktop */}
                                {(() => {
                                  const sessions = [
                                    r.sessions.race,
                                    r.sessions.qualifying,
                                    r.sessions.sprint,
                                    r.sessions.sprintQualifying,
                                    r.sessions.fp3,
                                    r.sessions.fp2,
                                    r.sessions.fp1
                                  ];
                                  const latestFinished = sessions.find(s => isFinished(s.time));

                                  if (latestFinished && latestFinished.key) {
                                    return (
                                      <div className="pt-2 border-t border-primary/10 mt-2 flex justify-end">
                                        <Button
                                          className="gap-2"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openResults(latestFinished.key, r)}
                                        >
                                          <Trophy className="h-4 w-4" />
                                          View Results
                                        </Button>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                      }
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
