/**
 * KAPSAMLI KULÜP LOGOLARI ENTEGRASYON VE SUPABASE DEPOLAMA MOTORU
 * (LOGO_STORAGE_MIGRATION & AGENTS.md Standartlarına Tam Uyumlu)
 * 
 * 1. Kapsam: Sadece 6 Büyük Avrupa Ligi (tümü) + Süper Lig (tümü) + Arjantin (top 5) + Brezilya (top 5).
 * 2. Katı Filtreleme: Asla P18 (stadyum/fotoğraf) çekmez; sadece resmi P154 ve doğrulanmış amblemleri çeker.
 * 3. Görsel Optimizasyonu: sharp ile 256x256 px içine sığdırma + WebP dönüşümü (<200 KB).
 * 4. Depolama: Doğrudan Supabase Storage'a yükler (public CDN URL).
 */

import { prisma } from "../lib/db/client";
import { createClient } from "@supabase/supabase-js";
import { processLogo } from "../lib/storage/processLogo";
import { getTargetTeams } from "./get-logo-target-teams";
import sharp from "sharp";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; FutbolQuizBot/1.0; +https://github.com/oguzgucuk/football-quiz)";
const REFERER = "https://commons.wikimedia.org/";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://mwfxdrejioteevtdehns.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ HATA: SUPABASE_SERVICE_KEY veya SUPABASE_KEY .env dosyasında bulunamadı!");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || "dummy", {
  auth: { persistSession: false },
});

