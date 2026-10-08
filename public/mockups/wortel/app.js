/* Wortel mockup – shared behaviour for every page */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const G = !!window.gsap && !reduce;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  let lenis = null;

  if (!G) { root.classList.remove('is-entering'); root.classList.add('no-anim'); }

  /* ---------- Growing roots on every dark hero ---------- */
  $$('canvas.roots').forEach(cv => {
    const cx = cv.getContext('2d');
    const big = cv.id === 'roots';
    let tips = [], W, H, mouse = { x: -999, y: -999 };
    const seed = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, W, H); tips = [];
      const n = Math.max(4, Math.round(W / (big ? 160 : 220)));
      for (let i = 0; i < n; i++) tips.push({ x: (i + 0.5) * W / n + (Math.random() - 0.5) * 60, y: -10, a: Math.PI / 2 + (Math.random() - 0.5) * 0.4, w: (big ? 2.6 : 1.8) + Math.random() * 1.2, gen: 0 });
    };
    const grow = () => {
      const next = [];
      for (const t of tips) {
        const nx = t.x + Math.cos(t.a) * 2.2, ny = t.y + Math.sin(t.a) * 2.2;
        const near = Math.hypot(nx - mouse.x, ny - mouse.y) < 140;
        cx.strokeStyle = near ? 'rgba(212,170,128,.85)' : `rgba(197,207,170,${0.16 + 0.3 * (t.w / 4)})`;
        cx.lineWidth = t.w; cx.lineCap = 'round';
        cx.beginPath(); cx.moveTo(t.x, t.y); cx.lineTo(nx, ny); cx.stroke();
        t.x = nx; t.y = ny;
        t.a += (Math.random() - 0.5) * 0.22 + (Math.PI / 2 - t.a) * 0.01;
        t.w *= 0.996;
        if (t.w > 0.35 && t.y < H + 20 && t.x > -20 && t.x < W + 20) {
          next.push(t);
          if (Math.random() < 0.018 && t.gen < 6) next.push({ x: t.x, y: t.y, a: t.a + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.6), w: t.w * 0.7, gen: t.gen + 1 });
        }
      }
      tips = next.slice(0, 400);
    };
    seed();
    if (reduce) { for (let i = 0; i < 700; i++) grow(); }
    else { const loop = () => { if (tips.length) { grow(); grow(); grow(); } requestAnimationFrame(loop); }; loop(); }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(cv.clientWidth - W) > 40) seed(); }, 250); });
    const host = cv.parentElement;
    host.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  });

  /* ---------- Generative art per treatment ---------- */
  $$('canvas[data-art]').forEach(c => {
    const k = +c.dataset.art, g = c.getContext('2d');
    const draw = time => {
      const w = c.clientWidth, h = c.clientHeight, r = Math.min(devicePixelRatio || 1, 2);
      if (!w || !h) return;
      if (c.width !== Math.round(w * r)) { c.width = w * r; c.height = h * r; }
      g.setTransform(r, 0, 0, r, 0, 0);
      g.fillStyle = ['#4a5a27', '#d9cfbd', '#2f3a22'][k]; g.fillRect(0, 0, w, h);
      const t = time / 1000, m = Math.min(w, h);
      if (k === 0) { // breathing rings
        for (let i = 12; i > 0; i--) { g.beginPath(); g.arc(w / 2, h / 2, i * m / 26 + Math.sin(t * 0.8 + i * 0.5) * m / 60, 0, 7); g.strokeStyle = `rgba(197,207,170,${0.08 + i * 0.03})`; g.lineWidth = 1; g.stroke(); }
      } else if (k === 1) { // acupressure points on meridians
        const rows = Math.max(4, Math.round(h / 60));
        for (let l = 0; l < rows; l++) {
          const base = h * ((l + 0.6) / (rows + 0.2));
          g.beginPath(); for (let x = 0; x <= w; x += 6) { const y = base + Math.sin(x / 50 + t + l) * 10; x ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.strokeStyle = 'rgba(74,90,39,.35)'; g.lineWidth = 1; g.stroke();
          for (let p = 0; p < 6; p++) { const x = (p + 0.5) * w / 6, y = base + Math.sin(x / 50 + t + l) * 10, a = 0.5 + 0.5 * Math.sin(t * 2 + p + l); g.beginPath(); g.arc(x, y, 3 + a * 3, 0, 7); g.fillStyle = `rgba(184,135,94,${0.4 + a * 0.6})`; g.fill(); }
        }
      } else { // muscle-test field lines
        const n = Math.round(h / 8);
        for (let i = 0; i < n; i++) { g.beginPath(); const y0 = (i / (n - 1)) * h; g.moveTo(0, y0); g.bezierCurveTo(w * 0.33, y0 + Math.sin(t + i * 0.3) * 30, w * 0.66, y0 - Math.cos(t * 0.7 + i * 0.2) * 30, w, y0); g.strokeStyle = `rgba(197,207,170,${i % 5 === 0 ? 0.33 : 0.12})`; g.lineWidth = 1; g.stroke(); }
      }
    };
    let vis = false;
    new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(c);
    if (reduce) { requestAnimationFrame(() => draw(0)); return; }
    const tick = ts => { if (vis) draw(ts); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });

  /* ---------- Menu ---------- */
  const drawer = $('#drawer'), mb = $('#menuBtn');
  const setMenu = o => { drawer.classList.toggle('open', o); mb.setAttribute('aria-expanded', o); if (lenis) o ? lenis.stop() : lenis.start(); };
  mb.addEventListener('click', () => setMenu(true));
  $('#menuClose').addEventListener('click', () => setMenu(false));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Breathing orb ---------- */
  const bBtn = $('#breathBtn');
  if (bBtn) {
    const orbText = $('#orbText'), cnt = $('#breathCount');
    let tl = null, n = 0;
    bBtn.addEventListener('click', () => {
      if (!window.gsap) return;
      if (tl) { tl.kill(); tl = null; gsap.to('#orb', { scale: 1, duration: 1 }); orbText.textContent = 'Klaar?'; bBtn.textContent = 'Start ademhaling'; return; }
      bBtn.textContent = 'Stop'; n = 0;
      tl = gsap.timeline({ repeat: -1, onRepeat: () => { n++; cnt.textContent = n + (n === 1 ? ' ademhaling' : ' ademhalingen'); } })
        .call(() => orbText.textContent = 'Adem in').to('#orb', { scale: 1.55, duration: 4, ease: 'sine.inOut' })
        .call(() => orbText.textContent = 'Houd vast').to({}, { duration: 2 })
        .call(() => orbText.textContent = 'Adem uit').to('#orb', { scale: 1, duration: 6, ease: 'sine.inOut' });
    });
  }

  /* ---------- Draggable reviews ---------- */
  const track = $('#rvTrack');
  if (track) {
    let down = false, sx = 0, ox = 0, x = 0, v = 0, lastX = 0, moved = false;
    const maxX = () => Math.min(0, -(track.scrollWidth - track.parentElement.clientWidth));
    const setX = val => { x = val; track.style.transform = `translateX(${x}px)`; };
    track.addEventListener('pointerdown', e => { if (maxX() === 0) return; down = true; moved = false; sx = e.clientX; ox = x; lastX = e.clientX; v = 0; track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointermove', e => { if (!down) return; moved = true; v = e.clientX - lastX; lastX = e.clientX; setX(Math.max(maxX() - 80, Math.min(80, ox + e.clientX - sx))); });
    track.addEventListener('pointerup', () => { if (!down) return; down = false; const target = Math.max(maxX(), Math.min(0, x + v * 12)); if (window.gsap) gsap.to({ v: x }, { v: target, duration: 1, ease: 'expo.out', onUpdate() { setX(this.targets()[0].v); } }); else setX(target); });
  }

  initBooking();

  /* ---------- Floating booking pill: visible after the hero, hidden at the footer ---------- */
  const pill = $('.book-pill');
  if (pill) {
    const ftr = $('.ftr');
    const check = () => pill.classList.toggle('show', scrollY > innerHeight * 0.6 && ftr.getBoundingClientRect().top > innerHeight * 0.9);
    addEventListener('scroll', check, { passive: true }); check();
  }

  if (!G) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.08 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Page transitions: circle closes in from the click point ---------- */
  const pt = $('.pt');
  const internal = a => {
    const h = a.getAttribute('href') || '';
    return !(a.target === '_blank' || /^(mailto|tel|https?):/.test(h)) && /\.html(\?|#|$)/.test(h);
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (h.startsWith('#') && h.length > 1) { const el = $(h); if (el) { e.preventDefault(); setMenu(false); lenis ? lenis.scrollTo(el, { duration: 1.4 }) : el.scrollIntoView(); } return; }
    if (!internal(a) || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const at = `${e.clientX || innerWidth / 2}px ${e.clientY || innerHeight / 2}px`;
    gsap.timeline()
      .set(pt, { visibility: 'visible', clipPath: `circle(0% at ${at})` })
      .to(pt, { clipPath: `circle(150% at ${at})`, duration: 0.85, ease: 'power3.inOut' })
      .add(() => { location.href = a.href; });
  });
  addEventListener('pageshow', e => { if (e.persisted) gsap.set(pt, { visibility: 'hidden', clipPath: 'circle(0% at 50% 50%)' }); });
  root.classList.remove('is-entering');
  gsap.fromTo(pt, { visibility: 'visible', clipPath: 'circle(150% at 50% 50%)' }, { clipPath: 'circle(0% at 50% 50%)', duration: 1, ease: 'power3.inOut', onComplete: () => gsap.set(pt, { visibility: 'hidden' }) });

  /* ---------- Custom cursor ---------- */
  if (fine) {
    const d = $('.cur'), r = $('.cur-ring');
    const dx = gsap.quickTo(d, 'left', { duration: 0.1 }), dy = gsap.quickTo(d, 'top', { duration: 0.1 });
    const rx = gsap.quickTo(r, 'left', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(r, 'top', { duration: 0.5, ease: 'power3' });
    addEventListener('mousemove', e => { root.classList.add('has-cursor'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('mouseleave', () => root.classList.remove('has-cursor'));
    document.addEventListener('mouseover', e => r.classList.toggle('big', !!e.target.closest('a,button,label,.panel,.rv-track')));
  }

  /* ---------- Hero title: letters rise in, words never break ---------- */
  $$('h1.chars').forEach(el => {
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(word => {
          if (!word) return;
          if (/^\s+$/.test(word)) { f.append(' '); return; }
          const w = document.createElement('span'); w.style.cssText = 'display:inline-block;white-space:nowrap';
          [...word].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.style.display = 'inline-block'; s.textContent = ch; w.append(s); });
          f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeName !== 'BR') walk(c);
    });
    walk(el);
  });
  const heroEl = $('.hero, .phero');
  gsap.timeline({ delay: 0.45 })
    .from(heroEl.querySelectorAll('.ch'), { yPercent: 60, opacity: 0, rotate: 8, filter: 'blur(10px)', duration: 1.3, stagger: 0.028, ease: 'expo.out' })
    .from(heroEl.querySelectorAll('.hero-fade'), { opacity: 0, y: 30, duration: 1, stagger: 0.1, ease: 'power3.out' }, '-=1');
  const heroPortrait = $('.phero .portrait');
  if (heroPortrait) gsap.from(heroPortrait, { clipPath: 'inset(100% 0 0 0 round 200px 200px 24px 24px)', duration: 1.6, ease: 'expo.inOut', delay: 0.5 });
  gsap.to(heroEl.querySelector('.wrap'), { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Reveals ---------- */
  $$('.reveal').forEach(el => gsap.from(el, { y: 44, opacity: 0, filter: 'blur(6px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  $$('main .portrait').forEach(p => {
    if (p.closest('.phero')) return;
    gsap.from(p, { clipPath: 'inset(100% 0 0 0 round 200px 200px 24px 24px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: p, start: 'top 85%' } });
  });
  $$('.portrait img').forEach(img => gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, scrub: true } }));
  $$('.reveal-words').forEach(p => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="rw">${w}</span>`).join(' ');
    gsap.to(p.querySelectorAll('.rw'), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });
  if ($('.orb-wrap')) {
    gsap.from('.orb-wrap', { scale: 0.6, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.orb-wrap', start: 'top 85%' } });
    gsap.to('.orb-ring', { rotate: 360, duration: 60, repeat: -1, ease: 'none' });
  }
  $$('.cloud').forEach(c => gsap.from(c.children, { y: 30, opacity: 0, scale: 0.9, duration: 0.8, stagger: 0.06, ease: 'back.out(1.6)', scrollTrigger: { trigger: c, start: 'top 85%' } }));
  $$('.grid2, .grid3').forEach(g => gsap.from(g.children, { y: 60, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: g, start: 'top 85%' } }));
  gsap.from('.ftr-big', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 85%' } });

  /* Timelines: line grows and dots light up */
  $$('.tl').forEach(tl => {
    const steps = $$('.step', tl);
    const vertical = matchMedia('(max-width:760px)').matches;
    gsap.to(tl.querySelector('.tl-line b'), { [vertical ? 'scaleY' : 'scaleX']: 1, ease: 'none',
      scrollTrigger: { trigger: tl, start: 'top 75%', end: 'bottom 55%', scrub: true,
        onUpdate: s => steps.forEach((st, i) => st.classList.toggle('on', s.progress >= i / steps.length + 0.02)) } });
    gsap.from(steps, { y: 30, opacity: 0, stagger: 0.15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: tl, start: 'top 80%' } });
  });

  /* Kinesiology web draws itself */
  if ($('.web')) {
    $$('.web-line').forEach(l => { const L = l.getTotalLength(); l.style.strokeDasharray = L; l.style.strokeDashoffset = L; });
    gsap.timeline({ scrollTrigger: { trigger: '.web', start: 'top 75%' } })
      .from('.web-core, .web-core-t', { scale: 0, transformOrigin: '300px 220px', duration: 1, ease: 'back.out(1.6)' })
      .to('.web-line', { strokeDashoffset: 0, duration: 1, stagger: 0.12, ease: 'power2.out' }, '-=.4')
      .from('.web-node', { opacity: 0, scale: 0.4, transformOrigin: 'center', stagger: 0.12, duration: 0.6, ease: 'back.out(2)' }, '-=1');
    gsap.to('.web-node circle', { attr: { r: 9 }, duration: 1.2, yoyo: true, repeat: -1, stagger: 0.3, ease: 'sine.inOut' });
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    /* Root ↔ Embodiment pinned scene */
    if ($('#duo')) {
      const rootP = $('#duoRoot'), body = $('#duoBody'), ground = $('#duoCircle');
      [rootP, body, ground].forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
      gsap.timeline({ scrollTrigger: { trigger: '#duo', start: 'top top', end: '+=200%', pin: true, scrub: 1 } })
        .to(ground, { strokeDashoffset: 0, duration: 1 })
        .to(rootP, { strokeDashoffset: 0, duration: 1.4 }, 0)
        .to('#pb1', { scaleX: 1, duration: 1.4 }, 0)
        .to('#p1', { opacity: 0, y: -40, duration: 0.5 }, 1.6)
        .to(rootP, { opacity: 0, duration: 0.4 }, 1.6)
        .fromTo('#p2', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5 }, 1.9)
        .set(body, { opacity: 1 }, 1.9)
        .to(body, { strokeDashoffset: 0, duration: 1.4 }, 1.9)
        .to('#pb2', { scaleX: 1, duration: 1.4 }, 1.9)
        .to(ground, { opacity: 0.25, duration: 1 }, 1.9);
    }
    /* Horizontal treatments on the home page */
    const ht = $('#htrack');
    if (ht) {
      const dist = () => ht.scrollWidth - innerWidth;
      gsap.to(ht, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.htrack-sec', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
    }
  });
  mm.add('(max-width: 860px)', () => {
    $$('.htrack .panel').forEach(p => gsap.from(p, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 90%' } }));
  });

  /* ================= booking widget (works without GSAP) ================= */
  function initBooking() {
    const grid = $('#calGrid');
    if (!grid) return;
    const title = $('#calTitle'), slotsEl = $('#slots'), summary = $('#summary'), consent = $('#consent'), btn = $('#confirmBtn'), done = $('#done');
    const pre = new URLSearchParams(location.search).get('b');
    if (pre) { const r = $(`#opts input[value="${pre}"]`); if (r) r.checked = true; }
    const treatName = () => { const r = $('#opts input:checked'); return r ? r.closest('.opt').querySelector('b').textContent : ''; };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let view = new Date(today.getFullYear(), today.getMonth(), 1), day = null, time = null;
    const isAvail = d => d >= today && [1, 2, 4].includes(d.getDay()) && (d.getDate() * 7) % 5 !== 0;
    const fmt = d => d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });
    function render() {
      title.textContent = view.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
      grid.innerHTML = '';
      for (let i = 0; i < (view.getDay() + 6) % 7; i++) grid.append(document.createElement('span'));
      const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (let n = 1; n <= days; n++) {
        const d = new Date(view.getFullYear(), view.getMonth(), n);
        const b = document.createElement('button'); b.type = 'button'; b.textContent = n;
        if (isAvail(d)) {
          b.className = 'av'; b.setAttribute('aria-label', fmt(d));
          if (day && d.getTime() === day.getTime()) b.classList.add('sel');
          b.addEventListener('click', () => { day = d; time = null; render(); renderSlots(); update(); });
        } else b.disabled = true;
        grid.append(b);
      }
    }
    function renderSlots() {
      slotsEl.innerHTML = '';
      ['09:00', '10:30', '13:30', '15:00', '17:30'].filter((_, i) => (day.getDate() + i) % 4 !== 0).forEach(t => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = t;
        if (t === time) b.className = 'sel';
        b.addEventListener('click', () => { time = t; renderSlots(); update(); });
        slotsEl.append(b);
      });
      if (window.gsap && !reduce) gsap.from(slotsEl.children, { y: 10, opacity: 0, stagger: 0.04, duration: 0.4 });
    }
    function update() {
      summary.textContent = day && time ? `${treatName()} · ${fmt(day)} om ${time}` : day ? `${treatName()} · ${fmt(day)}, kies nog een uur` : 'Nog geen moment gekozen.';
      btn.disabled = !(day && time && consent.checked);
    }
    $('#calPrev').addEventListener('click', () => { const p = new Date(view.getFullYear(), view.getMonth() - 1, 1); if (p >= new Date(today.getFullYear(), today.getMonth(), 1)) { view = p; render(); } });
    $('#calNext').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
    $$('#opts input').forEach(r => r.addEventListener('change', update));
    consent.addEventListener('change', update);
    btn.addEventListener('click', () => { done.hidden = false; if (window.gsap && !reduce) gsap.from(done, { y: 10, opacity: 0, duration: 0.5 }); });
    render(); update();
  }
})();
