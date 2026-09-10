# Maç Simülasyonu Yeniden Tasarım Planı — Tam Sürüm

> Bu dosya implementasyona hazır nihai plan. Her madde tartışılmış ve onaylanmış.
> Uygulamaya başlamadan önce sadece bu dosyayı oku.

---

## 1. Rating → Güç Eğrisi

**Formül:** `curve(r) = ((r - 40) / 59) ^ 2.5`

- Normalize: 40 OVR → 0.0 | 99 OVR → 1.0
- **90/91 arasında sıçrama yok** — her OVR kademeli, smooth artış
- 93-96 bölgesinde fark belirgin (fan service bölgesi)
- Eski `checkIndividualBrilliance` (90+ eşiği) **tamamen kaldırıldı**

| OVR | curve(r) |
|-----|----------|
| 60  | 0.07     |
| 70  | 0.17     |
| 80  | 0.34     |
| 85  | 0.46     |
| 90  | 0.61     |
| 93  | 0.72     |
| 96  | 0.84     |
| 99  | 1.00     |

```ts
// matchWeights.ts
export function ratingCurve(rating: number): number {
  return Math.pow(Math.max(0, (rating - 40) / 59), 2.5);
}
```

---

## 2. Possession Sayısı

**Seçilen:** İki takımın OVR **farkına** göre dinamik.

- Eşit takımlar → az pozisyon (sıkı, gerilimli maç)
- Büyük fark → çok pozisyon (güçlü takım baskı kuruyor hissi)

```ts
// simulateMatch.ts
function calculatePossessionCount(homeOvr: number, awayOvr: number): number {
  const diff = Math.abs(homeOvr - awayOvr);
  return Math.round(clamp(12 + diff * 0.4, 12, 18));
}
```

| OVR Farkı | Pozisyon Sayısı |
|-----------|----------------|
| 0         | 12             |
| 5         | 14             |
| 10        | 16             |
| 15+       | 18             |

---

## 3. Mevki Katkı Tablosu

**Kural:** Her pozisyon için `mid + atk + def = 2.0` (GK hariç — ayrı aşama).  
Hangi pozisyonu oynatsan benzer "toplam etki", fark sadece **nerede** katkı yaptığında.

| Mevki     | Mid  | Atk  | Def  | Toplam |
|-----------|------|------|------|--------|
| GK        | 0.00 | 0.00 | 0.00 | — (Aşama 3) |
| CB        | 0.10 | 0.05 | 1.85 | 2.0    |
| LB / RB   | 0.20 | 0.25 | 1.55 | 2.0    |
| LWB / RWB | 0.35 | 0.45 | 1.20 | 2.0    |
| CDM       | 1.10 | 0.10 | 0.80 | 2.0    |
| CM        | 0.90 | 0.45 | 0.65 | 2.0    |
| LM / RM   | 0.80 | 0.65 | 0.55 | 2.0    |
| CAM       | 0.40 | 1.40 | 0.20 | 2.0    |
| LW / RW   | 0.15 | 1.60 | 0.25 | 2.0    |
| ST / CF   | 0.05 | 1.85 | 0.10 | 2.0    |

**Trade-off'lar:**
- LM/RM vs LW/RW: LM orta sahaya hakimken LW/RW 2.5x daha fazla atak katkısı
- CAM: CAM merkezi tehlike (1.40 atk), biraz daha az mid (0.40)
- CDM: en dominant orta saha (1.10) ama hücumda neredeyse yok

```ts
// matchWeights.ts
export const MID_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0.00, CB: 0.10, LB: 0.20, RB: 0.20, LWB: 0.35, RWB: 0.35,
  CDM: 1.10, CM: 0.90, LM: 0.80, RM: 0.80, CAM: 0.40,
  LW: 0.15, RW: 0.15, ST: 0.05, CF: 0.05,
};

export const ATK_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0.00, CB: 0.05, LB: 0.25, RB: 0.25, LWB: 0.45, RWB: 0.45,
  CDM: 0.10, CM: 0.45, LM: 0.65, RM: 0.65, CAM: 1.40,
  LW: 1.60, RW: 1.60, ST: 1.85, CF: 1.85,
};

export const DEF_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0.00, CB: 1.85, LB: 1.55, RB: 1.55, LWB: 1.20, RWB: 1.20,
  CDM: 0.80, CM: 0.65, LM: 0.55, RM: 0.55, CAM: 0.20,
  LW: 0.25, RW: 0.25, ST: 0.10, CF: 0.10,
};
```

---

## 4. Possession Zinciri — 3 Aşama

Her possession tam bu sırayla çözümlenir:

