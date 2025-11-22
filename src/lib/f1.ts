export type OpenF1Meeting = {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_key: number;
  country_code: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string; // ISO string
  gmt_offset: string;
  year: number;
};

export type OpenF1Session = {
  session_key: number;
  meeting_key: number;
  session_type: string;
  session_name: string;
  date_start: string; // ISO string
  date_end: string; // ISO string
  gmt_offset: string;
  year: number;
  location: string;
};

export type OpenF1Result = {
  position: number;
  driver_number: number;
  team_name: string;
  full_name: string;
  abbreviation: string;
  grid_position: number;
  time: string; // interval or gap
  status: string;
  points: number;
  duration?: number | number[];
};

export type OpenF1Driver = {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  headshot_url: string;
  country_code: string;
  team_colour: string;
};

export type SessionResult = {
  position: number;
  driverNumber: number;
  driverName: string;
  driverAcronym: string;
  teamName: string;
  teamColour: string;
  time: string;
  points: number;
  headshotUrl: string | null;
};

export type SessionInfo = {
  time: string | null; // ISO string
  key: number | null;
};

export type NormalizedRace = {
  id: string;
  name: string;
  circuit: string;
  country: string;
  city: string;
  round: number;
  utcStart: string | null; // ISO string in UTC
  sessions: {
    fp1: SessionInfo;
    fp2: SessionInfo;
    fp3: SessionInfo;
    qualifying: SessionInfo;
    sprint: SessionInfo;
    race: SessionInfo;
  };
};

// Helper to truncate decimals to 3 places
function formatTimeValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const strVal = String(val);
  // Check if it looks like a time with decimals (e.g. "1:23.456789" or "83.456789")
  // We want to keep everything up to the 3rd decimal place
  const dotIndex = strVal.indexOf('.');
  if (dotIndex !== -1) {
    return strVal.substring(0, dotIndex + 4);
  }
  return strVal;
}

