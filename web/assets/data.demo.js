/*
 * Demo podatki (faza z demo vsebino).
 * V naslednjem koraku bo portal kartice izrisoval iz teh polj,
 * kasneje pa iz pravih Nostr dogodkov (NIP-23 / NIP-99), branih z relayjev.
 * Vsa vsebina je izmišljena — označena z [PRIMER].
 */
window.DEMO = {
  novice: [
    { vir: "Občina Ig", kratica: "OI", tip: "obcina", verificiran: true, vir_sub: "obcina-ig.si · pred 2 urama",
      naslov: "[PRIMER] Obvestilo o zapori ceste zaradi obnove",
      povzetek: "Kratek povzetek novice, samodejno zajet iz vira. Celotno besedilo je na izvirni strani.",
      povezava: "#", like: 12, komentarji: 3, zap: 210 },
    { vir: "Morostig", kratica: "MO", tip: "dogodki", verificiran: true, vir_sub: "morostig.si · zajem · pred 1 dnevom",
      naslov: "[PRIMER] Vodeni ogledi kolišča ob koncu tedna",
      povzetek: "Novice in dogodki Hiše narave in kolišč (zajem rubrike »Aktualno«).",
      povezava: "#", like: 21, komentarji: 3, zap: 140 },
    { vir: "OŠ Ig", kratica: "OŠ", tip: "sola", verificiran: true, vir_sub: "osig.si · RSS · pred 5 urami",
      naslov: "[PRIMER] Zaključna prireditev in roditeljski sestanki",
      povzetek: "Povzetek objave iz šolskega RSS vira (samodejni zajem).",
      povezava: "#", like: 28, komentarji: 7, zap: 0 },
    { vir: "Vrtec Ig", kratica: "VI", tip: "sola", verificiran: true, vir_sub: "vrtec-ig.si · zajem · pred 8 urami",
      naslov: "[PRIMER] Vpis novincev za jesen — obvestilo staršem",
      povzetek: "Povzetek obvestila vrtca (zajem strani).",
      povezava: "#", like: 16, komentarji: 2, zap: 0 },
    { vir: "Informirani in varni na Igu", kratica: "IV", tip: "varnost", verificiran: false, vir_sub: "FB skupina · ročno kurirano · pred 2 dnevoma",
      naslov: "[PRIMER] Opozorilo o vlomih — bodite pozorni",
      povzetek: "Varnostna obvestila zbrana v enem kanalu, uredniško potrjena.",
      povezava: "#", like: 67, komentarji: 9, zap: 0 }
  ],
  trznica: [
    { kat: "pridelki", emoji: "🍯", ozadje: "#fdecc8", naslov: "[PRIMER] Domači cvetlični med, 900 g",
      cena: "7,50 €", prodajalec: "Čebelarstvo Novak", verificiran: true, lokacija: "Iška vas" },
    { kat: "domaci", emoji: "🍓", ozadje: "#fde0dc", naslov: "[PRIMER] Domača marmelada in sokovi",
      cena: "4 €", prodajalec: "Ana — domača kuhinja", verificiran: false, lokacija: "Iška" },
    { kat: "obrt", emoji: "🪑", ozadje: "#e9e2d0", naslov: "[PRIMER] Ročno izdelani leseni stoli",
      cena: "od 85 €", prodajalec: "Mizarstvo Kovač", verificiran: true, lokacija: "Golo" },
    { kat: "rabljeno", emoji: "🚲", ozadje: "#e6ece0", naslov: "[PRIMER] Otroško kolo, dobro ohranjeno",
      cena: null, prodajalec: "Simona P.", verificiran: false, lokacija: "Ig" }
  ],
  izobrazevanje: [
    { kat: "jeziki", emoji: "🇬🇧", ozadje: "#e3e6f7", format: "Tečaj · v živo", placljivo: true,
      naslov: "[PRIMER] Tečaj angleščine za odrasle", cena: "60 € / mesec",
      izvajalec: "Marija — jezikovna šola", verificiran: true, lokacija: "Ig · 1×/teden" },
    { kat: "financna", emoji: "📊", ozadje: "#dcece0", format: "Delavnica · v živo", placljivo: false,
      naslov: "[PRIMER] Osnove osebnih financ in proračuna", cena: null,
      izvajalec: "Društvo za finančno opismenjevanje", verificiran: false, lokacija: "Ig · večerna delavnica" },
    { kat: "instrukcije", emoji: "➗", ozadje: "#fdf3c8", format: "Individualno", placljivo: true,
      naslov: "[PRIMER] Inštrukcije matematike (OŠ in SŠ)", cena: "12 € / ura",
      izvajalec: "Luka — inštruktor", verificiran: false, lokacija: "Ig ali na daljavo" },
    { kat: "digitalno", emoji: "🔐", ozadje: "#d6f0f3", format: "Gradivo · spletno", placljivo: false,
      naslov: "[PRIMER] Osnove spletne varnosti — vodič", cena: null,
      izvajalec: "Informirani in varni na Igu", verificiran: false, lokacija: "spletno gradivo (NIP-23)" }
  ],
  dogodki: [
    { dan: "04", mesec: "Jul", ime: "[PRIMER] Krajevni sejem", kje: "Center Iga · 9:00" },
    { dan: "12", mesec: "Jul", ime: "[PRIMER] Čistilna akcija", kje: "Iška vas · 8:00" },
    { dan: "20", mesec: "Jul", ime: "[PRIMER] Koncert na prostem", kje: "Grad Ig · 20:00" }
  ]
};
