# Namestitev in zagon (produkcija)

Portal deluje **brez lastnega strežnika**: statični frontend na GitHub Pages + ingest po urniku prek GitHub Actions + javni Nostr relayji.

## 1. Priprava repozitorija

1. Ustvari nov GitHub repozitorij in vanj naloži vsebino **korenske mape projekta** (mapa »Lokalna skupnost«). Za delovanje potrebuješ podmape `web/`, `ingest/`, `config/` in `.github/` ter datoteki `README.md` in `.gitignore`.

   > **Skrite datoteke:** `.github/` in `.gitignore` se začneta s piko, zato ju Finder/Explorer **privzeto ne prikaže** — čeprav se zdi, da ju ni, obstajata. V Finderju jih pokažeš s **Cmd+Shift+.** ; git ju ob nalaganju vključi samodejno. `.github/` je ključna (v njej sta oba workflowa).
   >
   > Datoteke prototipov (`prototip-*.html`, `mockup-ig.html`) in projektni plan (`PROJEKTNI-PLAN.*`) za delovanje niso potrebne — vključiš jih po želji.

   > **NE nalagaj mape `ingest/node_modules/`!** To je mapa z odvisnostmi (na tisoče datotek); obnovi se samodejno ob zagonu (CI požene `npm install`). Spletni nalagalnik GitHuba **ne upošteva `.gitignore`** in je omejen na **100 datotek naenkrat** — če povlečeš tudi `node_modules/`, naletiš na to omejitev. Brez nje ima projekt ~23 datotek. Dve poti:
   > - **Preprosto:** izbriši mapo `ingest/node_modules/` (če obstaja), nato povleci vsebino v GitHub spletni nalagalnik.
   > - **Priporočeno (git):** uporabi git iz ukazne vrstice — ta samodejno upošteva `.gitignore` (torej `node_modules/` sploh ne naloži):
   >   ```bash
   >   cd "Lokalna skupnost"
   >   git init && git add . && git commit -m "Prva objava"
   >   git branch -M main
   >   git remote add origin https://github.com/<uporabnik>/<repo>.git
   >   git push -u origin main
   >   ```
2. Veja naj bo `main`.

> **Brezplačni GitHub Pages:** za brezplačni račun mora biti repozitorij **javen** (zasebni Pages zahtevajo GitHub Pro). Če želiš repo zaseben, portal lahko objaviš tudi na Vercel/Netlify (brezplačno, tudi za zasebne).

## 2. Publisher (admin) ključ

Ingest objavlja novice kot »publisher« identiteta kraja (podpisuje NIP-23 dogodke).

1. Ustvari Nostr ključ (npr. v Alby / nak / katerikoli Nostr aplikaciji) → dobiš `nsec…`.
2. V GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - ime: `PUBLISHER_NSEC`, vrednost: `nsec…`
3. (Ko je FB vklopljen) dodaj še `FB_TOKEN_KLEPET`, `FB_TOKEN_VARNOST`.

> `nsec` je kot geslo — hrani ga samo kot GitHub secret, nikoli v kodi.

## 3. Ingest po urniku

Datoteka `.github/workflows/ingest.yml` teče **vsako uro** (in ročno prek zavihka **Actions**).
- Zajame RSS/scrape vire iz `config/kraji/ig.yaml`.
- Objavi naslov + povzetek + povezavo (z navedbo vira) kot NIP-23 na relayje iz konfiguracije.
- Brez `PUBLISHER_NSEC` teče v **suhem teku** (nič ne objavi).

Urnik prilagodiš v `cron` izrazu (npr. `*/30 * * * *` za vsakih 30 min).

## 4. Objava portala (GitHub Pages) — brez lastne domene

1. V GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Ob vsaki spremembi v `web/**` se sproži `.github/workflows/deploy-pages.yml` in objavi portal.
3. **Brezplačni naslov** (domena ni potrebna):
   - projektni repo → `https://<uporabnik>.github.io/<repo>/`
   - če repo poimenuješ `<uporabnik>.github.io` → `https://<uporabnik>.github.io/`
   HTTPS je vključen. Portal uporablja relativne poti, zato deluje tudi pod podpotjo `/<repo>/`.
4. Datoteka `web/.nojekyll` je že dodana (prepreči Jekyll obdelavo).

**Lastna domena je opcijska** in jo dodaš kadarkoli kasneje (za NIP-05 verifikacijo ali lepši naslov): ustvari `web/CNAME` z domeno (npr. `ig.lokalna-skupnost.si`) in nastavi DNS. Do takrat vse deluje na `github.io`.

## 5. Scrape selektorji

V `config/kraji/ig.yaml` pri virih tipa `scrape` po potrebi izpolni `selektor` (item/naslov/povezava/povzetek), da se ujema z živo stranjo. Brez selektorjev deluje hevristika.
- **Vrtec Ig** je JS-renderiran (`js_render: true`) — workflow namesti headless brskalnik (Playwright) za zajem.

## 6. Facebook (kasneje)

Adapter je pripravljen, a onemogočen. Ko urediš z administratorji:
1. V `config/kraji/ig.yaml` pri FB virih nastavi `enabled: true`, `page_id`, `nacin: graph`.
2. Dodaj access token kot GitHub secret (ime iz `token_env`).
3. Implementiraj klic Graph API v `ingest/adapters/facebook.js` (označeno z TODO).

## 7. Lokalni preizkus

```bash
cd ingest
npm install
KRAJ_SLUG=ig node index.js                         # suhi tek
RSS_FILE=vzorec.xml node index.js                  # test RSS iz datoteke
SCRAPE_FILE=vzorec.html node index.js              # test scrape iz datoteke
```

Frontend:
```bash
cd web && python3 -m http.server 8080   # http://localhost:8080
```
