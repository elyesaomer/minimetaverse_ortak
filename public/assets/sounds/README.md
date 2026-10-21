# Oyun & Casino Ses Dosyaları (Sound Assets)

Bu klasör (`public/assets/sounds/`) oyunlar (Casino, Bilardo, Rulet, Blackjack, Slot ve Global Jackpot) için ses dosyalarını barındırır.

Aşağıdaki isimlerde `.mp3` (veya `.wav`) dosyalarınızı bu klasöre yerleştirebilirsiniz:

### 🎱 Bilardo Sesleri:
1. **`billiard_hit.mp3`** (veya `billiard.mp3`) - Bilardo toplarının birbirine çarpışma sesi (tok fenolik reçine / kemik sesi).
2. **`cue_shoot.mp3`** - Istakanın tebeşirli deri ucuyla beyaz topa vuruş sesi.
3. **`billiard_pocket.mp3`** (veya `pocket.mp3`) - Topun cebe ve fileye düşüş sesi.

### 🎰 Casino & Masa Oyunları Sesleri:
4. **`chip.mp3`** - Rulet ve Blackjack'te çip seçme, masaya koyma ve bahis artırma sesi.
5. **`wheel.mp3`** (veya `roulette_spin.mp3`) - Rulet çarkı ve top dönerken çalan dönme sesi.
6. **`bet_start.mp3`** - Rulet ve Blackjack'te yeni tur başladığında ve bahisler açıldığında çalan uyarı zili/sesi.
7. **`card_deal.mp3`** (veya `card.mp3`) - Blackjack'te kart dağıtma ve oyuncunun kart çekme (Hit) sesi.
8. **`win.mp3`** - Rulet, Blackjack ve Slotta normal el/tur kazanıldığında çalan sevinç melodisi.
9. **`lose.mp3`** - Rulet ve Blackjack'te el kaybedildiğinde veya bust olunduğunda çalan ses.
10. **`spin.mp3`** (veya `slot_spin.mp3`) - Slot makinesi kolu çekilip makaralar dönerken çalan mekanik efekt.
11. **`jackpot.mp3`** - Slotta 777 veya büyük Jackpot vurulduğunda tüm odaya yayınlanan coşkulu zafer sesi.

> **Not:** Ses dosyalarından herhangi biri henüz eklenmemişse sistem otomatik olarak Web Audio API sentezleyicisi (Acoustic Synthesizer Fallback) ile gerçekçi ses üretir, böylece oyun asla sessiz kalmaz veya hata vermez. Dosyaları eklediğiniz an otomatik olarak sizin dosyalarınız çalacaktır.
