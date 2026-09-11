/* For Chotu · interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const haptic = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };
  const today = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')} · ${String(d.getMonth() + 1).padStart(2, '0')} · ${d.getFullYear()}`; };

  /* Envelope */
  const body = document.body, envelope = $('#envelope');
  body.classList.add('is-sealed');
  $('#seal').addEventListener('click', () => {
    if (envelope.classList.contains('is-open')) return;
    envelope.classList.add('is-open'); haptic(30);
    setTimeout(() => { body.classList.remove('is-sealed'); window.scrollTo(0, 0); startReveals(); startProgress(); }, 900);
    setTimeout(() => envelope.remove(), 1900);
  });

  /* Reveal on scroll: anything at or above the viewport gets shown, so nothing is skipped by a fast fling */
  let pending = [];
  const revealEl = (el) => {
    el.classList.add('is-in');
    if (el.classList.contains('hero__h')) { setTimeout(() => $('#stamp').classList.add('is-in'), 900); setTimeout(() => haptic(20), 1150); }
    if (el.querySelector && el.querySelector('#sigA')) $('#sigA').classList.add('is-in');
    $$('.count', el).forEach(countUp);
  };
  let ticking = false;
  const check = () => {
    ticking = false;
    const limit = innerHeight * 0.92;
    pending = pending.filter((el) => { if (el.getBoundingClientRect().top < limit) { revealEl(el); return false; } return true; });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
  const startReveals = () => { pending = $$('.rv'); addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); check(); };

  /* Count up numbers */
  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const to = parseFloat(el.dataset.to), dec = +el.dataset.dec || 0, t0 = performance.now(), dur = 1600;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* Progress bar */
  const prog = $('#progress'), progBar = prog.querySelector('i'), progHeart = prog.querySelector('b');
  let pTick = false;
  const drawProgress = () => { pTick = false; const max = document.documentElement.scrollHeight - innerHeight; const k = max > 0 ? Math.min(1, scrollY / max) : 0; progBar.style.transform = `scaleX(${k})`; progHeart.style.left = `${k * 100}%`; };
  const startProgress = () => { addEventListener('scroll', () => { if (!pTick) { pTick = true; requestAnimationFrame(drawProgress); } }, { passive: true }); drawProgress(); };

  /* Custom cursor */
  const cur = $('#cursor');
  if (fine && !reduced) {
    const dot = cur.querySelector('i'), ring = cur.querySelector('b');
    let mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; mx = e.clientX; my = e.clientY; if (!shown) { shown = true; cur.classList.remove('is-hidden'); } }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cur.classList.remove('is-hidden'));
    const hot = 'button, a, .hv, .zoom, .ph, textarea, .seg, .chip';
    document.addEventListener('pointerover', (e) => { cur.classList.toggle('is-hot', e.target instanceof Element && !!e.target.closest(hot)); });
    (function tickCur() { rx += (mx - rx) * .18; ry += (my - ry) * .18; dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`; ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`; requestAnimationFrame(tickCur); })();
  }

  /* Lens: each .hv gets an overlay copy of itself with every phrase replaced by its second reading.
     The overlay is masked by a soft circle that follows the pointer, so only what sits inside the circle reads differently, with no reflow. */
  const lensEl = document.createElement('div'); lensEl.className = 'lens'; document.body.appendChild(lensEl);
  const hvs = $$('.hv');
  hvs.forEach((h) => {
    const alt = h.cloneNode(true); alt.className = 'hv__alt'; alt.removeAttribute('style'); alt.setAttribute('aria-hidden', 'true');
    $$('.p', alt).forEach((ph) => { ph.textContent = ph.dataset.alt; ph.removeAttribute('data-alt'); ph.className = ''; });
    $$('.hv__alt', alt).forEach((x) => x.remove());
    h.appendChild(alt);
  });
  let lensHV = null, lensHide = 0;
  const placeLens = (h, x, y) => { const r = h.getBoundingClientRect(); h.style.setProperty('--x', `${x - r.left}px`); h.style.setProperty('--y', `${y - r.top}px`); };
  const lensOff = () => { if (lensHV) { lensHV.classList.remove('is-on'); lensHV = null; } cur.classList.remove('is-lens'); lensEl.classList.remove('is-on'); };
  if (fine) {
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const h = e.target instanceof Element ? e.target.closest('.hv') : null;
      if (h !== lensHV) { if (lensHV) lensHV.classList.remove('is-on'); lensHV = h; if (h) h.classList.add('is-on'); cur.classList.toggle('is-lens', !!h); }
      if (h) placeLens(h, e.clientX, e.clientY);
    }, { passive: true });
    document.addEventListener('mouseleave', lensOff);
  } else {
    hvs.forEach((h) => {
      h.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; clearTimeout(lensHide); if (lensHV && lensHV !== h) lensHV.classList.remove('is-on'); lensHV = h; h.classList.add('is-on'); placeLens(h, e.clientX, e.clientY); lensEl.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`; lensEl.classList.add('is-on'); haptic(8); }, { passive: true });
      h.addEventListener('pointermove', (e) => { if (lensHV !== h) return; placeLens(h, e.clientX, e.clientY); lensEl.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`; }, { passive: true });
      const rel = () => { clearTimeout(lensHide); lensHide = setTimeout(lensOff, 1400); };
      h.addEventListener('pointerup', rel); h.addEventListener('pointercancel', rel);
    });
  }

  /* Drag to scroll on rails (mouse only; touch scrolls natively) */
  $$('.rail').forEach((rail) => {
    let down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('is-drag'); });
    rail.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; moved += Math.abs(dx); rail.scrollLeft = sl - dx; });
    const up = () => { down = false; rail.classList.remove('is-drag'); };
    rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up); rail.addEventListener('pointerleave', up);
    rail.addEventListener('click', (e) => { if (moved > 8) { e.stopPropagation(); e.preventDefault(); } }, true);
  });

  /* Zoom lens on drawings: origin follows the cursor */
  if (fine) $$('.zoom').forEach((z) => {
    const im = z.querySelector('img');
    z.addEventListener('pointermove', (e) => { const r = z.getBoundingClientRect(); im.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; }, { passive: true });
  });

  /* Options */
  const flipped = new Set();
  const notes = { a: 'Option A picked. Outcome unchanged.', b: 'Option B picked. Outcome unchanged.', both: 'See? It was never about the option.' };
  $$('.opt').forEach((btn) => btn.addEventListener('click', () => {
    btn.classList.toggle('is-flipped'); haptic(15);
    const k = btn.dataset.opt; btn.classList.contains('is-flipped') ? flipped.add(k) : flipped.delete(k);
    $('#optNote').textContent = flipped.size === 2 ? notes.both : (flipped.size ? notes[k] : ' ');
    if (flipped.size === 2) burst(innerWidth / 2, btn.getBoundingClientRect().top, 24, ['♥']);
  }));

  /* Hugs */
  let hugs = 0;
  const hugLines = ['Hug dispensed. No receipt needed.', 'Second hug. Longer this time.', 'Third hug. The squeeze kind.', 'Hug four. Still unlimited. Still free.', 'Hug five. You are collecting these now.', 'Hug six. Fine. Take them all.'];
  const hugBtn = $('#hugBtn');
  hugBtn.addEventListener('click', () => {
    hugs++; haptic([10, 30, 10]);
    hugBtn.classList.remove('is-rip'); void hugBtn.offsetWidth; hugBtn.classList.add('is-rip');
    const r = hugBtn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 18, ['♥', '♡', '🫂']);
    $('#hugCount').textContent = hugs <= hugLines.length ? `${hugLines[hugs - 1]} · Dispensed: ${hugs} · Remaining: ∞` : `Hugs dispensed: ${hugs} · Remaining: ∞ · Yes, still`;
  });

  /* Complaints */
  let complaint = 'blanket';
  $$('.chip').forEach((c) => c.addEventListener('click', () => { $$('.chip').forEach((x) => x.classList.remove('is-on')); c.classList.add('is-on'); complaint = c.dataset.v; }));
  const replies = {
    blanket: 'Complaint 001 · Blanket stealing\nStatus: Upheld. Guilty as charged.\nRemedy (section 04): one blanket returned, with interest paid in cuddles.\nRepeat offence likely. Sorry in advance.',
    whatever: 'Complaint 002 · Use of “whatever”\nStatus: Under investigation.\nNote: the employee reserves the right to say “whatever you want, baby”, which is the legal form.\nRemedy: hug. Immediately.',
    kiss: 'Complaint 003 · Left without goodbye kiss\nStatus: Unacceptable. Agreed.\nRemedy: two goodbye kisses, back dated, plus one hello kiss at the next meeting.\nPolicy updated: no door opens without a kiss.',
    other: 'Complaint 004 · Other\nStatus: Received with full seriousness and a small smile.\nRemedy: honest communication, patience and hugs. Your words, section 04.\nWe will talk about it. We always do.',
  };
  $('#complaintForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const extra = $('#complaintText').value.trim(), box = $('#complaintReply');
    box.hidden = false; box.textContent = replies[complaint] + (extra ? `\n\nDetails noted: “${extra}”` : '');
    haptic(20); burst(innerWidth / 2, box.getBoundingClientRect().top + 40, 12, ['♥']);
  });

  /* Signature pad */
  const pad = $('#pad'), ctx = pad.getContext('2d'), hint = $('#padHint'), signBtn = $('#padSign');
  let drawing = false, hasInk = false, last = null;
  const fitPad = () => {
    const r = pad.getBoundingClientRect(); if (!r.width) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5), snap = hasInk ? pad.toDataURL() : null;
    pad.width = Math.round(r.width * dpr); pad.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#3b2a6b';
    if (snap) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height); im.src = snap; }
  };
  fitPad(); addEventListener('resize', fitPad);
  const pos = (e) => { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || .5 }; };
  pad.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); pad.setPointerCapture(e.pointerId); hint.classList.add('is-hidden'); });
  pad.addEventListener('pointermove', (e) => {
    if (!drawing) return; const p = pos(e);
    ctx.lineWidth = 1.6 + p.p * 2.2; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; hasInk = true; signBtn.disabled = false;
  });
  const stop = () => { drawing = false; };
  pad.addEventListener('pointerup', stop); pad.addEventListener('pointercancel', stop); pad.addEventListener('pointerleave', stop);
  $('#padClear').addEventListener('click', () => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, pad.width, pad.height); ctx.restore(); hasInk = false; signBtn.disabled = true; hint.classList.remove('is-hidden'); });
  signBtn.addEventListener('click', () => {
    $('#padDate').textContent = today(); signBtn.disabled = true; signBtn.textContent = 'Countersigned ✓'; $('#padClear').disabled = true;
    const ex = $('#executed'); ex.hidden = false; haptic([20, 40, 20, 40, 60]);
    setTimeout(() => ex.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); confetti(110);
  });

  /* Proposal */
  const box = $('#boxBtn'), question = $('#question'), qText = $('#qText'), caret = $('#caret'), answers = $('#answers');
  let opened = false;
  box.addEventListener('click', () => {
    if (opened) return; opened = true;
    box.classList.add('is-open'); $('#boxHint').textContent = ' '; haptic([15, 30, 15]);
    setTimeout(() => { question.hidden = false; question.scrollIntoView({ behavior: 'smooth', block: 'center' }); typeQuestion('Sakshi Ahuja, will you marry me?'); }, 1400);
  });
  function typeQuestion(str) {
    let i = 0;
    const tick = () => {
      qText.textContent = str.slice(0, ++i);
      if (i < str.length) setTimeout(tick, str[i - 1] === ',' ? 420 : 70);
      else setTimeout(() => { caret.style.display = 'none'; answers.hidden = false; }, 500);
    };
    tick();
  }
  const saidYes = () => {
    answers.hidden = true; haptic([30, 60, 30, 60, 120]);
    const said = $('#said'); said.hidden = false; $('#saidDate').textContent = today();
    confetti(160, ['#d8497a', '#f7c4d3', '#c9a15c', '#ffffff', '#ffd7e3']);
    setTimeout(() => said.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    setTimeout(() => confetti(90, ['#c9a15c', '#f6e2b0', '#ffffff']), 1400);
    try { localStorage.setItem('chotu-said-yes', today()); } catch (_) {}
  };
  $('#yes1').addEventListener('click', saidYes); $('#yes2').addEventListener('click', saidYes);

  /* Time of day toggle */
  const tod = $('#tod');
  $$('.seg button').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.t; tod.dataset.t = t; haptic(8);
    $$('.seg button').forEach((x) => x.classList.toggle('is-on', x === b));
    $$('.tod__img img').forEach((im) => im.classList.toggle('is-on', im.dataset.t === t));
  }));

  /* Lightbox for sheets */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbScroll = $('#lbScroll');
  const captions = ['Cover', 'CV and profile', 'Contents', 'Rupture to Renewal · overview', 'Mapping Swati’s walk', 'Swati’s emotional mapping', 'Everyday economy · vendors', 'Urban Forest Market Street', 'Adaptable bamboo structure · details', 'Lithium Futures · overview', 'Adaptive reuse strategy', 'Ground floor plan and details', 'Environmental strategy 1:50', 'Non standard habitat · bio facade', '99 Studio · column centre lines', 'Urbscapes · toilet and staircase details', 'Urbscapes · kitchen details', 'Thank you :)'];
  let idx = 1;
  const show = (i) => { idx = ((i - 1 + 18) % 18) + 1; lbImg.src = `img/folio/p${String(idx).padStart(2, '0')}.jpg`; lbCap.textContent = `Sheet ${String(idx).padStart(2, '0')} of 18 · ${captions[idx - 1]}`; lbScroll.classList.remove('is-zoom'); lbScroll.scrollTo(0, 0); };
  $$('#sheets button').forEach((b) => b.addEventListener('click', () => { lb.hidden = false; body.style.overflow = 'hidden'; show(+b.dataset.i); }));
  const close = () => { lb.hidden = true; body.style.overflow = ''; };
  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', () => show(idx - 1)); $('#lbNext').addEventListener('click', () => show(idx + 1));
  lbImg.addEventListener('click', () => lbScroll.classList.toggle('is-zoom'));
  addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(idx + 1); if (e.key === 'ArrowLeft') show(idx - 1); });
  let tx = 0; lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (lbScroll.classList.contains('is-zoom')) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 60) show(idx + (dx < 0 ? 1 : -1)); }, { passive: true });

  /* ═══ Things to discover ═══ */
  const toastEl = $('#toast'); let toastT = 0;
  const toast = (msg, ms = 4200) => { toastEl.textContent = msg; toastEl.hidden = false; requestAnimationFrame(() => toastEl.classList.add('is-on')); clearTimeout(toastT); toastT = setTimeout(() => { toastEl.classList.remove('is-on'); setTimeout(() => { toastEl.hidden = true; }, 400); }, ms); };
  const found = new Set();
  const find = (key, msg, ms) => { const first = !found.has(key); found.add(key); toast(msg, ms); if (first) { try { localStorage.setItem('found-' + key, '1'); } catch (_) {} } };

  // 1. The 14 on the envelope
  $('#egg14').addEventListener('click', (e) => { e.stopPropagation(); find('14', '14, because of the 14th. Every one of them counts.'); });

  // 2. Polaroids have backs
  $$('.ph').forEach((ph) => ph.addEventListener('click', (e) => { if (e.defaultPrevented) return; ph.classList.toggle('is-flipped'); haptic(8); if (!found.has('backs')) { found.add('backs'); } }));

  // 3. The stamp can be pressed again
  const stampLines = ['still', 'again', 'and again', 'you can stop pressing, the answer stays yes', 'yes', 'still yes', 'with my whole heart'];
  let stampI = 0;
  $('#stamp').addEventListener('click', () => { const st = $('#stamp'); st.classList.remove('is-restamp'); void st.offsetWidth; st.classList.add('is-restamp'); $('#stampSmall').textContent = stampLines[stampI++ % stampLines.length]; haptic(12); });

  // 4. Hug milestones
  const hugMilestones = { 14: 'Fourteen. Of course it is fourteen.', 50: 'Fifty. Go drink some water. I love you.', 100: 'One hundred. Okay. Now call me.' };
  hugBtn.addEventListener('click', () => { if (hugMilestones[hugs]) find('hug' + hugs, hugMilestones[hugs]); });

  // 5. The complaints form reads what you type
  $('#complaintForm').addEventListener('submit', () => {
    const t = $('#complaintText').value.toLowerCase();
    if (/love/.test(t)) setTimeout(() => { $('#complaintReply').textContent = 'Complaint rejected. That is not a complaint. Refiled under compliments, with thanks.'; }, 50);
    else if (/miss/.test(t)) setTimeout(() => { $('#complaintReply').textContent = 'Complaint upheld. I miss you too. Remedy: I am checking flights as you read this.'; }, 50);
  });

  // 6. The moon in her own render
  $('#sky').addEventListener('click', () => { if (tod.dataset.t !== 'night') return; find('moon', 'You drew a moon over that street. It is the same one over both of us tonight.'); });

  // 7. The ticker knows about sheet 09
  $('.ticker').addEventListener('click', () => find('ticker', 'Sheet 09. The bamboo lashing detail. I keep going back to that one.'));

  // 8. Typing her name, or tapping the dot five times
  let typed = ''; addEventListener('keydown', (e) => { if (e.key.length !== 1) return; typed = (typed + e.key.toLowerCase()).slice(-5); if (typed === 'chotu') { find('name', 'You typed your own name. Of course you did. There are more of these.'); burst(innerWidth / 2, innerHeight / 2, 30, ['♥']); } });
  let dots = 0, dotT = 0; $('#dot').addEventListener('click', () => { dots++; clearTimeout(dotT); dotT = setTimeout(() => { dots = 0; }, 1500); if (dots === 5) { dots = 0; find('name', 'Five taps. You found this one. There are more.'); burst(innerWidth / 2, innerHeight / 3, 30, ['♥']); } });

  // 9. Double tap the title
  $('.hero__h').addEventListener('dblclick', (e) => burst(e.clientX, e.clientY, 22, ['♥', '♡']));

  // 10. The tab misses her
  const realTitle = document.title;
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'Come back, Chotu.' : realTitle; });

  // 11. The 14th of any month
  if (new Date().getDate() === 14) { $('#anniv').hidden = false; }

  // 12. The very bottom
  let endT = 0; addEventListener('scroll', () => { const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 4; clearTimeout(endT); if (atEnd) endT = setTimeout(() => $('#endnote').classList.add('is-on'), 1500); }, { passive: true });

  /* FX canvas: hearts and confetti, 1x resolution, hidden when idle */
  const fx = $('#fx'), fctx = fx.getContext('2d');
  let parts = [], raf = 0;
  const fitFx = () => { fx.width = innerWidth; fx.height = innerHeight; };
  fitFx(); addEventListener('resize', fitFx);
  const loop = () => {
    fctx.clearRect(0, 0, fx.width, fx.height);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
      fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.txt) { fctx.font = `${p.size}px serif`; fctx.fillStyle = p.color; fctx.textAlign = 'center'; fctx.textBaseline = 'middle'; fctx.fillText(p.txt, 0, 0); }
      else { fctx.fillStyle = p.color; fctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
      fctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop); else { fctx.clearRect(0, 0, fx.width, fx.height); fx.style.display = 'none'; raf = 0; }
  };
  const kick = () => { fx.style.display = 'block'; if (!raf) raf = requestAnimationFrame(loop); };
  function burst(x, y, n, glyphs) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, g: .12, rot: 0, vr: (Math.random() - .5) * .2, size: 14 + Math.random() * 16, life: 1, decay: .012 + Math.random() * .01, txt: glyphs[Math.floor(Math.random() * glyphs.length)], color: Math.random() < .7 ? '#d8497a' : '#c9a15c' });
    }
    kick();
  }
  function confetti(n, colors = ['#d8497a', '#f7c4d3', '#c9a15c', '#ffffff', '#2c1a22']) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .4, vx: (Math.random() - .5) * 2, vy: 1 + Math.random() * 3, g: .05, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, size: 6 + Math.random() * 8, life: 1.6, decay: .006 + Math.random() * .004, color: colors[i % colors.length], txt: i % 9 === 0 ? '♥' : null });
    }
    kick();
  }
})();