// Kesin doğrulanmış resmi SVG/PNG amblem kaynakları
const VERIFIED_OFFICIAL_URLS: Record<string, string> = {
  // Türkiye Süper Lig
  fenerbahce: "https://upload.wikimedia.org/wikipedia/tr/8/86/Fenerbah%C3%A7e_SK.png",
  galatasaray: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Galatasaray_Sports_Club_Logo.svg",
  besiktas: "https://upload.wikimedia.org/wikipedia/commons/0/08/BesiktasJK-Logo.svg",
  trabzonspor: "https://upload.wikimedia.org/wikipedia/tr/a/ab/Trabzonspor_Amblemi.png",
  basaksehir: "https://upload.wikimedia.org/wikipedia/tr/2/23/%C4%B0stanbul_Ba%C5%9Fak%C5%9Fehir_FK.png",
  "adana demirspor": "https://upload.wikimedia.org/wikipedia/tr/a/a2/Adana_Demirspor_Logo.png",
  "antalyaspor": "https://upload.wikimedia.org/wikipedia/tr/4/45/Antalyaspor_logo.png",
  "konyaspor": "https://upload.wikimedia.org/wikipedia/tr/1/15/Konyaspor_Logo.png",
  "kasimpasa": "https://upload.wikimedia.org/wikipedia/tr/7/7b/Kas%C4%B1mpa%C5%9Fa_SK_Logo.png",
  "sivasspor": "https://upload.wikimedia.org/wikipedia/tr/c/cb/Sivasspor_Logo.png",
  "alanyaspor": "https://upload.wikimedia.org/wikipedia/tr/7/79/Alanyaspor_Logo.png",
  "gaziantep": "https://upload.wikimedia.org/wikipedia/tr/3/30/Gaziantep_FK_logosu.png",
  "caykur rizespor": "https://upload.wikimedia.org/wikipedia/tr/d/d6/%C3%87aykur_Rizespor_logosu.png",
  "rizespor": "https://upload.wikimedia.org/wikipedia/tr/d/d6/%C3%87aykur_Rizespor_logosu.png",
  "goztepe": "https://upload.wikimedia.org/wikipedia/tr/4/4b/G%C3%B6ztepe_Spor_Kul%C3%BCb%C3%BC_Armas%C4%B1.png",
  "samsunspor": "https://upload.wikimedia.org/wikipedia/tr/8/87/Samsunspor_logosu.png",
  "eyupspor": "https://upload.wikimedia.org/wikipedia/tr/7/77/Ey%C3%BCpspor_logosu.png",
  "bodrum": "https://upload.wikimedia.org/wikipedia/tr/4/49/Bodrum_FK_logosu.png",
  "kayserispor": "https://upload.wikimedia.org/wikipedia/tr/1/14/Kayserispor_Logo.png",
  "hatayspor": "https://upload.wikimedia.org/wikipedia/tr/7/7f/Hatayspor_Logo.png",

  // İngiltere Premier League
  "chelsea fc": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  chelsea: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  "manchester united": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
  "manchester city": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  liverpool: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "liverpool fc": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  arsenal: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "arsenal fc": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "tottenham hotspur": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
  "aston villa": "https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg",
  "newcastle united": "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
  newcastle: "https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg",
  "brighton & hove albion": "https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg",
  "west ham united": "https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg",
  "everton fc": "https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg",
  everton: "https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg",
  "wolverhampton wanderers": "https://upload.wikimedia.org/wikipedia/en/f/fc/Wolverhampton_Wanderers.svg",
  "fulham fc": "https://upload.wikimedia.org/wikipedia/en/e/eb/Fulham_FC_%28shield%29.svg",
  "brentford fc": "https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg",
  "nottingham forest": "https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg",
  "crystal palace": "https://upload.wikimedia.org/wikipedia/en/a/a2/Crystal_Palace_FC_logo_%282022%29.svg",
  "afc bournemouth": "https://upload.wikimedia.org/wikipedia/en/e/e5/AFC_Bournemouth_%282013%29.svg",

  // İspanya La Liga
  "real madrid": "https://upload.wikimedia.org/wikipedia/commons/5/56/Real_Madrid_CF.svg",
  barcelona: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "fc barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "atletico madrid": "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg",
  "atletico de madrid": "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg",
  "athletic bilbao": "https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg",
  "real sociedad": "https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg",
  "valencia cf": "https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg",
  sevilla: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg",
  "sevilla fc": "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg",
  "villarreal cf": "https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg",
  "rcd espanyol": "https://upload.wikimedia.org/wikipedia/en/d/d6/Rcd_espanyol_logo.svg",
  "rc celta de vigo": "https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg",
  "deportivo alaves": "https://upload.wikimedia.org/wikipedia/en/2/2e/Deportivo_Alaves_logo.svg",
  "ca osasuna": "https://upload.wikimedia.org/wikipedia/en/d/db/Osasuna_logo.svg",
  "rayo vallecano": "https://upload.wikimedia.org/wikipedia/commons/1/17/Rayo_Vallecano_logo.svg",
  "rcd mallorca": "https://upload.wikimedia.org/wikipedia/en/e/e0/RCD_Mallorca_logo.svg",
  "girona fc": "https://upload.wikimedia.org/wikipedia/en/7/70/Girona_FC_Logo_2022.svg",
  "real betis": "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg",
  "real betis balompié": "https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg",

  // İtalya Serie A
  juventus: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg",
  "ac milan": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
  "inter milan": "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
  "as roma": "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg",
  "ss lazio": "https://upload.wikimedia.org/wikipedia/en/c/ce/S.S._Lazio_badge.svg",
  "ssc napoli": "https://upload.wikimedia.org/wikipedia/commons/b/ba/SSC_Napoli_2024_%28deep_blue_background%29.svg",
  fiorentina: "https://upload.wikimedia.org/wikipedia/commons/7/79/ACF_Fiorentina_2022.svg",
  "acf fiorentina": "https://upload.wikimedia.org/wikipedia/commons/7/79/ACF_Fiorentina_2022.svg",
  "atalanta bc": "https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg",
  "torino fc": "https://upload.wikimedia.org/wikipedia/en/2/2e/Torino_FC_Logo.svg",
  "bologna fc 1909": "https://upload.wikimedia.org/wikipedia/en/5/5b/Bologna_F.C._1909_logo.svg",
  "genoa": "https://upload.wikimedia.org/wikipedia/en/6/6c/Genoa_C.F.C._logo.svg",
  "genoa cfc": "https://upload.wikimedia.org/wikipedia/en/6/6c/Genoa_C.F.C._logo.svg",

  // Almanya Bundesliga
  "bayern munchen": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "bayern munich": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "borussia dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "bayer leverkusen": "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg",
  "rb leipzig": "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2020_Logo.svg",
  "eintracht frankfurt": "https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg",
  "vfb stuttgart": "https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg",
  "vfl wolfsburg": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo-VfL-Wolfsburg.svg",
  "sc freiburg": "https://upload.wikimedia.org/wikipedia/en/6/6d/SC_Freiburg_logo.svg",
  "sv werder bremen": "https://upload.wikimedia.org/wikipedia/commons/b/be/SV-Werder-Bremen-Logo.svg",

  // Fransa Ligue 1
  "paris saint-germain": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
  "olympique marseille": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg",
  "olympique lyon": "https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais.svg",
  "as monaco": "https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC_badge_%282021%29.svg",
  lille: "https://upload.wikimedia.org/wikipedia/en/6/6f/LOSC_Lille_logo.svg",
  "losc lille": "https://upload.wikimedia.org/wikipedia/en/6/6f/LOSC_Lille_logo.svg",
  "stade rennais fc": "https://upload.wikimedia.org/wikipedia/en/9/9e/Stade_Rennais_FC.svg",
  "ogc nice": "https://upload.wikimedia.org/wikipedia/en/2/2e/OGC_Nice_logo.svg",

  // Güney Amerika (Top 5 Arjantin & Brezilya)
  "boca juniors": "https://upload.wikimedia.org/wikipedia/commons/4/41/Boca_Juniors_logo18.svg",
  "river plate": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Escudo_del_C_A_River_Plate.svg",
  flamengo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Clube_de_Regatas_do_Flamengo_logo.svg",
  palmeiras: "https://upload.wikimedia.org/wikipedia/commons/1/10/Sociedade_Esportiva_Palmeiras_logo.svg",
  "santos fc": "https://upload.wikimedia.org/wikipedia/commons/1/15/Santos_Logo.png",
  "sao paulo fc": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_SaoPauloFC.svg",
  "corinthians": "https://upload.wikimedia.org/wikipedia/en/5/5a/Sport_Club_Corinthians_Paulista_crest.svg",
  "racing club": "https://upload.wikimedia.org/wikipedia/commons/5/56/Escudo_de_Racing_Club_%282014%29.svg",
  "san lorenzo": "https://upload.wikimedia.org/wikipedia/commons/7/77/Escudo_del_Club_Atl%C3%A9tico_San_Lorenzo_de_Almagro.svg",
  "independiente": "https://upload.wikimedia.org/wikipedia/commons/d/db/Escudo_del_Club_Atl%C3%A9tico_Independiente.svg",
};

