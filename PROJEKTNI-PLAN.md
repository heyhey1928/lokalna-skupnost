# Projektni plan — Lokalni informativni portal na Nostr protokolu

> Delovni naslov / blagovna znamka: **Lokalna skupnost** — centralni pregled dogajanja v lokalni skupnosti (kraju).
> (Kratek slug za tehnične identifikatorje: `ls`; per-kraj oznaka npr. `ls-ig`.)
> Demo kraj: **Ig**. Arhitektura: multi-kraj (isti sistem, konfiguracija na kraj).

---

## 0. Povzetek za odločitev (na vrhu)

**Naloga:** Zasnovati portal, ki obiskovalcem prikazuje informacije o dogajanju v lokalni skupnosti; berljiv za vse, interakcija (like, komentar, zap) pa vezana na Nostr profil. Vsebina se, kjer je mogoče, zajema samodejno. Platforma naj čim bolj temelji na Nostr protokolu. Sistem mora biti prilagodljiv na poljuben kraj.

**Ključne odločitve (potrjene z naročnikom):**

- Oblika: tehnični + produktni plan (ta dokument).
- Zajem vsebin: **avtomatski (RSS/scraping)**, objava kot admin (publisher) z **navedbo vira** — naslov + povzetek + povezava, ne celo besedilo. Facebook je **pripravljen, a onemogočen** do dogovora z admini.
- Obseg 1. faze: **delujoč MVP za Ig + arhitektura za več krajev.**
- Infrastruktura: **MVP brez lastnega relaya** — uporaba javnih Nostr relayjev; lasten/gostovan relay le kot opcijska nadgradnja (faza 2+).
- Model krajev: **hibrid** — odprtokodna baza (samo-gostovanje mogoče) + osrednja gostovana instanca z upravljanim onboardingom; samopostrežna registracija krajev kasneje (glej 5.1).

**Glavna tveganja (podrobneje v pogl. 7):**

1. **Facebook skupine** (Ižanski klepet, Informirani in varni na Igu) so zaprte — samodejni zajem je pravno in tehnično sporen. Rešitev: sodelovanje z admini / ročna kuracija, ne scraping.
2. **Avtorske pravice** na novicah (osig.si, obcina-ig.si) — objavljamo povzetek + povezavo na vir, ne celih vsebin brez dovoljenja.
3. **Nostr onboarding** za nedigitalno populacijo — potrebna zelo preprosta prijava (NIP-07 / nsec bunker / vgrajen signer).

**Naslednji koraki:** potrditi ime in domeno, ustvariti publisher (admin) ključ, potrditi tehnološki sklad, začeti fazo 1 (glej pogl. 8). Dostop do FB se uredi kasneje z admini (opcijsko).

**Kaj potrebuje človeški pregled:** pravne točke (avtorske pravice pri objavi povzetkov, GDPR, FB ToS), izbira relayjev in blagovna znamka.

---

## 1. Uporabljeni viri in kontekst

- Projektna navodila (`project_instructions`): centralna informativna stran o dogajanju v skupnosti; interakcija samo prek Nostr profila; ne izmišljati podatkov.
- **Manjkajoče datoteke:** `PERSON.md`, `COMPANY.md`, `BRAND.md` niso prisotne v projektu. Ton, blagovna znamka in nekatere poslovne omejitve zato niso definirani in jih je treba dodati.
- Preverjeno na spletu:
  - **osig.si** (Osnovna šola Ig) — teče na WordPress, ima delujoč RSS (`/feed/`, `application/rss+xml`). → primeren za avtomatski zajem.
  - **obcina-ig.si** (Občina Ig) — `/feed/` ne vrne vsebine; potrebna posebna obravnava (preveriti alternativni RSS ali scraper).
  - Nostr NIP-i (glej pogl. 3): NIP-25 (reakcije), NIP-57 (zaps), NIP-23 (dolge objave); NIP-72 (skupnosti) je označen kot »unrecommended«, priporočen je **NIP-29**.

---

## 2. Vizija in cilji

**Vizija:** En naslov, kjer prebivalec kraja vidi vse pomembno lokalno dogajanje — novice občine, šole, društev, dogodke, obvestila — in lahko sodeluje (všeček, komentar, mikro-donacija/zap) s svojo suvereno Nostr identiteto.

**Cilji (SMART, za demo Ig):**

- Agregirati vsaj 3 vire v enoten kronološki/kategoriziran pregled.
- Vsak obiskovalec bere brez prijave; interakcija zahteva Nostr profil.
- Prilagoditev na nov kraj v < 1 dan (samo konfiguracija, brez novega kodiranja).
- Vse interakcije zapisane kot Nostr dogodki na relayju (podatki niso ujeti v zaprto bazo).

**Ne-cilji (za zdaj):**

- Ni zaprto družbeno omrežje (samo za registrirane).
- Ni scraping zaprtih FB skupin brez dovoljenja.
- Ni komercialnih transakcij razen zaps (mikro-donacij).
- MVP ni samopostrežna platforma — kraje na začetku dodaja upravljavec; samopostrežna registracija je predvidena kasneje (5.1).

---

## 3. Zakaj Nostr in kako (tehnično jedro)

Nostr (Notes and Other Stuff Transmitted by Relays) je odprt protokol: uporabnik ima par ključev (javni `npub` / zasebni `nsec`), objave (»events«) so podpisane in shranjene na **relayjih**. To se ujema z zahtevo: identiteta je uporabnikova, interakcije so prenosljive, ni osrednje zaprte baze.

**Relevantni NIP-i za ta projekt:**

| NIP | Namen v projektu |
|-----|------------------|
| **NIP-01** | Osnovni format dogodkov, profili (kind 0), objave (kind 1). |
| **NIP-02** | Seznami sledenj (socialni graf) — temelj Web of Trust (glej 7.4). |
| **NIP-07** | Prijava prek brskalniške razširitve (Alby, nos2x) — »poveži Nostr«. |
| **NIP-46** | Oddaljeno podpisovanje (nsec bunker) — prijava brez razširitve, prijaznejše za nove uporabnike. |
| **NIP-25** | Reakcije (»like«) na objave. |
| **NIP-57** | **Zaps** — Lightning mikro-donacije (kind 9734 zahteva, 9735 potrdilo). |
| **NIP-23** | Dolge objave/članki (novice, obvestila kot strukturirana vsebina). |
| **NIP-22 / NIP-10** | Komentarji in nitenje (threaded comments). |
| **NIP-52** | Koledarski dogodki (lokalni dogodki, prireditve). |
| **NIP-99** | Oglasi / tržnica (kind 30402) — ponudba kmetov in obrtnikov (glej 6.1). |
| **NIP-50** | Iskalna zmožnost relaya — opcijska nadgradnja iskalnika (glej 4.2). |
| **NIP-32** | Oznake / priporočila (labeling) — vouchanje za Web of Trust (glej 7.4). |
| **NIP-51** | Seznami (npr. »Priporočam / Uporabljam«) — socialni dokaz (glej 7.4). |
| **NIP-56** | Prijave spornih vsebin (kind 1984) — moderacija in negativni WoT signal (glej 6.3, 7.4). |
| **NIP-29** | Skupine na relayju (moderiran »kraj« kot skupnost). Priporočeno namesto NIP-72. |
| **NIP-05** | Človeku berljivi identifikatorji (npr. `janez@lokalna-skupnost.si`) — verifikacija lokalnih uradnih profilov. |