```
AŞAMA 1: ORTA SAHA     → Kim topu alıyor? (olasılıksal, sonuç 0/1)
           ↓ Kazanan taraf hücuma geçer
AŞAMA 2: HÜCUM vs SAHA DEFANSI → Defansı geçebildi mi?
           ↓ Geçebildiyse şut gerçekleşir
AŞAMA 3: ŞUT vs KALECİ → Gol mü, kurtarış mı?
```

### Aşama 1 — Orta Saha (Olasılıksal, Sonuç 0/1)

```ts
// possessionResolver.ts
function resolveMidfield(homeSlots: SquadSlot[], awaySlots: SquadSlot[]): "home" | "away" {
  const homeMid = sumScore(homeSlots, MID_WEIGHTS);
  const awayMid = sumScore(awaySlots, MID_WEIGHTS);
  const homeWinProb = homeMid / (homeMid + awayMid);
  return Math.random() < homeWinProb ? "home" : "away";
}
```

### Aşama 2 — Hücum vs Saha Defansı

```ts
// possessionResolver.ts
function resolveDefense(
  atkSlots: SquadSlot[],
  defSlots: SquadSlot[]   // GK hariç
): { beaten: boolean; breakthroughChance: number } {
  const atkScore = sumScore(atkSlots, ATK_WEIGHTS);
  const defScore = sumScore(defSlots, DEF_WEIGHTS);  // GK weight = 0.00, etkisiz
  const breakthroughChance = clamp(atkScore / (atkScore + defScore), 0.05, 0.90);
  return { beaten: Math.random() < breakthroughChance, breakthroughChance };
}
```

### Aşama 3 — Şut vs Kaleci (Yalnızca Aşama 2 geçilirse)

Atağın defansı **ne kadar baskıyla** geçtiği şutun kalitesini belirler.  
Kaleci artık defans gücüne gömülü değil — kendi başına bağımsız bir katman.

```ts
// possessionResolver.ts
function resolveGoalkeeper(
  gkEffectiveRating: number,
  breakthroughChance: number
): { isGoal: boolean; gkSaveChance: number } {
  // 0.5 = eşit güç, 0.9 = atak çok dominant → shot quality yüksek
  const shotQuality = clamp((breakthroughChance - 0.5) * 2, 0.0, 1.0);
  const gkStrength = ratingCurve(gkEffectiveRating);
  // Güçlü kaleci bile mükemmel şutu kurtaramayabilir, ama şansı çok daha yüksek
  const gkSaveChance = clamp(gkStrength * 0.88 * (1 - shotQuality * 0.4), 0.05, 0.85);
  // × 0.88 çarpanı: 90 OVR GK'nın etkisini hafifçe yumuşatmak için eklendi
  // Olmadan: 90 OVR GK %39 goal% | Bununla: %46 goal% (eşit maç, shotQuality=0)
  return { isGoal: Math.random() > gkSaveChance, gkSaveChance };
}
```

**Örnek senaryolar:**

| Durum | gkStrength | shotQuality | Kurtarma % |
|---|---|---|---|
| 96 OVR GK, yarım şut | 0.84 | 0.20 | %77 |
| 96 OVR GK, mükemmel şut | 0.84 | 0.90 | %55 |
| 70 OVR GK, yarım şut | 0.17 | 0.20 | %15 |
| 70 OVR GK, mükemmel şut | 0.17 | 0.90 | %11 |

---

## 5. Gol Atıcı Seçimi

**Formül:** Hem pozisyon hem rating birlikte belirler.

```ts
// possessionResolver.ts
function pickGoalScorer(atkSlots: SquadSlot[]): string {
  const candidates = atkSlots
    .filter(s => s.placedPlayer && s.targetPosition !== "GK")
    .map(s => ({
      name: s.placedPlayer!.fullName,
      weight: ratingCurve(s.effectiveRating) * ATK_WEIGHTS[s.targetPosition],
    }));

  if (candidates.length === 0) return "Futbolcu";

  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  for (const c of candidates) {
    if (roll <= c.weight) return c.name;
    roll -= c.weight;
  }
  return candidates[0].name;
}
```

**Örnekler:**

| Durum | 92 OVR ST ağırlık | 78 OVR ST ağırlık | Gol dağılımı |
|---|---|---|---|
| Çift ST | `0.67 × 1.85 = 1.24` | `0.30 × 1.85 = 0.56` | **%69 / %31** |
| 92 ST vs 88 CAM | `0.67 × 1.85 = 1.24` | `0.55 × 1.40 = 0.77` | **%62 / %38** |

Yüksek ratingli oyuncu pozisyon avantajıyla birleşince doğal olarak öne çıkar. Yapay eşik yok.

---

## 5b. Asist Seçimi

**Formül:** `midWeight` ile aynı weighted random — ama golcü hariç tutulur.

