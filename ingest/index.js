#!/usr/bin/env node
/*
 * Ingest servis — Lokalna skupnost
 * Zajem lokalnih virov -> normalizacija -> podpisani Nostr dogodki (NIP-23, kind 30023).
 *
 * Politika vsebine: objavimo NASLOV + KRATEK POVZETEK + POVEZAVO NA VIR (z navedbo vira),
 * NIKOLI celotnega besedila. Objavlja "publisher" (admin) ključ kraja.
 *
 * VARNO PRIVZETO: suhi tek (dry run). Objava na relayje samo z:
 *   PUBLISHER_NSEC=nsec1...   in   PUBLISH=1
 *
 * Viri:
 *   tip: rss     -> RSS feed (rss-parser)
 *   tip: scrape  -> zajem HTML (cheerio); selektorji v konfiguraciji (ali hevristika)
 *   tip: fb      -> Facebook adapter (privzeto onemogočen; glej adapters/facebook.js)
 *
 * Uporaba:
 *   KRAJ_SLUG=ig node index.js
 *   KRAJ_SLUG=ig PUBLISHER_NSEC=nsec1... PUBLISH=1 node index.js
 *   RSS_FILE=/pot/sample.xml node index.js         # test RSS iz datoteke
 *   SCRAPE_FILE=/pot/sample.html node index.js      # test scrape iz datoteke
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const RSSParser = require('rss-parser');
const cheerio = require('cheerio');
const YAML = require('yaml');
const { finalizeEvent, generateSecretKey, getPublicKey, nip19, SimplePool } = require('nostr-tools');
const fetchFacebook = require('./adapters/facebook');

const rss = new RSSParser();

function naloziKonfiguracijo(slug) {
  const p = path.join(__dirname, '..', 'config', 'kraji', slug + '.yaml');
  return YAML.parse(fs.readFileSync(p, 'utf8'));
}

function absURL(href, base) {
  if (!href) return '';
  try { return new URL(href, base).href; } catch { return href; }
}
function kratko(t, n = 280) { return (t || '').replace(/\s+/g, ' ').trim().slice(0, n); }
function plain(html) { return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim(); }

// --- RSS ---
async function zajemRss(vir, localFile) {
  const feed = localFile
    ? await rss.parseString(fs.readFileSync(localFile, 'utf8'))
    : await rss.parseURL(vir.url);
  return (feed.items || []).map((it) => {
    const telo = plain(it['content:encoded'] || it.content || '');
    const snippet = plain(it.contentSnippet || it.summary || '');
    // vzemi daljše/bolj informativno besedilo (prvi ~300 znakov), ne le "…"
    const povz = kratko(telo.length > snippet.length ? telo : (snippet || telo), 300);
    return {
      naslov: kratko(it.title, 200),
      povzetek: povz,
      telo: telo,
      url: it.link || it.guid || '',
      datum: it.isoDate ? Math.floor(new Date(it.isoDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
      kategorija: vir.kategorija || 'obcina',
      vir: vir.ime
    };
  });
}

// headless zajem (za JS-renderirane strani) — playwright je opcijski
async function fetchHtmlHeadless(url) {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { throw new Error('playwright ni nameščen (potreben za js_render vire)'); }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    return await page.content();
  } finally { await browser.close(); }
}

// preberi naslov / povzetek / datum iz posamezne strani članka (Open Graph + prvi odstavek)
async function metaClanka(url) {
  const $ = cheerio.load(await (await fetch(url)).text());
  const meta = (k) => $('meta[property="' + k + '"]').attr('content') || $('meta[name="' + k + '"]').attr('content') || '';
  const naslov = kratko(meta('og:title') || $('h1').first().text() || $('title').text() || '', 200);
  const pEl = $('.kv-vsebina p, article p, main p, .content p, .entry p, p')
    .filter((i, e) => plain($(e).text()).length > 40).first();
  const povzetek = kratko(meta('og:description') || plain(pEl.text()), 300);
  const dstr = meta('article:published_time') || meta('article:modified_time') || meta('og:updated_time') || $('time').attr('datetime') || '';
  const datum = dstr ? Math.floor(new Date(dstr).getTime() / 1000) : 0;
  // polno besedilo članka (za zaznavo datuma dogodka; ni objavljeno)
  const cont = $('.kv-vsebina, article, main, .content, .entry-content, .entry').first();
  let telo = cont.length ? plain(cont.text()) : $('p').map((i, e) => $(e).text()).get().join(' ');
  telo = plain(telo).slice(0, 5000);
  return { naslov, povzetek, datum, telo };
}

// --- SCRAPE ---
async function zajemScrape(vir, opts = {}) {
  let html;
  if (opts.file) html = fs.readFileSync(opts.file, 'utf8');
  else if (opts.html) html = opts.html;
  else if (vir.js_render) html = await fetchHtmlHeadless(vir.url);
  else html = await (await fetch(vir.url)).text();
  const $ = cheerio.load(html);

  // Način A: zbiranje po vzorcu povezave (npr. Gatsby s premešanimi razredi) — naslov/povzetek/datum iz članka
  if (vir.povezava_vzorec) {
    const seen = new Set(); const urls = [];
    $('a').each((_, a) => {
      const h = $(a).attr('href') || '';
      if (!h.includes(vir.povezava_vzorec)) return;
      const abs = absURL(h, vir.url);
      if (abs.replace(/\/$/, '') === vir.url.replace(/\/$/, '')) return; // indeksna stran
      if (seen.has(abs)) return; seen.add(abs); urls.push(abs);
    });
    const rez = [];
    for (const u of urls.slice(0, vir.maks || 30)) {
      try {
        const m = await metaClanka(u);
        if (m.naslov && m.naslov.length > 8) rez.push({ naslov: m.naslov, povzetek: m.povzetek, telo: m.telo, url: u, datum: m.datum, kategorija: vir.kategorija || 'obcina', vir: vir.ime });
      } catch (e) { /* preskoči */ }
    }
    return rez;
  }

  // Način B: selektorji na seznamu
  const s = vir.selektor || {};
  const $items = s.item ? $(s.item) : $('article, .novica, .news-item, .post, li:has(a)');
  const out = [];
  $items.each((_, node) => {
    const el = $(node);
    const $a = (s.povezava ? el.find(s.povezava) : el.find('a')).first();
    let naslov = s.naslov ? el.find(s.naslov).first().text() : ($a.text() || el.find('h1,h2,h3').first().text());
    naslov = kratko(naslov, 200);
    const url = absURL($a.attr('href'), vir.url);
    let povzetek = s.povzetek ? el.find(s.povzetek).first().text() : el.find('p').first().text();
    povzetek = kratko(povzetek);
    if (naslov && url && naslov.length > 8) out.push({ naslov, povzetek, url, datum: 0, kategorija: vir.kategorija || 'obcina', vir: vir.ime });
  });
  let rez = out.slice(0, vir.maks || 30);
  // dopolni povzetek/datum iz posameznega članka, kjer manjka
  if (vir.povzetek_iz_clanka) {
    for (const it of rez) {
      try {
        const m = await metaClanka(it.url);
        if (!it.povzetek || it.povzetek.length < 20) it.povzetek = m.povzetek;
        if (!it.datum) it.datum = m.datum;
        it.telo = m.telo;
      } catch (e) { /* preskoči */ }
    }
  }
  return rez;
}