**Ključna arhitekturna zamisel:** vsak **kraj = Nostr skupnost/oznaka**. Novica se v sistem vnese kot Nostr dogodek (npr. NIP-23 članek) z oznako kraja (npr. `#ls-ig` in geo/`t` tagi). Interakcije (NIP-25, NIP-22, NIP-57) se pripnejo na ta dogodek. Portal je v bistvu **specializiran Nostr odjemalec (client)** s kuriranim pogledom na določene avtorje/oznake.

### 3.1 Kako se ločijo objave kraja

Objave kraja se ne ločijo po enem samem znaku, ampak po **kombinaciji treh mehanizmov** v Nostr dogodku. Portal ob prikazu izvede poizvedbo (filter) na relayje in prikaže le tisto, kar ustreza konfiguraciji kraja.

**1. Publisher identiteta kraja (najmočnejši ključ).** Vsak kraj ima svojo »publisher« identiteto — Nostr par ključev, s katerim ingest servis podpisuje vse zajete novice tega kraja. Ker je vsak dogodek kriptografsko podpisan, ga ni mogoče ponarediti. To je najbolj zanesljivo za uradne novice (občina, šola, kuriran FB). V filtru je to polje `authors`.

**2. Oznaka kraja (`t` tag).** Vsak dogodek dobi oznako kraja (npr. `ls-ig`) in kategorijo (`obcina`, `sola`, `dogodki`…). Omogoča filtriranje po kraju in kategoriji hkrati ter ujame tudi morebitne objave, ki jih ne piše publisher (npr. če bi kasneje prebivalci sami objavljali pod oznako kraja).

**3. Geo oznaka (opcijsko).** Dogodek lahko nosi geolokacijski tag (geohash / koordinate) za funkcijo »kaj se dogaja blizu mene« in filtriranje po območju, ne le po imenu.

**Primer poizvedbe portala (Nostr filter):**

```json
{
  "kinds": [30023],
  "authors": ["<pubkey_publisher_ig>"],
  "#t": ["ls-ig"]
}
```

Portal vzame dogodke **od publisherja kraja** ali dogodke **z oznako kraja** in tako sestavi feed za Ig. Enak kod za drug kraj = druga identiteta in druga oznaka (iz `ig.yaml`).

**Pomembno pri MVP brez lastnega relaya:** javni relayji vsebujejo objave z vsega sveta, zato je **filtriranje obvezno** — ni relaya, ki bi vseboval »samo Ig«. Publisher identiteta je zato ključna: je edini zanesljiv način, da ločimo pristne krajevne novice od naključnega šuma pod isto oznako.

**Interakcije ne potrebujejo ločevanja po kraju:** like (NIP-25), komentar (NIP-22) in zap (NIP-57) se prek NIP standardov samodejno navežejo na konkreten dogodek novice (prek njegovega ID-ja `e` tag), zato že po definiciji pripadajo pravemu kraju.

---

## 4. Arhitektura sistema

```
                        ┌─────────────────────────────────────┐
   VIRI                 │            ZAJEM (Ingest)            │
 ┌──────────┐           │  ┌───────────────────────────────┐  │
 │ osig.si  │──RSS────► │  │  Fetcher (RSS/HTML)            │  │
 │ obcina-  │──scrape─► │  │  → normalizacija → dedup        │  │
 │  ig.si   │           │  │  → objava kot Nostr dogodek     │  │
 │ FB skup. │──ročno──► │  │    (kind 30023 / NIP-23)        │  │
 └──────────┘           │  └───────────────┬───────────────┘  │
                        └──────────────────┼──────────────────┘
                                           │ podpiše "publisher" ključ kraja
                                           ▼
                        ┌─────────────────────────────────────┐
                        │      JAVNI NOSTR RELAYJI (več)       │
                        │  MVP: brez lastnega relaya          │
                        │  npr. damus.io, nos.lol, primal...  │
                        │  hrani: novice, komentarje, like,   │
                        │         zaps, profile, dogodke      │
                        └──────────────────┬──────────────────┘
                                           │
             ┌─────────────────────────────┼─────────────────────────────┐
             ▼                                                             ▼
   ┌───────────────────┐                                       ┌───────────────────┐
   │   PORTAL (web)     │  bralci: brez prijave                │  Nostr uporabnik   │
   │  Nostr client +    │  interakcija: prek NIP-07/NIP-46     │  (npub, wallet)    │
   │  kurirani pogled   │◄───────── like / komentar / zap ─────│                    │
   │  na kraj (config)  │                                       └───────────────────┘
   └───────────────────┘
```

**Komponente:**

1. **Ingest servis** — periodično zajema vire, normalizira, deduplicira in objavlja kot podpisane Nostr dogodke (NIP-23) pod »publisher« identiteto kraja. Vsak dogodek nosi vir, povezavo, kraj-oznako.
2. **Relayji** — **MVP uporablja izključno javne relayje** (npr. `relay.damus.io`, `nos.lol`, `relay.primal.net`, `nostr.wine`). Objavljamo na več hkrati zaradi redundance. Lasten ali gostovan relay je opcijska nadgradnja (faza 2+) za trajni arhiv in NIP-29 skupine — arhitektura ostane enaka, spremeni se le seznam relayjev v konfiguraciji.
3. **Portal (web client)** — bere dogodke za konfiguriran kraj, prikazuje kronološko/po kategorijah, omogoča branje vsem. Za interakcijo sproži prijavo z Nostr.
4. **Konfiguracija kraja** — deklarativna datoteka na kraj (glej pogl. 5).
5. **Moderacija** — urednik z Nostr profilom, moderacijski dogodki / NIP-29 pravila.

**Predlog tehnološkega sklada (za potrditev):**

- Frontend: SvelteKit ali Next.js + `nostr-tools` / NDK (Nostr Dev Kit).
- Relayji (MVP): javni relayji — brez lastne relay infrastrukture. (Opcijsko kasneje: gostovan relay ali `strfry`/`nostr-rs-relay`.)
- Ingest: majhen servis (Node/TypeScript ali Python) z `nostr-tools`; cron/scheduler.
- Gostovanje: samo ingest servis (majhen VPS ali serverless cron) + statični/edge hosting za frontend. Brez relay strežnika.
- Zaps: povezava z Lightning (LNURL/Alby) prek NIP-57.

### 4.1 Infrastruktura za MVP (kaj je res potrebno)

Za MVP praktično **ni potrebna lastna infrastruktura** v smislu strežnika, ki bi ga vzdrževal — vse teče na upravljanih (managed) / brezplačnih platformah.

| Komponenta | MVP rešitev | Lastna infra? |
|-----------|-------------|---------------|
| **Portal (spletna stran)** | Statična stran na brezplačnem nivoju (Vercel / Netlify / Cloudflare Pages). Ni strežnika, ni baze. | ❌ Ne |
| **Relayji** | Javni relayji, ki jih poganjajo drugi. | ❌ Ne |
| **Ingest (zajem novic)** | Skripta po urniku prek **GitHub Actions** ali **serverless cron** (Vercel / Cloudflare / Netlify). Brez VPS-ja. | ❌ Ne (le urnik na tuji platformi) |
| **Ključi (publisher `nsec`)** | Varno shranjena skrivnost (secret) v okolju CI/serverless platforme; kasneje bunker (NIP-46). | ⚠️ Le varna hramba |

