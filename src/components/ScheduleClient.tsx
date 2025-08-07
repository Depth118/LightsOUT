"use client";

import { useMemo, useState } from "react";
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

function toDisplay(dtISO: string, useLocal: boolean) {
  const d = new Date(dtISO);
  return useLocal ? d.toLocaleString() : d.toUTCString();
}

export default function ScheduleClient({ races }: { races: NormalizedRace[] }) {
  const [query, setQuery] = useState("");
  const [useLocal, setUseLocal] = useState(false);

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

  return (
    <div className="space-y-6">
      {next && (
        <Card className="border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <div className="inline-flex w-fit items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                  Round {next.round}
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-display">
                  Next up: {next.name}
                </CardTitle>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <span className="font-medium">{next.circuit}</span>
                  <span className="px-2 text-foreground/30">•</span>
                  <span>
                    {next.city}, {next.country}
                  </span>
                </div>
              </div>
              {next.utcStart && (
                <div className="sm:pl-6 sm:ml-2 sm:border-l sm:border-primary/20 sm:text-right">
                  <div className="font-f1 uppercase tracking-wide text-primary/80 text-xs sm:text-sm">
                    Lights out in
                  </div>
                  <div className="font-display text-2xl sm:text-4xl leading-none text-primary">
                    <Countdown utcISO={next.utcStart} />
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground mt-3">
                    {toDisplay(next.utcStart, useLocal)}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
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
              />
            ))}
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Round</TableHead>
                  <TableHead>Race</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">
                    {useLocal ? "Local" : "UTC"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className={next?.id === r.id ? "bg-primary/5" : undefined}
                  >
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
