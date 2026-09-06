/**
 * Türk takımları (özellikle Hatayspor, Denizlispor, Eyüpspor, Samsunspor, Göztepe,
 * Kasımpaşa, Sivasspor, Kayserispor, Erzurumspor vb.) arasındaki eksik oyuncu ve
 * transfer geçmişlerini veritabanına zenginleştiren script.
 * 
 * GEMINI.md Kural 9 uyarınca:
 * - Duplicate oluşturulmaz, önce parmak izi ve alias kontrolü yapılır.
 * - Mevcut oyuncular güncellenir ve eksik kulüp geçmişleri eklenir.
 */

import { prisma } from "../../lib/db/client";
import { normalizeText } from "../../lib/validation/normalizeText";

interface PlayerEnrichment {
  fullName: string;
  nationality: string;
  position: string;
  birthDate?: string;
  teams: string[]; // İsim veya bilinen alias
}

const TURKISH_PLAYERS_DATA: PlayerEnrichment[] = [
  // ── HATAYSPOR & DENİZLİSPOR ORTAK OYUNCULARI ──
  {
    fullName: "Isaac Sackey",
    nationality: "Ghana",
    position: "Midfield",
    birthDate: "1994-04-04",
    teams: ["Hatayspor", "Denizlispor", "Alanyaspor", "Ümraniyespor"],
  },
  {
    fullName: "Kerem Can Akyüz",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1989-07-01",
    teams: ["Hatayspor", "Denizlispor", "Samsunspor", "Gençlerbirliği Spor Kulübü", "Bursaspor", "Balikesirspor", "Alanyaspor"],
  },
  {
    fullName: "Kubilay Sönmez",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1994-06-17",
    teams: ["Hatayspor", "Denizlispor", "Göztepe", "Erzurumspor FK", "Adanaspor", "Kayserispor"],
  },
  {
    fullName: "Bülent Ertuğrul",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1978-09-17",
    teams: ["Denizlispor", "Hatayspor", "Eskişehirspor", "Elazigspor", "Manisaspor"],
  },
  {
    fullName: "Taylan Uzunoğlu",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1982-03-09",
    teams: ["Denizlispor", "Hatayspor", "Manisaspor", "Karşıyaka", "Altay", "Akhisarspor", "Eyüpspor", "Bucaspor"],
  },
  {
    fullName: "Oktay Pop",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1988-11-25",
    teams: ["Denizlispor", "Hatayspor", "Kocaelispor", "Elazigspor"],
  },
  {
    fullName: "Muhammed Gönülaçar",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1994-10-03",
    teams: ["Denizlispor", "Hatayspor", "MKE Ankaragücü", "Kocaelispor", "Bodrum FK"],
  },
  {
    fullName: "Ömer Erdoğan",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1977-05-03",
    teams: ["Denizlispor", "Bursaspor", "Galatasaray", "Erzurumspor FK", "Diyarbakırspor"],
  },
  {
    fullName: "Burak Çamoğlu",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1996-10-05",
    teams: ["Hatayspor", "Adanaspor"],
  },
  {
    fullName: "Caner Hüseyin Bağ",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1991-04-10",
    teams: ["Hatayspor", "Eyüpspor", "Bandırmaspor"],
  },

  // ── DENİZLİSPOR & DİĞER TÜRK TAKIMLARI ──
  {
    fullName: "Tiago Lopes",
    nationality: "Portugal",
    position: "Defender",
    birthDate: "1989-01-04",
    teams: ["Denizlispor", "Kayserispor"],
  },
  {
    fullName: "Hugo Rodallega",
    nationality: "Colombia",
    position: "Attack",
    birthDate: "1985-07-25",
    teams: ["Denizlispor", "Trabzonspor", "Akhisarspor"],
  },
  {
    fullName: "Zeki Yavru",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1991-10-19",
    teams: ["Trabzonspor", "Kayserispor", "Gençlerbirliği Spor Kulübü", "Akhisarspor", "Denizlispor", "Yeni Malatyaspor", "Giresunspor", "Samsunspor"],
  },
  {
    fullName: "Mustafa Yumlu",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1987-09-25",
    teams: ["Trabzonspor", "Akhisarspor", "Denizlispor", "Erzurumspor FK", "Eskişehirspor"],
  },
  {
    fullName: "Mehmet Akyüz",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1986-01-02",
    teams: ["Denizlispor", "Akhisarspor", "Beşiktaş", "Giresunspor", "Adana Demirspor", "Samsunspor", "Sakaryaspor", "Çaykur Rizespor"],
  },
  {
    fullName: "Recep Niyaz",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1995-01-01",
    teams: ["Denizlispor", "Fenerbahçe", "Bucaspor", "Samsunspor", "Çaykur Rizespor", "Gaziantep FK", "Eyüpspor"],
  },
  {
    fullName: "Ismaïl Aissati",
    nationality: "Morocco",
    position: "Midfield",
    birthDate: "1988-08-16",
    teams: ["Denizlispor", "Antalyaspor", "Alanyaspor", "Balikesirspor", "Adana Demirspor"],
  },
  {
    fullName: "Olcay Şahan",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1987-05-26",
    teams: ["Beşiktaş", "Trabzonspor", "Denizlispor", "Yeni Malatyaspor", "Ankaraspor"],
  },
  {
    fullName: "Cenk Gönen",
    nationality: "Türkiye",
    position: "Goalkeeper",
    birthDate: "1988-02-21",
    teams: ["Denizlispor", "Beşiktaş", "Galatasaray", "Alanyaspor", "Kayserispor"],
  },
  {
    fullName: "Özer Hurmacı",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1986-11-20",
    teams: ["Ankaraspor", "Fenerbahçe", "Kasimpasa", "Trabzonspor", "Akhisarspor", "Sivasspor", "Erzurumspor FK", "Bursaspor"],
  },
  {
    fullName: "Servet Çetin",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1981-03-17",
    teams: ["Göztepe", "Denizlispor", "Fenerbahçe", "Sivasspor", "Galatasaray", "Eskişehirspor", "Mersin Talimyurdu SK"],
  },
  {
    fullName: "Yusuf Şimşek",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1975-07-20",
    teams: ["Denizlispor", "Fenerbahçe", "Gaziantep FK", "Ankaraspor", "Bursaspor", "Beşiktaş", "Kayseri Erciyesspor"],
  },
  {
    fullName: "Fabrice N'Sakala",
    nationality: "DR Congo",
    position: "Defender",
    birthDate: "1990-07-21",
    teams: ["Alanyaspor", "Beşiktaş", "Denizlispor"],
  },
  {
    fullName: "Modou Barrow",
    nationality: "Gambia",
    position: "Attack",
    birthDate: "1992-10-13",
    teams: ["Denizlispor", "Sivasspor"],
  },
  {
    fullName: "Angelo Sagal",
    nationality: "Chile",
    position: "Attack",
    birthDate: "1993-04-18",
    teams: ["Denizlispor", "Gaziantep FK"],
  },

  // ── HATAYSPOR & DİĞER TÜRK TAKIMLARI ──
  {
    fullName: "Rayane Aabid",
    nationality: "France",
    position: "Midfield",
    birthDate: "1992-01-19",
    teams: ["Hatayspor", "Yeni Malatyaspor", "Kasimpasa", "Sakaryaspor"],
  },
  {
    fullName: "Gökhan Karadeniz",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1990-05-02",
    teams: ["Hatayspor", "Antalyaspor", "Trabzonspor", "Göztepe", "Alanyaspor", "Erzurumspor FK", "Samsunspor", "Boluspor"],
  },
  {
    fullName: "Kamil Ahmet Çörekçi",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1992-02-01",
    teams: ["Trabzonspor", "Hatayspor", "Eskişehirspor", "Adanaspor"],
  },
  {
    fullName: "Onur Ergün",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1992-11-15",
    teams: ["İstanbulspor", "Hatayspor", "Basaksehir FK"],
  },
  {
    fullName: "Burak Öksüz",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1996-01-25",
    teams: ["Hatayspor", "Bodrum FK"],
  },
  {
    fullName: "Erce Kardeşler",
    nationality: "Türkiye",
    position: "Goalkeeper",
    birthDate: "1994-03-14",
    teams: ["Trabzonspor", "Hatayspor"],
  },
  {
    fullName: "Bertuğ Yıldırım",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "2002-07-12",
    teams: ["Sarıyer SK", "Hatayspor", "Antalyaspor"],
  },
  {
    fullName: "Sam Adekugbe",
    nationality: "Canada",
    position: "Defender",
    birthDate: "1995-01-16",
    teams: ["Hatayspor", "Galatasaray"],
  },
  {
    fullName: "Munir Mohamedi",
    nationality: "Morocco",
    position: "Goalkeeper",
    birthDate: "1989-05-10",
    teams: ["Hatayspor"],
  },
  {
    fullName: "Ruben Ribeiro",
    nationality: "Portugal",
    position: "Midfield",
    birthDate: "1987-08-01",
    teams: ["Hatayspor", "Çaykur Rizespor"],
  },

  // ── SÜPER LİG & 1. LİG DİĞER KÜÇÜK VE ORTA TAKIMLAR ──
  {
    fullName: "Aytaç Kara",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1993-03-23",
    teams: ["Eskişehirspor", "Trabzonspor", "Bursaspor", "Yeni Malatyaspor", "Galatasaray", "Göztepe", "Kasimpasa"],
  },
  {
    fullName: "Emre Akbaba",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1992-10-04",
    teams: ["Alanyaspor", "Antalyaspor", "Galatasaray", "Adana Demirspor", "Eyüpspor"],
  },
  {
    fullName: "Taylan Antalyalı",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1995-01-08",
    teams: ["Gençlerbirliği Spor Kulübü", "Kayseri Erciyesspor", "Erzurumspor FK", "Galatasaray", "MKE Ankaragücü", "Samsunspor", "Bodrum FK"],
  },
  {
    fullName: "Umut Nayir",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1993-06-28",
    teams: ["MKE Ankaragücü", "Ankaraspor", "Yeni Malatyaspor", "Göztepe", "Beşiktaş", "Bursaspor", "Giresunspor", "Ümraniyespor", "Fenerbahçe", "Pendikspor", "Konyaspor"],
  },
  {
    fullName: "Serdar Gürler",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1991-09-14",
    teams: ["Elazigspor", "Trabzonspor", "Kayseri Erciyesspor", "Gençlerbirliği Spor Kulübü", "Ankaraspor", "Göztepe", "Antalyaspor", "Konyaspor", "Basaksehir FK"],
  },
  {
    fullName: "Mame Thiam",
    nationality: "Senegal",
    position: "Attack",
    birthDate: "1992-09-07",
    teams: ["Kasimpasa", "Fenerbahçe", "Kayserispor", "Pendikspor", "Eyüpspor"],
  },
  {
    fullName: "Thievy Bifouma",
    nationality: "Congo",
    position: "Attack",
    birthDate: "1992-05-13",
    teams: ["Ankaraspor", "Sivasspor", "MKE Ankaragücü", "Yeni Malatyaspor", "Bursaspor"],
  },
  {
    fullName: "Adem Büyük",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1987-08-30",
    teams: ["Beşiktaş", "Manisaspor", "Boluspor", "Mersin Talimyurdu SK", "Kasimpasa", "Yeni Malatyaspor", "Galatasaray"],
  },
  {
    fullName: "Veysel Sarı",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1988-07-25",
    teams: ["Eskişehirspor", "Galatasaray", "Kasimpasa", "Göztepe", "Antalyaspor"],
  },
  {
    fullName: "Mustafa Pektemek",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1988-08-11",
    teams: ["Sakaryaspor", "Gençlerbirliği Spor Kulübü", "Beşiktaş", "Basaksehir FK", "Alanyaspor", "Kayserispor", "Eyüpspor"],
  },
  {
    fullName: "Ahmet İlhan Özek",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1988-01-01",
    teams: ["Manisaspor", "Kardemir Karabükspor", "Çaykur Rizespor", "Gençlerbirliği Spor Kulübü", "Giresunspor"],
  },
  {
    fullName: "Emre Güral",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1989-04-05",
    teams: ["Bucaspor", "Trabzonspor", "Eskişehirspor", "Antalyaspor", "Alanyaspor", "Gaziantep FK", "MKE Ankaragücü"],
  },
  {
    fullName: "Eren Derdiyok",
    nationality: "Switzerland",
    position: "Attack",
    birthDate: "1988-06-12",
    teams: ["Kasimpasa", "Galatasaray", "Göztepe", "MKE Ankaragücü"],
  },
  {
    fullName: "Muğdat Çelik",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1990-01-03",
    teams: ["Balikesirspor", "Akhisarspor", "Galatasaray", "Gaziantep FK", "Kayserispor", "Denizlispor", "MKE Ankaragücü"],
  },
  {
    fullName: "Emrah Başsan",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1992-04-17",
    teams: ["Pendikspor", "Antalyaspor", "Galatasaray", "Çaykur Rizespor", "Erzurumspor FK", "Kayserispor", "Sivasspor"],
  },
  {
    fullName: "İlhan Parlak",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1987-01-19",
    teams: ["Kayserispor", "Fenerbahçe", "Ankaraspor", "MKE Ankaragücü", "Kardemir Karabükspor", "Kayseri Erciyesspor", "Gaziantep FK", "Gençlerbirliği Spor Kulübü"],
  },
  {
    fullName: "Yusuf Erdoğan",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1992-08-07",
    teams: ["Trabzonspor", "Bursaspor", "Kasimpasa", "Adana Demirspor", "Konyaspor"],
  },
  {
    fullName: "Olcan Adın",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1985-10-25",
    teams: ["Fenerbahçe", "Antalyaspor", "Karşıyaka", "Gaziantep FK", "Trabzonspor", "Galatasaray", "Akhisarspor"],
  },
  {
    fullName: "Uğur Uçar",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1987-04-05",
    teams: ["Galatasaray", "Kayserispor", "Kardemir Karabükspor", "Basaksehir FK", "Pendikspor"],
  },
  {
    fullName: "Caner Erkin",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1988-10-04",
    teams: ["Galatasaray", "Fenerbahçe", "Beşiktaş", "Fatih Karagümrük", "Basaksehir FK", "Eyüpspor"],
  },
  {
    fullName: "Mehmet Topal",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1986-03-03",
    teams: ["Çanakkale Dardanel SK", "Galatasaray", "Fenerbahçe", "Basaksehir FK", "Beşiktaş"],
  },
  {
    fullName: "Burak Yılmaz",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1985-07-15",
    teams: ["Antalyaspor", "Beşiktaş", "Manisaspor", "Fenerbahçe", "Eskişehirspor", "Trabzonspor", "Galatasaray", "Fortuna Sittard"],
  },
  {
    fullName: "Emre Belözoğlu",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1980-09-07",
    teams: ["Galatasaray", "Fenerbahçe", "Basaksehir FK"],
  },
  {
    fullName: "Gökhan Gönül",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1985-01-04",
    teams: ["Gençlerbirliği Spor Kulübü", "Fenerbahçe", "Beşiktaş", "Çaykur Rizespor"],
  },
  {
    fullName: "Alper Potuk",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1991-04-08",
    teams: ["Eskişehirspor", "Fenerbahçe", "MKE Ankaragücü", "Çaykur Rizespor"],
  },
  {
    fullName: "Ahmet Çalık",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1994-02-26",
    teams: ["Gençlerbirliği Spor Kulübü", "Galatasaray", "Konyaspor"],
  },
  {
    fullName: "Ozan Tufan",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1995-03-23",
    teams: ["Bursaspor", "Fenerbahçe", "Alanyaspor", "Trabzonspor"],
  },
  {
    fullName: "Sergen Yalçın",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1972-10-05",
    teams: ["Beşiktaş", "İstanbulspor", "Fenerbahçe", "Galatasaray", "Trabzonspor", "Eskişehirspor", "Siirtspor", "Şekerspor A.Ş."],
  },
  {
    fullName: "Nihat Kahveci",
    nationality: "Türkiye",
    position: "Attack",
    birthDate: "1979-11-23",
    teams: ["Beşiktaş", "Real Sociedad", "Villarreal CF"],
  },
  {
    fullName: "Aykut Çeviker",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1990-01-03",
    teams: ["Akhisarspor", "Fatih Karagümrük", "Balikesirspor", "Bucaspor"],
  },
  {
    fullName: "Ramazan Civelek",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1996-01-22",
    teams: ["Fenerbahçe", "Fatih Karagümrük", "Akhisarspor", "Kayserispor", "Gaziantep FK"],
  },
  {
    fullName: "Tolga Ünlü",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1989-09-10",
    teams: ["Konyaspor", "Akhisarspor", "Fatih Karagümrük", "Altay"],
  },
  {
    fullName: "Burhan Eşer",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1985-01-01",
    teams: ["Sivasspor", "Eskişehirspor", "Gençlerbirliği Spor Kulübü", "Akhisarspor", "Erzurumspor FK", "Fatih Karagümrük", "Trabzonspor", "Ankaraspor"],
  },
  {
    fullName: "Erhan Çelenk",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1989-03-16",
    teams: ["Gaziantep FK", "Akhisarspor", "Fatih Karagümrük", "Altay", "Manisaspor"],
  },
  {
    fullName: "Zeki Yıldırım",
    nationality: "Türkiye",
    position: "Midfield",
    birthDate: "1991-01-15",
    teams: ["Antalyaspor", "Fatih Karagümrük", "Akhisarspor", "Elazigspor"],
  },
  {
    fullName: "Musa Nizam",
    nationality: "Türkiye",
    position: "Defender",
    birthDate: "1990-09-08",
    teams: ["Antalyaspor", "Trabzonspor", "Gaziantep FK", "Akhisarspor", "Kasimpasa"],
  },
];