**Kar boš imel »svoje«:** koda (repozitorij), publisher/uredniški ključi in — za produkcijo — domena za NIP-05 (razdelek 7.2). Nič od tega ni strežnik za vzdrževati.

**Kaj te lahko potisne v lastno infrastrukturo (šele faza 2+):** trajni arhiv novic in NIP-29 moderirane skupine → gostovan ali lasten relay. Za MVP ne.

### 4.2 Iskanje po portalu

Portal ima iskalnik (viden v glavi), ki išče **po vseh vsebinah kraja** — novicah, dogodkih in oglasih tržnice hkrati.

**Pristop po fazah:**

- **MVP — iskanje na strani odjemalca (client-side).** Portal tako ali tako naloži dogodke za konfiguriran kraj; iskanje se izvede lokalno v brskalniku po naslovu, povzetku in tagih (kategorija, vir). Brez strežnika in brez lastne infrastrukture — deluje takoj. Primerno za obseg enega kraja.
- **Filtri:** iskanje kombinirano s filtri po kategoriji, viru, tipu vsebine (novica / dogodek / oglas) in času.
- **Nadgradnja (ob rasti) — NIP-50 (Search Capability).** Nekateri relayji podpirajo iskalni filter na strani relaya (NIP-50); portal ga lahko uporabi za hitrejše iskanje po večjem obsegu, brez lastnega iskalnega indeksa.
- **Opcijsko kasneje:** lasten iskalni indeks (npr. za več krajev hkrati, polno besedilo, samodejno dopolnjevanje) — šele če se pokaže potreba in obstaja backend.

**Omejitev pri MVP:** client-side iskanje deluje po tem, kar je naloženo/predpomnjeno; za globok arhiv starih objav je potreben NIP-50 relay ali indeks (nadgradnja).

---

## 5. Multi-kraj zasnova (prilagodljivost na poljuben kraj)

Cilj: nov kraj brez pisanja kode. Vsak kraj ima konfiguracijo, npr.:

```yaml
# kraji/ig.yaml
kraj:
  ime: "Ig"
  slug: "ig"
  koordinate: [45.958, 14.527]
  jezik: "sl"
branding:
  logo: "ig-logo.svg"
  barve: { primarna: "#1c6b3c" }
nostr:
  publisher_npub: "npub1..."   # identiteta, ki objavlja novice kraja
  # MVP: samo javni relayji, brez lastnega
  relay_pisanje: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"]
  relay_branje:  ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"]
  oznaka: "ls-ig"        # filter po tagu (NIP-29 skupina opcijsko kasneje)
viri:
  - tip: rss
    ime: "OŠ Ig"
    url: "https://www.osig.si/feed/"
    kategorija: "šola"
  - tip: scrape
    ime: "Občina Ig"
    url: "https://www.obcina-ig.si/"
    kategorija: "občina"
    selektor: { item: "", naslov: "", povezava: "", povzetek: "" }  # uskladi z živo stranjo
  - tip: scrape
    ime: "Vrtec Ig"
    url: "https://vrtec-ig.si/"
    kategorija: "šola"
    js_render: true        # JS-renderirano -> potreben headless zajem (sicer preskok)
  - tip: scrape
    ime: "Morostig — Hiša narave in kolišč"
    url: "https://morostig.si/aktualno/"
    kategorija: "dogodki"
  # Facebook: PRIPRAVLJENO, a onemogočeno do dogovora z admini
  - tip: fb
    ime: "Ižanski klepet (FB)"
    enabled: false
    nacin: "graph"; page_id: ""; token_env: "FB_TOKEN_KLEPET"
    kategorija: "skupnost"
kategorije: ["občina", "šola", "dogodki", "skupnost", "varnost"]
trznica:                  # lokalna ponudba (NIP-99), glej 6.1–6.3
  omogoceno: true
  kategorije: ["pridelki-hrana", "domaci-izdelki", "obrt", "storitve",
               "kmetija-zivali", "turizem", "rabljeno-podarim", "delo"]
  cene: "opcijsko"        # prikaz cene le, če je vnesena (EUR / sats)
  moderacija: "pomoderacija"   # pomoderacija | predmoderacija | samo-verificirani
  slike_samo_nas_nalagalnik: true
izobrazevanje:            # učne vsebine (imenik ponudb), glej 6.4
  omogoceno: true
  kategorije: ["jeziki", "digitalno", "glasba-umetnost", "kmetijstvo-vrt",
               "obrt", "kuhanje", "sport", "otroci", "instrukcije", "osebna-rast",
               "financna-pismenost"]
  formati: ["delavnica", "tecaj", "v-zivo", "spletno", "individualno", "gradivo"]
  oznaka_placljivo: true  # filter brezplačno / plačljivo
```

Portal ob zagonu prebere konfiguracijo za `slug` in sestavi pogled. Enak kod, drugačna vsebina in videz → uporabno za vsak kraj posebej.

### 5.1 Model dodajanja krajev (hibrid)

Kako nastane nov kraj (npr. Ljubljana), je **produktna odločitev, ne omejitev Nostr protokola** — protokol je odprt, »kraj« pa pri nas definira konfiguracija in kuriran seznam zaupanja, kar nekdo mora nastaviti. Izbrani pristop je **hibrid**, ki se razvija po fazah:

**1. Odprtokodna baza (od začetka).** Koda platforme je javna (npr. permisivna licenca). Vsak lahko klonira repozitorij in si **sam gostuje** instanco za svoj kraj — brez centralnega admina. Konfiguracija kraja je le YAML datoteka (razdelek 5). To zagotavlja neodvisnost in preprečuje ozko grlo.

**2. Osrednja gostovana instanca z upravljanim onboardingom (MVP → produkcija).** Vzporedno teče ena uradna gostovana platforma (`lokalna-skupnost.si`). Na začetku kraje dodaja upravljavec: doda `<kraj>.yaml`, ustvari publisher ključ in vpiše urednike na allowlisto. To omogoča nadzor kakovosti in enotno izkušnjo, dokler platforma ni zrela.

**3. Samopostrežna registracija krajev (kasnejša faza).** Vmesnik, kjer urednik sam registrira in »prevzame« kraj (ustvari konfiguracijo, poveže svoj Nostr ključ kot urednik). Potrebni varovalni mehanizmi: preverjanje pristnosti (npr. dokazilo o povezanosti s krajem/institucijo), moderacija, zaščita pred lažnimi prevzemi in podvajanjem krajev.

**Zakaj hibrid:** takoj daš skupnosti možnost samo-gostovanja (odprtokodnost), obenem ponudiš enostavno uradno instanco za tiste, ki nočejo tehnične postavitve, in postopoma odpreš samopostrežbo, ko so vzpostavljeni moderacija in varovala.

> Odprto vprašanje za naročnika: licenca (npr. MIT/AGPL — glej 5.2), ali naj bo osrednja instanca komercialna/neprofitna, in kriteriji za »prevzem« kraja pri samopostrežni registraciji.

### 5.2 Izbira licence (MIT vs. AGPL)

Ker je Lokalna skupnost **omrežna storitev** (portal na strežniku), je izbira licence pomembna — določa, koliko svobode imajo tisti, ki kodo uporabljajo naprej.

