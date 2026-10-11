// Behaviour for every page: smooth scroll, page transitions, reveals and the
// small interactive pieces (menu, reviews, breathing exercise).
// Everything degrades gracefully: without JS or with "reduce motion" the page
// is fully readable and usable.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const session = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
};
let lenis = null;
window.__siteReady = true;

/* ---------- Header + menu ---------- */
const hdr = $('#hdr');
let lastY = 0;
const onScroll = () => {
  const y = scrollY;
  hdr.classList.toggle('is-solid', y > 40);
  hdr.classList.toggle('is-hidden', y > 300 && y > lastY && !root.classList.contains('menu-open'));
  lastY = y;
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const burger = $('#burger');
function setMenu(open) {
  root.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  $$('.overlay a').forEach((a, i) => (a.style.transitionDelay = open ? 0.25 + i * 0.05 + 's' : '0s'));
  if (lenis) open ? lenis.stop() : lenis.start();
}
burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

initToc();
initBreath();

if (reduce) {
  root.classList.remove('is-entering');
  root.classList.add('no-anim');
  $('.loader')?.remove();
} else {
  initMotion();
}

/* ================================================================== */

function initMotion() {
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll */
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Page transitions */
  const pt = $('.pt');
  const isInternal = (a) => {
    const h = a.getAttribute('href') || '';
    if (!h || h.startsWith('#') || a.target === '_blank' || a.hasAttribute('download') || /^(mailto|tel|https?):/.test(h)) return false;
    return a.origin === location.origin;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    if (h.startsWith('#') && h.length > 1) {
      const el = $(h);
      if (!el) return;
      e.preventDefault();
      setMenu(false);
      lenis.scrollTo(el, { offset: -90, duration: 1.4 });
      return;
    }
    if (!isInternal(a) || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault();
    setMenu(false);
    gsap.timeline()
      .set(pt, { yPercent: 100, visibility: 'visible' })
      .to(pt, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' })
      .from('.pt-mark', { opacity: 0, y: 20, duration: 0.4 }, '-=.3')
      .add(() => { location.href = a.href; });
  });
  addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(pt, { yPercent: 100, visibility: 'hidden' }); });

  /* Split headings into masked words */
  $$('.split').forEach((el) => {
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
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

  /* Intro: name loader on the first visit of the home page, curtain otherwise */
  const heroSel = $('.hero') ? '.hero' : '.phero';
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, paused: true });
  const add = (sel, vars, pos) => { if ($$(sel).length) intro.from(sel, vars, pos); };
  add(`${heroSel} .wi`, { yPercent: 115, duration: 1.3, stagger: 0.06 }, 0);
  add(`${heroSel} .eyebrow, ${heroSel} .fade`, { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.2);
  add(`${heroSel} .reveal-img`, { clipPath: 'inset(100% 0 0 0)', duration: 1.6, ease: 'expo.inOut' }, 0.1);
  add(`${heroSel} .reveal-img .inner`, { scale: 1.3, duration: 2 }, 0.4);
  if ($('.badge')) intro.from('.badge', { scale: 0, rotate: -90, duration: 1.2, ease: 'back.out(1.6)' }, 0.9);

  const loader = $('.loader');
  if (loader && !session.get('seen')) {
    session.set('seen', '1');
    gsap.set(pt, { yPercent: 100, visibility: 'hidden' });
    gsap.set(loader, { display: 'grid' });
    root.classList.remove('is-entering');
    const ln = $('#loaderName');
    ln.innerHTML = [...ln.textContent].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('#loaderName span', { yPercent: 110, duration: 1, stagger: 0.035 })
      .to('.loader-bar', { width: '100%', duration: 0.9, ease: 'power2.inOut' }, '<.2')
      .to('#loaderName span', { yPercent: -110, duration: 0.6, stagger: 0.02, ease: 'power3.in' })
      .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=.2')
      .add(() => { loader.remove(); intro.play(); }, '-=.5');
  } else {
    loader?.remove();
    gsap.set(pt, { yPercent: 0 });
    root.classList.remove('is-entering');
    gsap.timeline()
      .to(pt, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', delay: 0.05 })
      .set(pt, { yPercent: 100, visibility: 'hidden' })
      .add(() => intro.play(), 0.35);
  }

  /* Scroll reveals */
  const inHero = (el) => el.closest('.hero, .phero');
  $$('main .split').forEach((h) => {
    if (inHero(h)) return;
    gsap.from(h.querySelectorAll('.wi'), { yPercent: 110, duration: 1.2, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('main .fade').forEach((el) => {
    if (inHero(el)) return;
    gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  $$('main .reveal-img').forEach((el) => {
    if (inHero(el)) return;
    gsap.from(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 82%' } });
  });
  $$('.parallax').forEach((el) => gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, scrub: true } }));
  $$('.rows').forEach((r) => gsap.from(r.children, { y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: r, start: 'top 85%' } }));
  $$('.complaints, .checks, .prose ul:not(.complaints)').forEach((l) => gsap.from(l.children, { y: 24, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: l, start: 'top 85%' } }));
  if ($('.cta .ring')) gsap.from('.cta .ring', { scale: 0.4, opacity: 0, stagger: 0.15, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true } });

  /* Scroll-lit sentences */
  $$('.lit-text').forEach((p) => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="lit">${w}</span>`).join(' ');
    gsap.to(p.querySelectorAll('.lit'), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  /* Steps: line draws and dots light up */
  $$('.steps').forEach((list) => {
    const steps = $$('.step', list);
    gsap.to(list.querySelector('.steps-line b'), {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: list, start: 'top 75%', end: 'bottom 60%', scrub: true,
        onUpdate: (s) => steps.forEach((st, i) => st.classList.toggle('on', s.progress >= i / steps.length + 0.02)) },
    });
  });

  /* Magnetic buttons */
  if (fine) $$('.magnetic').forEach((b) => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1,.4)' });
    const yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1,.4)' });
    b.addEventListener('mousemove', (e) => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4); });
    b.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });

  /* Reviews: autoplay with progress bars */
  const slides = $$('.rv');
  const bars = $$('#rvCtrl b');
  if (slides.length > 1) {
    let cur = 0, prog;
    const show = (n) => {
      const prev = slides[cur]; cur = (n + slides.length) % slides.length; const next = slides[cur];
      if (prev !== next) {
        gsap.to(prev, { opacity: 0, y: -20, duration: 0.6, onComplete: () => {
          prev.classList.remove('is-on'); gsap.set(prev, { y: 0, clearProps: 'opacity' });
          next.classList.add('is-on');
          gsap.fromTo(next.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' });
        } });
      }
      bars.forEach((b, i) => gsap.set(b, { scaleX: i < cur ? 1 : 0 }));
      prog?.kill();
      prog = gsap.to(bars[cur], { scaleX: 1, duration: 8, ease: 'none', onComplete: () => show(cur + 1) });
    };
    $$('#rvCtrl button').forEach((b, i) => b.addEventListener('click', () => show(i)));
    ScrollTrigger.create({ trigger: '.reviews', start: 'top 70%', once: true, onEnter: () => show(0) });
  }

  if ($('.map .pin')) gsap.to('.map .pin', { y: -10, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/* Practical info: highlight the section you are reading */
function initToc() {
  const links = $$('.toc a');
  if (!links.length) return;
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) links.forEach((l) => l.classList.toggle('on', l.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
}

/* Breathing exercise: 3 rounds of 4 in, 2 hold, 6 out */
function initBreath() {
  const btn = $('#breathBtn');
  if (!btn) return;
  const orb = $('#orb'), text = $('#orbText'), count = $('#orbCount'), bar = $('#breathBar'), live = $('#breathLive');
  const legend = $$('.breath-legend li'), dots = $$('.breath-dots i');
  const label = btn.firstChild;
  const PHASES = [['in', 4, 'Adem in'], ['hold', 2, 'Houd vast'], ['out', 6, 'Adem uit']];
  const CYCLE = PHASES.reduce((s, p) => s + p[1], 0);
  const ROUNDS = 3;
  const ease = (p) => (1 - Math.cos(Math.PI * p)) / 2;
  let raf = 0, start = 0, lastPhase = '';

  const setScale = (s) => { orb.style.transform = `scale(${s})`; };
  const reset = (msg, sub) => {
    cancelAnimationFrame(raf); raf = 0; lastPhase = '';
    setScale(1); bar.style.strokeDashoffset = '100';
    text.textContent = msg; count.textContent = sub || '';
    legend.forEach((l) => l.classList.remove('on'));
  };
  const frame = (now) => {
    const t = (now - start) / 1000;
    if (t >= CYCLE * ROUNDS) {
      dots.forEach((d) => d.classList.add('on'));
      reset('Mooi zo', 'zo begint elke sessie');
      live.textContent = 'Klaar. Drie ademhalingen.';
      label.textContent = 'Nog eens ';
      return;
    }
    const round = Math.floor(t / CYCLE);
    let tc = t - round * CYCLE, i = 0;
    while (tc >= PHASES[i][1]) { tc -= PHASES[i][1]; i++; }
    const [key, dur, name] = PHASES[i];
    const p = tc / dur;
    setScale(key === 'in' ? 1 + 0.6 * ease(p) : key === 'hold' ? 1.6 : 1.6 - 0.6 * ease(p));
    bar.style.strokeDashoffset = String(100 * (1 - p));
    count.textContent = String(Math.ceil(dur - tc));
    dots.forEach((d, n) => d.classList.toggle('on', n < round));
    if (key + round !== lastPhase) {
      lastPhase = key + round;
      text.textContent = name;
      live.textContent = name;
      legend.forEach((l) => l.classList.toggle('on', l.dataset.ph === key));
    }
    raf = requestAnimationFrame(frame);
  };
  btn.addEventListener('click', () => {
    if (raf) { reset('Klaar?'); label.textContent = 'Start '; dots.forEach((d) => d.classList.remove('on')); return; }
    dots.forEach((d) => d.classList.remove('on'));
    label.textContent = 'Stop ';
    start = performance.now();
    raf = requestAnimationFrame(frame);
  });
}
