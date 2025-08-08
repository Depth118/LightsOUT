export type ErgastRace = {
  season: string;
  round: string;
  url?: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ssZ
  FirstPractice?: { date: string; time?: string };
  SecondPractice?: { date: string; time?: string };
  ThirdPractice?: { date: string; time?: string };
  Qualifying?: { date: string; time?: string };
  Sprint?: { date: string; time?: string };
};

export type ErgastScheduleResponse = {
  MRData: {
    RaceTable: {
      season: string;
      Races: ErgastRace[];
    };
  };
};

function parseErgastDate(date?: string, time?: string): Date | null {
  if (!date) return null;
  // Ergast times are typically UTC with a trailing Z; fall back to 00:00Z if missing
  const iso = `${date}T${(time ?? "00:00:00Z")
    .replace(" ", "")
    .replace(/Z?$/, "Z")}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export type NormalizedRace = {
  id: string;
  name: string;
  circuit: string;
  country: string;
  city: string;
  round: number;
  utcStart: string | null; // ISO string in UTC
};

export async function fetchCurrentSeasonSchedule(): Promise<NormalizedRace[]> {
  const res = await fetch("http://api.jolpi.ca/ergast/f1/current.json", {
    // Revalidate hourly
    next: { revalidate: 3600 },
    cache: "force-cache",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch F1 schedule: ${res.status}`);
  }
  const data = (await res.json()) as ErgastScheduleResponse;
  const races = data?.MRData?.RaceTable?.Races ?? [];
  return races.map((r) => {
    const dt = parseErgastDate(r.date, r.time ?? undefined);
    return {
      id: `${r.season}-${r.round}`,
      name: r.raceName,
      circuit: r.Circuit.circuitName,
      country: r.Circuit.Location.country,
      city: r.Circuit.Location.locality,
      round: Number(r.round),
      utcStart: dt ? dt.toISOString() : null,
    } satisfies NormalizedRace;
  });
}

export function getNextRace(
  races: NormalizedRace[],
  now = new Date()
): NormalizedRace | null {
  const upcoming = races
    .filter((r) =>
      r.utcStart ? new Date(r.utcStart).getTime() > now.getTime() : false
    )
    .sort(
      (a, b) =>
        new Date(a.utcStart!).getTime() - new Date(b.utcStart!).getTime()
    );
  return upcoming[0] ?? null;
}