function cleanClubName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(sk|fk|fc|cf|sc|ac|ss|as|sd|us|spor kulübü|kulübü|football club|club de fútbol|balompié|balompie)\b/gi, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Dosya adında amblem dışı (fotoğraf/stadyum vb.) kelimeleri eler
 */
function isDisallowedFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  const badWords = [
    "stadium", "stadyum", "stadion", "stade", "estadio", "arena",
    "match", "crowd", "taraftar", "tribun", "tribune",
    "squad", "lineup", "kadro", "team", "celebration", "trophy",
    "interior", "exterior", "panorama", "aerial", "building",
    "player", "footballer", "coach", "manager"
  ];
  return badWords.some(w => lower.includes(w));
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: REFERER,
      },
    });
    if (!res.ok) {
      console.error(`   ⚠️ HTTP ${res.status} for ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) {
      console.error(`   ⚠️ Too small buffer (${buf.length} bytes) for ${url}`);
      return null;
    }
    return buf;
  } catch (err) {
    console.error(`   ⚠️ Fetch exception for ${url}:`, err);
    return null;
  }
}

export async function runTargetLogoSync() {
  console.log("🛡️ [Kapsamlı Kulüp Logoları Entegrasyonu & Supabase Sync] Başlatılıyor...\n");

  const targetTeams = await getTargetTeams();
  console.log(`📋 Toplam ${targetTeams.length} hedef kulüp işlenecek.\n`);

  let downloadedCount = 0;
  let fallbackCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < targetTeams.length; i++) {
    const team = targetTeams[i];
    const cleanName = cleanClubName(team.name);

    // Eğer zaten Supabase CDN URL'ine sahipse atla
    if (team.logoUrl && team.logoUrl.includes("supabase.co")) {
      skippedCount++;
      continue;
    }

    const verifiedUrl = VERIFIED_OFFICIAL_URLS[cleanName] || VERIFIED_OFFICIAL_URLS[team.name.toLowerCase()];

    if (verifiedUrl && !isDisallowedFilename(verifiedUrl)) {
      console.log(`[${i + 1}/${targetTeams.length}] 📥 ${team.name} (${team.country}) -> Doğrulanmış Logo İndiriliyor...`);
      const rawBuf = await fetchBuffer(verifiedUrl);

      if (rawBuf) {
        try {
          const rawExt = verifiedUrl.toLowerCase().includes(".svg") ? "svg" : "png";
          const processed = await processLogo(rawBuf, rawExt);

          // Kalite Denetimi (Sharp)
          const meta = await sharp(processed.buffer).metadata();
          if (meta.format === "jpeg" || (meta.format === "png" && !meta.hasAlpha)) {
            console.warn(`   ⚠️ Kalite denetiminden geçemedi (Fotoğraf formatı): ${team.name}`);
            fallbackCount++;
            continue;
          }

          const targetFilename = `${team.id}.${processed.extension}`;

          // Supabase Storage'a Yükle
          if (SUPABASE_KEY) {
            const { error: uploadErr } = await supabase.storage
              .from("team-logos")
              .upload(targetFilename, processed.buffer, {
                contentType: processed.contentType,
                upsert: true,
              });

            if (!uploadErr) {
              const { data } = supabase.storage.from("team-logos").getPublicUrl(targetFilename);
              await prisma.team.update({
                where: { id: team.id },
                data: { logoUrl: data.publicUrl },
              });
              downloadedCount++;
              console.log(`   ✅ Supabase CDN'e Kaydedildi: ${data.publicUrl} (${(processed.buffer.length / 1024).toFixed(1)} KB)`);
              continue;
            } else {
              console.error(`   ❌ Supabase Yükleme Hatası (${team.name}):`, uploadErr);
            }
          }
        } catch (e: any) {
          console.error(`   ❌ İşleme hatası (${team.name}):`, e.message);
        }
      }
    }

    // Bulunamayan kulüpler güvenle Monogram Rozete bırakılır
    fallbackCount++;
  }

  console.log("\n==========================================");
  console.log("🎉 [TAMAMLANDI] Hedef Kulüp Logoları Raporu:");
  console.log(`   - Yeni İndirilen & Yüklenen Logo: ${downloadedCount}`);
  console.log(`   - Önceden Var Olan Supabase Logoları: ${skippedCount}`);
  console.log(`   - Logo Olmayan / Monogram Rozet Fallback: ${fallbackCount}`);
  console.log("==========================================\n");
}

if (require.main === module) {
  runTargetLogoSync()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