| | **MIT** (permisivna) | **AGPL** (copyleft) |
|---|---|---|
| Načelo | »Delaj kar hočeš«, ohrani navedbo avtorstva. | »Ostani odprt, tudi kot spletna storitev.« |
| Zaprta/komercialna izpeljanka | Dovoljena (nekdo lahko naredi zaprt komercialni produkt). | Ni dovoljena — spremembe morajo ostati odprte. |
| Sprožilec obveznosti deljenja kode | Nobene. | Že ob **dostopu prek omrežja** (ne le distribuciji) — zapre »SaaS luknjo« navadnega GPL. |
| Učinek na skupnost | Široka uporaba, a prispevki niso zagotovljeni. | Izboljšave se vračajo v skupnost. |
| Slabost | Delo je lahko »zaprto« brez prispevkov nazaj. | Podjetja se AGPL pogosto izogibajo (interne prepovedi). |

**Kdaj kaj:**

- **AGPL** — če želiš, da vsakdo, ki poganja svojo instanco ali forka platformo, ostane odprt in prispeva nazaj. Ujema se z duhom Nostra in hibridnim modelom (skupnost gradi skupaj).
- **MIT** — če želiš najširšo uporabo, tudi če kdo naredi zaprto komercialno različico (npr. agencija postavlja portale občinam).
- **Dual licensing (AGPL + komercialna)** — srednja pot: koda AGPL za skupnost, podjetja lahko kupijo komercialno licenco. Omogoča odprtost in hkrati zaslužek.

**Izhodiščno priporočilo:** glede na hibridni model in vrednote Nostra je **AGPL** smiselno izhodišče (ščiti odprtost skupnega dobra); če je cilj spodbuditi komercialne postavljavce, izberi MIT. Odločitev potrdi naročnik.

---

## 6. Zajem vsebin (strategija po viru)

**Politika (potrjeno):** vsebino, dosegljivo prek **RSS ali scrapinga**, portal objavi kot **admin (publisher)** z **navedbo vira** — vedno le **naslov + kratek povzetek + povezavo na izvirnik** (in datum/vir), **nikoli celotnega besedila**. S tem se usmerja promet na vir in zmanjša avtorsko-pravno tveganje.

> **Pravni pridržek (ni pravni nasvet):** tudi z navedbo vira objava tuje vsebine ni brez tveganja (avtorske pravice, pogoji uporabe strani). Objava povzetka + povezave je nižje tveganje kot polno besedilo; za dokončno oceno naj poskrbi pravni pregled (pogl. 11).

| Vir | Metoda | Status / opomba |
|-----|--------|-----------------|
| **osig.si** (OŠ Ig) | RSS (`/feed/`) | ✅ Deluje (WordPress). |
| **obcina-ig.si** (Občina Ig) | HTML scraper | ✅ Seznam novic na domači strani (datum, naslov, povzetek, povezava). Selektorje uskladi z živo stranjo. |
| **vrtec-ig.si** (Vrtec Ig) | HTML scraper (headless) | ⚠️ JS-renderirano — potreben zajem z izrisom (Playwright). Do takrat se preskoči. |
| **morostig.si** (Hiša narave in kolišč) | HTML scraper `/aktualno/` | ✅ Zajem rubrike »Aktualno«. Upravlja Občina Ig. |
| **Ižanski klepet (FB)** | **FB adapter — pripravljen, onemogočen** | ⏸️ Zaprta skupina. Adapter (`ingest/adapters/facebook.js`) je pripravljen; vklopi se (`enabled: true`) šele po dogovoru z admini (Graph API na Page ali ročni uvoz). |
| **Informirani in varni na Igu (FB)** | **FB adapter — pripravljen, onemogočen** | ⏸️ Enako — idealno kot uradni »varnostni« kanal, ko admini sodelujejo. |

**Cevovod zajema:** fetch → parse → normalizacija (naslov, povzetek, url, datum, kategorija, vir) → deduplikacija (hash url) → objava kot NIP-23 dogodek s tagi (`kraj`, `kategorija`, `vir`) → na relay.

### 6.1 Lokalna ponudba — kmetje in obrtniki (tržnica)

Poleg novic portal ponuja **lokalno tržnico**, kjer domači ponudniki blaga in storitev (predvsem kmetje in obrtniki) objavijo svojo ponudbo. Za razliko od novic tu **vsebino ustvarjajo ponudniki sami** s svojim Nostr profilom — ni zajem iz zunanjih virov.

**Tehnična osnova — NIP-99 (Classified Listings).** Nostr ima namenski standard za oglase: dogodek **kind 30402** (aktivni oglas), **kind 30403** (osnutek/neaktiven). Vsebuje strukturirane tage: naslov, povzetek, cena (`["price","<znesek>","<valuta>","<frekvenca>"]` — valuta v ISO 4217, npr. EUR ali btc), lokacija, status, slike. Oglas je »addressable«, zato ga ponudnik lahko posodablja (cena, zaloga) brez novega vnosa. To je enak model, ki ga uporabljajo obstoječi Nostr trgovinski odjemalci (npr. Shopstr).

**Kako deluje za ponudnika:**

- Ponudnik se poveže s svojim Nostr profilom (isti onboarding kot za interakcijo — NIP-07 / NIP-46).
- Odda oglas prek preprostega obrazca (naslov, opis, cena, kategorija, kraj, fotografije) → objavi se kot NIP-99 dogodek z oznako kraja (`ls-ig`) in kategorijo tržnice (npr. `kmetija`, `obrt`, `storitev`).
- Oglas se pojavi v ločenem zavihku **Tržnica** in v filtru po kategorijah; ostane last ponudnika (prenosljiv, ni ujet v našo bazo).

**Kako deluje za obiskovalca:**

- Bere/brska ponudbo in **komentarje** brez prijave.
- Za interakcijo (všeček, **komentar**, zap kot napitnina/podpora, stik) potrebuje Nostr profil — enako pravilo kot drugod.
- **Komentar:** javno vprašanje/odziv na oglas prek NIP-22 (kind 1111), pripet na dogodek oglasa; javno viden in moderiran (razdelek 6.3). Primerno za javna vprašanja (dostava, razpoložljivost).
- Kontakt (zaseben): prek Nostr zasebnega sporočila (NIP-17/NIP-04) ali navedenih kontaktnih podatkov v oglasu (telefon, e-pošta — po izbiri ponudnika).

**Cene:** prikažejo se **le, če jih ponudnik vnese** (polje ni obvezno); sicer se prikaže »po dogovoru«. Valuta EUR ali sats (Lightning), zapisano prek NIP-99 `price` taga.

**Zaupanje in kakovost:**

- **Verificirani ponudniki:** lokalni kmetje/obrtniki lahko dobijo NIP-05 značko (`kmetija-novak@ig.lokalna-skupnost.si`) za verodostojnost.
- **Brez transakcij v MVP:** portal je oglasna deska (kot izložba), ne plačilni posrednik. Plačila/dostava so stvar dogovora med ponudnikom in kupcem. Zap (Lightning) je le neobvezna napitnina/podpora, ne nakup. To ohranja projekt zunaj regulative za plačilne storitve.

**Cevovod (ponudnik → portal):** obrazec → sestava NIP-99 dogodka (kind 30402) → podpis s ponudnikovim ključem → objava na relayje z oznako kraja → prikaz v zavihku Tržnica.

### 6.2 Predlagane kategorije tržnice

Predlog izhodiščnega nabora (prilagojen podeželskemu kraju; upravljavec kraja lahko prilagodi):

