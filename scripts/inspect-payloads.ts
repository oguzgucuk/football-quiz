async function inspectPayloads() {
  // 1. Statik CDN players-index.json
  const startStatic = Date.now();
  const resStatic = await fetch("http://localhost:5000/data/players-index.json");
  const textStatic = await resStatic.text();
  const durStatic = Date.now() - startStatic;
  const jsonStatic = JSON.parse(textStatic);

  console.log("⚡ STATIC PLAYERS INDEX (/data/players-index.json):", {
    count: jsonStatic.length,
    payloadSizeKB: (textStatic.length / 1024).toFixed(2) + " KB",
    timeMs: durStatic
  });

  // 2. Dinamik API /api/players/search
  const startApi = Date.now();
  const resApi = await fetch("http://localhost:5000/api/players/search");
  const textApi = await resApi.text();
  const durApi = Date.now() - startApi;
  const jsonApi = JSON.parse(textApi);

  console.log("🔍 DYNAMIC API (/api/players/search):", {
    count: jsonApi.total,
    payloadSizeKB: (textApi.length / 1024).toFixed(2) + " KB",
    timeMs: durApi
  });

  // 3. Takımlar /api/teams/search
  const startTeams = Date.now();
  const resTeams = await fetch("http://localhost:5000/api/teams/search");
  const textTeams = await resTeams.text();
  const durTeams = Date.now() - startTeams;
  const jsonTeams = JSON.parse(textTeams);

  console.log("🛡️ TEAMS (/api/teams/search):", {
    count: jsonTeams.total,
    payloadSizeKB: (textTeams.length / 1024).toFixed(2) + " KB",
    timeMs: durTeams
  });
}

inspectPayloads();
