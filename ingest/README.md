# Ingest servis

Zajem lokalnih virov kraja in objava kot podpisani Nostr dogodki (NIP-23, kind 30023).

## Kako deluje

1. Prebere konfiguracijo kraja (`/config/kraji/<slug>.yaml`).
2. Za vsak vir: RSS (`rss`) ali zajem strani (`scrape`); viri tipa `rocno` (npr. FB skupine) se preskočijo — te dodaja urednik ročno.
3. Normalizira (naslov, povzetek, povezava, datum, kategorija) in deduplicira.
4. Sestavi NIP-23 dogodek z oznako kraja (`t`) in kategorijo, ga podpiše s **publisher ključem** in objavi na **javne relayje**.

## Zagon

```bash
npm install            # (ko so dodane odvisnosti)
KRAJ_SLUG=ig PUBLISHER_NSEC=nsec1... npm start
npm run dry-run        # suhi tek brez objave
```

> **Varnost:** `PUBLISHER_NSEC` je skrivnost iz okolja (CI/serverless secret), nikoli v kodi ali repozitoriju.

## Urnik (MVP, brez lastnega strežnika)

Poganja se po urniku prek **GitHub Actions** ali **serverless cron** (Vercel / Cloudflare / Netlify) — brez VPS-ja.

## Stanje

Skeleton s TODO koraki. Odvisnosti (`nostr-tools`, `rss-parser`, `yaml`) in dejanska logika se dodajo v razvojnem koraku »Ingest servis«.
