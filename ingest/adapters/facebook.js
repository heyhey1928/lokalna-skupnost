/*
 * Facebook adapter — PRIPRAVA za prihodnji uvoz (privzeto ONEMOGOČEN).
 * ----------------------------------------------------------------------
 * Ižanski klepet in "Informirani in varni na Igu" sta ZAPRTI skupini:
 * brez dogovora z administratorji ju ni mogoče (in ni dovoljeno) samodejno zajemati.
 *
 * Ko bo urejeno z administratorji, sta smiselni poti:
 *
 *  A) Facebook Graph API (priporočeno, uradno)
 *     - Deluje najbolje za Facebook STRANI (Page), ne za osebne skupine
 *       (API za skupine je zelo omejen). Dogovor: admini objave dajo na Page,
 *       ali ustvarijo Page kot uradni kanal skupnosti.
 *     - Potreben je dolgotrajni access token (secret v okolju) in pregled aplikacije.
 *     - Klic: GET /{page_id}/posts?fields=message,permalink_url,created_time
 *
 *  B) Ročni / polavtomatski uvoz
 *     - Admin (ali urednik z Nostr profilom) izbrane objave potrdi/uvozi
 *       prek uredniškega vmesnika. Brez scrapinga zaprtih vsebin.
 *
 * Konfiguracija vira (config/kraji/<slug>.yaml), primer:
 *   - tip: fb
 *     ime: "Informirani in varni na Igu"
 *     enabled: false            # vklopi šele po dogovoru z admini
 *     nacin: "graph"            # graph | rocno
 *     page_id: ""               # ID Facebook strani (Page)
 *     token_env: "FB_TOKEN_VARNOST"   # ime okoljske spremenljivke s tokenom
 *     kategorija: "varnost"
 *
 * Vrne enotno obliko: [{ naslov, povzetek, url, datum, kategorija, vir }]
 * (Politika ostane enaka: naslov + povzetek + povezava, z navedbo vira.)
 */
module.exports = async function fetchFacebook(vir) {
  if (!vir || !vir.enabled) {
    console.log(`[fb] ${vir && vir.ime}: onemogočeno (uredi z administratorji, nato enabled: true).`);
    return [];
  }
  if (vir.nacin === 'rocno') {
    // Ročni uvoz teče prek uredniškega vmesnika, ne tukaj.
    console.log(`[fb] ${vir.ime}: način "rocno" — uvoz prek uredniškega vmesnika.`);
    return [];
  }

  // nacin === 'graph'
  const token = process.env[vir.token_env || 'FB_ACCESS_TOKEN'];
  if (!token) { console.warn(`[fb] ${vir.ime}: manjka access token (${vir.token_env || 'FB_ACCESS_TOKEN'}).`); return []; }
  if (!vir.page_id) { console.warn(`[fb] ${vir.ime}: manjka page_id.`); return []; }

  // TODO (ob vklopu): dejanski klic Graph API in normalizacija.
  // const url = `https://graph.facebook.com/v20.0/${vir.page_id}/posts` +
  //   `?fields=message,permalink_url,created_time&limit=20&access_token=${token}`;
  // const data = await (await fetch(url)).json();
  // return (data.data || []).map(p => ({
  //   naslov: (p.message || '').split('\n')[0].slice(0, 200),
  //   povzetek: (p.message || '').slice(0, 280),
  //   url: p.permalink_url,
  //   datum: Math.floor(new Date(p.created_time).getTime() / 1000),
  //   kategorija: vir.kategorija || 'skupnost',
  //   vir: vir.ime
  // }));

  console.log(`[fb] ${vir.ime}: Graph API pot pripravljena (TODO: implementacija ob vklopu).`);
  return [];
};