| Kategorija | Primeri podkategorij |
|-----------|----------------------|
| 🥕 **Kmetijski pridelki in hrana** | zelenjava, sadje, jajca, med, mleko in mlečni izdelki, meso |
| 🍯 **Domači predelani izdelki** | marmelade, sokovi, žganja, kruh in pecivo, vloženo |
| 🪵 **Obrt in rokodelstvo** | les, kovina, keramika, tekstil, unikatni izdelki |
| 🔧 **Storitve** | popravila, gradbeništvo, košnja in vrtnarstvo, prevoz, čiščenje, inštrukcije, varstvo |
| 🐔 **Kmetija in živali** | sadike, seme, seno, mladiči, gnoj, kmetijska oprema |
| 🏡 **Kmečki turizem in doživetja** | nastanitev, degustacije, izleti, delavnice |
| ♻️ **Rabljeno / podarim** | second-hand, brezplačno oddam |
| 💼 **Delo** | iščem/ponujam lokalno delo, sezonska pomoč |

### 6.3 Nadzor vsebine oglasov (moderacija)

**Izhodišče (pomembno):** Nostr je decentraliziran — nikomur ne moremo preprečiti, da objavi NIP-99 dogodek z oznako kraja na javni relay. **Lahko pa v celoti nadzorujemo, kaj prikaže naš portal.** Portal je kuriran odjemalec, zato moderiramo na ravni prikaza, ne protokola. (Iskren pridržek: drug odjemalec bi lahko prikazal iste surove oglase pod isto oznako — to je lastnost Nostra.)

**Besedilo oglasa — večplastni pristop:**

- **Način moderacije (izbira kraja):**
  - *Predmoderacija* — nov oglas skrit, dokler ga urednik ne potrdi (najvarnejše, počasnejše).
  - *Pomoderacija* — oglas takoj viden, urednik naknadno skrije/odstrani problematične (hitrejše).
  - *Samo verificirani ponudniki* — strog način: prikažemo le oglase z NIP-05 / allowlist ponudnikov (najvišji nadzor, največ trenja).
- **Prijave uporabnikov (NIP-56):** obiskovalci prijavijo sporen oglas → gre v uredniško vrsto.
- **Samodejni filtri:** ključne besede, prepovedani izrazi, zaznava spama in podvajanja.
- **Blocklist:** kraj vzdržuje seznam skritih dogodkov/ponudnikov (event ID / pubkey), ki ga portal upošteva.

**Slike — ključni izziv:** v NIP-99 so slike običajno URL-ji na zunanjih gostiteljih, ne binarni podatki v dogodku. Zato:

- **Samo naš nalagalnik:** slike sprejmemo izključno prek lastnega medijskega nalagalnika (ne poljubnih zunanjih URL-jev). Tako gre vsaka slika skozi naš nadzor.
- **Samodejna moderacija slik:** ob nalaganju skozi vision API za zaznavo golote/nasilja/neprimerne vsebine; sporne slike se zavrnejo ali gredo v ročno potrditev.
- **Lasten/proxy medijski sloj:** slike serviramo iz našega predpomnilnika, da jih lahko kadarkoli umaknemo (tudi če je originalni URL zunaj).
- **CSAM (zakonsko obvezno):** hash-matching za znano gradivo in postopek prijave po zakonu — **gre v pravni pregled (pogl. 11).**

**Odgovornost:** portal je posrednik/oglasna deska; potrebni so pogoji uporabe, pravila oglaševanja in izjava o omejitvi odgovornosti (pravni pregled).

### 6.4 Izobraževanje (učne vsebine)

Samostojen zavihek **Izobraževanje**, kjer izvajalci (učitelji, društva, mentorji) objavijo ponudbo učnih vsebin — tečaje, delavnice, inštrukcije, spletne tečaje in učna gradiva. Vsaka objava je označena kot **brezplačno** ali **plačljivo**.

**Model (potrjeno): imenik ponudb.** Portal je imenik/oglasna deska izobraževalnih ponudb — **plačilo in dostava potekata zunaj** (kontakt, zunanja povezava, prijava pri izvajalcu). To ohranja MVP brez lastne infrastrukture in zunaj plačilne/izobraževalne regulative (nismo LMS ne plačilni posrednik).

**Kako to leže na Nostr:**

- **Ponudbe (tečaj, delavnica, inštrukcije, spletni tečaj)** → NIP-99 oglas (kind 30402), enak model kot tržnica, a z ločenim imenskim prostorom kategorij (`izobrazevanje-*`), dodatnim tagom **`format`** (delavnica / tečaj / v živo / spletno / individualno / gradivo) in oznako **brezplačno / plačljivo**.
- **Brezplačna pisna/video vsebina, ki živi na Nostr** (članek, vodič) → NIP-23 dolga objava (kind 30023), ki jo ponudba lahko poveže ali vsebuje.
- **Cena:** kot na tržnici — prikaže se le, če je vnesena; drugače »brezplačno« ali »po dogovoru«.

**Za izvajalca:** poveže se s svojim Nostr profilom → odda ponudbo prek obrazca (naslov, opis, format, kategorija, brezplačno/cena, povezava za prijavo/kontakt) → objavi kot NIP-99 dogodek z oznako kraja in kategorijo `izobrazevanje-*`.

**Za obiskovalca:** brska in filtrira po kategoriji, formatu in **brezplačno/plačljivo**; za stik/prijavo klikne povezavo ali kontaktira izvajalca prek Nostr (potrebuje profil). Prijavljeni lahko ponudbo **komentirajo** (NIP-22 — javna vprašanja, npr. o terminih ali vsebini) in oddajo všeček; komentarji so moderirani (razdelek 6.3). Zap (Lightning) je možen kot neobvezna napitnina/podpora.

**Predlagane kategorije izobraževanja:**

| Kategorija | Primeri |
|-----------|---------|
| 🗣️ **Jeziki** | tečaji tujih jezikov, konverzacija |
| 💻 **Računalništvo in digitalno** | osnove računalništva, spletna varnost, orodja |
| 🎨 **Glasba in umetnost** | inštrumenti, slikanje, ustvarjanje |
| 🌱 **Kmetijstvo in vrt** | ekološko vrtnarjenje, čebelarstvo, sadjarstvo |
| 🪵 **Obrt in rokodelstvo** | delavnice ročnih spretnosti |
| 🍲 **Kuhanje in gospodinjstvo** | kuharski tečaji, vlaganje |
| 🏃 **Šport in rekreacija** | vodene vadbe, tečaji |
| 🧒 **Za otroke in mladino** | učna pomoč, ustvarjalne delavnice |
| 📚 **Inštrukcije in učna pomoč** | individualne inštrukcije (šola, matura) |
| 💡 **Osebna rast in poklic** | mehke veščine, podjetništvo |
| 💰 **Finančna pismenost** | osebne finance, proračun, varčevanje, osnove investiranja |

**Zaupanje in moderacija:** enako kot tržnica (razdelek 6.3) — verificirani izvajalci (NIP-05), izbrani način moderacije, prijave (NIP-56), filtri, moderacija slik. Odgovornost za vsebino in izvedbo izobraževanja je na izvajalcu; portal je posrednik (pravni pregled, pogl. 11).

> Kasnejša nadgradnja (izven MVP): Lightning plačilo/napitnina neposredno izvajalcu (NIP-57) in — če se pokaže potreba — pravi paywall (zaklenjena vsebina), ki pa zahteva backend, avtentikacijo in obračun (lastna infrastruktura).

---

## 7. Interakcija in identiteta (osrednja zahteva)

