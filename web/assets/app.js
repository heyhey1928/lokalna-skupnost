// ===== DINAMIČEN IZRIS IZ DEMO PODATKOV (config.js + data.demo.js) =====
(function(){
  var D = window.DEMO || {}, K = window.KRAJ || {};
  // branding iz konfiguracije kraja
  if (K.branding){
    if (K.branding.barvaPrimarna) document.documentElement.style.setProperty('--terra', K.branding.barvaPrimarna);
    if (K.branding.barvaPoudarek) document.documentElement.style.setProperty('--ocher', K.branding.barvaPoudarek);
  }
  if (K.ime){ var ki=document.getElementById('krajIme'); if(ki) ki.textContent=K.ime; }

  function el(h){ var t=document.createElement('template'); t.innerHTML=h.trim(); return t.content.firstChild; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function zn(v){ return v ? ' <span class="znacka" title="NIP-05">&#10003;</span>' : ''; }
  function ini(name){ var p=String(name||'').replace(/[^A-Za-zČŠŽčšž ]/g,'').trim().split(/\s+/); return ((p[0]||'?')[0]+((p[1]||'')[0]||'')).toUpperCase(); }
  function pseudo(s){ return (String(s).length % 18) + 4; }

  var labN={obcina:'Občina',sola:'Šola',dogodki:'Dogodki',skupnost:'Skupnost',varnost:'Varnost'};
  var katT={pridelki:'🥕 Pridelki',domaci:'🍯 Domači izdelki',obrt:'🪵 Obrt',storitve:'🔧 Storitve',kmetija:'🐔 Kmetija',turizem:'🏡 Turizem',rabljeno:'♻️ Rabljeno',delo:'💼 Delo'};
  var katI={jeziki:'🗣️ Jeziki',digitalno:'💻 Digitalno',glasba:'🎨 Glasba',kmetijstvo:'🌱 Kmetijstvo',obrt:'🪵 Obrt',kuhanje:'🍲 Kuhanje',sport:'🏃 Šport',otroci:'🧒 Otroci',instrukcije:'📚 Inštrukcije','osebna-rast':'💡 Osebna rast',financna:'💰 Finance'};

  // NOVICE
  var fN=document.getElementById('feedNovice');
  if(fN && D.novice){ fN.innerHTML=''; D.novice.forEach(function(n){
    fN.appendChild(el(
      '<article class="karta" data-kat="'+n.tip+'">'+
        '<div class="karta-glava"><div class="vir '+n.tip+'">'+esc(n.kratica)+'</div>'+
          '<div class="vir-meta"><div class="vir-ime">'+esc(n.vir)+zn(n.verificiran)+'</div>'+
          '<div class="vir-sub">'+esc(n.vir_sub)+'</div></div>'+
          '<span class="oznaka-kat">'+esc(labN[n.tip]||n.tip)+'</span></div>'+
        '<div class="karta-telo"><h3>'+esc(n.naslov)+'</h3><p>'+esc(n.povzetek)+'</p>'+
          '<a class="vir-link" href="'+esc(n.povezava)+'">Preberi →</a></div>'+
        '<div class="karta-noga">'+
          '<button class="akcija like" data-akcija="like"><span>🤍</span><span class="n">'+(n.like||0)+'</span></button>'+
          '<button class="akcija" data-akcija="komentar"><span>💬</span><span class="n">'+(n.komentarji||0)+'</span></button>'+
          '<button class="akcija zap" data-akcija="zap"><span>⚡</span><span class="n">'+(n.zap||0)+'</span></button>'+
        '</div></article>'));
  }); }

  // TRŽNICA
  var fT=document.getElementById('oglasi');
  if(fT && D.trznica){ fT.innerHTML=''; D.trznica.forEach(function(o){
    var cena = o.cena ? '<div class="cena">'+esc(o.cena)+'</div>' : '<div class="cena dogovor">Po dogovoru</div>';
    fT.appendChild(el(
      '<article class="oglas" data-kat="'+o.kat+'">'+
        '<div class="oglas-slika" style="background:'+esc(o.ozadje)+'"><span class="oglas-kat">'+esc(katT[o.kat]||o.kat)+'</span>'+esc(o.emoji)+'</div>'+
        '<div class="oglas-telo"><h3>'+esc(o.naslov)+'</h3>'+cena+
          '<div class="prodajalec"><span class="av">'+ini(o.prodajalec)+'</span><div><div class="ime">'+esc(o.prodajalec)+zn(o.verificiran)+'</div><div class="loc">📍 '+esc(o.lokacija)+'</div></div></div></div>'+
        '<div class="oglas-noga"><button class="btn-kontakt" data-akcija="kontakt">✉️ Kontakt</button>'+
          '<button class="akcija" data-akcija="komentar"><span>💬</span><span class="n">3</span></button>'+
          '<button class="akcija like" data-akcija="like"><span>🤍</span><span class="n">'+pseudo(o.naslov)+'</span></button>'+
          '<button class="akcija zap" data-akcija="zap"><span>⚡</span></button></div></article>'));
  }); }

  // IZOBRAŽEVANJE
  var fI=document.getElementById('ucnePonudbe');
  if(fI && D.izobrazevanje){ fI.innerHTML=''; D.izobrazevanje.forEach(function(o){
    var free = !o.placljivo;
    var cena = free ? '<div class="cena dogovor">Brezplačno</div>' : (o.cena ? '<div class="cena">'+esc(o.cena)+'</div>' : '<div class="cena dogovor">Po dogovoru</div>');
    var pill = '<div class="izo-znacke"><span class="pill format">'+esc(o.format)+'</span>'+(free?'<span class="pill free">Brezplačno</span>':'<span class="pill paid">Plačljivo</span>')+'</div>';
    fI.appendChild(el(
      '<article class="oglas" data-kat="'+o.kat+'" data-placilo="'+(free?'brezplacno':'placljivo')+'">'+
        '<div class="oglas-slika" style="background:'+esc(o.ozadje)+'"><span class="oglas-kat">'+esc(katI[o.kat]||o.kat)+'</span>'+esc(o.emoji)+'</div>'+
        '<div class="oglas-telo">'+pill+'<h3>'+esc(o.naslov)+'</h3>'+cena+
          '<div class="prodajalec"><span class="av">'+ini(o.izvajalec)+'</span><div><div class="ime">'+esc(o.izvajalec)+zn(o.verificiran)+'</div><div class="loc">📍 '+esc(o.lokacija)+'</div></div></div></div>'+
        '<div class="oglas-noga"><button class="btn-kontakt" data-akcija="kontakt">✉️ Prijava</button>'+
          '<button class="akcija" data-akcija="komentar"><span>💬</span><span class="n">4</span></button>'+
          '<button class="akcija like" data-akcija="like"><span>🤍</span><span class="n">'+pseudo(o.naslov)+'</span></button>'+
          '<button class="akcija zap" data-akcija="zap"><span>⚡</span></button></div></article>'));
  }); }

  // DOGODKI (stranica)
  var dg=document.querySelector('#stranNovice .panel-telo');
  if(dg && D.dogodki){ dg.innerHTML=''; D.dogodki.forEach(function(e){
    dg.appendChild(el('<div class="dogodek"><div class="datum"><div class="d">'+esc(e.dan)+'</div><div class="m">'+esc(e.mesec)+'</div></div><div><div class="dogodek-ime">'+esc(e.ime)+'</div><div class="dogodek-loc">'+esc(e.kje)+'</div></div></div>'));
  }); }
})();

var prijavljen=false, mask=document.getElementById('mask'), maskForm=document.getElementById('maskForm'), toast=document.getElementById('toast');
  function pokaziToast(t){toast.textContent=t;toast.classList.add('viden');clearTimeout(toast._t);toast._t=setTimeout(function(){toast.classList.remove('viden')},2600);}
  function odpriModal(){mask.classList.add('odprt')} function zapriModal(){mask.classList.remove('odprt')}

  document.getElementById('btnPrijava').addEventListener('click',odpriModal);
  document.getElementById('zapriModal').addEventListener('click',zapriModal);
  mask.addEventListener('click',function(e){if(e.target===mask)zapriModal()});
  function osveziProfil(){
    var s=(window.NostrLS&&window.NostrLS.state)||{};
    if(s.npub){var chip=document.getElementById('profilChip');
      chip.querySelector('.npub').textContent=s.npub.slice(0,9)+'…'+s.npub.slice(-4);
      chip.querySelector('.av').textContent=s.npub.slice(4,6).toUpperCase();}
  }
  function poPrijavi(msg){prijavljen=true;zapriModal();
    document.getElementById('btnPrijava').style.display='none';
    document.getElementById('profilChip').style.display='flex';
    osveziProfil();pokaziToast(msg);}
  document.querySelectorAll('#mask .opcija').forEach(function(o){o.addEventListener('click',function(){
    var nacin=o.dataset.nacin, NS=window.NostrLS;
    Promise.resolve().then(function(){
      if(nacin==='ext'){
        if(NS&&NS.hasExtension()) return NS.loginExtension().then(function(){poPrijavi('Povezan prek razširitve (NIP-07) ✓');});
        if(NS)NS.createAccount(); poPrijavi('Ni zaznane razširitve — ustvarjen začasen profil (demo)');
      } else if(nacin==='nov'){ if(NS)NS.createAccount(); poPrijavi('Ustvarjen nov Nostr profil ✓'); }
      else { if(NS)NS.createAccount(); poPrijavi('NIP-46 (bunker) pride kmalu — začasen profil (demo)'); }
    }).catch(function(err){pokaziToast('Napaka pri prijavi: '+(err&&err.message||err));});
  });});
  // branje realnih novic kraja (NIP-23) — ne zahteva prijave
  var realNalozeno=false;
  function labNaslov(t){return {obcina:'Občina',sola:'Šola',dogodki:'Dogodki',skupnost:'Skupnost',varnost:'Varnost'}[t]||t;}
  function tagVal(ev,k){var f=(ev.tags||[]).find(function(x){return x[0]===k;});return f?f[1]:'';}
  function naloziRealneNovice(){
    if(realNalozeno||!window.NostrLS)return; 
    window.NostrLS.fetchNews(50).then(function(evs){
      if(!evs||!evs.length)return; realNalozeno=true;
      var fN=document.getElementById('feedNovice');
      evs.sort(function(a,b){return b.created_at-a.created_at;}).forEach(function(ev){
        var kat=(ev.tags||[]).filter(function(x){return x[0]==='t'&&x[1]!==window.NostrLS.oznaka;}).map(function(x){return x[1];})[0]||'obcina';
        var naslov=tagVal(ev,'title')||'(brez naslova)';
        var art=document.createElement('template');
        art.innerHTML=('<article class="karta" data-kat="'+kat+'" data-id="'+ev.id+'" data-pubkey="'+ev.pubkey+'">'+
          '<div class="karta-glava"><div class="vir '+kat+'">🟣</div><div class="vir-meta">'+
          '<div class="vir-ime">'+window.NostrLS.npubOf(ev.pubkey).slice(0,12)+'…</div>'+
          '<div class="vir-sub">Nostr · '+new Date(ev.created_at*1000).toLocaleDateString('sl')+'</div></div>'+
          '<span class="oznaka-kat">'+labNaslov(kat)+'</span></div>'+
          '<div class="karta-telo"><h3>'+naslov+'</h3><p>'+(ev.content||'').slice(0,160)+'</p></div>'+
          '<div class="karta-noga"><button class="akcija like" data-akcija="like"><span>🤍</span><span class="n">0</span></button>'+
          '<button class="akcija" data-akcija="komentar"><span>💬</span><span class="n">0</span></button>'+
          '<button class="akcija zap" data-akcija="zap"><span>⚡</span><span class="n">0</span></button></div></article>').trim();
        fN.insertBefore(art.content.firstChild, fN.firstChild);
      });
    }).catch(function(){});
  }
  window.addEventListener('nostr-ready', naloziRealneNovice);
  if(window.NostrLS) naloziRealneNovice();

  var POGLEDI={novice:{feed:'feedNovice',kat:'katNovice',stran:'stranNovice',tarce:'#feedNovice .karta'},trznica:{feed:'feedTrznica',kat:'katTrznica',stran:'stranTrznica',tarce:'#oglasi .oglas'},izobrazevanje:{feed:'feedIzobrazevanje',kat:'katIzobrazevanje',stran:'stranIzobrazevanje',tarce:'#ucnePonudbe .oglas'}};
  var aktivniPogled='novice';
  document.querySelectorAll('.pogled-tab').forEach(function(t){t.addEventListener('click',function(){document.querySelectorAll('.pogled-tab').forEach(function(x){x.classList.remove('aktiven')});t.classList.add('aktiven');aktivniPogled=t.dataset.pogled;Object.keys(POGLEDI).forEach(function(p){var akt=(p===aktivniPogled),c=POGLEDI[p];document.getElementById(c.feed).classList.toggle('skrit',!akt);document.getElementById(c.kat).classList.toggle('skrit',!akt);document.getElementById(c.stran).classList.toggle('skrit',!akt);});document.getElementById('iskalnik').value='';});});

  function nastaviFilter(vsebnik,tarce){vsebnik.addEventListener('click',function(e){var c=e.target.closest('.cip');if(!c)return;vsebnik.querySelectorAll('.cip').forEach(function(x){x.classList.remove('aktiven')});c.classList.add('aktiven');var kat=c.dataset.kat;document.querySelectorAll(tarce).forEach(function(k){var z;if(kat==='vse')z=true;else if(kat.indexOf('placilo-')===0)z=(k.dataset.placilo===kat.replace('placilo-',''));else z=(k.dataset.kat===kat);k.style.display=z?'':'none';});});}
  nastaviFilter(document.getElementById('katNovice'),'#feedNovice .karta');
  nastaviFilter(document.getElementById('katTrznica'),'#oglasi .oglas');
  nastaviFilter(document.getElementById('katIzobrazevanje'),'#ucnePonudbe .oglas');

  document.getElementById('iskalnik').addEventListener('input',function(e){var q=e.target.value.trim().toLowerCase();document.querySelectorAll(POGLEDI[aktivniPogled].tarce).forEach(function(el){el.style.display=(q===''||el.textContent.toLowerCase().indexOf(q)>-1)?'':'none';});});

  // meniji
  var krajMeni=document.getElementById('krajMeni'), profilMeni=document.getElementById('profilMeni');
  function zapriMenije(){krajMeni.classList.remove('odprt');profilMeni.classList.remove('odprt');}
  document.getElementById('krajIzbor').addEventListener('click',function(e){e.stopPropagation();profilMeni.classList.remove('odprt');krajMeni.classList.toggle('odprt');});
  krajMeni.addEventListener('click',function(e){var el=e.target.closest('.meni-el');if(!el)return;if(el.dataset.kraj){document.getElementById('krajIme').textContent=el.dataset.kraj;pokaziToast('Preklop na kraj: '+el.dataset.kraj+' (naloži se konfiguracija — demo)');}else{pokaziToast('Predlog novega kraja (demo)');}zapriMenije();});
  document.getElementById('profilChip').addEventListener('click',function(e){e.stopPropagation();krajMeni.classList.remove('odprt');profilMeni.classList.toggle('odprt');});
  profilMeni.addEventListener('click',function(e){var el=e.target.closest('.meni-el');if(!el)return;var p=el.dataset.p;if(p==='odjava'){if(window.NostrLS)window.NostrLS.logout();prijavljen=false;document.getElementById('profilChip').style.display='none';document.getElementById('btnPrijava').style.display='flex';pokaziToast('Odjavljen');}else if(p==='npub'){var st=(window.NostrLS&&window.NostrLS.state)||{};if(st.npub&&navigator.clipboard)navigator.clipboard.writeText(st.npub);pokaziToast('npub kopiran'+(st.npub?' ✓':''));}else{pokaziToast('Odpre se: '+el.textContent.trim()+' (demo)');}zapriMenije();});
  document.addEventListener('click',zapriMenije);

  // obrazec
  var KATEGORIJE={trznica:['Kmetijski pridelki in hrana','Domači predelani izdelki','Obrt in rokodelstvo','Storitve','Kmetija in živali','Kmečki turizem','Rabljeno / podarim','Delo'],izobrazevanje:['Jeziki','Računalništvo in digitalno','Glasba in umetnost','Kmetijstvo in vrt','Kuhanje in gospodinjstvo','Šport in rekreacija','Za otroke in mladino','Inštrukcije in učna pomoč','Osebna rast in poklic','Finančna pismenost']};
  var placiloIzbran='brezplacno';
  function napolniKat(tip){var s=document.getElementById('fKategorija');s.innerHTML='';KATEGORIJE[tip].forEach(function(k){var o=document.createElement('option');o.textContent=k;s.appendChild(o);});}
  function odpriForm(tip){var izo=(tip==='izobrazevanje');document.getElementById('formNaslov').textContent=izo?'Nova učna ponudba':'Nov oglas';document.getElementById('formPod').textContent=izo?'Objavi se kot tvoj podpisan NIP-99 dogodek (brezplačno ali plačljivo) in ostane tvoja last.':'Objavi se kot tvoj podpisan NIP-99 dogodek in ostane tvoja last.';napolniKat(tip);document.getElementById('fFormatWrap').classList.toggle('skrit',!izo);document.getElementById('fPlaciloWrap').classList.toggle('skrit',!izo);maskForm.dataset.tip=tip;maskForm.classList.add('odprt');}
  function zapriForm(){maskForm.classList.remove('odprt');}
  function kliknjenoDodaj(tip,n,o){if(!prijavljen){document.getElementById('modalNaslov').textContent=n;document.getElementById('modalOpis').textContent=o;odpriModal();}else{odpriForm(tip);}}
  document.getElementById('btnOglas').addEventListener('click',function(){kliknjenoDodaj('trznica','Za oddajo oglasa poveži Nostr','Oglas se objavi kot tvoj NIP-99 dogodek in ostane tvoja last. Potrebuješ Nostr profil.');});
  document.getElementById('btnUcnaPonudba').addEventListener('click',function(){kliknjenoDodaj('izobrazevanje','Za oddajo učne ponudbe poveži Nostr','Ponudba se objavi kot tvoj NIP-99 dogodek (brezplačno ali plačljivo). Potrebuješ Nostr profil.');});
  document.getElementById('fPlacilo').addEventListener('click',function(e){var c=e.target.closest('.radio-cip');if(!c)return;this.querySelectorAll('.radio-cip').forEach(function(x){x.classList.remove('izbran')});c.classList.add('izbran');placiloIzbran=c.dataset.v;document.getElementById('fCenaWrap').style.display=(placiloIzbran==='brezplacno')?'none':'flex';});
  document.getElementById('fSlike').addEventListener('click',function(){pokaziToast('Nalaganje slik + moderacija (demo)');});
  document.getElementById('formPreklici').addEventListener('click',zapriForm);
  maskForm.addEventListener('click',function(e){if(e.target===maskForm)zapriForm();});
  document.getElementById('formObjavi').addEventListener('click',function(){
    var naslov=document.getElementById('fNaslov').value.trim();
    if(!naslov){pokaziToast('Vnesi naslov');return;}
    var tip=maskForm.dataset.tip||'trznica', izo=(tip==='izobrazevanje');
    var kategorija=document.getElementById('fKategorija').value;
    var opis=document.getElementById('fOpis').value.trim();
    var cenaVal=document.getElementById('fCena').value.trim();
    var valSel=document.querySelector('#fCenaWrap select'); var valuta=valSel?valSel.value:'EUR';
    var brezplacno=izo&&placiloIzbran==='brezplacno';
    var payload={title:naslov,summary:opis,category:kategorija,section:tip,content:opis};
    if(izo){payload.format=document.getElementById('fFormat').value;payload.placljivo=!brezplacno;}
    if(cenaVal&&!brezplacno)payload.price={amount:cenaVal,currency:valuta};
    function koncaj(realno){zapriForm();pokaziToast(realno?'Objavljeno kot NIP-99 dogodek na Nostr ✓':'Objavljeno kot NIP-99 (demo)');
      document.getElementById('fNaslov').value='';document.getElementById('fOpis').value='';document.getElementById('fCena').value='';}
    var NS=window.NostrLS;
    if(NS&&NS.state.method){ NS.publishListing(payload).then(function(){koncaj(true);}).catch(function(e){pokaziToast('Napaka pri objavi: '+(e&&e.message||e));}); }
    else { koncaj(false); }
  });

  // akcije
  document.addEventListener('click',function(e){var b=e.target.closest('.akcija, .btn-kontakt');if(!b)return;var a=b.dataset.akcija;if(!prijavljen){odpriModal();pokaziToast('Za interakcijo poveži Nostr profil');return;}if(a==='like'){var n=b.querySelector('.n');if(!n)return;var c=parseInt(n.textContent)||0;if(b.classList.contains('aktivna')){b.classList.remove('aktivna');b.querySelector('span').textContent='🤍';n.textContent=c-1;}else{b.classList.add('aktivna');b.querySelector('span').textContent='❤️';n.textContent=c+1;var cardL=b.closest('[data-id]');if(cardL&&window.NostrLS&&window.NostrLS.state.method){window.NostrLS.react({id:cardL.dataset.id,pubkey:cardL.dataset.pubkey}).then(function(){pokaziToast('Všeček objavljen na Nostr ✓');});}else{pokaziToast('Všeček objavljen (demo)');}}}else if(a==='zap'){b.classList.add('aktivna');pokaziToast('⚡ Zap poslan (demo)');}else if(a==='komentar'){var cardK=b.closest('[data-id]');if(cardK&&window.NostrLS&&window.NostrLS.state.method){var tx=window.prompt('Komentar:');if(tx){window.NostrLS.comment({id:cardK.dataset.id,pubkey:cardK.dataset.pubkey},tx).then(function(){pokaziToast('Komentar objavljen na Nostr ✓');});}}else{pokaziToast('Komentar kot Nostr dogodek (demo)');}}else if(a==='kontakt'){pokaziToast('Stik prek Nostr sporočila (demo)');}});

  // web of trust: socialni dokaz + ⋯
  var barve=['#c85a34','#2f6db0','#8a5cd6','#e9a23b','#0e9aa7','#6f7a3e'], ini=['MK','AN','JŽ','SP','TL','BK','NR','ČD'];
  function miniAvti(n){var k=Math.min(n,3),h='<span class="avti">';for(var i=0;i<k;i++){h+='<span style="background:'+barve[(i+n)%barve.length]+'">'+ini[(i*2+n)%ini.length]+'</span>';}return h+'</span>';}
  document.querySelectorAll('#oglasi .oglas, #ucnePonudbe .oglas').forEach(function(card,i){var telo=card.querySelector('.oglas-telo'),prod=telo.querySelector('.prodajalec'),n=[6,3,8,2,5,4,7,1][i%8];var w=document.createElement('div');w.className='wot';w.innerHTML=miniAvti(n)+'<span>Zaupa mu <b>'+n+'</b> iz tvoje mreže</span>';telo.insertBefore(w,prod);var vec=document.createElement('button');vec.className='vec';vec.dataset.tip='oglas';vec.textContent='⋯';card.querySelector('.oglas-noga').appendChild(vec);});
  document.querySelectorAll('#feedNovice .karta').forEach(function(card){var vec=document.createElement('button');vec.className='vec';vec.dataset.tip='novica';vec.textContent='⋯';card.querySelector('.karta-noga').appendChild(vec);});
  var kartaMeni=document.getElementById('kartaMeni');
  document.addEventListener('click',function(e){var v=e.target.closest('.vec');if(v){var r=v.getBoundingClientRect();kartaMeni.style.top=(r.bottom+6)+'px';kartaMeni.style.left=Math.max(8,Math.min(r.right-220,window.innerWidth-228))+'px';kartaMeni.querySelector('[data-a="priporocam"]').style.display=(v.dataset.tip==='oglas')?'':'none';kartaMeni._card=v.closest('[data-id]');kartaMeni.classList.add('odprt');return;}if(!e.target.closest('#kartaMeni'))kartaMeni.classList.remove('odprt');});
  kartaMeni.addEventListener('click',function(e){var el=e.target.closest('.km-el');if(!el)return;kartaMeni.classList.remove('odprt');if(!prijavljen){odpriModal();pokaziToast('Za to dejanje poveži Nostr');return;}if(el.dataset.a==='priporocam'){var cardP=kartaMeni._card;if(cardP&&cardP.dataset.id&&window.NostrLS&&window.NostrLS.state.method){window.NostrLS.recommend({id:cardP.dataset.id,pubkey:cardP.dataset.pubkey}).then(function(){pokaziToast('Priporočilo objavljeno na Nostr (NIP-32) ✓');});}else{pokaziToast('Dodano med »Priporočam« (demo)');}}else{var cardR=kartaMeni._card;if(cardR&&cardR.dataset.id&&window.NostrLS&&window.NostrLS.state.method){window.NostrLS.report({id:cardR.dataset.id,pubkey:cardR.dataset.pubkey}).then(function(){pokaziToast('Prijava oddana na Nostr (NIP-56) ✓');});}else{pokaziToast('Prijava oddana (NIP-56 — demo)');}}});
