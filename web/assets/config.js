/*
 * Konfiguracija aktivnega kraja (demo faza).
 * V produkciji se ta objekt zgradi iz /config/kraji/<slug>.yaml.
 * Isti sistem, druga konfiguracija = drug kraj (multi-kraj zasnova).
 */
window.KRAJ = {
  ime: "Ig",
  slug: "ig",
  koordinate: [45.958, 14.527],
  jezik: "sl",
  branding: {
    logoEmoji: "🏡",
    barvaPrimarna: "#7b3fe4",   // Nostr vijolična
    barvaPoudarek: "#c471ed"
  },
  nostr: {
    // MVP: samo javni relayji, brez lastnega (primal odstranjen — ne streže poizvedb)
    relayPisanje: ["wss://relay.damus.io", "wss://nos.lol", "wss://nostr.mom"],
    relayBranje:  ["wss://relay.damus.io", "wss://nos.lol", "wss://nostr.mom"],
    oznaka: "ls-ig",             // filter po tagu (per-kraj)
    publisherNpub: "npub1_ig_TODO"
  },
  kategorijeNovic: ["obcina", "sola", "dogodki", "skupnost", "varnost"],
  trznica: {
    omogoceno: true,
    kategorije: ["pridelki", "domaci", "obrt", "storitve", "kmetija", "turizem", "rabljeno", "delo"],
    cene: "opcijsko",
    moderacija: "pomoderacija"
  },
  izobrazevanje: {
    omogoceno: true,
    kategorije: ["jeziki", "digitalno", "glasba", "kmetijstvo", "obrt", "kuhanje",
                 "sport", "otroci", "instrukcije", "osebna-rast", "financna"],
    formati: ["delavnica", "tecaj", "v-zivo", "spletno", "individualno", "gradivo"]
  },
  nostrInfoUrl: "https://nakojnu.si/orodja/nostr/"
};
