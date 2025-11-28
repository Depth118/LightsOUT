
async function researchJolpicaSprintSchedule() {
    const year = 2024;
    console.log(`Fetching schedule for ${year}...`);
    const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`);

    if (!res.ok) {
        console.error("Failed to fetch:", res.status, res.statusText);
        return;
    }

    const data = await res.json();
    const races = data.MRData.RaceTable.Races;

    // Find a sprint race, e.g., China (Round 5) or Austria (Round 11)
    const sprintRace = races.find((r: any) => r.Sprint);

    if (sprintRace) {
        console.log("Sprint Race Found:", sprintRace.raceName);
        console.log("Structure:", JSON.stringify(sprintRace, null, 2));
    } else {
        console.log("No sprint race found in schedule (might be looking at wrong year or field)");
    }
}

researchJolpicaSprintSchedule();