- **Branje:** popolnoma odprto, brez prijave (portal viden vsem).
- **Interakcija (like / komentar / zap):** samo prek Nostr profila.
  - Prijava: NIP-07 (razširitev) za napredne; **NIP-46 / vgrajen »bunker«** za nove uporabnike, ki še nimajo ključev — ob prvem obisku lahko ustvarimo ključe in jih varno shranimo (npr. prek ponudnika signerja).
  - Like → NIP-25 reakcija na dogodek novice.
  - Komentar → NIP-22 komentar (nit) na dogodek.
  - Zap → NIP-57 Lightning mikro-donacija avtorju/viru/skupnosti.
- **Verificirani lokalni profili:** občina, šola, PGD ipd. dobijo NIP-05 (`obcina@ig.lokalna-skupnost.si`) za zaupanje.

**Onboarding tveganje:** ključni izziv je preprosta prijava za netehnično populacijo. Predlog: privzeto NIP-46 »poveži z enim klikom« + jasna razlaga, kaj je Nostr profil in zakaj (suverena identiteta, prenosljiva med aplikacijami).

### 7.1 Vloge in upravljanje ključev

Pomembno je ločiti **istovetnost, s katero se objavlja** (uredniška/admin identiteta kraja) od **navadnih uporabnikov**. Kdorkoli ima zasebni ključ (`nsec`) publisher identitete, lahko objavlja novice v imenu kraja; podpis dokazuje pristnost vira.

| Vloga | Ključ | Pravice |
|-------|-------|---------|
| **Bralec** | brez / lasten | Bere vse, brez prijave. |
| **Uporabnik** | lasten Nostr par | Like, komentar, zap (svoj profil). |
| **Urednik / admin** | lasten par na *allowlisti* zaupanja | Objavlja/kurira novice, moderira. |
| **Publisher (uradni glas kraja)** | skupni ključ na bunkerju | Samodejno zajete novice (ingest). |

**Izziv:** Nostr nima vgrajenega »več oseb na en račun« — identiteta *je* ključ. Deljenje surovega `nsec` med ljudmi je tvegano (ne veš, kdo je objavil; ključa ni mogoče preprosto »zamenjati«, saj je identiteta vezana nanj). Zato:

**A) Seznam zaupanja urednikov (priporočeno).** Vsak urednik ima svoj par ključev; v konfiguraciji kraja je allowlist njihovih javnih ključev. Portal prikaže novice od kateregakoli ključa s seznama. Prednosti: sledljivost (kdo je objavil), enostavno dodajanje/odvzem, kompromitiran ključ enega urednika ne ogrozi celote.

```yaml
nostr:
  uredniki_npub:            # seznam zaupanja — vsak urednik svoj ključ
    - "npub1_janez..."
    - "npub1_ana..."
  publisher_npub: "npub1_ig..."   # skupni "uradni" ključ samo za samodejni ingest
```

**B) Nsec bunker (NIP-46) za skupni ključ.** Če želimo en sam uradni glas kraja, naj `nsec` živi na signerju (bunkerju), ne pri posameznikih. Pooblaščeni uredniki prek bunkerja *zaprosijo za podpis*, ne da bi videli surovi ključ; dostop se centralno dodeli in odvzame.

**Praksa:** kombinacija — skupni publisher ključ (v bunkerju) za samodejni ingest + osebni ključi urednikov na allowlisti za ročno kuracijo in moderiranje. Navadni uporabniki nimajo posebnih pravic.

**Varnost:** `nsec` je kot geslo, ki ga ni mogoče resetirati — hraniti na bunkerju/hardveru, nikoli v kodi ali repozitoriju.

### 7.2 Domena in NIP-05 verifikacija

Lastna domena **tehnično ni nujna**, a je za produkcijsko storitev priporočljiva. Uporablja se za tri ločene stvari:

- **Portal (spletna stran):** deluje tudi na brezplačni poddomeni gostitelja (npr. `ls-ig.vercel.app`) — za demo zadošča. Za javno storitev lastna domena (`lokalna-skupnost.si`, kraji kot `ig.lokalna-skupnost.si`) pomeni zaupanje, prepoznavnost in neodvisnost od enega ponudnika. Ena domena pokrije vse kraje prek poddomen, kar ne ovira multi-kraj zasnove.
- **NIP-05 verifikacija (edini funkcionalni razlog za domeno):** človeku berljivi identifikatorji oblike `obcina@ig.lokalna-skupnost.si` — »modra kljukica« Nostra, ki dokazuje pristnost uradnega profila. Zahteva domeno z datoteko `/.well-known/nostr.json`. Brez lastne domene te verifikacije ni mogoče ponuditi (profili se še vedno prepoznajo po `npub`, le preverjenih imen ni).
- **Relay:** ni relevantno za MVP (javni relayji tečejo na svojih domenah). Šele opcijski gostovan/lasten relay bi želel svojo domeno (`relay.lokalna-skupnost.si`).

**Sklep:** za demo domena ni potrebna; za produkcijo priporočena — predvsem zaradi NIP-05 verifikacije uradnih lokalnih profilov (občina, šola, PGD) in kredibilnosti.

**Postopek pridobitve preverjene identitete (značka ✓).** Ločimo tehnični mehanizem in proces potrjevanja.

*Tehnično (NIP-05):*

1. Uporabnik ima svoj Nostr par ključev (`npub` / javni ključ).
2. Upravljavec doda vnos v `/.well-known/nostr.json` na domeni kraja (ime → javni ključ), npr. `obcina` → `pubkey…`.
3. Uporabnik v svojem profilu (kind 0) nastavi polje `nip05` na `ime@ig.lokalna-skupnost.si`.
4. Odjemalec ob prikazu preveri ujemanje in prikaže značko ✓.

Ključno: verifikacija je vredna toliko, kolikor je vreden **nadzor nad domeno** — ker `nostr.json` gostuje upravljavec, ta odloča o vnosu; zato je bistven spodnji proces.

*Proces — kaj mora prosilec dokazati (po vrstah profila):*

| Vrsta profila | Zahtevano dokazilo |
|---------------|--------------------|
| **Uradne institucije** (občina, šola, vrtec, PGD, društva) | zahteva z uradnega e-naslova/domene institucije ali uradni dopis; potrditev pooblaščene osebe. Najvišja stopnja zaupanja. |
| **Kmetje in obrtniki** (tržnica) | dokazilo o lokalni dejavnosti (npr. davčna/registrska št. ali naslov kmetije/dejavnosti) ali potrditev že verificiranega lokalnega sidra (občina, društvo). |
| **Izvajalci izobraževanj** | dokazilo o istovetnosti in povezavi s krajem; za občutljive teme (npr. finančna pismenost) po potrebi dodatno preverjanje. |
| **Navadni prebivalci** | verifikacija ni potrebna — všeček, komentar in zap delujejo z vsakim Nostr profilom; značko dobijo le tisti, ki želijo javno nastopati kot preverjeni ponudniki/institucije. |

*Pomen značke:* ✓ pomeni **»istovetnost je preverjena«**, ne »kakovost je zagotovljena«. Ugled in kakovost gradi ločeno **Web of Trust** (razdelek 7.4) — organsko prek mreže zaupanja, brez formalne verifikacije.

> Odprto vprašanje za naročnika: kdo izvaja preverjanje (upravljavec / lokalni uredniki), kje se hranijo dokazila (GDPR — pravni pregled, pogl. 11) in ali za posameznike zadošča »lažja« verifikacija prek lokalnega sidra.

