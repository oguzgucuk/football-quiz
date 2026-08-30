import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const DATA_DIR = path.join(process.cwd(), "data");

interface CsvPlayerRow {
  player_id: string;
  name: string;
  current_club_name: string;
  current_club_id: string;
  last_season: string;
}

async function checkKagglePlayers() {
  const playersFile = path.join(DATA_DIR, "players.csv");
  const rawPlayers = fs.readFileSync(playersFile, "utf-8");
  const playerRows = parse(rawPlayers, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CsvPlayerRow[];

  const targets = ["Arda Turan", "Ibrahimovic", "Burak Yilmaz", "Burak Yılmaz", "Zidane"];
  for (const t of targets) {
    const matches = playerRows.filter((r) =>
      r.name && r.name.toLowerCase().includes(t.toLowerCase())
    );
    console.log(`\n🔍 ${t} in players.csv (${matches.length} matches):`);
    for (const m of matches) {
      console.log(`   ID: ${m.player_id}, Name: ${m.name}, Current Club: ${m.current_club_name} (${m.current_club_id}), Last Season: ${m.last_season}`);
    }
  }
}

checkKagglePlayers().catch(console.error);
