(() => {
  'use strict';

  const D = window.DATA;
  const SAVE_KEY = 'meep-nuit-v1';
  const GROWTH = 1.15;
  const MEEP_CD = 15;
  const BASE_FRENZY = 1.5;
  const FRENZY_S = 10;

  const $ = (id) => document.getElementById(id);

  const el = {
    meeps: $('meeps'), cps: $('cps'),
    crab: $('crab'), crabs: $('crabs'), hint: $('hint'),
    meep: $('meepBtn'), meepCd: $('meepCd'),
    shop: $('shopList'), ticker: $('tickerTrack'), goals: $('goalList'),
    toasts: $('toasts'), events: $('eventLayer'),
    codeBtn: $('codeBtn'), codeCount: $('codeCount'), codeScreen: $('codeScreen'), codeList: $('codeList'),
    giftBtn: $('giftBtn'), giftScreen: $('giftScreen'), giftConds: $('giftConds'), giftOpen: $('giftOpen'),
    giftReveal: $('giftReveal'), giftB64: $('giftB64'), giftInput: $('giftInput'), giftOk: $('giftOk'),
    giftMsg: $('giftMsg'), giftPrize: $('giftPrize'),
    mute: $('muteBtn'),
    end: null,
    fx: $('fx'),
    gate: $('gate'), gateInput: $('gateInput'), gateBtn: $('gateBtn'),
    gateRow: $('gateRow'), gateMsg: $('gateMsg')
  };

  const fresh = () => ({
    meeps: 0, totalEarned: 0, owned: {}, clicks: 0, t: 0,
    cheats: [], goals: [], gift: { open: false, done: false },
    meepPresses: 0, flansCleared: 0, olyCaught: 0,
    clicksSinceMeep: 0, muted: true, started: false, ended: false, unlocked: false
  });

  let S = fresh();
  let debuffs = [];        // { type, until, el, mult }
  let frenzyUntil = 0;
  let frenzyMult = BASE_FRENZY;
  let meepReadyAt = 0;
  let nextOly = 55;
  let nextDebuff = 28;
  let lastSave = 0;
  let shopSignature = '';

  /* ---------------- sauvegarde ---------------- */

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* privé */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      S = Object.assign(fresh(), data);
      S.owned = data.owned || {};
      S.cheats = Array.isArray(data.cheats) ? data.cheats : [];
      S.goals = Array.isArray(data.goals) ? data.goals : [];
      S.gift = Object.assign({ open: false, done: false }, data.gift || {});
    } catch (e) { S = fresh(); }
  }

  /* ---------------- calculs ---------------- */

  const ownedOf = (id) => S.owned[id] || 0;

  /* ---------------- sprites pixel ---------------- */

  const spriteCache = {};

  function pixelSprite(emoji, grid) {
    const key = emoji + grid;
    if (spriteCache[key]) return spriteCache[key];
    const c = document.createElement('canvas');
    c.width = grid;
    c.height = grid;
    const g = c.getContext('2d');
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = Math.round(grid * 0.94) + 'px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    g.fillText(emoji, grid / 2, grid / 2 + grid * 0.04);
    spriteCache[key] = c.toDataURL();
    return spriteCache[key];
  }

  /* ---------------- crabes ---------------- */

  let crabCount = -1;

  function wantedCrabs() {
    const c = baseCps() * prodMult();
    if (c < 1) return 0;
    const cap = window.innerWidth < 700 ? 14 : 28;
    return Math.min(cap, Math.floor(Math.log10(c + 1) * 5));
  }

  function makeMini(i) {
    const img = document.createElement('img');
    img.className = 'mini';
    img.src = pixelSprite('🦀', 12);
    img.alt = '';
    const angle = i * 2.39996323;
    const ring = Math.floor(i / 8);
    const radius = 34 + ring * 7;
    img.style.left = (50 + Math.cos(angle) * radius).toFixed(2) + '%';
    img.style.top = (50 + Math.sin(angle) * radius * 0.82).toFixed(2) + '%';
    const size = 16 + (i % 3) * 4;
    img.style.width = size + 'px';
    img.style.height = size + 'px';
    img.style.setProperty('--dur', (1.1 + (i % 5) * 0.17).toFixed(2) + 's');
    img.style.setProperty('--delay', (i * 0.09).toFixed(2) + 's');
    return img;
  }

  function syncCrabs() {
    const want = wantedCrabs();
    if (want === crabCount) return;
    if (want > crabCount) {
      for (let i = Math.max(0, crabCount); i < want; i++) el.crabs.appendChild(makeMini(i));
    } else {
      while (el.crabs.children.length > want) el.crabs.lastElementChild.remove();
    }
    crabCount = want;
  }

  function baseCps() {
    let v = 0;
    for (const t of D.tiers) v += ownedOf(t.id) * t.cps;
    return v;
  }

  function debuffMult() {
    let m = 1;
    for (const d of debuffs) m *= d.mult;
    return m;
  }

  function prodMult() {
    return debuffMult() * (S.t < frenzyUntil ? frenzyMult : 1);
  }

  function clickPower() {
    if (debuffs.some((d) => d.type === 'shirt')) return 0;
    let p = 1;
    for (const t of D.tiers) if (t.clickMult && ownedOf(t.id) > 0) p *= t.clickMult;
    if (S.t < frenzyUntil) p *= frenzyMult;
    return p;
  }

  function tierCost(t) {
    return Math.ceil(t.cost * Math.pow(GROWTH, ownedOf(t.id)));
  }

  function fmt(n) {
    n = Math.floor(n);
    if (n < 1e5) return n.toLocaleString('fr-FR');
    if (n < 1e6) return Math.round(n / 1e3) + ' k';
    if (n < 1e9) return (n / 1e6).toFixed(2).replace('.', ',') + ' M';
    return (n / 1e9).toFixed(2).replace('.', ',') + ' Md';
  }

  /* ---------------- son ---------------- */

  let audioCtx = null;
  let prizeAudio = null;
  function blip(freq = 320) {
    if (S.muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.035;
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.09);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.1);
    } catch (e) { /* pas de son, pas grave */ }
  }

  /* ---------------- feedback ---------------- */

  function toast(text, kind) {
    if (!text) return;
    const node = document.createElement('div');
    node.className = 'toast' + (kind ? ' ' + kind : '');
    node.textContent = text;
    el.toasts.appendChild(node);
    setTimeout(() => {
      node.classList.add('out');
      setTimeout(() => node.remove(), 280);
    }, 3200);
  }

  function floatNumber(x, y, text) {
    const node = document.createElement('span');
    node.className = 'float-num';
    node.textContent = text;
    node.style.left = x + 'px';
    node.style.top = y + 'px';
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 780);
  }

  /* ---------------- particules ---------------- */

  const fx = el.fx.getContext('2d');
  let parts = [];
  let vw = 0, vh = 0, dpr = 1, fxDirty = false;

  function resize() {
    dpr = 1;
    vw = window.innerWidth;
    vh = window.innerHeight;
    el.fx.width = vw;
    el.fx.height = vh;
    fx.setTransform(1, 0, 0, 1, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 190;
      parts.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 60,
        life: 0.5 + Math.random() * 0.45,
        max: 0.95,
        size: 1.6 + Math.random() * 2.6,
        color: Math.random() < 0.5 ? '124,255,90' : '255,184,107'
      });
    }
    if (parts.length > 380) parts = parts.slice(-380);
  }

  function drawFx(dt) {
    if (!parts.length) {
      if (fxDirty) {
        fx.clearRect(0, 0, vw, vh);
        fxDirty = false;
      }
      return;
    }
    fxDirty = true;
    fx.clearRect(0, 0, vw, vh);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += 340 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const alpha = Math.max(0, Math.min(1, p.life / p.max));
      fx.fillStyle = `rgba(${p.color},${alpha})`;
      fx.beginPath();
      fx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fx.fill();
    }
  }

  /* ---------------- clic ---------------- */

  el.crab.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if (S.ended) return;
    S.started = true;
    el.hint.classList.add('gone');

    const power = clickPower();
    S.meeps += power;
    S.totalEarned += power;
    S.clicks++;
    S.clicksSinceMeep++;

    burst(ev.clientX, ev.clientY, 7);
    floatNumber(ev.clientX, ev.clientY, '+' + fmt(power));
    blip(300 + Math.random() * 90);
  });

  /* ---------------- boutique ---------------- */

  function visibleTiers() {
    return D.tiers.filter((t, i) => {
      if (ownedOf(t.id) > 0) return true;
      if (i === 0) return true;
      return S.totalEarned >= t.cost * 0.4;
    });
  }

  function buildShop() {
    el.shop.innerHTML = '';
    for (const t of visibleTiers()) {
      const li = document.createElement('li');
      li.className = 'item';
      li.dataset.id = t.id;
      li.innerHTML = `
        <button class="item-btn" type="button" title="${t.name}">
          <img class="item-icon" src="${pixelSprite(t.icon, 16)}" alt="">
          <span class="item-body">
            <span class="item-line"></span>
            <span class="item-meta"></span>
          </span>
          <span class="item-cost"></span>
        </button>`;
      li.querySelector('.item-btn').addEventListener('click', () => buy(t));
      el.shop.appendChild(li);
    }
    updateShop(true);
  }

  function buy(t) {
    const cost = tierCost(t);
    if (S.meeps < cost) return;
    if (t.max && ownedOf(t.id) >= t.max) return;
    S.meeps -= cost;
    S.owned[t.id] = ownedOf(t.id) + 1;
    blip(520);
    updateShop(true);
    save();
  }

  function updateShop(force) {
    for (const li of el.shop.children) {
      const t = D.tiers.find((x) => x.id === li.dataset.id);
      if (!t) continue;
      const cost = tierCost(t);
      const btn = li.querySelector('.item-btn');
      const line = li.querySelector('.item-line');
      const meta = li.querySelector('.item-meta');
      const costEl = li.querySelector('.item-cost');
      const owned = ownedOf(t.id);
      const maxed = t.max && owned >= t.max;

      line.textContent = t.name;
      line.classList.remove('locked');
      meta.textContent = `+${fmt(t.cps)} /s`
        + (t.clickMult ? ` · clic ×${t.clickMult}` : '')
        + (owned > 0 ? ` · ×${owned}${t.max ? '/' + t.max : ''}` : '');
      costEl.textContent = maxed ? '—' : fmt(cost);

      btn.disabled = maxed || S.meeps < cost;
      btn.classList.toggle('can', !maxed && S.meeps >= cost);
    }
  }

  /* ---------------- objectifs ---------------- */

  const goalEls = new Map();

  function goalValue(g) {
    switch (g.type) {
      case 'clicks': return S.clicks;
      case 'total': return S.totalEarned;
      case 'tiers': return D.tiers.filter((t) => ownedOf(t.id) > 0).length;
      case 'meep': return S.meepPresses;
      case 'malus': return S.flansCleared;
      default: return 0;
    }
  }

  function goalsDone() {
    return D.goals.filter((g) => S.goals.includes(g.id)).length;
  }

  function buildGoals() {
    el.goals.innerHTML = '';
    goalEls.clear();
    for (const g of D.goals) {
      const li = document.createElement('li');
      li.className = 'goal';
      li.innerHTML = `
        <div class="goal-head">
          <span class="goal-label">${g.label}</span>
          <span class="goal-gift">${g.gift}</span>
        </div>
        <div class="goal-foot">
          <div class="goal-bar"><i></i></div>
          <span class="goal-pct">0 %</span>
          <button class="goal-claim" type="button">claim</button>
        </div>`;
      const btn = li.querySelector('.goal-claim');
      btn.addEventListener('click', () => claimGoal(g));
      el.goals.appendChild(li);
      goalEls.set(g.id, {
        li,
        bar: li.querySelector('.goal-bar i'),
        pct: li.querySelector('.goal-pct'),
        btn
      });
    }
  }

  function claimGoal(g) {
    if (S.goals.includes(g.id)) return;
    if (goalValue(g) < g.target) return;
    S.goals.push(g.id);
    grant(g.reward);
    save();
    updateGoals();
  }

  function updateGoals() {
    for (const g of D.goals) {
      const ref = goalEls.get(g.id);
      if (!ref) continue;
      const cur = goalValue(g);
      const pct = Math.min(100, (cur / g.target) * 100);
      const claimed = S.goals.includes(g.id);
      const ready = !claimed && cur >= g.target;

      ref.bar.style.width = pct + '%';
      ref.pct.textContent = claimed ? 'pris' : Math.floor(pct) + ' %';
      ref.btn.disabled = !ready;
      ref.li.classList.toggle('claimed', claimed);
      ref.li.classList.toggle('ready', ready);
    }
  }

  /* ---------------- meep ---------------- */

  el.meep.addEventListener('click', () => {
    if (S.ended || S.t < meepReadyAt) return;
    S.meepPresses++;
    S.clicksSinceMeep = 0;
    meepReadyAt = S.t + MEEP_CD;
    frenzyMult = BASE_FRENZY;
    frenzyUntil = S.t + FRENZY_S;
    clearDebuffs();
    toast('meep', 'good');
    blip(660);
  });

  function clearDebuffs() {
    for (const d of debuffs) if (d.el) d.el.remove();
    debuffs = [];
  }

  /* ---------------- événements ---------------- */

  function spawnOly() {
    const btn = document.createElement('button');
    btn.className = 'ev ev-oly';
    btn.type = 'button';
    btn.textContent = '🐕';
    btn.setAttribute('aria-label', 'Oly');
    btn.style.top = (26 + Math.random() * 34) + 'vh';
    btn.style.left = '0';
    el.events.appendChild(btn);

    const kill = setTimeout(() => btn.remove(), 9000);
    btn.addEventListener('click', () => {
      clearTimeout(kill);
      btn.remove();
      S.olyCaught++;
      if (Math.random() < 0.5) {
        const gain = Math.max(30, Math.min(Math.floor(S.totalEarned * 0.05), Math.floor(baseCps() * 60)));
        S.meeps += gain;
        S.totalEarned += gain;
        floatNumber(window.innerWidth / 2, window.innerHeight / 2, '+' + fmt(gain));
        toast('il revient toujours', 'good');
      } else {
        frenzyMult = 3;
        frenzyUntil = S.t + 12;
        toast('encore lui', 'good');
      }
      blip(760);
    });
  }

  const DEBUFFS = {
    flan:   { icon: '🍮', mult: 0.5,  dur: 12, line: 'j\'en veux pas' },
    shirt:  { icon: '👕', mult: 1,    dur: 10, line: 'pas maintenant' },
    lav:    { icon: '🌸', mult: 0.7,  dur: 15, line: 'non.' }
  };

  function spawnDebuff() {
    const keys = Object.keys(DEBUFFS);
    const kind = keys[Math.floor(Math.random() * keys.length)];
    const def = DEBUFFS[kind];

    const btn = document.createElement('button');
    btn.className = 'ev ev-debuff';
    btn.type = 'button';
    btn.textContent = def.icon;
    btn.setAttribute('aria-label', def.line);
    btn.style.left = (12 + Math.random() * 62) + 'vw';
    btn.style.top = (18 + Math.random() * 52) + 'vh';
    el.events.appendChild(btn);

    const entry = { type: kind, until: S.t + def.dur, el: btn, mult: def.mult };
    debuffs.push(entry);

    btn.addEventListener('click', () => {
      if (btn.dataset.hit) return;
      btn.dataset.hit = '1';
      btn.classList.add('hit');

      const loss = Math.max(20, Math.floor(S.meeps * 0.12));
      S.meeps = Math.max(0, S.meeps - loss);
      S.flansCleared++;
      toast(def.line + ' · −' + fmt(loss), 'bad');
      blip(140);
    });
  }

  function removeDebuff(entry) {
    const i = debuffs.indexOf(entry);
    if (i >= 0) debuffs.splice(i, 1);
    if (entry.el) entry.el.remove();
  }

  /* ---------------- cadeau ---------------- */

  function giftConditions() {
    return [
      { label: '1 000 000 meeps en poche', value: fmt(S.meeps) + ' / 1,00 M', ok: S.meeps >= 1e6 },
      { label: '10 000 000 gagnés en tout', value: fmt(S.totalEarned) + ' / 10,00 M', ok: S.totalEarned >= 1e7 },
      { label: '350 000 par seconde', value: fmt(baseCps()) + ' / 350 k', ok: baseCps() >= 350000 },
      { label: 'tous les objectifs', value: goalsDone() + ' / ' + D.goals.length, ok: goalsDone() >= D.goals.length },
      { label: 'tous les codes', value: S.cheats.length + ' / ' + D.cheats.length, ok: S.cheats.length >= D.cheats.length }
    ];
  }

  function openGift() {
    const conds = giftConditions();
    const all = conds.every((c) => c.ok);

    el.giftConds.innerHTML = conds
      .map((c) => `<li class="${c.ok ? 'ok' : ''}"><span>${c.label}</span><b>${c.value}</b></li>`)
      .join('');

    el.giftOpen.disabled = !all || S.gift.open;
    el.giftOpen.hidden = S.gift.open;
    el.giftOpen.textContent = all ? 'débloquer' : 'verrouillé';

    el.giftConds.classList.toggle('hidden', S.gift.open && all);

    el.giftReveal.classList.toggle('hidden', !(S.gift.open && all));
    if (S.gift.open && all) el.giftB64.textContent = btoa(D.gift.hint);

    el.giftPrize.classList.toggle('hidden', !S.gift.done);
    if (S.gift.done) {
      const p = D.gift.prize;
      el.giftPrize.innerHTML =
        `<p class="gift-lead">${p[0]}</p>` +
        `<p class="gift-artist">${p[1]}</p>` +
        `<p class="gift-place">${p[2]}</p>` +
        `<p class="gift-date">${p[3]}</p>`;
    }

    el.giftScreen.classList.remove('hidden');
  }

  el.giftBtn.addEventListener('click', openGift);

  el.giftOpen.addEventListener('click', () => {
    if (el.giftOpen.disabled) return;
    S.gift.open = true;
    save();
    openGift();
    el.giftInput.focus();
  });

  function playPrize() {
    try {
      if (!prizeAudio) {
        prizeAudio = new Audio('aupinard.mp3');
        prizeAudio.preload = 'auto';
      }
      const start = () => {
        try { prizeAudio.currentTime = 15; } catch (e) { /* rien */ }
        prizeAudio.play().catch(() => {});
      };
      if (prizeAudio.readyState >= 1) start();
      else prizeAudio.addEventListener('loadedmetadata', start, { once: true });
    } catch (e) { /* pas de son */ }
  }

  function submitGift() {
    if (S.gift.done) return;
    const val = norm(el.giftInput.value);
    if (!val) return;
    if (D.gift.answers.some((a) => norm(a) === val)) {
      S.gift.done = true;
      save();
      el.giftMsg.textContent = '';
      el.giftInput.value = '';
      openGift();
      burst(window.innerWidth / 2, window.innerHeight / 2, 46);
      toast('jte prends 2 places', 'good');
      blip(880);
      playPrize();
    } else {
      el.giftMsg.textContent = 'non.';
      el.giftInput.value = '';
      el.giftInput.focus();
    }
  }

  el.giftOk.addEventListener('click', submitGift);
  el.giftInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitGift();
    }
  });

  el.giftScreen.addEventListener('click', (e) => {
    if (e.target === el.giftScreen || e.target.dataset.close) el.giftScreen.classList.add('hidden');
  });

  /* ---------------- porte ---------------- */

  function checkDate(raw) {
    const n = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (!n) return false;

    const text = n.replace(/[^a-z0-9]/g, '');
    if (text === '4juin2003' || text === '04juin2003' || text === '4juin' || text === '04juin') return true;

    const m = n.match(/^(\d{1,2})\s*[\/.\- ]\s*(\d{1,2})\s*[\/.\- ]\s*(\d{4})$/);
    if (m && +m[1] === 4 && +m[2] === 6 && +m[3] === 2003) return true;

    const d = n.replace(/\D/g, '');
    return d === '04062003' || d === '4062003';
  }

  function maskDate(raw) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';

    if (digits.length === 1) return digits;

    const dayLen = digits[0] >= '4' ? 1 : 2;
    let out = digits.slice(0, dayLen);
    let pos = dayLen;

    if (digits.length > pos) {
      out += '/';
      const rest = digits.slice(pos);
      if (rest.length === 1) return out + rest;

      const monLen = rest[0] >= '2' ? 1 : 2;
      out += rest.slice(0, monLen);
      pos += monLen;

      if (digits.length > pos) {
        out += '/' + digits.slice(pos, pos + 4);
      }
    }
    return out;
  }

  el.gateInput.addEventListener('input', () => {
    const v = el.gateInput.value;
    if (/[a-z]/i.test(v)) return;
    const masked = maskDate(v);
    if (masked !== v) el.gateInput.value = masked;
  });

  let gateFails = 0;

  function submitGate() {
    if (checkDate(el.gateInput.value)) {
      S.unlocked = true;
      save();
      el.gate.classList.add('hidden');
      el.gateMsg.textContent = '';
      el.gateInput.blur();
      return;
    }
    gateFails++;
    el.gateInput.value = '';
    el.gateInput.focus();
    el.gateRow.classList.remove('shake');
    void el.gateRow.offsetWidth;
    el.gateRow.classList.add('shake');
    el.gateMsg.textContent = 'non.';
  }

  el.gateBtn.addEventListener('click', submitGate);
  el.gateInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitGate();
  });

  /* ---------------- boucle ---------------- */

  function tick(dt) {
    if (!S.started) return;
    S.t += dt;

    const gain = baseCps() * prodMult() * dt;
    S.meeps += gain;
    S.totalEarned += gain;

    if (S.t >= nextOly) { spawnOly(); nextOly = S.t + 60 + Math.random() * 55; }
    if (S.t >= nextDebuff) {
      if (!debuffs.length) spawnDebuff();
      nextDebuff = S.t + 38 + Math.random() * 26;
    }

    for (let i = debuffs.length - 1; i >= 0; i--) {
      const d = debuffs[i];
      if (S.t >= d.until) removeDebuff(d);
    }

    if (S.t - lastSave > 5) { save(); lastSave = S.t; }
  }

  /* ---------------- rendu ---------------- */

  function render() {
    el.meeps.textContent = fmt(S.meeps);
    el.cps.textContent = '+' + fmt(baseCps() * prodMult()) + ' /s';
    syncCrabs();

    const cd = Math.max(0, meepReadyAt - S.t);
    const ratio = Math.min(1, cd / MEEP_CD);
    el.meepCd.style.width = (ratio * 100) + '%';
    el.meep.classList.toggle('is-ready', cd <= 0);
    el.meep.classList.toggle('is-cooling', cd > 0);
    el.meep.disabled = cd > 0 || S.ended;

    el.codeCount.textContent = S.cheats.length + '/' + D.cheats.length;
    el.mute.classList.toggle('is-muted', S.muted);
    el.mute.setAttribute('aria-label', S.muted ? 'son coupé' : 'son activé');

    const sig = visibleTiers().map((t) => t.id).join(',');
    if (sig !== shopSignature) { shopSignature = sig; buildShop(); }
    else updateShop(false);

    updateGoals();
  }

  let last = performance.now();
  let uiAcc = 0;

  /* ---------------- bandeau ---------------- */

  let tickerX = 0;
  let tickerHalf = 0;

  function measureTicker() {
    tickerHalf = el.ticker.scrollWidth / 2;
  }

  function tickTicker(dt) {
    if (!tickerHalf) return;
    tickerX -= 42 * dt;
    if (tickerX <= -tickerHalf) tickerX += tickerHalf;
    el.ticker.style.transform = 'translateX(' + tickerX.toFixed(1) + 'px)';
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!S.ended && document.visibilityState === 'visible') tick(dt);
    tickTicker(dt);
    drawFx(dt);

    uiAcc += dt;
    if (uiAcc >= 0.08) { uiAcc = 0; render(); }

    requestAnimationFrame(frame);
  }

  /* ---------------- recommencer ---------------- */

  function restart() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* rien */ }
    S = fresh();
    debuffs = [];
    frenzyUntil = 0;
    frenzyMult = BASE_FRENZY;
    meepReadyAt = 0;
    nextOly = 55;
    nextDebuff = 28;
    lastSave = 0;
    parts = [];
    shopSignature = '';
    crabCount = -1;
    el.crabs.innerHTML = '';
    el.codeScreen.classList.add('hidden');
    el.giftScreen.classList.add('hidden');
    el.hint.classList.remove('gone');
    buildGoals();
    buildShop();

    gateFails = 0;
    el.gateInput.value = '';
    el.gateMsg.textContent = '';
    el.gate.classList.remove('hidden');
    el.gateInput.focus();
  }

  $('restartCodeBtn').addEventListener('click', restart);

  /* ---------------- code ---------------- */

  function norm(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function grant(reward) {
    if (reward.type === 'meeps') {
      const unit = baseCps();
      const amount = reward.sec ? unit * reward.sec : unit * (reward.mult || 30);
      const gain = Math.max(reward.min || 200, Math.floor(amount));
      S.meeps += gain;
      S.totalEarned += gain;
      toast('+' + fmt(gain), 'good');
    } else if (reward.type === 'frenzy') {
      frenzyMult = reward.mult;
      frenzyUntil = S.t + reward.dur;
      toast('×' + reward.mult + ' pendant ' + reward.dur + ' s', 'good');
    } else if (reward.type === 'free') {
      const target = D.tiers.find((t) => ownedOf(t.id) === 0);
      if (target) {
        S.owned[target.id] = 1;
        shopSignature = '';
        toast('offert : ' + target.icon, 'good');
      } else {
        const gain = Math.max(500, Math.floor(baseCps() * prodMult() * 60));
        S.meeps += gain;
        S.totalEarned += gain;
        toast('+' + fmt(gain), 'good');
      }
    }
    save();
  }

  function openCode() {
    el.codeList.innerHTML = D.cheats.map((c) => {
      if (S.cheats.includes(c.id)) {
        return `<li class="code-item done">
          <p class="code-q">${c.q}</p>
          <span class="code-done">pris · ${c.gift}</span>
        </li>`;
      }
      return `<li class="code-item" data-id="${c.id}">
        <p class="code-q">${c.q}</p>
        <div class="code-row">
          <input class="code-input" type="text" autocomplete="off" spellcheck="false" aria-label="${c.q}">
          <button class="code-ok" type="button">ok</button>
        </div>
      </li>`;
    }).join('');
    el.codeScreen.classList.remove('hidden');
    const first = el.codeList.querySelector('.code-input');
    if (first) first.focus();
  }

  el.codeBtn.addEventListener('click', openCode);

  el.codeList.addEventListener('click', (e) => {
    if (!e.target.classList.contains('code-ok')) return;
    const li = e.target.closest('.code-item');
    const c = D.cheats.find((x) => x.id === li.dataset.id);
    if (!c) return;
    const input = li.querySelector('.code-input');
    if (c.answers.some((a) => norm(a) === norm(input.value))) {
      S.cheats.push(c.id);
      grant(c.reward);
      openCode();
    } else {
      toast('non.', 'bad');
      input.value = '';
      input.focus();
    }
  });

  el.codeList.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const btn = e.target.closest('.code-item')?.querySelector('.code-ok');
    if (btn) btn.click();
  });

  el.codeScreen.addEventListener('click', (e) => {
    if (e.target === el.codeScreen || e.target.dataset.close) el.codeScreen.classList.add('hidden');
  });

  el.mute.addEventListener('click', () => {
    S.muted = !S.muted;
    save();
    if (!S.muted) blip(520);
  });

  window.addEventListener('beforeunload', save);

  /* ---------------- décor ---------------- */

  function xpBackdrop() {
    const W = 160;
    const H = 90;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');

    const sky = ['#2f6fc4', '#3a7bd0', '#4789da', '#5599e4', '#6aacec', '#84bff2', '#a3d2f7', '#c3e4fb'];
    for (let y = 0; y < 60; y++) {
      g.fillStyle = sky[Math.min(sky.length - 1, Math.floor((y / 60) * sky.length))];
      g.fillRect(0, y, W, 1);
    }

    const cloud = (cx, cy, s) => {
      g.fillStyle = '#ffffff';
      g.fillRect(cx - 14 * s, cy, 28 * s, 5 * s);
      g.fillRect(cx - 9 * s, cy - 4 * s, 20 * s, 5 * s);
      g.fillRect(cx - 4 * s, cy - 7 * s, 12 * s, 4 * s);
      g.fillStyle = '#dceefb';
      g.fillRect(cx - 14 * s, cy + 5 * s, 28 * s, 2 * s);
    };
    cloud(30, 16, 1);
    cloud(104, 10, 1.4);
    cloud(140, 27, 0.9);

    for (let x = 0; x < W; x++) {
      const far = 54 + Math.round(3 * Math.sin(x / 14));
      g.fillStyle = '#8fbf72';
      g.fillRect(x, far, 1, H - far);
    }

    for (let x = 0; x < W; x++) {
      const main = 68 - Math.round(26 * Math.exp(-Math.pow((x - 46) / 58, 2)));
      g.fillStyle = '#77b24a';
      g.fillRect(x, main, 1, H - main);
    }

    for (let x = 0; x < W; x++) {
      const fore = 80 + Math.round(3 * Math.sin(x / 9 + 2));
      g.fillStyle = '#5f9a38';
      g.fillRect(x, fore, 1, H - fore);
    }

    const tree = (x, y) => {
      g.fillStyle = '#4e8a2e';
      g.fillRect(x - 3, y - 10, 6, 6);
      g.fillRect(x - 2, y - 13, 4, 4);
      g.fillStyle = '#3f7225';
      g.fillRect(x - 1, y - 4, 2, 5);
    };
    tree(120, 72);
    tree(134, 76);

    return c.toDataURL();
  }

  document.querySelector('.stage').style.backgroundImage = 'url(' + xpBackdrop() + ')';

  /* ---------------- départ ---------------- */

  el.ticker.innerHTML = (() => {
    const frags = D.ticker.map((x) => `<span>${x}</span>`).join('');
    return frags + frags;
  })();

  measureTicker();
  window.addEventListener('resize', measureTicker);
  setTimeout(measureTicker, 250);

  $('crabSprite').src = pixelSprite('🦀', 20);

  load();
  if (S.unlocked) el.gate.classList.add('hidden');
  buildGoals();
  buildShop();
  render();
  requestAnimationFrame(frame);
})();