### 7.3 Uporabniški vmesnik portala (UX)

Glavni elementi vmesnika (prikazani v mockupu `mockup-ig.html`):

**Navigacija — trije sklopi.** Portal ima tri zavihke: **📰 Novice**, **🛒 Tržnica** in **🎓 Izobraževanje**. Vsak ima svoj nabor kategorij za filtriranje; iskalnik (razdelek 4.2) deluje v aktivnem sklopu.

**Interakcije na karticah.** Novice, oglasi tržnice in učne ponudbe imajo enotne akcije: 🤍 všeček (NIP-25), 💬 **komentar** (NIP-22 — javno viden, moderiran), ⚡ zap (NIP-57); ponudbe imajo dodatno gumb za kontakt/prijavo. Vse akcije zahtevajo prijavo z Nostr; branje (vključno s komentarji) je odprto za vse.

**Subtilno pojasnilo Nostr.** V stranici je stalni panel **»Zakaj Nostr?«** (viden v vseh pogledih), ki na kratko izpostavi prednosti protokola (profil je res tvoj in prenosljiv, brez osrednjega lastnika/oglasov/sledenja, objave in stiki ostanejo tvoji). Panel in razdelek »Kako deluje« vodita na zunanjo podstran za več informacij: <https://nakojnu.si/orodja/nostr/>. Namen je nevsiljivo izobraževati obiskovalce, zakaj je interakcija vezana na Nostr profil.

**Izbirnik kraja (multi-kraj).** V glavi je spustni izbirnik kraja (npr. »📍 Ig ▾«). Obiskovalcu omogoča **preklop med kraji**; ob izbiri se naloži konfiguracija izbranega kraja (znamka, viri, oznaka `ls-<kraj>`, relayji). Vključuje tudi možnost »Predlagaj svoj kraj« (poveže se z modelom dodajanja krajev, razdelek 5.1). To je vidni izraz multi-kraj zasnove.

**Prijava in profil/račun meni.** Dokler obiskovalec ni prijavljen, je v glavi gumb »🔑 Poveži Nostr« (odpre izbiro NIP-07 / NIP-46 / ustvari profil). Po prijavi se gumb zamenja s **profilnim čipom** (avatar + skrajšan `npub`), ki odpre **račun meni**:

- Moj profil (ogled Nostr profila, NIP-05),
- Moje objave in oglasi / Moje učne ponudbe,
- Kopiraj `npub`,
- Nastavitve (relayji, ključi),
- Odjava.

**Obrazec za oddajo (oglas / učna ponudba).** Gumba »+ Dodaj oglas« (Tržnica) in »+ Dodaj ponudbo« (Izobraževanje) odpreta obrazec — dostopen le prijavljenim (sicer se najprej sproži prijava). Polja:

| Polje | Opomba |
|-------|--------|
| Naslov * | obvezno |
| Kategorija * | samodejno napolnjena glede na sklop (tržnica / izobraževanje) |
| Oblika izvedbe | le izobraževanje: delavnica / tečaj / v živo / spletno / individualno / gradivo |
| Brezplačno / plačljivo | le izobraževanje; ob »brezplačno« se cena skrije |
| Opis | prosto besedilo |
| Cena + valuta | neobvezno (EUR / sats); brez vnosa → »po dogovoru« |
| Lokacija | npr. Iška vas |
| Kontakt / povezava | telefon, e-pošta ali povezava za prijavo |
| Fotografije | nalaganje **prek našega nalagalnika** + samodejna moderacija (razdelek 6.3) |

Ob oddaji se vsebina sestavi v **podpisan NIP-99 dogodek** in objavi na relayje z oznako kraja (cevovod v 6.1 / 6.4).

### 7.4 Web of Trust in socialni dokaz

Ker vsa interakcija teče na Nostr, je socialni graf skupnosti na voljo »zastonj«. **Web of Trust (WoT)** ga izkoristi: zaupanje ne izhaja iz osrednje ocene, ampak iz tega, **komu zaupajo ljudje, ki jih uporabnik pozna/spremlja**. Za lokalno skupnost je to naravno — sosedje, društva in uradni profili tvorijo gosto mrežo zaupanja.

**Iz česa se WoT sestavi (obstoječi Nostr signali):**

- **Sledenja (NIP-02)** — temelj grafa; iz njega se izračuna »oddaljenost« do ponudnika/izvajalca.
- **Zaps (NIP-57)** — najmočnejši signal (stoji zanj denar): »zapnilo ga je N ljudi iz tvoje mreže«.
- **Všečki in komentarji (NIP-25 / NIP-22)** — lažji signali odobravanja.
- **Priporočila / oznake (NIP-32 labeling, NIP-51 seznami)** — eksplicitno vouchanje: uporabnik doda ponudnika na svoj javni seznam »Priporočam / Uporabljam«.
- **Prijave (NIP-56)** — negativni signal (spam, goljufija, neprimerna vsebina); glej moderacijo spodaj.
- **NIP-05 verifikacija + lokalna sidra zaupanja** — občina, društva, PGD delujejo kot izhodiščna sidra; kar ta sidra spremljajo/priporočajo, dobi večjo težo. Nov obiskovalec brez lastne mreže lahko »podeduje« zaupanje kraja.

**Kako koristi projektu:**

1. **Socialni dokaz na ponudbi/izobraževanju** — »🤝 Zaupa mu N ljudi iz tvoje mreže«, skupna poznanstva, »Priporoča: Čebelarsko društvo ✓«.
2. **Razvrščanje in filtriranje** — ponudbe/izvajalce rangiramo po WoT oceni (bližina v grafu + zaps + priporočila); filter »samo iz moje mreže zaupanja«.
3. **Moderacija brez centralizacije** — vsebina zunaj mreže zaupanja se lahko privzeto oznaci ali skrije; skupaj s prijavami (NIP-56) močno zmanjša spam brez ročnega pregleda vsega (dopolnjuje 6.3).
4. **Lokalna sidra** — uradni profili kot izhodiščna točka zaupanja za novince.

**Prijave (NIP-56):** vsak prijavljen uporabnik lahko prijavi sporno objavo/oglas/ponudbo (razlog: spam, goljufija, neprimerno …). Prijava je Nostr dogodek (kind 1984), pripet na prijavljeni dogodek/pubkey. Prijave se štejejo kot negativen WoT signal in gredo v uredniško vrsto (6.3). Več prijav iz mreže zaupanja lahko sproži samodejno skritje do pregleda.

**Eksplicitno dejanje »Priporočam / Uporabljam«:** ker dejanskih nakupov (denar, dostava zunaj portala) ne vidimo, avtomatskega »kdo je kupil« ni mogoče prikazati. Namesto tega uporabnik z javnim dejanjem označi ponudnika/ponudbo kot priporočeno (NIP-32/NIP-51). Tako nastane iskren socialni dokaz »kdo javno uporablja/priporoča«.

**Obseg po fazah:**

- *MVP (osnovno):* client-side izračun iz sledenj prijavljenega uporabnika + štetje zaps/všečkov/priporočil → prikaz »zaupa mu N iz tvoje mreže« in gumba »Priporočam«; prijave (NIP-56).
- *Nadgradnja:* pravo WoT ocenjevanje in rangiranje po grafu (globlji izračun, predpomnjenje), filter »samo mreža zaupanja«, trust-based samodejna moderacija.