export async function fetchSessionResults(sessionKey: number, sessionType?: string): Promise<SessionResult[]> {
  // If it's a dummy key (negative), return empty results immediately
  if (sessionKey < 0) return [];

  const [resultsRes, driversRes] = await Promise.all([
    fetch(`https://api.openf1.org/v1/session_result?session_key=${sessionKey}`),
    fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`)
  ]);

  if (!resultsRes.ok || !driversRes.ok) return [];

  const results = (await resultsRes.json()) as any[];
  const drivers = (await driversRes.json()) as OpenF1Driver[];

  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

  return results
    .sort((a, b) => (a.position || 999) - (b.position || 999))
    .map(r => {
      const driver = driverMap.get(r.driver_number);

      // Format time/gap
      let timeStr = "";
      if (r.position === 1) {
        if (sessionType === "Race") {
          timeStr = "N/A";
        } else {
          // Format duration to mm:ss.ms if possible, but OpenF1 gives seconds
          // If duration is available
          if (r.time) {
            timeStr = formatTimeValue(r.time);
          } else if (r.duration) {
            // Handle duration which can be number or array of numbers
            const durationVal = Array.isArray(r.duration)
              ? r.duration[r.duration.length - 1]
              : r.duration;

            const minutes = Math.floor(durationVal / 60);
            const seconds = (durationVal % 60).toFixed(3);
            timeStr = `${minutes}:${seconds.padStart(6, '0')}`;
          } else {
            timeStr = "Finished";
          }
        }
      } else {
        const gap = r.gap_to_leader ? `+${formatTimeValue(r.gap_to_leader)}` : r.status || "";
        timeStr = gap;
        if (r.dnf) timeStr = "DNF";
        if (r.dns) timeStr = "DNS";
        if (r.dsq) timeStr = "DSQ";
      }

      // Manual overrides for missing headshots
      let headshotUrl = driver?.headshot_url ?? null;
      if (r.driver_number === 43 && !headshotUrl) {
        // Franco Colapinto fallback
        headshotUrl = "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/2col/image.png";
      }

      return {
        position: r.position,
        driverNumber: r.driver_number,
        driverName: driver?.full_name ?? r.full_name ?? "Unknown", // Fallback to result name if driver missing
        driverAcronym: driver?.name_acronym ?? r.abbreviation ?? "UNK",
        teamName: driver?.team_name ?? r.team_name ?? "Unknown",
        teamColour: driver?.team_colour ?? "000000",
        time: timeStr,
        points: Number(r.points) || 0, // Ensure points is a number
        headshotUrl,
      };
    });
}

export async function fetchCurrentSeasonSchedule(): Promise<NormalizedRace[]> {
  const year = new Date().getFullYear();

  // Fetch meetings and sessions in parallel
  const [meetingsRes, sessionsRes] = await Promise.all([
    fetch(`https://api.openf1.org/v1/meetings?year=${year}`, {
      next: { revalidate: 3600 },
    }),
    fetch(`https://api.openf1.org/v1/sessions?year=${year}`, {
      next: { revalidate: 3600 },
    }),
  ]);

  if (!meetingsRes.ok || !sessionsRes.ok) {
    throw new Error("Failed to fetch F1 data from OpenF1");
  }

  const meetings = (await meetingsRes.json()) as OpenF1Meeting[];
  const sessions = (await sessionsRes.json()) as OpenF1Session[];

  // Filter out testing sessions if necessary, though OpenF1 usually labels them clearly.
  // We'll assume all meetings returned are relevant, but we might want to sort them by date.
  const sortedMeetings = meetings.sort(
    (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
  );

  // Group sessions by meeting_key
  const sessionsByMeeting = new Map<number, OpenF1Session[]>();
  for (const session of sessions) {
    const key = session.meeting_key;
    if (!sessionsByMeeting.has(key)) {
      sessionsByMeeting.set(key, []);
    }
    sessionsByMeeting.get(key)!.push(session);
  }

  const normalized = sortedMeetings.map((meeting, index) => {
    const meetingSessions = sessionsByMeeting.get(meeting.meeting_key) ?? [];

    // Find specific sessions
    const findSession = (namePattern: RegExp): SessionInfo => {
      const s = meetingSessions.find(s => namePattern.test(s.session_name));
      // If session exists but has no key (future session), generate a deterministic dummy key
      // using meeting_key and a hash of the pattern to ensure buttons appear
      let key = s?.session_key ?? null;
      if (!key && s) {
        // Simple deterministic dummy key: meeting_key * 100 + index based on type
        // This is just to ensure the UI renders the button
        key = -(meeting.meeting_key * 100 + (namePattern.source.length));
      }

      return {
        time: s?.date_start ?? null,
        key
      };
    };

    let fp1 = findSession(/Practice 1/i);
    let fp2 = findSession(/Practice 2/i);
    let fp3 = findSession(/Practice 3/i);
    // Ensure Qualifying does not match "Sprint Qualifying"
    let qualifying = findSession(/^(?!.*Sprint).*Qualifying/i);
    // Ensure Sprint does not match "Sprint Qualifying" (matches "Sprint" or "Sprint Race")
    let sprint = findSession(/^Sprint(?!.*Qualifying)/i);

    // The main race start time usually corresponds to the "Race" session
    let raceSession = findSession(/^Race$/i);

    // Patch for Las Vegas 2025 if sessions are missing or incomplete
    // Check by name OR key to be robust
    if ((meeting.meeting_key === 1274 || meeting.meeting_name.includes("Las Vegas")) && meeting.year === 2025) {
      // Use dummy keys (negative) to allow UI to render buttons, even if API returns no data
      if (!raceSession.time) raceSession = { time: "2025-11-23T06:00:00Z", key: -1 };
      if (!fp1.time) fp1 = { time: "2025-11-21T02:30:00Z", key: -2 };
      if (!fp2.time) fp2 = { time: "2025-11-21T06:00:00Z", key: -3 };
      if (!fp3.time) fp3 = { time: "2025-11-22T02:30:00Z", key: -4 };
      if (!qualifying.time) qualifying = { time: "2025-11-22T06:00:00Z", key: -5 };
    }

    // Fallback to meeting start date if race session not found (though it should be there for valid races)
    const utcStart = raceSession.time ?? meeting.date_start;

    return {
      id: `${meeting.year}-${meeting.meeting_key}`,
      name: meeting.meeting_name,
      circuit: meeting.circuit_short_name,
      country: meeting.country_name,
      city: meeting.location,
      round: index + 1, // Infer round from sorted order
      utcStart,
      sessions: {
        fp1,
        fp2,
        fp3,
        qualifying,
        sprint,
        race: raceSession
      },
    };
  });

  // Append missing races for 2025 (Qatar and Abu Dhabi) if they are not in the list
  if (year === 2025) {
    const hasQatar = normalized.some(r => r.country === "Qatar");
    const hasAbuDhabi = normalized.some(r => r.country === "UAE" || r.city === "Yas Island");

    if (!hasQatar) {
      normalized.push({
        id: "2025-qatar",
        name: "Qatar Grand Prix",
        circuit: "Lusail",
        country: "Qatar",
        city: "Lusail",
        round: normalized.length + 1,
        utcStart: "2025-11-30T16:00:00Z",
        sessions: {
          fp1: { time: "2025-11-28T13:30:00Z", key: null }, // Est
          qualifying: { time: "2025-11-28T17:00:00Z", key: null }, // Sprint Quali
          sprint: { time: "2025-11-29T14:00:00Z", key: null },
          fp2: { time: null, key: null }, // Sprint weekend
          fp3: { time: null, key: null },
          race: { time: "2025-11-30T16:00:00Z", key: null }
        }
      });
    }

    if (!hasAbuDhabi) {
      normalized.push({
        id: "2025-abudhabi",
        name: "Abu Dhabi Grand Prix",
        circuit: "Yas Marina",
        country: "UAE",
        city: "Yas Island",
        round: normalized.length + 1,
        utcStart: "2025-12-07T13:00:00Z",
        sessions: {
          fp1: { time: "2025-12-05T09:30:00Z", key: null }, // Est
          fp2: { time: "2025-12-05T13:00:00Z", key: null }, // Est
          fp3: { time: "2025-12-06T10:30:00Z", key: null }, // Est
          qualifying: { time: "2025-12-06T14:00:00Z", key: null }, // Est
          sprint: { time: null, key: null },
          race: { time: "2025-12-07T13:00:00Z", key: null }
        }
      });
    }
  }

  return normalized;
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