```ts
// possessionResolver.ts
function pickAssistProvider(atkSlots: SquadSlot[], scorerName: string): string | null {
  // %70 ihtimalle asist olur, %30 solo gol
  if (Math.random() > 0.70) return null;

  const candidates = atkSlots
    .filter(s => s.placedPlayer && s.targetPosition !== "GK"
              && s.placedPlayer.fullName !== scorerName)  // golcü hariç
    .map(s => ({
      name: s.placedPlayer!.fullName,
      weight: ratingCurve(s.effectiveRating) * MID_WEIGHTS[s.targetPosition],
    }))
    .filter(c => c.weight > 0);

  if (candidates.length === 0) return null;

  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  for (const c of candidates) {
    if (roll <= c.weight) return c.name;
    roll -= c.weight;
  }
  return candidates[0].name;
}
```

**Örnek — Real Madrid (hücum):**

| Oyuncu | Pozisyon | midWeight | curve(88 OVR) | Asist ağırlığı |
|---|---|---|---|---|
| Kroos | CM | 0.90 | 0.55 | **0.50** |
| Valverde | CDM | 1.10 | 0.46 | **0.51** |
| Vinicius | LW | 0.15 | 0.72 | 0.11 |
| Benzema | ST | — | — | *(golcü, hariç)* |

→ Büyük ihtimalle **Kroos veya Valverde** asist yapar. Gerçekçi.

**Event görüntüsü:**
```
⚽ 34'  Benzema
         ↳ assist: Kroos
```
```
⚽ 71'  Mbappe  (solo)
```

---



Tüm eski brilliance metinleri kaldırıldı. Yeni metinler aşama zincirine göre üretilir.

### Aşama 1 — Orta Saha Kazanıldı (sadece bağlantı eventi, opsiyonel)
```
"[Takım] orta sahada hakimiyet kurdu, hücum başladı."
```
*(Bu aşamayı sessiz geçmek de tercih edilebilir — sadece gol/kurtarış/engel göster)*

### Aşama 2 — Defans Durdurdu (Aşama 2'de hücum geçemedi)
```
"🛡️ [defenderName] son anda araya girdi, tehlike geçti."
"🛡️ [awayUsername] savunması sağlam durdu."
"🛡️ Harika organizasyon — [homeUsername] hücumu çözüme kavuşturamadı."
```

### Aşama 3 — Kaleci Kurtardı (Aşama 2 geçildi ama GK kurtardı)
```
"🧤 [gkName] muhteşem kurtarışla golü önledi!"
"🧤 [gkName] yerinde çıkışla topu kapıp pozisyonu bitirdi."
"🧤 [gkName] birinci sınıf refleksle golü çıkardı!"
```

### Aşama 3 — Gol
```
"⚽ GOL! [scorerName] ([teamUsername]) pozisyonu soğukkanlılıkla değerlendirdi!"
"⚽ GOL! [scorerName] ([teamUsername]) kaleciyi de çaresiz bıraktı!"
"⚽ GOL! [scorerName] ([teamUsername]) müthiş bir bitirişle skoru güncelledi!"
```

---

## 7. Kaldırılan Mekanikler

| Eski Mekanik | Dosya | Neden Kaldırıldı |
|---|---|---|
| `checkIndividualBrilliance` | `simulateMatch.ts` | 89-90 arası yapay sıçrama, defansı yok sayıyordu |
| `checkGoalkeeperBrilliance` | `simulateMatch.ts` | GK Aşama 3 ile doğal etki ediyor |
| Sabit `CONVERSION_RATES` | `simulateMatch.ts` | Aşama 2/3 formülleri replace etti |
| `starAttackerRating / Name` | `TeamLineup` tipi | Rating eğrisi zaten doğal öne çıkarıyor |
| `effectiveAtkPower` | `TeamLineup` tipi | Artık possession başına hesaplanıyor |
| `effectiveDefPower` | `TeamLineup` tipi | Artık possession başına hesaplanıyor |
| `rawMidPower / rawFwdPower` | `TeamLineup` tipi | Kullanılmıyor |

---

## 8. Dosya Yapısı

```
/lib/auction/
  positionSuitability.ts     [MEVCUT — güncellenir]
                             calculateSlotRating kalır (ceza sistemi değişmiyor)
                             calculateLineupPowers sadeleşir: hat güç hesapları
                             kaldırılır, sadece teamOvr + slot listesi kalır

  matchWeights.ts            [YENİ — oluşturulur]
                             ratingCurve(r) fonksiyonu
                             MID_WEIGHTS, ATK_WEIGHTS, DEF_WEIGHTS tabloları
                             sumScore(slots, weights) yardımcı fonksiyonu

  possessionResolver.ts      [YENİ — oluşturulur]
                             resolveMidfield()
                             resolveDefense()
                             resolveGoalkeeper()
                             pickGoalScorer()
                             buildPossessionEvent() — event metni üretici
                             Ana export: resolvePossession() → PossessionResult

  simulateMatch.ts           [YENİDEN YAZILIR — küçülür, ~100 satır]
                             calculatePossessionCount()
                             N × resolvePossession döngüsü
                             Skor sayacı + events listesi birleştirme
                             MatchSimulationResult döndürür
```

