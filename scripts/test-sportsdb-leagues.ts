const API_KEY = "3";
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

async function fetchLeagues() {
  const res = await fetch(`${BASE_URL}/all_leagues.php`);
  const data = await res.json();
  const soccerLeagues = data.leagues.filter((l: any) => l.strSport === "Soccer");
  
  // Ligleri filtrele
  const targets = ["premier", "liga", "serie", "bundesliga", "ligue", "super", "championship", "segunda"];
  
  for (const l of soccerLeagues) {
    const nameLower = l.strLeague.toLowerCase();
    if (targets.some(t => nameLower.includes(t))) {
      console.log(`ID: ${l.idLeague} | Name: ${l.strLeague}`);
    }
  }
}

fetchLeagues();
