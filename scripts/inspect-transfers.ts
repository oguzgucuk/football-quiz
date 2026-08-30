import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const DATA_DIR = path.join(process.cwd(), "data");

interface CsvTransferRow {
  player_name: string;
  from_club_name: string;
  from_club_id: string;
  to_club_name: string;
  to_club_id: string;
  transfer_season: string;
}

async function checkKaggleTransfers() {
  const transfersFile = path.join(DATA_DIR, "transfers.csv");
  const rawTransfers = fs.readFileSync(transfersFile, "utf-8");
  const transferRows = parse(rawTransfers, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as CsvTransferRow[];

  const targetNames = ["Zlatan Ibrahimović", "Arda Turan", "Burak Yilmaz", "Burak Yılmaz", "Zinedine Zidane"];
  
  for (const target of targetNames) {
    const matches = transferRows.filter((r) => 
      r.player_name && r.player_name.toLowerCase().includes(target.toLowerCase())
    );
    console.log(`\n🔍 ${target} (${matches.length} transfer kaydı bulundu):`);
    for (const m of matches.slice(0, 8)) {
      console.log(`   Transfer: ${m.from_club_name} (${m.from_club_id}) ➔ ${m.to_club_name} (${m.to_club_id}) | Sezon: ${m.transfer_season}`);
    }
  }
}

checkKaggleTransfers().catch(console.error);