### Yeni / Güncellenen Tipler (`auctionTypes.ts`)

```ts
// KALDIRILACAK alanlar (TeamLineup'tan):
// starAttackerRating, starAttackerName
// effectiveAtkPower, effectiveDefPower
// rawMidPower, rawFwdPower, rawDefPower

// EKLENECEk tip:
export interface PossessionResult {
  attackingTeamUserId: string;
  isGoal: boolean;
  gkSaved: boolean;        // Aşama 3: kaleci kurtardı
  defenseBlocked: boolean; // Aşama 2: savunma durdurdu
  goalScorerName?: string;
  gkName?: string;
  defenderName?: string;
  event: MatchEvent;       // Hazır event objesi
}
```

---

## 9. Bağımlılık Kontrol Listesi

`TeamLineup` değişince şu dosyalar incelenmeli:

- [ ] `party/auction.ts` — lineup oluşturma ve iletme
- [ ] `lib/auction/auctionPartyHandler.ts` — lineup validation
- [ ] `components/auction/` — `effectiveAtkPower` vb. UI'da kullanılıyor mu?
- [ ] `positionSuitability.ts` → `calculateLineupPowers` return tipi güncellenmeli

---

## 10. UI / Görsel İyileştirmeler

### 10a. Seyirci Modu — Kritik Bug Fix (En Yüksek Öncelik)

**Bug:** Oyun başladıktan sonra odaya katılan biri tam bütçeyle normal oyuncu olarak ekleniyor. Açık artırmanın sonlarında bile teklif verebiliyor, eksik kadroyla kalıyor, oyunu bozuyor.

