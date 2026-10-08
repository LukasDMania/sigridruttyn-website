/* Stilte mockup – shared behaviour for every page */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const G = !!window.gsap && !reduce;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };
  let lenis = null;

  if (!G) {
    root.classList.remove('is-entering');
    root.classList.add('no-anim');
    const l = $('.loader'); if (l) l.remove();
  }

  /* ---------- Header + menu (works without GSAP) ---------- */
  const hdr = $('#hdr');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-solid', y > 40);
    hdr.classList.toggle('is-hidden', y > 300 && y > lastY && !root.classList.contains('menu-open'));
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('#burger');
  const setMenu = open => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    $$('.overlay a').forEach((a, i) => a.style.transitionDelay = open ? (0.25 + i * 0.05) + 's' : '0s');
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Booking widget (works without GSAP) ---------- */
  initBooking();
  /* ---------- Practical info: table of contents highlight ---------- */
  initToc();

  if (!G) { initStatic(); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Page transitions ---------- */
  const pt = $('.pt');
  const isInternal = a => {
    const h = a.getAttribute('href');
    if (!h || h.startsWith('#') || a.target === '_blank' || h.startsWith('mailto:') || h.startsWith('tel:') || /^https?:/.test(h)) return false;
    return /\.html(\?|#|$)/.test(h);
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    if (h.startsWith('#') && h.length > 1) {
      const el = $(h); if (!el) return;
      e.preventDefault(); setMenu(false); lenis ? lenis.scrollTo(el, { offset: -90, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!isInternal(a) || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setMenu(false);
    gsap.timeline()
      .set(pt, { yPercent: 100, visibility: 'visible' })
      .to(pt, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' })
      .from('.pt-mark', { opacity: 0, y: 20, duration: 0.4 }, '-=.3')
      .add(() => { location.href = a.href; });
  });
  addEventListener('pageshow', e => { if (e.persisted) gsap.set(pt, { yPercent: 100, visibility: 'hidden' }); });

  /* ---------- Split headings into masked words ---------- */
  $$('.split').forEach(el => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(t); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = t;
          w.append(i); frag.append(w);
        });
        n.replaceWith(frag);
      } else walk(n);
    });
    walk(el);
  });

  /* ---------- Intro: loader on first visit of the home page, curtain otherwise ---------- */
  const heroSel = $('.hero') ? '.hero' : '.phero';
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, paused: true });
  const add = (sel, vars, pos) => { if ($$(sel).length) intro.from(sel, vars, pos); };
  add(`${heroSel} .wi`, { yPercent: 115, duration: 1.3, stagger: 0.06 }, 0);
  add(`${heroSel} .eyebrow, ${heroSel} .fade`, { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.2);
  add(`${heroSel} .reveal-img`, { clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.inOut' }, 0.1);
  add(`${heroSel} .reveal-img .inner`, { scale: 1.3, duration: 2 }, 0.4);
  if ($('.badge')) intro.from('.badge', { scale: 0, rotate: -90, duration: 1.2, ease: 'back.out(1.6)' }, 0.9);

  const loader = $('.loader');
  if (loader && !store.get('seen')) {
    store.set('seen', 1);
    gsap.set(pt, { yPercent: 100, visibility: 'hidden' }); root.classList.remove('is-entering');
    const ln = $('#loaderName');
    ln.innerHTML = [...ln.textContent].map(c => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('#loaderName span', { yPercent: 110, duration: 1, stagger: 0.035 })
      .to('.loader-bar', { width: '100%', duration: 0.9, ease: 'power2.inOut' }, '<.2')
      .to('#loaderName span', { yPercent: -110, duration: 0.6, stagger: 0.02, ease: 'power3.in' })
      .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=.2')
      .add(() => { loader.remove(); intro.play(); }, '-=.5');
  } else {
    if (loader) loader.remove();
    gsap.set(pt, { yPercent: 0 }); root.classList.remove('is-entering');
    gsap.timeline()
      .to(pt, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', delay: 0.05 })
      .set(pt, { yPercent: 100, visibility: 'hidden' })
      .add(() => intro.play(), 0.35);
  }

  /* ---------- Scroll reveals ---------- */
  const inHero = el => el.closest('.hero, .phero');
  $$('main .split').forEach(h => {
    if (inHero(h)) return;
    gsap.from(h.querySelectorAll('.wi'), { yPercent: 110, duration: 1.2, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('main .fade').forEach(el => {
    if (inHero(el)) return;
    gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  $$('main .reveal-img').forEach(el => {
    if (inHero(el)) return;
    gsap.from(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 82%' } });
  });
  $$('.parallax').forEach(el => gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, scrub: true } }));
  $$('.rows').forEach(r => gsap.from(r.children, { y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: r, start: 'top 85%' } }));
  $$('.complaints, .checks').forEach(l => gsap.from(l.children, { y: 24, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: l, start: 'top 85%' } }));
  $$('.cta .ring').length && gsap.from('.cta .ring', { scale: 0.4, opacity: 0, stagger: 0.15, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true } });

  /* Scroll-lit sentences */
  $$('.lit-text').forEach(p => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="lit">${w}</span>`).join(' ');
    gsap.to(p.querySelectorAll('.lit'), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  /* Steps: line draws and dots light up */
  $$('.steps').forEach(list => {
    const steps = $$('.step', list);
    gsap.to(list.querySelector('.steps-line b'), {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: list, start: 'top 75%', end: 'bottom 60%', scrub: true,
        onUpdate: s => steps.forEach((st, i) => st.classList.toggle('on', s.progress >= i / steps.length + 0.02)) },
    });
  });

  /* Magnetic buttons */
  if (fine) $$('.magnetic').forEach(b => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1,.4)' });
    const yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1,.4)' });
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4); });
    b.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });

  /* Cursor-following preview on treatment rows */
  const follow = $('#follow');
  if (follow && fine) {
    const fx = gsap.quickTo(follow, 'left', { duration: 0.7, ease: 'power3' });
    const fy = gsap.quickTo(follow, 'top', { duration: 0.7, ease: 'power3' });
    const imgs = $$('.ph', follow);
    $$('.row[data-tone]').forEach(r => {
      r.addEventListener('mouseenter', () => { imgs.forEach((im, i) => im.style.opacity = i == r.dataset.tone ? 1 : 0); gsap.to(follow, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }); });
      r.addEventListener('mouseleave', () => gsap.to(follow, { opacity: 0, scale: 0.6, duration: 0.4 }));
    });
    addEventListener('mousemove', e => { fx(e.clientX + 160); fy(e.clientY); });
    addEventListener('scroll', () => { if (!$('.row[data-tone]:hover')) gsap.to(follow, { opacity: 0, scale: 0.6, duration: 0.3, overwrite: 'auto' }); }, { passive: true });
  }

  /* Reviews: autoplay with progress bars */
  const slides = $$('.rv');
  const bars = $$('#rvCtrl b');
  if (slides.length > 1) {
    let cur = 0, prog;
    const show = n => {
      const prev = slides[cur]; cur = (n + slides.length) % slides.length; const next = slides[cur];
      if (prev !== next) {
        gsap.to(prev, { opacity: 0, y: -20, duration: 0.6, onComplete: () => {
          prev.classList.remove('is-on'); gsap.set(prev, { y: 0, clearProps: 'opacity' });
          next.classList.add('is-on');
          gsap.fromTo(next.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' });
        } });
      }
      bars.forEach((b, i) => gsap.set(b, { scaleX: i < cur ? 1 : 0 }));
      prog && prog.kill();
      prog = gsap.to(bars[cur], { scaleX: 1, duration: 8, ease: 'none', onComplete: () => show(cur + 1) });
    };
    $$('#rvCtrl button').forEach((b, i) => b.addEventListener('click', () => show(i)));
    ScrollTrigger.create({ trigger: '.reviews', start: 'top 70%', once: true, onEnter: () => show(0) });
  }

  /* Map pin bounce */
  if ($('.map .pin')) gsap.to('.map .pin', { y: -10, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  function initStatic() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (a && a.getAttribute('href').length > 1) setMenu(false);
    });
  }

  /* ================= helpers that work without GSAP ================= */
  function initToc() {
    const links = $$('.toc a');
    if (!links.length) return;
    const secs = links.map(a => $(a.getAttribute('href')));
    const io = new IntersectionObserver(ents => ents.forEach(en => {
      if (en.isIntersecting) links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(s => s && io.observe(s));
  }

  function initBooking() {
    const grid = $('#calGrid');
    if (!grid) return;
    const title = $('#calTitle'), slotsEl = $('#slots'), summary = $('#summary'), consent = $('#consent'), btn = $('#confirmBtn'), done = $('#done');
    const params = new URLSearchParams(location.search);
    const pre = params.get('b');
    if (pre) { const r = $(`#opts input[value="${pre}"]`); if (r) r.checked = true; }
    const treatName = () => { const r = $('#opts input:checked'); return r ? r.closest('.opt').querySelector('b').textContent : ''; };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    let day = null, time = null;
    const isAvail = d => d >= today && [1, 2, 4].includes(d.getDay()) && (d.getDate() * 7) % 5 !== 0;
    const fmt = d => d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });
    function render() {
      title.textContent = view.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
      grid.innerHTML = '';
      const offset = (view.getDay() + 6) % 7;
      for (let i = 0; i < offset; i++) grid.append(document.createElement('span'));
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