function dedup(items) {
  const seen = new Set();
  return items.filter((i) => {
    const k = i.url || (i.vir + i.naslov);
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

// --- Zaznava koledarskih dogodkov (NIP-52) ---
const MES3 = { jan: 1, feb: 2, mar: 3, apr: 4, maj: 5, jun: 6, jul: 7, avg: 8, sep: 9, okt: 10, nov: 11, dec: 12 };
const DOGODEK_KW = /(prired|dogodek|dogodku|vabljen|vabimo|koncert|delavnic|sejem|veselic|razstav|predavanj|pohod|tekmovanj|kviz|sre[čc]anj|proslav|festival|nastop|praznovanj|akcij|krvodajal|delavnica|piknik|kolesarj|tek\b)/i;

function razcleniDatumi(text) {
  if (!text) return [];
  const t = text.toLowerCase(); const out = []; let m;
  let re = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g;                  // 8. 7. 2026
  while ((m = re.exec(t))) { const d = +m[1], mo = +m[2], y = +m[3]; if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) out.push({ y, mo, d }); }
  re = /(\d{1,2})\.\s*([a-zčšž]{3,})\s+(\d{4})/g;                   // 8. februar(ja) 2026
  while ((m = re.exec(t))) { const d = +m[1], mo = MES3[m[2].slice(0, 3)], y = +m[3]; if (mo) out.push({ y, mo, d }); }
  return out;
}

function zaznajDogodek(item) {
  const besedilo = (item.naslov || '') + ' ' + (item.telo || item.povzetek || '');
  const jeDogodek = item.kategorija === 'dogodki' || DOGODEK_KW.test(besedilo);
  if (!jeDogodek) return null;
  const zdaj = Math.floor(Date.now() / 1000) - 86400;
  const kand = razcleniDatumi(besedilo)
    .map((d) => ({ d, ts: Math.floor(Date.UTC(d.y, d.mo - 1, d.d) / 1000) }))
    .filter((x) => x.ts >= zdaj)
    .sort((a, b) => a.ts - b.ts);
  if (!kand.length) return null;
  const { d } = kand[0];
  return { start: d.y + '-' + String(d.mo).padStart(2, '0') + '-' + String(d.d).padStart(2, '0'), ts: kand[0].ts };
}

// NIP-52 koledarski dogodek (kind 31922 — datumski)
function sestaviDogodek52(item, dog, cfg) {
  const oznaka = (cfg.nostr && cfg.nostr.oznaka) || 'ls';
  const d = crypto.createHash('sha256').update('dogodek:' + (item.url || item.naslov)).digest('hex').slice(0, 32);
  return {
    kind: 31922,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', d],
      ['title', item.naslov],
      ['start', dog.start],
      ['t', oznaka],
      ['t', 'dogodek'],
      ['r', item.url || ''],
      ['source', item.vir],
      ['client', 'lokalna-skupnost-ingest']
    ],
    content: item.povzetek || item.naslov
  };
}

// --- NIP-23 dogodek z navedbo vira ---
function sestaviDogodek(item, cfg) {
  const oznaka = (cfg.nostr && cfg.nostr.oznaka) || 'ls';
  const d = crypto.createHash('sha256').update(item.url || item.naslov).digest('hex').slice(0, 32);
  const cas = item.datum || Math.floor(Date.now() / 1000);   // pravi datum objave (stabilen vrstni red, brez dnevnega premikanja)
  return {
    kind: 30023,
    created_at: cas,
    tags: [
      ['d', d],
      ['title', item.naslov],
      ['summary', item.povzetek],      // čist povzetek (prvi del besedila)
      ['published_at', String(cas)],
      ['t', oznaka],
      ['t', item.kategorija],
      ['r', item.url],                 // povezava na vir (klikabilna v portalu)
      ['source', item.vir],            // ime vira (navedba)
      ['client', 'lokalna-skupnost-ingest']
    ],
    content: item.povzetek || item.naslov   // čisto besedilo; vir/povezava sta v tagih
  };
}

async function main() {
  const slug = process.env.KRAJ_SLUG || 'ig';
  const rssFile = process.env.RSS_FILE || null;
  const scrapeFile = process.env.SCRAPE_FILE || null;
  const doPublish = process.env.PUBLISH === '1' && !!process.env.PUBLISHER_NSEC;

  const cfg = naloziKonfiguracijo(slug);
  console.log(`[ingest] kraj=${slug} oznaka=${cfg.nostr && cfg.nostr.oznaka} objava=${doPublish ? 'DA' : 'suhi tek'}`);

  let sk;
  if (process.env.PUBLISHER_NSEC) sk = nip19.decode(process.env.PUBLISHER_NSEC).data;
  else { sk = generateSecretKey(); console.log('[ingest] PUBLISHER_NSEC ni nastavljen — začasen ključ (samo prikaz).'); }
  const pk = getPublicKey(sk);
  console.log(`[ingest] publisher npub: ${nip19.npubEncode(pk)}`);

  let postavke = [];
  for (const vir of (cfg.viri || [])) {
    try {
      if (vir.tip === 'rss') {
        const p = await zajemRss(vir, rssFile);
        console.log(`[ingest] RSS ${vir.ime}: ${p.length}`); postavke = postavke.concat(p);
        if (rssFile) break;
      } else if (vir.tip === 'scrape') {
        const p = await zajemScrape(vir, { file: scrapeFile });
        console.log(`[ingest] SCRAPE ${vir.ime}: ${p.length}`); postavke = postavke.concat(p);
        if (scrapeFile) break;
      } else if (vir.tip === 'fb') {
        const p = await fetchFacebook(vir);
        console.log(`[ingest] FB ${vir.ime}: ${p.length}`); postavke = postavke.concat(p);
      } else {
        console.log(`[ingest] neznan tip vira: ${vir.tip} (${vir.ime})`);
      }
    } catch (e) { console.warn(`[ingest] napaka pri viru ${vir.ime}: ${e.message}`); }
  }
  postavke = dedup(postavke);
  console.log(`[ingest] skupaj po dedup: ${postavke.length}`);

  // Starostni filter: izpusti prestare novice (kjer je datum znan)
  const maxDni = cfg.max_starost_dni || 0;
  if (maxDni) {
    const meja = Math.floor(Date.now() / 1000) - maxDni * 86400;
    const pred = postavke.length;
    postavke = postavke.filter((it) => !it.datum || it.datum >= meja);
    console.log(`[ingest] starostni filter (${maxDni} dni): ${pred} -> ${postavke.length}`);
  }

  const dogodki = postavke.map((it) => finalizeEvent(sestaviDogodek(it, cfg), sk));

  // Zaznaj koledarske dogodke (NIP-52) med vsemi viri
  const koledar = postavke
    .map((it) => ({ it, dg: zaznajDogodek(it) }))
    .filter((x) => x.dg)
    .map((x) => finalizeEvent(sestaviDogodek52(x.it, x.dg, cfg), sk));
  console.log(`[ingest] zaznanih koledarskih dogodkov (NIP-52): ${koledar.length}`);

  if (!doPublish) {
    if (dogodki[0]) { console.log('[ingest] SUHI TEK — primer novice:'); console.log(JSON.stringify(dogodki[0], null, 2)); }
    console.log(`[ingest] zgrajenih: ${dogodki.length} novic + ${koledar.length} dogodkov (avtor ${nip19.npubEncode(pk).slice(0, 14)}…). Ni objavljeno.`);
    return;
  }
  const pool = new SimplePool();
  const relays = (cfg.nostr && cfg.nostr.relay_pisanje) || [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let ok = 0, zavrnjeni = 0, primerZavrnitve = '';
  for (const ev of dogodki) {
    const res = await Promise.allSettled(pool.publish(relays, ev));
    const sprejet = res.some((r) => r.status === 'fulfilled');
    if (sprejet) ok++; else {
      zavrnjeni++;
      if (!primerZavrnitve) primerZavrnitve = String((res.find((r) => r.status === 'rejected') || {}).reason || 'neznano');
    }
    await sleep(1000);   // 1 s zamik — izogib rate-limitu relayjev
  }
  console.log(`[ingest] sprejeto na vsaj enem relayju: ${ok}/${dogodki.length} (relayji: ${relays.join(', ')})`
    + (zavrnjeni ? `; ZAVRNJENIH: ${zavrnjeni} (primer razloga: ${primerZavrnitve})` : ''));

  const oznakaKraja = (cfg.nostr && cfg.nostr.oznaka) || 'ls';

  // Čiščenje zastarelih objav (NIP-09): izbriši dogodke kraja, ki jih v tem teku ni več
  try {
    await sleep(1500);
    const trenutniD = new Set(dogodki.map((e) => (e.tags.find((t) => t[0] === 'd') || [])[1]));
    const obstojeci = await pool.querySync(relays, { kinds: [30023], authors: [pk], '#t': [oznakaKraja], limit: 500 });
    const zaBrisanje = obstojeci.filter((e) => { const dt = (e.tags.find((t) => t[0] === 'd') || [])[1]; return dt && !trenutniD.has(dt); });
    for (const e of zaBrisanje) {
      const del = finalizeEvent({ kind: 5, created_at: Math.floor(Date.now() / 1000), tags: [['e', e.id]], content: 'zastarelo' }, sk);
      await Promise.allSettled(pool.publish(relays, del));
      await sleep(300);
    }
    console.log(`[ingest] pobrisanih zastarelih (NIP-09): ${zaBrisanje.length}`);
  } catch (e) { console.log(`[ingest] čiščenje ni uspelo: ${e.message}`); }

  // Objava koledarskih dogodkov (NIP-52) + čiščenje zastarelih dogodkov
  let dOk = 0;
  for (const ev of koledar) {
    const res = await Promise.allSettled(pool.publish(relays, ev));
    if (res.some((r) => r.status === 'fulfilled')) dOk++;
    await sleep(1000);
  }
  console.log(`[ingest] objavljenih dogodkov (NIP-52): ${dOk}/${koledar.length}`);
  try {
    await sleep(1500);
    const trenutniDe = new Set(koledar.map((e) => (e.tags.find((t) => t[0] === 'd') || [])[1]));
    const obstDogodki = await pool.querySync(relays, { kinds: [31922, 31923], authors: [pk], '#t': [oznakaKraja], limit: 500 });
    const brisDe = obstDogodki.filter((e) => { const dt = (e.tags.find((t) => t[0] === 'd') || [])[1]; return dt && !trenutniDe.has(dt); });
    for (const e of brisDe) {
      const del = finalizeEvent({ kind: 5, created_at: Math.floor(Date.now() / 1000), tags: [['e', e.id]], content: 'zastarel dogodek' }, sk);
      await Promise.allSettled(pool.publish(relays, del));
      await sleep(300);
    }
    if (brisDe.length) console.log(`[ingest] pobrisanih zastarelih dogodkov: ${brisDe.length}`);
  } catch (e) { console.log(`[ingest] čiščenje dogodkov ni uspelo: ${e.message}`); }

  // Preverjanje berljivosti takoj po objavi (diagnostika)
  await sleep(2500);
  for (const r of relays) {
    try {
      const poAvtorju = await pool.querySync([r], { kinds: [30023], authors: [pk], limit: 200 });
      const poOznaki = await pool.querySync([r], { kinds: [30023], '#t': [oznakaKraja], limit: 200 });
      console.log(`[ingest] BRANJE ${r} → po avtorju: ${poAvtorju.length}, po oznaki(${oznakaKraja}): ${poOznaki.length}`);
    } catch (e) { console.log(`[ingest] BRANJE ${r} → NAPAKA: ${e.message}`); }
  }
  pool.close(relays);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { naloziKonfiguracijo, zajemRss, zajemScrape, dedup, sestaviDogodek };