**Zasebnost:** vsi ti signali so **javni po naravi Nostr** (sledenja, zaps, priporočila, prijave). To je treba jasno navesti v zasebnostni politiki (pravni pregled, pogl. 11).

---

## 8. Faze in časovnica

**Faza 0 — Priprava (1–2 tedna)**
Potrditi ime/domeno/blagovno znamko (dopolniti `BRAND.md`), izbrati javne relayje, ustvariti publisher (admin) identiteto za Ig, uskladiti scrape selektorje z živimi stranmi. **Brez postavljanja relaya.** (Dostop do FB opcijsko kasneje z admini.)
*Rezultat:* izbrani relayji + publisher ključ + konfiguracija `ig.yaml`.

**Faza 0.5 — Design in prototip (1–2 tedna)**
Določitev vizualnega designa pred razvojem: potrditev **vizualne identitete** (logotip, barve, tipografija, ton — v `BRAND.md`); izdelava **dizajnerskega sistema** (barvna paleta, tipografija, komponente: kartice, gumbi, značke, meniji); nadgradnja obstoječega `mockup-ig.html` v **klikabilni prototip** vseh sklopov (Novice, Tržnica, Izobraževanje, obrazec, profil, izbirnik kraja); poskrbeti za dostopnost in mobilni pogled. Prototip **potrdi naročnik** pred začetkom razvoja.
*Rezultat:* potrjena vizualna identiteta + dizajnerski sistem + potrjen klikabilni prototip.

**Faza 1 — MVP za Ig + multi-kraj temelj (3–5 tednov)**
Razvoj na podlagi **potrjenega designa (Faza 0.5)**. Ingest za osig.si (RSS) in obcina-ig.si, objava na **javne relayje**; portal s kronološkim/kategoriziranim pogledom; branje za vse; **iskalnik (client-side, razdelek 4.2)**; prijava z Nostr (NIP-07 + NIP-46); like in komentar (NIP-25/22); **osnovni UX: izbirnik kraja in profil/račun meni (razdelek 7.3)**. Konfiguracijski sistem za kraje. **Koda javna (odprtokodno) za samo-gostovanje.**
*Rezultat:* javni demo `ig.lokalna-skupnost.si`, brez lastne relay infrastrukture; javni repozitorij.

**Faza 2 — Zaps + dogodki + tržnica + izobraževanje + moderacija (4–6 tednov)**
NIP-57 zaps; koledar dogodkov (NIP-52); **lokalna tržnica za kmete in obrtnike (NIP-99, razdelek 6.1)** in **zavihek Izobraževanje — imenik učnih ponudb (NIP-99/NIP-23, razdelek 6.4)** z obrazcem za oddajo; **prijave spornih vsebin (NIP-56) in osnovni socialni dokaz / Web of Trust (razdelek 7.4)**; ročna kuracija FB vsebin prek uredniškega vmesnika. **Ocena potrebe po gostovanem/lastnem relayu** (za trajni arhiv in NIP-29 skupine).
*Rezultat:* polna interakcija, tržnica, izobraževanje, prijave in uredniški tok.

**Faza 3 — Skaliranje na več krajev + samopostrežba (odprto)**
Upravljan onboarding novih krajev prek konfiguracije; nato **samopostrežna registracija krajev** z varovali (preverjanje pristnosti, moderacija, zaščita pred lažnimi prevzemi — glej 5.1); onboarding lokalnih urednikov; obvestila; **napredno iskanje (NIP-50 / indeks, razdelek 4.2)**; **napredni Web of Trust — rangiranje po grafu in trust-based moderacija (razdelek 7.4)**; mobilni PWA.

---

## 9. Merila uspeha (KPI)

- Št. agregiranih virov in dnevnih objav na kraj.
- Št. bralcev (brez prijave) vs. Nostr interakcij.
- Čas do prilagoditve novega kraja (cilj < 1 dan).
- Delež novic z veljavno povezavo na vir (spoštovanje avtorskih pravic).
- Št. verificiranih lokalnih profilov (občina, šola, društva).

---

## 10. Tveganja in odprta vprašanja

| Tveganje | Vpliv | Ublažitev |
|----------|-------|-----------|
| Objava povzetkov iz virov (avtorske pravice/ToS) | Srednji (pravno) | Le naslov+povzetek+povezava z navedbo vira; brez polnega besedila; pravni pregled. |
| FB skupine — zaprte | Srednji | Adapter pripravljen, a onemogočen; vklop šele po dogovoru z admini (Graph API / ročno). |
| Avtorske pravice novic | Srednji | Povzetek + povezava; pisno dovoljenje za polne vsebine. |
| GDPR (osebni podatki v objavah/komentarjih) | Srednji | Politika zasebnosti, moderacija, minimalno zbiranje. |
| Nostr onboarding pretežek | Visok (uporaba) | NIP-46 »1-klik«, jasna navodila, lokalni uredniki kot ambasadorji. |
| Odvisnost od javnih relayjev (MVP) | Srednji | Objava na več relayjev (redundanca); možna nadgradnja na gostovan/lasten relay v fazi 2. |
| Trajnost arhiva na javnih relayjih | Srednji | Nekateri relayji brišejo stare dogodke → v fazi 2 dodati relay z garantiranim arhivom. |
| Omejena moderacija brez lastnega relaya | Nizek-srednji | Osnovno filtriranje na strani portala; NIP-29 skupine šele z (gostovanim) relayjem. |
| obcina-ig.si nima RSS | Nizek-srednji | Targeted scraper ali uradni feed od občine. |

**Odprta vprašanja za naročnika:**

1. Ime, domena in blagovna znamka (za `BRAND.md`).
2. **Potrjeno:** soglasij za RSS/scrape ne pridobivamo — objava povzetkov z navedbo vira. FB (zaprti skupini) se vklopi šele ob dogovoru z admini. Odprto: pravni pregled objave povzetkov.
3. Zaps — želimo Lightning donacije že v MVP ali kasneje?
4. Kdo bodo lokalni uredniki/moderatorji?
5. Relayji: **potrjeno — MVP na javnih relayjih brez lastnega.** Odprto ostane, kateri konkretni relayji in kdaj (če) preidemo na gostovan/lasten relay za arhiv in NIP-29 skupine.
6. Model krajev: **potrjeno — hibrid** (odprtokodno + osrednja gostovana instanca → kasneje samopostrežba). Odprto: licenca (MIT/AGPL), status osrednje instance (komercialna/neprofitna) in kriteriji za »prevzem« kraja.

---

## 11. Kaj potrebuje človeški pregled (pred izvedbo)

- **Pravno:** avtorske pravice na zajetih novicah, skladnost s Facebook pogoji, GDPR/politika zasebnosti; **odgovornost za vsebino oglasov na tržnici** (izjava o omejitvi odgovornosti, pravila oglaševanja, varstvo potrošnikov — portal je oglasna deska, ne prodajalec).
- **FB dostop (opcijsko, kasneje):** dogovor z admini skupin za vklop FB adapterja (Graph API / ročno).
- **Poslovno:** manjkajoči `PERSON.md`, `COMPANY.md`, `BRAND.md` (ton, cilji, omejitve).
- **Tehnične izbire:** relay in tehnološki sklad, strategija onboardinga (NIP-46 ponudnik), izbira javnih relayjev.

*Ta plan je osnutek za razpravo. Nobene zunanje akcije (objave, e-pošte, zajem) niso bile izvedene; potrebna je potrditev pred nadaljevanjem.*
