# 🔍 Popülerlik Bazlı Arama Sıralaması — Teknik Görev

> AGENTS.md kurallarına uyularak uygulanmalı. Amaç: arama kutusunda
> (`TeamPicker`, `PlayerAnswerInput`) popüler oyuncu/takımların üstte
> çıkması, **oyunun hızını hiç etkilemeden** (0ms ek network gecikmesi).

---

## Temel Prensip

Tüm popülerlik hesaplaması **önceden, import/build sırasında** yapılır.
Oyun sırasında (client-side arama anında) sadece hazır sayılar üzerinde
basit bir matematik işlemi çalışır — hiçbir DB sorgusu, hiçbir ağır
hesaplama round akışının içinde yer almaz.

**❌ Yapılmayacak:** Elle yazılmış "top 100 süperstar" listesi. Sebebi:
sürekli bakım gerektirir, güncel kalmaz, ve projenin özellikle kapsadığı
bölgesel ligleri (Türkiye 2. Lig, Arjantin, Brezilya) büyük ihtimalle
dışarıda bırakır çünkü böyle bir liste hep Avrupa-merkezli yazılır. Tüm
skorlama **veriden otomatik türetilmeli.**

---

## 1. `popularity_score` Alanını Şemaya Ekle

```prisma
model Player {
  // ...mevcut alanlar
  popularityScore Int @default(0) // 0-100 arası, önceden hesaplanır
}

model Team {
  // ...mevcut alanlar
  popularityScore Int @default(0)
}
```

Migration: `npx prisma migrate dev --name add_popularity_score`

---

## 2. Skor Hesaplama Script'i (Import Sonrası Bir Kere Çalışır)

### Oyuncular İçin

Üç sinyalin ağırlıklı ortalaması, **tamamen veriden türetilir**, elle
girilen isim/liste yok:

```typescript
// scripts/calculate-popularity.ts

// 1. Piyasa değeri sinyali — LOGARİTMİK normalize edilmeli.
//    Düz (linear) normalize edilirse sadece en tepedeki birkaç oyuncu
//    skalayı domine eder, geri kalan herkes 0'a yakın çıkar.
function logNormalize(value: number, maxValue: number): number {
  if (value <= 0) return 0;
  return Math.log(value + 1) / Math.log(maxValue + 1);
}

// 2. Kulüp prestij sinyali — kulübün kadro toplam piyasa değerinden
//    veya lig seviyesinden (1. lig / 2. lig ayrımı teams tablosunda
//    varsa) otomatik türetilir. Elle "elit kulüp listesi" YOK.
async function calculateClubPrestige(teamId: number): Promise<number> {
  const squadValue = await prisma.playerTeamHistory.aggregate({
    where: { teamId },
    _sum: { /* ilişkili player'ın market_value alanı üzerinden */ },
  });
  // ... squadValue'yu diğer kulüplere göre normalize et
}

async function calculatePlayerPopularity(player: PlayerWithHistory) {
  const marketValueScore = logNormalize(player.marketValueEur ?? 0, MAX_MARKET_VALUE);
  const appearancesScore = normalize(player.appearancesCount ?? 0, MAX_APPEARANCES);
  const clubPrestigeScore = await getMaxClubPrestige(player.id); // en yüksek prestijli kulübü

  const raw =
    marketValueScore * 0.5 +
    appearancesScore * 0.3 +
    clubPrestigeScore * 0.2;

  return Math.round(raw * 100); // 0-100 aralığına ölçekle
}
```

### Takımlar İçin

```typescript
async function calculateTeamPopularity(team: TeamWithSquad) {
  const totalSquadValue = /* kadrodaki tüm oyuncuların market_value toplamı */;
  const leagueTierScore = /* teams.league_tier gibi bir alan varsa, yoksa 0.5 varsayılan */;

  const raw = logNormalize(totalSquadValue, MAX_SQUAD_VALUE) * 0.7 + leagueTierScore * 0.3;
  return Math.round(raw * 100);
}
```

**Çalıştırma sıklığı:** Bu script, veri import/güncelleme sonrası bir kere
çalışır (cron ile periyodik de olabilir, ör. haftada bir), **oyun
sırasında asla tetiklenmez.**

---

## 3. Client'a Gönderilen Listeyi Popülerliğe Göre Sırala

Oda açılışında/oyun başında client'a indirilen hafif liste
(`{id, name, popularityScore}`), **zaten popülerliğe göre azalan sırada**
gönderilsin:

```typescript
const players = await prisma.player.findMany({
  select: { id: true, fullName: true, popularityScore: true },
  orderBy: { popularityScore: "desc" },
});
```

---

## 4. Client-Side Arama: Fuse.js + Popülerlik Tie-Breaker

**⚠️ Kritik nokta:** Fuse.js'in `score` değeri ters yönlüdür — `0` =
mükemmel eşleşme, `1` = hiç eşleşme yok. Bu, popülerlik skoruyla
(yüksek = iyi) ters yönde. Doğrudan toplarsan popüler ama alakasız
sonuçlar öne geçebilir. Önce çevirmek şart:

```typescript
const fuse = new Fuse(players, {
  keys: ["fullName"],
  includeScore: true,
  threshold: 0.4,
});

function searchPlayers(query: string, limit = 8) {
  const results = fuse.search(query, { limit: limit * 2 }); // biraz fazla al, sonra kırp

  const scored = results.map((r) => {
    const textMatchScore = 1 - (r.score ?? 1); // YÖN DÜZELTMESİ — yüksek = iyi eşleşme
    const normalizedPopularity = (r.item.popularityScore ?? 0) / 100;

    // Metin eşleşmesine daha fazla ağırlık — popülerlik sadece
    // eşit/yakın eşleşmeler arasında tie-breaker rolü oynamalı,
    // ana filtre olmamalı.
    const finalScore = textMatchScore * 0.7 + normalizedPopularity * 0.3;

    return { ...r.item, finalScore };
  });

  return scored.sort((a, b) => b.finalScore - a.finalScore).slice(0, limit);
}
```

**Performans etkisi:** Sıfıra yakın. Bu işlem tamamen client belleğinde
(RAM), birkaç yüz/bin elemanlık bir dizi üzerinde `sort` — mikrosaniyeler
sürer, hiçbir network isteği yok, round akışını hiç etkilemez.

---

## 5. (Opsiyonel, İleri Faz — Şimdi Yapılmayacak)

Gerçek kullanım verisiyle popülerliği zamanla iyileştirmek mümkün: her
round'da seçilen takım/doğru bilinen oyuncu için bir `selection_count`
**asenkron** artırılır (round akışını bloklamadan), gece bir cron job ile
`popularity_score`'a karıştırılır. **Bu MVP kapsamında değil**, sadece not
olarak buraya düşülüyor — şimdi uygulanmayacak.

---

## Kabul Kriterleri (Ajan İçin Kontrol Listesi)

- [ ] `popularity_score` alanı hem `Player` hem `Team` modeline eklendi.
- [ ] Skor hesaplama tamamen otomatik — hiçbir yerde elle yazılmış oyuncu/
      takım ismi listesi yok.
- [ ] Piyasa değeri **logaritmik** normalize ediliyor (düz linear değil).
- [ ] Client'a giden liste zaten `popularityScore desc` sıralı geliyor.
- [ ] Fuse.js skoru kullanılmadan önce `1 - score` ile yön düzeltmesi
      yapılıyor.
- [ ] Arama sırasında hiçbir ek network isteği/DB sorgusu tetiklenmiyor —
      tamamen client-side, önceden yüklenmiş veri üzerinde çalışıyor.
