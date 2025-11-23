
async function debugF1() {
    const year = 2024; // Try 2024 first as it's more likely to have data if 2025 is future
    console.log(`Fetching for year ${year}...`);

    try {
        const meetingsRes = await fetch(`https://api.openf1.org/v1/meetings?year=${year}&limit=1`);
        const meetings = await meetingsRes.json();
        console.log("Meetings:", meetings);

        if (meetings.length > 0) {
            const meetingKey = meetings[0].meeting_key;
            console.log(`Fetching sessions for meeting ${meetingKey}...`);
            const sessionsRes = await fetch(`https://api.openf1.org/v1/sessions?meeting_key=${meetingKey}&limit=1`);
            const sessions = await sessionsRes.json();
            console.log("Sessions:", sessions);

            if (sessions.length > 0) {
                const sessionKey = sessions[0].session_key;
                console.log(`Fetching drivers for session ${sessionKey}...`);
                const driversRes = await fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}&limit=1`);
                const drivers = await driversRes.json();
                console.log("Drivers:", drivers);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

debugF1();
