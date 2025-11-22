
async function inspect() {
    // Fetch sessions for Bahrain 2024 (Meeting 1229) to find Qualifying key
    const sessionsRes = await fetch("https://api.openf1.org/v1/sessions?meeting_key=1229&session_name=Qualifying");
    const sessions = await sessionsRes.json();
    if (sessions.length === 0) {
        console.log("No qualifying session found");
        return;
    }
    const sessionKey = sessions[0].session_key;
    console.log("Session Key:", sessionKey);

    // Fetch results for this session
    const resultsRes = await fetch(`https://api.openf1.org/v1/session_result?session_key=${sessionKey}`);
    const results = await resultsRes.json();

    // Find position 1
    const p1 = results.find((r: any) => r.position === 1);
    console.log("P1 Result:", JSON.stringify(p1, null, 2));
}

inspect();