**Kök neden:** [`party/auction.ts` L136](file:///c:/Users/Administrator/.gemini/antigravity-ide/scratch/football-quiz/party/auction.ts#L136-L144) — `handleJoin` fonksiyonunda hiçbir `status` kontrolü yok:

```ts
// Şu an (bozuk):
if (!this.state.participants[userId]) {
  this.state.participants[userId] = {
    budget: this.state.settings.startingBudget,  // her zaman tam bütçe
    squad: [],
    ...
  };
}
```

**Fix:**

```ts
// party/auction.ts — handleJoin güncellemesi
private handleJoin(sender: Party.Connection, userId: string, username: string) {
  if (!userId || !userId.trim()) return;
  this.connectionMeta.set(sender.id, { userId, username });
  delete this.state.participants[""];

  if (!this.state.hostUserId) {
    this.state.hostUserId = userId;
  }

  // Oyun başlamışsa yeni gelen kişi seyirci olarak işlensin
  const gameStarted = this.state.status !== "lobby";

  if (!this.state.participants[userId]) {
    if (gameStarted) {
      // Seyirci: sadece connectionMeta'ya eklendi, participants'a eklenmedi
      // STATE_SYNC gönder ki mevcut durumu görsun
      sender.send(JSON.stringify({
        type: "AUCTION_STATE_SYNC",
        state: this.state,
        viewerMode: true,   // client bu flagle seyirci arayüzünü gösterir
      }));
      return; // broadcast yapma, diğer oyuncuları bozma
    }

    this.state.participants[userId] = {
      userId,
      username,
      budget: this.state.settings.startingBudget,
      squad: [],
      isReady: true,
      isHost: this.state.hostUserId === userId,
    };
  }

  this.state.turnOrder = Object.keys(this.state.participants)
    .filter((id) => Boolean(id && id.trim()));
  this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
}
```

**Client tarafında:**
```tsx
// Seyirci arayüzü:
// - Tüm oyuncuların kadrolarını gör
// - Maç simülasyonunu izle
// - Teklif butonu / lineup editörü görünmüyor
// - "👁 İzliyorsunuz" badgeı görünür
```

**Yeni tip eklentisi (`auctionTypes.ts`):**
```ts
// AuctionParticipant'a isSpectator alanı EKLENMESİ GEREKMEZ
// Seyirciler participants'a hiç eklenmez — sadece connectionMeta'da tutulur
// viewerMode flag'i STATE_SYNC içinde gelir
```

---

### 10b. Açık Artırma — Sol Kendi Kadrom Paneli

**Sorun:** Soldaki alan boş (kırmızı dikdörtgen). Sağ panelde tüm oyuncuların kadroları görünüyor, kendi kadron rakiplerin kadrosyla karışık.

**Hedef:**
- **Sol:** Kendi kadronum — sabit, her zaman görünür. Küçük ekranda kapatılabilir (slide-in drawer / toggle butonu)
- **Sağ:** Yalnızca rakiplerin kadroları (kendim listeden çıkar)

**Uygulama:**
```tsx
// components/auction/MySquadDrawer.tsx  [YENİ]
// - Kendi slot'larını alır, pozisyona göre gruplar (GK, DEF, MID, FWD)
// - Küçük ekranda (< 768px) varsayılan kapalı, toggle butonuyla açılır
// - Büyük ekranda sabit open

// AuctionLobbyView.tsx güncellenir:
// - Sol kolon: <MySquadDrawer />
// - Sağ panel: participants listesinden myUserId filtrele
```

---

### 10c. Simülasyon — Formasyonları Gösteren Panel

**Hedef:** Her maç simüle edilirken her iki takımın 11 oyuncusunu pozisyonlarıyla görebilmeli. Slider/drawer olarak açılıp kapanabilmeli.

```tsx
// components/auction/MatchLineupDrawer.tsx  [YENİ]
// - İki taraf yan yana: Sol = kendi takımım, Sağ = rakip
// - Her oyuncu: isim + pozisyon + effectiveRating badge
// - Formation grid: GK 1, DEF satır, MID satır, FWD satır
// - Toggle: "📋 Dizilişler" butonu
```

---

### 10d. Maç Simülasyonu — Görsel Dramatizasyon + Asist Takibi

**Hedef:** Hangi oyuncunun gol attığı, asist yaptiğı açıkça görünsün. Maç anları tatmin edici hissettirsin.

**Asist mekaniği — possession zinciriyle uyumlu:**

Mevcut 3 aşamalı zincirde asist doğal olarak çıkıyor:
- **Aşama 1 kazananı** (topu alan oyuncu) = potansiyel asist yapan
- **Aşama 3 golcüsü** = gol atan
- Golcü != topu kazanan kişi ise → topu kazanan oyuncu asist kaydeder

```ts
// possessionResolver.ts — PossessionResult'a eklenir
export interface PossessionResult {
  attackingTeamUserId: string;
  isGoal: boolean;
  gkSaved: boolean;
  defenseBlocked: boolean;
  goalScorerName?: string;
  assistPlayerName?: string;  // YENİ — topu ileriye taşıyan oyuncu
  gkName?: string;
  event: MatchEvent;
}

// pickMidfieldCarrier(atkSlots) — YENİ fonksiyon
// Orta sahayı kazanan tarafta topu ilerleten oyuncuyu seçer
// Ağırlık: curve(rating) × midWeight (CDM/CM/LM/RM/CAM)
// Bu oyuncu golcüden farklıysa asist kaydedilir
```

**Görsel event kartları:**
```
⚽ GOL!
⭐ Ronaldo  →  ℹ️ assist: Modric
   45'  |  Real Madrid  3-1
```

```
🧤 KURTARİŞ!
   De Gea inanılmaz refleksle golü önledi!
   67'  |  Manchester United  1-0
```

**Animasyon önerileri (CSS):**
- Gol eventi gelince kart yukarıdan slide-in, 3sn göster, fade-out
- Gol anı: kısa titreme animasyonu (skor görüntüsü)
- Kurtarış: mavi highlight
- Savunma: gri/nötr

---

### 10e. Maç Sonu İstatistikler

**Hedef:** Maç bittiğinde, bir sonraki tura geçmeden önce tatmin edici bir özet göster.

**Gösterilecek veriler:**
```
🏆 MAÇ SONU

swapfit  3  —  1  orhanrez

GOLLER:
  17' Ronaldo
  34' Benzema (assist: Modric)
  72' Mbappe

KURTARIŞLAR:
  De Gea — 2 kurtarış

EN İYİ OYUNCU: Ronaldo (2 gol katkısı)
```

**Veri ihtiyacı:** `MatchSimulationResult` tipine eklenir:
```ts
export interface MatchSimulationResult {
  // mevcut alanlar...
  playerStats: Record<string, PlayerMatchStat>;  // YENİ
}

export interface PlayerMatchStat {
  playerName: string;
  teamUserId: string;
  goals: number;
  assists: number;
  saves: number;  // sadece GK için
}
```

**Tur sonu istatistikleri (tüm maçlar tamamlandığında):**
- Turda en çok gol atan oyuncu
- En çok asist yapan
- En çok kurtarış yapan kaleci
- En sürpriz sonuç

---

### 10f. İleride (Roadmap)

- 10 oyuncuya kadar destek + turnuva ağacı formatı
- Seyirci/izleyici stream layoutı (OBS overlay)
- Sezon modu — aynı ekiple birden fazla turnuva


**Sorun:** Şu an soldaki alan boş (kırmızı dikdörtgen). Sağ panelde tüm oyuncuların kadroları görünüyor, kendi kadron rakiplerin kadrosyla karışık.

**Hedef:**
- **Sol:** Kendi kadronum — sabit, her zaman görünür. Küçük ekranda kapatılabilir (slide-in drawer / toggle butonu)
- **Sağ:** Yalnızca rakiplerin kadroları (kendim listeden çıkar)

**Uygulama:**
```tsx
// components/auction/MySquadDrawer.tsx  [YENİ]
// - Kendi slot'larını alır, pozisyona göre gruplar (GK, DEF, MID, FWD)
// - Küçük ekranda (< 768px) varsayılan kapalı, toggle butonuyla açılır
// - Büyük ekranda sabit open

// AuctionLobbyView.tsx güncellenir:
// - Sol kolon: <MySquadDrawer />
// - Sağ panel: participants listesinden myUserId filtrele
```

**Slider davranışı:**
- Masaüstü: sol kenara sabitlenmiş, her zaman açık
- Mobil/küçük ekran: sağdan/soldan kayan drawer, üstte toggle butonu (`☰ Kadrom`)
- Kapatılınca içerik taşmaz, ortadaki açık artırma kartı tam genişliği alır

---

### 10b. Simülasyon — Formasyonları Gösteren Panel

**Sorun:** Simülasyon esnasında kendi ve rakip 11'inin dizilişi görünmüyor.

**Hedef:** Her maç simüle edilirken her iki takımın 11 oyuncusunu pozisyonlarıyla görebilmeli. Panel slider/drawer olarak açılıp kapanabilmeli.

**Uygulama:**
```tsx
// components/auction/MatchLineupDrawer.tsx  [YENİ]
// Props: homeLineup: TeamLineup, awayLineup: TeamLineup
// - İki taraf yan yana: Sol = kendi takımım, Sağ = rakip
// - Her oyuncu: isim + pozisyon + effectiveRating badge
// - Formation grid: GK 1, DEF satır, MID satır, FWD satır şeklinde
// - Toggle: üst köşede "📋 Dizilişler" butonu
```

**Hangi maçın lineup'ını göster:**
- Kullanıcı kendi maçındaysa: kendi maçı
- Kendi maçı yoksa (bye durumu): izlediği herhangi bir maç
- Şu anki `currentRoundIndex` + `simulationRounds[currentRoundIndex].matches` üzerinden bulunur

---

## 11. Simülasyon Donma Sorunu — Kök Neden ve Çözüm

**Gözlemlenen davranış:** Tüm oyuncularda aynı anda donuyor, bir anda doğrudan sonuç görünüyor.

### Kök Neden — PartyKit `setInterval` Güvenilir Değil

[`party/auction.ts` L288](file:///c:/Users/Administrator/.gemini/antigravity-ide/scratch/football-quiz/party/auction.ts#L288):

```ts
this.timerInterval = setInterval(() => { ... }, 2000);
```

PartyKit, Cloudflare Worker ortamında çalışır. Worker'a inbound mesaj gelmediğinde **idle mod**a geçer ve `setInterval` durabilir. Simülasyon başlayınca oyunculardan mesaj gelmez → Worker uyur → tick'ler çalışmaz → 90dk dolunca STATE_SYNC gider → herkeste birden 3-0 görünür.

**Tüm oyuncular aynı anda donuyor** → server-side olduğu kesin.

### Doğru Mimari Çözüm — Client-Side Timer

```
[SERVER] Simülasyon başlınca → STATE_SYNC gönder (tüm round verisi dahil)
[CLIENT] Veriyi alır → kendi setInterval'ını başlatır
         → her 2s'de currentMinute += 6
         → event.minute <= currentMinute filtreleyerek gösterir
         → 90dk dolunca SERVER'a "AUCTION_ROUND_COMPLETE" gönderir
[SERVER] "AUCTION_ROUND_COMPLETE" alınca standings günceller → STATE_SYNC
```

```ts
// party/auction.ts [DEĞİŞİR]
// startRoundTimer() tamamen kaldırılır
case "AUCTION_ROUND_COMPLETE":
  this.handleRoundComplete(msg.userId);
  break;
```

```ts
// Client — SimulationView [DEĞİŞİR]
useEffect(() => {
  if (status !== "simulation") return;
  const interval = setInterval(() => {
    setCurrentMinute(prev => {
      const next = Math.min(90, prev + 6);
      if (next >= 90) {
        clearInterval(interval);
        sendMessage({ type: "AUCTION_ROUND_COMPLETE", userId });
      }
      return next;
    });
  }, 2000);
  return () => clearInterval(interval);
}, [currentRoundIndex, status]);

const visibleEvents = currentRound.matches
  .flatMap(m => m.events)
  .filter(e => e.minute <= currentMinute)
  .sort((a, b) => a.minute - b.minute);
```

**Eski `startRoundTimer` + `AUCTION_SIM_TICK` tamamen kaldırılır.**

---

## 12. Uygulama Sırası

**Öncelik 1 — Bug fix (hemen uygulanabilir):**
1. **Seyirci modu fix** → `party/auction.ts` `handleJoin` — status kontrolü

**Öncelik 2 — Simülasyon motoru yeniden yazımı:**
2. **`matchWeights.ts`** → `ratingCurve` + 3 ağırlık tablosu
3. **`possessionResolver.ts`** → 3 aşama + scorer + asist + event metinleri
4. **`simulateMatch.ts`** → döngü + `playerStats` + sonuç
5. **`auctionTypes.ts`** → eski alanları kaldır, `PossessionResult` + `PlayerMatchStat` ekle
6. **`positionSuitability.ts`** → `calculateLineupPowers` sadeleştir
7. **Donma fix** → `party/auction.ts` `startRoundTimer` kaldır, client-side timer

**Öncelik 3 — UI / Görsel:**
8. **`MySquadDrawer.tsx`** → sol kadro paneli
9. **`MatchLineupDrawer.tsx`** → diziliş paneli
10. **Maç sonu istatistik ekranı** → gol/asist/kurtarış özeti


**Gözlemlenen davranış:** Tüm oyuncularda aynı anda donuyor, bir anda doğrudan sonuç görünüyor.

### Kök Neden — PartyKit `setInterval` Güvenilir Değil

[`party/auction.ts` L288](file:///c:/Users/Administrator/.gemini/antigravity-ide/scratch/football-quiz/party/auction.ts#L288)'deki `startRoundTimer()` içi:

```ts
this.timerInterval = setInterval(() => { ... }, 2000);
```

PartyKit, Cloudflare Worker ortamında çalışır. Worker'a inbound WebSocket mesajı gelmediğinde **idle mod**a geçer ve `setInterval` durabilir. Simülasyon başladıktan sonra oyunculardan mesaj gelmez → Worker uyur → tick'ler çalışmaz → ta ki 90dk'ya ulaşılınca (ya da bir mesaj gelince) `AUCTION_STATE_SYNC` gider → herkeste birden 3-0 görünür.

**Tüm oyuncular aynı anda donuyor** → server-side olduğu kesin (client sorunu olsaydı oyuncular birbirinden farklı donardı).

### Doğru Mimari Çözüm — Client-Side Timer

Simülasyon verisi **başlangıçta tek seferde tam hesaplanıyor** — tüm goller, dakikalar, eventlar hazır. Server'a döngü tutan interval gerekmez. Animasyonu client çözer:

```
[SERVER] Simülasyon başlınca → STATE_SYNC gönder (tüm round verisi dahil)
[CLIENT] Veriyi alır → kendi setInterval'ını başlatir
         → her 2s'de currentMinute += 6
         → event.minute <= currentMinute filtreleyerek gösterir
         → 90dk dolunca SERVER'a "AUCTION_ROUND_COMPLETE" mesajı gönderir
[SERVER] "AUCTION_ROUND_COMPLETE" alınca puan tablosunu günceller
         → STATE_SYNC gönderir (standings güncel, currentRoundMinute = 90)
```

**Değişen dosyalar:**

```ts
// party/auction.ts [DEĞİŞİR]
// startRoundTimer() tamamen kaldırılır
// Yeni mesaj handler eklenir:
case "AUCTION_ROUND_COMPLETE":
  // Client'tan gelir: round bittiğini bildiriyor
  // Host veya herkes hazır olunca standings güncellenir
  this.handleRoundComplete(msg.userId);
  break;

// startTournamentSimulation() son satırı:
// this.startRoundTimer()  ← bu satırı kaldır
// Yerine sadece STATE_SYNC yeterli (zaten yapılıyor L277)
```

```ts
// Client tarafı (SimulationView component'i veya hook'u) [DEĞİŞİR]
// STATE_SYNC alınınca ve status === "simulation" olunca:
useEffect(() => {
  if (status !== "simulation") return;
  const interval = setInterval(() => {
    setCurrentMinute(prev => {
      const next = Math.min(90, prev + 6);
      if (next >= 90) {
        clearInterval(interval);
        sendMessage({ type: "AUCTION_ROUND_COMPLETE", userId });
      }
      return next;
    });
  }, 2000);
  return () => clearInterval(interval);
}, [currentRoundIndex, status]); // round değişince yeniden başlat

// Event render:
const visibleEvents = currentRound.matches
  .flatMap(m => m.events)
  .filter(e => e.minute <= currentMinute)
  .sort((a, b) => a.minute - b.minute);
```

**Eski `startRoundTimer` + `AUCTION_SIM_TICK` tamamen kaldırılır.**


### Kök Neden (party/auction.ts analizi)

[`party/auction.ts` L288-319](file:///c:/Users/Administrator/.gemini/antigravity-ide/scratch/football-quiz/party/auction.ts#L288-L319)'de `startRoundTimer()` incelendi:

```ts
// Her 2 saniyede bir tick → currentRoundMinute += 6
// Ama broadcast yalnızca AUCTION_SIM_TICK tipiyle dakika numarasını gönderiyor
// Maç eventları (goller, kurtarışlar) STATE_SYNC ile anlık gelmiyor
```

**Problem 1 — Client tick'i işlemiyor olabilir:**
Client tarafı `AUCTION_SIM_TICK` mesajını alıp `currentRoundMinute`'u güncelliyorsa bile, maç eventları `state.simulationRounds[roundIdx].matches[].events[]` içinde **zaten hazır** (simülasyon başlangıçta tek seferde tamamlandı). Client, bu event listesini `currentRoundMinute`'a göre filtrelerek gösteriyor. Eğer client bu filtrelemeyi yapmıyorsa veya `AUCTION_SIM_TICK`'i kaçırırsa → tüm eventler birden görünür.

**Problem 2 — PartyKit'te `setInterval` güvenilirliği:**
PartyKit'in serverless ortamında `setInterval` bazı durumlarda atlanabiliyor veya birden fazla instance'ta çakışabiliyor. Bu durumda tick'ler düzensiz geliyor, client dakika güncellemelerini kaçırıyor.

**Problem 3 — `AUCTION_SIM_TICK` mesajı `state` içermiyor:**
```ts
// Şu an:
this.broadcast({ type: "AUCTION_SIM_TICK", currentMinute: ... })
// Client bu mesajı alıp sadece dakikayı güncelliyor
// Bağlantı gecikmeli açılmış veya mesaj atlanmışsa dakika kaçıyor
```

### Çözüm

**Kısa vadeli fix (en az değişiklik):**
```ts
// party/auction.ts — startRoundTimer() içinde
// Her tick'te AUCTION_SIM_TICK + currentRoundMinute state'e de yaz
// Ve STATE_SYNC gönder (mevcut state'i tamamıyla gönder)
// Bu sayede geç bağlanan veya tick kaçıran client tam state'i alır

this.broadcast({
  type: "AUCTION_STATE_SYNC",    // TICK yerine STATE_SYNC
  state: this.state,             // tüm state — currentRoundMinute dahil
});
```

Dezavantajı: tüm state her 2 saniyede broadcast edilir → büyük payload. Ama PartyKit için kabul edilebilir.

**Orta vadeli fix (doğru çözüm):**
```ts
// 1. Tick mesajı hem dakikayı hem de o dakikaya kadar olan eventların özetini içersin:
this.broadcast({
  type: "AUCTION_SIM_TICK",
  currentMinute: this.state.currentRoundMinute,
  currentRoundIndex: this.state.currentRoundIndex,
});

// 2. Client tarafında: tick gelince mevcut state'teki rounds[roundIdx].matches
//    içindeki eventları currentMinute'a göre filtrele ve göster
//    Bu zaten doğru tasarım — ama client filtreleme kodu eksik ya da hatalı olabilir

// 3. Yeni bağlanan client onConnect'te STATE_SYNC alıyor (L46) — bu yeterli
//    Ama currentRoundMinute o anda ne olduğunu yansıtmalı
```

**Client tarafı kontrol listesi:**
- [ ] `AUCTION_SIM_TICK` reducer'ı `currentRoundMinute`'u güncelliyor mu?
- [ ] Event listesi render ederken `event.minute <= currentRoundMinute` filtresi var mı?
- [ ] `AUCTION_STATE_SYNC` gelince event listesi sıfırlanıp yeniden mi render ediliyor?

---

## 12. Uygulama Sırası (Güncellenmiş)



1. **`matchWeights.ts`** yaz → `ratingCurve` + 3 ağırlık tablosu
2. **`possessionResolver.ts`** yaz → 3 aşama + scorer seçimi + event metinleri
3. **`simulateMatch.ts`** yeniden yaz → döngü + skor + sonuç
4. **`auctionTypes.ts`** güncelle → eski alanları kaldır, `PossessionResult` ekle
5. **`positionSuitability.ts`** sadeleştir → `calculateLineupPowers` temizle
6. **Bağımlı dosyaları** kontrol et ve güncelle
7. Test: birkaç farklı kadro kombinasyonuyla manuel simülasyon çalıştır, skor dağılımını kontrol et