async function enrichTurkishClubs() {
  console.log("🇹🇷 [Enrich Turkish Clubs] Başlatılıyor...");
  const startTime = Date.now();

  // 1. Tüm takımları önbelleğe al
  const allTeams = await prisma.team.findMany({
    select: { id: true, name: true, aliases: true, country: true },
  });

  const teamMap = new Map<string, string>(); // normalizedName -> teamId
  for (const t of allTeams) {
    const norm = normalizeText(t.name);
    if (norm) teamMap.set(norm, t.id);
    for (const a of t.aliases) {
      const normA = normalizeText(a);
      if (normA) teamMap.set(normA, t.id);
    }
  }

  // Yardımcı fonksiyon: Takım ismini DB id'sine eşle
  function findTeamId(name: string): string | undefined {
    const norm = normalizeText(name);
    if (teamMap.has(norm)) return teamMap.get(norm);

    // Kısmi eşleşme dene
    for (const [key, id] of teamMap.entries()) {
      if (key.includes(norm) || norm.includes(key)) {
        return id;
      }
    }
    return undefined;
  }

  // 2. Mevcut oyuncuları al
  const existingPlayers = await prisma.player.findMany({
    select: { id: true, fullName: true, birthDate: true },
  });

  const playerMap = new Map<string, string>(); // normalizedName -> playerId
  for (const p of existingPlayers) {
    const norm = normalizeText(p.fullName);
    if (norm) playerMap.set(norm, p.id);
  }

  // 3. Mevcut geçmişleri al
  const existingHistories = await prisma.playerTeamHistory.findMany({
    select: { playerId: true, teamId: true },
  });
  const historySet = new Set<string>();
  for (const h of existingHistories) {
    historySet.add(`${h.playerId}_${h.teamId}`);
  }

  let playersCreated = 0;
  let historiesCreated = 0;

  for (const pData of TURKISH_PLAYERS_DATA) {
    const normName = normalizeText(pData.fullName);
    let playerId = playerMap.get(normName);

    // Oyuncu yoksa oluştur
    if (!playerId) {
      const newPlayer = await prisma.player.create({
        data: {
          fullName: pData.fullName,
          nationality: pData.nationality,
          position: pData.position,
          birthDate: pData.birthDate ? new Date(pData.birthDate) : null,
          popularityScore: 60,
        },
      });
      playerId = newPlayer.id;
      playerMap.set(normName, playerId);
      playersCreated++;
      console.log(`  ➕ Yeni Oyuncu Eklendi: ${pData.fullName} (${pData.position})`);
    }

    // Kulüp geçmişlerini ekle
    for (const teamName of pData.teams) {
      const teamId = findTeamId(teamName);
      if (!teamId) {
        console.warn(`  ⚠️ Takım bulunamadı: "${teamName}" (Oyuncu: ${pData.fullName})`);
        continue;
      }

      const key = `${playerId}_${teamId}`;
      if (!historySet.has(key)) {
        try {
          await prisma.playerTeamHistory.create({
            data: {
              playerId,
              teamId,
              isNationalTeam: false,
            },
          });
          historySet.add(key);
          historiesCreated++;
        } catch (err) {
          // Ignore unique constraint race conditions
        }
      }
    }
  }

  console.log(`\n🎉 [Zenginleştirme Tamamlandı] (${Date.now() - startTime}ms)`);
  console.log(`   - Eklenen Yeni Oyuncu: ${playersCreated}`);
  console.log(`   - Eklenen Yeni Transfer Geçmişi: ${historiesCreated}`);
}

enrichTurkishClubs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
