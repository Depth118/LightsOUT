import { getDriverImage, getTeamColor } from "./driverImages";

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
  year: number;
  utcStart: string | null; // ISO string in UTC
  sessions: {
    fp1: SessionInfo;
    fp2: SessionInfo;
    fp3: SessionInfo;
    qualifying: SessionInfo;
    sprintQualifying: SessionInfo;
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

export async function fetchSessionResults(year: number, round: number, sessionType: string): Promise<SessionResult[]> {
  // Jolpica/Ergast does not support practice session results
  if (sessionType.startsWith("FP") || sessionType.includes("Practice")) {
    return [];
  }

  let url = `https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`;
  if (sessionType === "Quali" || sessionType === "Qualifying") {
    url = `https://api.jolpi.ca/ergast/f1/${year}/${round}/qualifying.json`;
  } else if (sessionType === "Sprint") {
    url = `https://api.jolpi.ca/ergast/f1/${year}/${round}/sprint.json`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      // If 404, it might just mean results aren't out yet, so return empty
      if (res.status === 404) return [];
      throw new Error(`Failed to fetch results: ${res.statusText}`);
    }

    const data = await res.json();
    const raceTable = data.MRData.RaceTable;
    if (!raceTable.Races || raceTable.Races.length === 0) {
      return [];
    }

    const raceData = raceTable.Races[0];
    let results: any[] = [];

    if (sessionType === "Quali" || sessionType === "Qualifying") {
      results = raceData.QualifyingResults || [];
    } else if (sessionType === "Sprint") {
      results = raceData.SprintResults || [];
    } else {
      results = raceData.Results || [];
    }

    // Fetch driver images for mapping
    // const driverImages = await fetchDriverImages();

    return results.map((r: any) => {
      const driver = r.Driver;
      const constructor = r.Constructor;
      const driverId = driver.driverId;

      // Map time/gap
      let timeStr = "";
      if (r.Time) {
        timeStr = r.Time.time;
      } else if (r.status) {
        timeStr = r.status; // e.g. "+1 Lap", "DNF"
      }

      // For Qualifying, use Q3 time, else Q2, else Q1
      if (sessionType === "Quali" || sessionType === "Qualifying") {
        timeStr = r.Q3 || r.Q2 || r.Q1 || "";
      }

      return {
        position: parseInt(r.position),
        driverNumber: parseInt(driver.permanentNumber),
        driverName: `${driver.givenName} ${driver.familyName}`,
        driverAcronym: driver.code,
        teamName: constructor.name,
        teamColour: getTeamColor(constructor.name).replace("#", ""),
        time: timeStr,
        points: parseFloat(r.points) || 0,
        headshotUrl: getDriverImage(driverId),
      };
    });

  } catch (error) {
    console.error("Error fetching Jolpica results:", error);
    throw error;
  }
}

export async function fetchCurrentSeasonSchedule(): Promise<NormalizedRace[]> {
  const year = new Date().getFullYear();

  try {
    const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch F1 schedule from Jolpica");
    }

    const data = await res.json();
    const races = data.MRData.RaceTable.Races;

    return races.map((race: any) => {
      const round = parseInt(race.round);

      // Helper to create session info
      const createSession = (sessionData: any, typeId: number): SessionInfo => {
        if (!sessionData) return { time: null, key: null };
        const time = `${sessionData.date}T${sessionData.time}`;
        // Generate a deterministic key: year * 10000 + round * 100 + typeId
        // typeId: 1=FP1, 2=FP2, 3=FP3, 4=Quali, 5=SprintQuali, 6=Sprint, 7=Race
        const key = -(year * 10000 + round * 100 + typeId);
        return { time, key };
      };

      const fp1 = createSession(race.FirstPractice, 1);
      const fp2 = createSession(race.SecondPractice, 2);
      const fp3 = createSession(race.ThirdPractice, 3);
      const qualifying = createSession(race.Qualifying, 4);
      const sprintQualifying = createSession(race.SprintQualifying, 5);
      const sprint = createSession(race.Sprint, 6);
      const raceSession = {
        time: `${race.date}T${race.time}`,
        key: -(year * 10000 + round * 100 + 7)
      };

      return {
        id: `${race.season}-${race.round}`,
        name: race.raceName,
        circuit: race.Circuit.circuitName,
        country: race.Circuit.Location.country,
        city: race.Circuit.Location.locality,
        round: round,
        year: parseInt(race.season),
        utcStart: raceSession.time,
        sessions: {
          fp1,
          fp2,
          fp3,
          qualifying,
          sprintQualifying,
          sprint,
          race: raceSession
        },
      };
    });

  } catch (error) {
    console.error("Error fetching schedule:", error);
    // Return empty array or throw depending on desired behavior. 
    // Throwing allows the error boundary/page to handle it.
    throw error;
  }
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

// --- Ergast API Types & Fetching ---

export type DriverStanding = {
  position: string;
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    permanentNumber: string;
    code: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  Constructors: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  }[];
};

export type ConstructorStanding = {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  };
};

export async function fetchDriverStandings(): Promise<DriverStanding[]> {
  try {
    const res = await fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  } catch (error) {
    console.error("Failed to fetch driver standings:", error);
    return [];
  }
}

export async function fetchConstructorStandings(): Promise<ConstructorStanding[]> {
  try {
    const res = await fetch("https://api.jolpi.ca/ergast/f1/current/constructorStandings.json", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch constructor standings");
    }

    const data = await res.json();
    return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
  } catch (error) {
    console.error("Error fetching constructor standings:", error);
    return [];
  }
}



