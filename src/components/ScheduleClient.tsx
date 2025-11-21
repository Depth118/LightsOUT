"use client";

import React, { useMemo, useState } from "react";
import type { NormalizedRace } from "@/lib/f1";
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
import { ChevronDown, ChevronUp } from "lucide-react";

function toDisplay(dtISO: string, useLocal: boolean) {
  const d = new Date(dtISO);
  return useLocal ? d.toLocaleString() : d.toUTCString();
}

function formatSessionTime(isoString: string | null | undefined, useLocal: boolean): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return useLocal ? date.toLocaleString() : date.toUTCString();
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
      { name: "FP1", time: race.sessions.fp1 },
      { name: "FP2", time: race.sessions.fp2 },
      { name: "FP3", time: race.sessions.fp3 },
      { name: "Qualifying", time: race.sessions.qualifying },
      { name: "Sprint", time: race.sessions.sprint },
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

export default function ScheduleClient({ races }: { races: NormalizedRace[] }) {
  const [query, setQuery] = useState("");
  const [useLocal, setUseLocal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showWeekendSchedule, setShowWeekendSchedule] = useState(false);

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
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
                  {toDisplay(nextSession.time, useLocal)}
                </div>
              </div>
            </div>
          </CardHeader>
          {/* Show all upcoming sessions for this race */}
          {(nextSession.race.sessions.fp1 || nextSession.race.sessions.fp2 || nextSession.race.sessions.fp3 || nextSession.race.sessions.qualifying || nextSession.race.sessions.sprint) && (
            <CardContent className={showWeekendSchedule ? "pt-0 pb-4" : "pt-0 pb-0"}>
              <div className={showWeekendSchedule ? "border-t border-primary/20 pt-3" : "border-t border-primary/20 pt-2"}>
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

                {showWeekendSchedule && (
                  <div className="text-sm text-muted-foreground space-y-2 mt-2">
                    {nextSession.race.sessions.fp1 && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">FP1:</span>
                        <div className="flex items-center gap-3">
                          {new Date(nextSession.race.sessions.fp1).getTime() > Date.now() && (
                            <span className="text-primary font-mono text-xs">
                              <Countdown utcISO={nextSession.race.sessions.fp1} />
                            </span>
                          )}
                          <span>{formatSessionTime(nextSession.race.sessions.fp1, useLocal)}</span>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.fp2 && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">FP2:</span>
                        <div className="flex items-center gap-3">
                          {new Date(nextSession.race.sessions.fp2).getTime() > Date.now() && (
                            <span className="text-primary font-mono text-xs">
                              <Countdown utcISO={nextSession.race.sessions.fp2} />
                            </span>
                          )}
                          <span>{formatSessionTime(nextSession.race.sessions.fp2, useLocal)}</span>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.fp3 && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">FP3:</span>
                        <div className="flex items-center gap-3">
                          {new Date(nextSession.race.sessions.fp3).getTime() > Date.now() && (
                            <span className="text-primary font-mono text-xs">
                              <Countdown utcISO={nextSession.race.sessions.fp3} />
                            </span>
                          )}
                          <span>{formatSessionTime(nextSession.race.sessions.fp3, useLocal)}</span>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.sprint && (
                      <div className="flex justify-between items-center">
                        <span className="text-orange-500 font-medium">Sprint:</span>
                        <div className="flex items-center gap-3">
                          {new Date(nextSession.race.sessions.sprint).getTime() > Date.now() && (
                            <span className="text-primary font-mono text-xs">
                              <Countdown utcISO={nextSession.race.sessions.sprint} />
                            </span>
                          )}
                          <span>{formatSessionTime(nextSession.race.sessions.sprint, useLocal)}</span>
                        </div>
                      </div>
                    )}
                    {nextSession.race.sessions.qualifying && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Qualifying:</span>
                        <div className="flex items-center gap-3">
                          {new Date(nextSession.race.sessions.qualifying).getTime() > Date.now() && (
                            <span className="text-primary font-mono text-xs">
                              <Countdown utcISO={nextSession.race.sessions.qualifying} />
                            </span>
                          )}
                          <span>{formatSessionTime(nextSession.race.sessions.qualifying, useLocal)}</span>
                        </div>
                      </div>
                    )}
                    {nextSession.race.utcStart && (
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Race:</span>
                        <div className="flex items-center gap-3">
                          {new Date(nextSession.race.utcStart).getTime() > Date.now() && (
                            <span className="text-primary font-mono text-xs">
                              <Countdown utcISO={nextSession.race.utcStart} />
                            </span>
                          )}
                          <span>{formatSessionTime(nextSession.race.utcStart, useLocal)}</span>
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Input
          placeholder="Search race, circuit or location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="inline-flex items-center gap-2">
          <Switch id="tz" checked={useLocal} onCheckedChange={setUseLocal} />
          <Label htmlFor="tz">Show local time</Label>
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
                title={r.name}
                round={r.round}
                circuit={r.circuit}
                city={r.city}
                country={r.country}
                when={r.utcStart ? toDisplay(r.utcStart, useLocal) : null}
                isNext={next?.id === r.id}
                sessions={r.sessions}
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
                    {useLocal ? "Local" : "UTC"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const isExpanded = expandedRows.has(r.id);
                  const hasSessions = r.sessions.fp1 || r.sessions.fp2 || r.sessions.fp3 || r.sessions.qualifying || r.sessions.sprint;

                  return (
                    <React.Fragment key={r.id}>
                      <TableRow
                        className={next?.id === r.id ? "bg-primary/5" : undefined}
                      >
                        <TableCell>
                          {hasSessions && (
                            <button
                              onClick={() => toggleRow(r.id)}
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
                          {r.utcStart ? toDisplay(r.utcStart, useLocal) : "TBD"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasSessions && (
                        <TableRow key={`${r.id}-sessions`}>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <div className="py-2 px-4 space-y-2 text-sm">
                              <div className="font-medium text-foreground/70">Sessions:</div>
                              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
                                {r.sessions.fp1 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">FP1:</span>
                                    <div className="flex items-center gap-3">
                                      {new Date(r.sessions.fp1).getTime() > Date.now() && (
                                        <span className="text-primary font-mono text-[10px]">
                                          <Countdown utcISO={r.sessions.fp1} />
                                        </span>
                                      )}
                                      <span>{formatSessionTime(r.sessions.fp1, useLocal)}</span>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.fp2 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">FP2:</span>
                                    <div className="flex items-center gap-3">
                                      {new Date(r.sessions.fp2).getTime() > Date.now() && (
                                        <span className="text-primary font-mono text-[10px]">
                                          <Countdown utcISO={r.sessions.fp2} />
                                        </span>
                                      )}
                                      <span>{formatSessionTime(r.sessions.fp2, useLocal)}</span>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.fp3 && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">FP3:</span>
                                    <div className="flex items-center gap-3">
                                      {new Date(r.sessions.fp3).getTime() > Date.now() && (
                                        <span className="text-primary font-mono text-[10px]">
                                          <Countdown utcISO={r.sessions.fp3} />
                                        </span>
                                      )}
                                      <span>{formatSessionTime(r.sessions.fp3, useLocal)}</span>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.sprint && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-orange-500">Sprint:</span>
                                    <div className="flex items-center gap-3">
                                      {new Date(r.sessions.sprint).getTime() > Date.now() && (
                                        <span className="text-primary font-mono text-[10px]">
                                          <Countdown utcISO={r.sessions.sprint} />
                                        </span>
                                      )}
                                      <span>{formatSessionTime(r.sessions.sprint, useLocal)}</span>
                                    </div>
                                  </div>
                                )}
                                {r.sessions.qualifying && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Qualifying:</span>
                                    <div className="flex items-center gap-3">
                                      {new Date(r.sessions.qualifying).getTime() > Date.now() && (
                                        <span className="text-primary font-mono text-[10px]">
                                          <Countdown utcISO={r.sessions.qualifying} />
                                        </span>
                                      )}
                                      <span>{formatSessionTime(r.sessions.qualifying, useLocal)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
