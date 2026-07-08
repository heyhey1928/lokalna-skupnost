/*
 * Nostr integracija (ES modul) — Lokalna skupnost
 * Uporablja nostr-tools prek ESM CDN (brez build koraka).
 * Izpostavi window.NostrLS z metodami za prijavo, objavo interakcij in branje.
 *
 * MVP: javni relayji (iz config.js), oznaka kraja iz config.js (npr. ls-ig).
 * NIP-07 = brskalniška razširitev; lokalni ključi = "ustvari profil" (demo/za test).
 * NIP-46 (bunker) = načrtovano (TODO).
 */
import {
  SimplePool, finalizeEvent, generateSecretKey, getPublicKey, nip19
} from "https://esm.sh/nostr-tools@2.10.4";

const K = window.KRAJ || {};
const N = K.nostr || {};
const RELAYS_R = N.relayBranje  || ["wss://relay.damus.io", "wss://nos.lol"];
const RELAYS_W = N.relayPisanje || RELAYS_R;
const OZNAKA   = N.oznaka || "ls-ig";
const pool = new SimplePool();

const state = { pubkey: null, sk: null, method: null };
const now = () => Math.floor(Date.now() / 1000);
const npubOf = (pk) => { try { return nip19.npubEncode(pk); } catch { return pk; } };

async function sign(unsigned) {
  if (state.method === "ext" && window.nostr) return await window.nostr.signEvent(unsigned);
  if (state.method === "local" && state.sk)   return finalizeEvent(unsigned, state.sk);
  throw new Error("Ni prijavljenega podpisnika");
}
async function publish(ev) {
  try { await Promise.any(pool.publish(RELAYS_W, ev)); } catch (e) { /* vsaj en relay je zavrnil */ }
  return ev;
}

const NostrLS = {
  relaysR: RELAYS_R, relaysW: RELAYS_W, oznaka: OZNAKA,
  get state() {
    return { pubkey: state.pubkey, npub: state.pubkey ? npubOf(state.pubkey) : null, method: state.method };
  },
  hasExtension() { return !!window.nostr; },

  async loginExtension() {
    if (!window.nostr) throw new Error("Ni zaznane Nostr razširitve (NIP-07).");
    state.pubkey = await window.nostr.getPublicKey();
    state.method = "ext";
    return this.state;
  },
  createAccount() {
    const sk = generateSecretKey();
    state.sk = sk; state.pubkey = getPublicKey(sk); state.method = "local";
    return { ...this.state, nsec: nip19.nsecEncode(sk) };
  },
  loginNsec(nsec) {
    const dec = nip19.decode(nsec);
    if (dec.type !== "nsec") throw new Error("Neveljaven nsec");
    state.sk = dec.data; state.pubkey = getPublicKey(dec.data); state.method = "local";
    return this.state;
  },
  logout() { state.pubkey = null; state.sk = null; state.method = null; },

  // NIP-25 reakcija (kind 7)
  async react(target, content = "+") {
    return publish(await sign({ kind: 7, created_at: now(),
      tags: [["e", target.id], ["p", target.pubkey], ["t", OZNAKA]], content }));
  },
  // NIP-22 komentar (kind 1111)
  async comment(target, text) {
    return publish(await sign({ kind: 1111, created_at: now(),
      tags: [["e", target.id], ["p", target.pubkey], ["t", OZNAKA]], content: text }));
  },
  // NIP-56 prijava sporne vsebine (kind 1984)
  async report(target, reason = "other") {
    return publish(await sign({ kind: 1984, created_at: now(),
      tags: [["e", target.id, reason], ["p", target.pubkey]], content: "" }));
  },
  // NIP-32 oznaka / vouch "priporočam" (kind 1985) — Web of Trust signal
  async recommend(target) {
    return publish(await sign({ kind: 1985, created_at: now(),
      tags: [["L", "ls/priporocam"], ["l", "priporocam", "ls/priporocam"],
             ["e", target.id], ["p", target.pubkey], ["t", OZNAKA]], content: "" }));
  },
  // NIP-02 seznam sledenj prijavljenega uporabnika (osnova za WoT — napredna faza)
  async fetchFollows() {
    if (!state.pubkey) return [];
    try {
      const ev = await pool.get(RELAYS_R, { kinds: [3], authors: [state.pubkey] });
      return ev ? (ev.tags || []).filter((t) => t[0] === "p").map((t) => t[1]) : [];
    } catch { return []; }
  },
  // NIP-99 oglas / učna ponudba (kind 30402)
  async publishListing({ d, title, summary, price, category, section, format, placljivo, place = OZNAKA, content = "" }) {
    const tags = [["d", d || String(now())], ["title", title], ["t", place]];
    if (section)  tags.push(["t", section]);
    if (category) tags.push(["t", category]);
    if (format)   tags.push(["t", "format:" + format]);
    if (typeof placljivo === "boolean") tags.push(["t", placljivo ? "placljivo" : "brezplacno"]);
    if (summary)  tags.push(["summary", summary]);
    if (price && price.amount) tags.push(["price", String(price.amount), price.currency || "EUR"]);
    return publish(await sign({ kind: 30402, created_at: now(), tags, content }));
  },
  // Branje novic kraja (NIP-23, kind 30023) po oznaki
  async fetchNews(limit = 50) {
    try { return await pool.querySync(RELAYS_R, { kinds: [30023], "#t": [OZNAKA], limit }); }
    catch { return []; }
  },
  npubOf
};

window.NostrLS = NostrLS;
window.dispatchEvent(new Event("nostr-ready"));
