# Lokalna skupnost

Centralni informativni portal o dogajanju v lokalni skupnosti (kraju), postavljen na **Nostr protokolu**. Branje je odprto za vse; interakcija (všeček, komentar, zap, oddaja oglasov in učnih ponudb) je vezana na Nostr profil. Sistem je zasnovan **multi-kraj** — isti kod, druga konfiguracija = drug kraj.

Demo kraj: **Ig**.

## Sklopi portala

- **📰 Novice** — agregacija lokalnih virov (občina, šola, vrtec, društva, kurirani FB).
- **🛒 Tržnica** — ponudba domačih kmetov in obrtnikov (NIP-99).
- **🎓 Izobraževanje** — imenik učnih ponudb, brezplačnih ali plačljivih (NIP-99 / NIP-23).

Dodatno: iskalnik, izbirnik kraja, prijava z Nostr, socialni dokaz (Web of Trust), prijave spornih vsebin (NIP-56), verifikacija profilov (NIP-05).

## Struktura repozitorija

```
.
├── web/                      # frontend (statičen, brez build koraka — demo faza)
│   ├── index.html
│   └── assets/
│       ├── styles.css        # dizajnerski sistem (barve, tipografija, komponente)
│       ├── app.js            # interakcije (zavihki, filtri, prijava, obrazec, WoT)
│       ├── config.js         # konfiguracija aktivnega kraja (za brskalnik)
│       └── data.demo.js      # demo podatki (kasneje: pravi Nostr dogodki)
├── config/
│   └── kraji/
│       └── ig.yaml           # kanonična konfiguracija kraja (nov kraj = nova datoteka)
├── ingest/                   # servis za zajem virov -> Nostr dogodki (NIP-23)
│   ├── index.js
│   ├── adapters/facebook.js  # FB adapter (pripravljen, onemogočen)
│   ├── package.json
│   └── README.md
├── .github/workflows/        # CI/CD
│   ├── ingest.yml            # zajem po urniku (cron) -> objava
│   └── deploy-pages.yml      # objava portala na GitHub Pages
└── DEPLOY.md                 # navodila za namestitev, secrete, urnik
```

## Namestitev v produkcijo

Glej **[DEPLOY.md](DEPLOY.md)** — brez lastnega strežnika in **brez lastne domene**: statični portal na GitHub Pages (`https://<uporabnik>.github.io/<repo>/`) + ingest po urniku (GitHub Actions) + javni Nostr relayji. Objava zahteva secret `PUBLISHER_NSEC`. Lastna domena je opcijska (za NIP-05), doda se kasneje.

## Zagon (demo)

Frontend je statičen — odpri `web/index.html` v brskalniku, ali strežno:

```bash
cd web && python3 -m http.server 8080
# nato odpri http://localhost:8080
```

Za objavo je dovolj brezplačno statično gostovanje (Vercel / Netlify / Cloudflare Pages) — **brez lastne infrastrukture**.

## Nostr (kratko)

- Novice se objavijo kot **NIP-23** dogodki, oglasi/ponudbe kot **NIP-99** (kind 30402).
- Interakcije: **NIP-25** (všeček), **NIP-22** (komentar), **NIP-57** (zap).
- Prijava: **NIP-07** (razširitev) ali **NIP-46** (bunker).
- MVP uporablja **javne relayje** — brez lastnega relaya.
- Vsak kraj ima oznako `ls-<slug>` (npr. `ls-ig`) za filtriranje.

Več o Nostr: <https://nakojnu.si/orodja/nostr/>

## Načrt razvoja (MVP)

1. ✅ Design in prototip
2. ✅ Scaffold projekta
3. ⬜ Frontend portal z demo podatki (dinamičen izris iz `data.demo.js`)
4. ⬜ Nostr integracija (prijava, branje/pisanje)
5. ⬜ Ingest servis (RSS zajem)
6. ⬜ Tržnica in Izobraževanje (obrazci NIP-99)
7. ⬜ Interakcije + Web of Trust + prijave
8. ⬜ Testiranje in pregled

## Licenca

Predlog: **AGPL-3.0-or-later** (odprtokodno, izboljšave se vračajo v skupnost) — dokončna odločitev naročnika. Glej projektni plan, razdelek 5.2.

---

*Demo vsebina je označena z [PRIMER] in ni prava novica/oglas.*
