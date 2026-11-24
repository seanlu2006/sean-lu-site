(() => {
  const root = document.documentElement;
  root.classList.add('js');

  function refreshCardLabel() {
    const currentCard = document.querySelector('.flashcard');
    if (!currentCard) return;
    const currentWord = document.querySelector('.card-word')?.textContent || '';
    const action = currentCard.classList.contains('is-flipped') ? 'Show the front of' : 'Show the meaning of';
    currentCard.setAttribute('aria-label', `${action}: ${currentWord}`);
  }

  const samples = [
    {
      word: 'mitigate',
      type: 'verb',
      meaning: '減輕；緩和',
      example: 'The policy aims to mitigate the impact of rising housing costs.'
    },
    {
      word: 'ubiquitous',
      type: 'adjective',
      meaning: '無所不在的',
      example: 'Smartphones have become ubiquitous in everyday life.'
    },
    {
      word: 'scrutinize',
      type: 'verb',
      meaning: '仔細檢查',
      example: 'The committee will scrutinize the evidence before making a decision.'
    }
  ];

  const card = document.querySelector('.flashcard');
  const nextButton = document.querySelector('.next-card');
  const word = document.querySelector('.card-word');
  const type = document.querySelector('.word-kind');
  const meaning = document.querySelector('.card-meaning');
  const example = document.querySelector('.card-example');
  const count = document.querySelector('.demo-count');
  let sampleIndex = 0;

  function updateCard() {
    const sample = samples[sampleIndex];
    card.classList.remove('is-flipped');
    card.setAttribute('aria-pressed', 'false');
    card.querySelector('.flash-front').setAttribute('aria-hidden', 'false');
    card.querySelector('.flash-back').setAttribute('aria-hidden', 'true');
    word.textContent = sample.word;
    type.textContent = sample.type;
    meaning.textContent = sample.meaning;
    example.textContent = sample.example;
    count.textContent = `${String(sampleIndex + 1).padStart(2, '0')} / ${String(samples.length).padStart(2, '0')}`;
    refreshCardLabel();
  }

  card?.addEventListener('click', () => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
    card.querySelector('.flash-front').setAttribute('aria-hidden', String(flipped));
    card.querySelector('.flash-back').setAttribute('aria-hidden', String(!flipped));
    refreshCardLabel();
  });

  nextButton?.addEventListener('click', () => {
    sampleIndex = (sampleIndex + 1) % samples.length;
    updateCard();
    card.focus({ preventScroll: true });
  });

  const revealItems = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Motion clip: loads and plays only while on screen; never autoplays for
  // reduced-motion visitors (they get the poster and can click to play).
  const clip = document.querySelector('.motion-clip');
  if (clip) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let userPaused = false;
    clip.addEventListener('click', () => {
      if (clip.paused) { userPaused = false; clip.play().catch(() => {}); }
      else { userPaused = true; clip.pause(); }
    });
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !userPaused) clip.play().catch(() => {});
          else if (!entry.isIntersecting) clip.pause();
        });
      }, { threshold: 0.4 }).observe(clip);
    }
  }

  // Build intro: three cursors drag the hero into place on load, then leave.
  // Only runs when the head script set .intro-pending (no hash, motion allowed).
  // Any key, click, wheel, touch, scroll or resize jumps to the finished page.
  if (root.classList.contains('intro-pending')) runIntro();

  function runIntro() {
    const pick = (name) => document.querySelector(`[data-intro="${name}"]`);
    const els = {
      sean: pick('sean'), lu: pick('lu'), portrait: pick('portrait'),
      copy: pick('copy'), actions: pick('actions'), desk: pick('desk')
    };
    if (Object.values(els).some((el) => !el) || window.scrollY > 0) {
      root.classList.remove('intro-pending');
      return;
    }

    const T = 3000;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    };
    const R = {};
    Object.keys(els).forEach((k) => { R[k] = box(els[k]); });

    // Damped spring (about 4% overshoot) sampled into linear(); older engines get a curve.
    const spring = (() => {
      const w = 16, z = 0.72, wd = w * Math.sqrt(1 - z * z), pts = [];
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * 0.65;
        pts.push((1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t))).toFixed(4));
      }
      pts[40] = '1';
      return CSS.supports('transition-timing-function', 'linear(0, 1)')
        ? `linear(${pts.join(', ')})`
        : 'cubic-bezier(.2, .8, .2, 1)';
    })();
    const glide = 'cubic-bezier(.45, 0, .2, 1)';

    const layer = document.createElement('div');
    layer.className = 'build-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
    const css = getComputedStyle(layer);
    const color = { sean: css.getPropertyValue('--c-sean').trim(), claude: css.getPropertyValue('--c-claude').trim(), codex: css.getPropertyValue('--c-codex').trim() };

    // One keyframe list per element across the whole intro, so finishing is one call.
    // Each step carries only what changes; `ease` shapes the segment that starts there.
    const anims = [];
    function track(el, steps) {
      const props = new Set();
      steps.forEach(({ t, ease, ...p }) => Object.keys(p).forEach((k) => props.add(k)));
      let cur = {};
      props.forEach((k) => { cur[k] = steps.find((step) => k in step)[k]; });
      const frames = steps.map(({ t, ease, ...p }) => {
        cur = { ...cur, ...p };
        return { ...cur, offset: Math.min(1, t / T), easing: ease || 'linear' };
      });
      if (frames[0].offset > 0) frames.unshift({ ...frames[0], offset: 0, easing: 'linear' });
      if (frames[frames.length - 1].offset < 1) frames.push({ ...frames[frames.length - 1], offset: 1 });
      anims.push(el.animate(frames, { duration: T }));
    }

    const make = (className, x, y, w, h) => {
      const el = document.createElement('div');
      el.className = className;
      el.style.transform = `translate(${x}px, ${y}px)`;
      if (w != null) el.style.width = `${w}px`;
      if (h != null) el.style.height = `${h}px`;
      layer.append(el);
      return el;
    };
    const cursor = (name, c, ink) => {
      const el = make('build-cursor', 0, 0);
      el.style.setProperty('--c', c);
      if (ink) el.style.setProperty('--chip-ink', ink);
      el.innerHTML = '<svg viewBox="0 0 18 22"><path d="M1 1v17.5l4.6-4.3 3.1 6.9 3.1-1.4-3.1-6.7H15z"/></svg><span></span>';
      el.querySelector('span').textContent = name;
      return el;
    };
    const at = (x, y, s = 1) => ({ transform: `translate(${x - 1}px, ${y - 1}px) scale(${s})` });

    const off = {
      lu: -Math.min(W * 0.32, 340),
      portrait: { x: -Math.min(W * 0.18, 150), y: 70 },
      copy: 60,
      desk: { x: Math.min(W * 0.4, 460), y: -60 }
    };

    // Sean draws a frame for the name, places the line under it, then clicks the buttons in.
    const f = { x: R.sean.x - 6, y: R.sean.y - 6, w: R.sean.w + 12, h: R.sean.h + 12 };
    track(make('build-frame', f.x, f.y, f.w, f.h), [
      { t: 0, opacity: 0, clipPath: 'inset(0% 100% 100% 0%)' },
      { t: 639 }, { t: 640, opacity: 1, ease: glide },
      { t: 1080, clipPath: 'inset(0% 0% 0% 0%)' },
      { t: 1500 }, { t: 1800, opacity: 0 }
    ]);
    const size = make('build-size', f.x, f.y + f.h + 6);
    size.textContent = `${Math.round(R.sean.w)} × ${Math.round(R.sean.h)}`;
    track(size, [{ t: 1000, opacity: 0 }, { t: 1100, opacity: 1 }, { t: 1600 }, { t: 1800, opacity: 0 }]);
    track(els.sean, [
      { t: 0, opacity: 0, clipPath: 'inset(-12% 100% -12% -4%)' },
      { t: 1079 }, { t: 1080, opacity: 1, ease: 'cubic-bezier(.6, 0, .2, 1)' },
      { t: 1600, clipPath: 'inset(-12% -4% -12% -4%)' }
    ]);

    const cg = { x: R.copy.x + Math.min(60, R.copy.w * 0.25), y: R.copy.y + R.copy.h * 0.45 };
    track(els.copy, [
      { t: 0, opacity: 0, transform: `translateY(${off.copy}px)`, outlineColor: 'transparent' },
      { t: 1479 }, { t: 1480, opacity: 1, outlineColor: color.sean },
      { t: 1520, ease: spring }, { t: 2020, transform: 'translateY(0px)' },
      { t: 2150 }, { t: 2400, outlineColor: 'transparent' }
    ]);
    const bx = { x: R.actions.x + 44, y: R.actions.y + R.actions.h * 0.55 };
    track(els.actions, [
      { t: 0, opacity: 0, transform: 'scale(.9)' },
      { t: 2340, ease: spring }, { t: 2800, opacity: 1, transform: 'scale(1)' }
    ]);
    track(cursor('Sean', color.sean), [
      { t: 0, ...at(W * 0.46, H + 30), opacity: 1 },
      { t: 100, ease: glide }, { t: 600, ...at(f.x, f.y) },
      { t: 640, ...at(f.x, f.y, 0.86), ease: glide },
      { t: 1080, ...at(f.x + f.w, f.y + f.h, 0.86) },
      { t: 1100, ...at(f.x + f.w, f.y + f.h), ease: glide },
      { t: 1460, ...at(cg.x, cg.y + off.copy) },
      { t: 1520, ...at(cg.x, cg.y + off.copy, 0.86), ease: spring },
      { t: 2020, ...at(cg.x, cg.y, 0.86) },
      { t: 2040, ...at(cg.x, cg.y), ease: glide },
      { t: 2300, ...at(bx.x, bx.y) },
      { t: 2340, ...at(bx.x, bx.y, 0.86) }, { t: 2420, ...at(bx.x, bx.y) },
      { t: 2560, ease: glide }, { t: 2900, ...at(bx.x + 24, bx.y + 16), opacity: 0 }
    ]);

    // Claude drags the outlined LU to the right edge, then brings in the demo card.
    const lg = { x: R.lu.x + R.lu.w * 0.45, y: R.lu.y + R.lu.h * 0.55 };
    track(els.lu, [
      { t: 0, opacity: 0, transform: `translateX(${off.lu}px)`, outlineColor: 'transparent' },
      { t: 699 }, { t: 700, opacity: 1, outlineColor: color.claude },
      { t: 720, ease: spring }, { t: 1350, transform: 'translateX(0px)' },
      { t: 1500 }, { t: 1750, outlineColor: 'transparent' }
    ]);
    const top = R.sean.y - 24;
    const bottom = R.desk.y + R.desk.h + 24;
    track(make('build-guide', R.lu.x + R.lu.w, top, 1, bottom - top), [
      { t: 1250, opacity: 0 }, { t: 1350, opacity: 1 }, { t: 1650 }, { t: 1900, opacity: 0 }
    ]);
    const dg = { x: R.desk.x + R.desk.w * 0.3, y: R.desk.y + 22 };
    track(els.desk, [
      { t: 0, opacity: 0, transform: `translate(${off.desk.x}px, ${off.desk.y}px) rotate(4deg)`, outlineColor: 'transparent' },
      { t: 1819 }, { t: 1820, opacity: 1, outlineColor: color.claude },
      { t: 1850, ease: spring }, { t: 2480, transform: 'translate(0px, 0px) rotate(0deg)' },
      { t: 2600 }, { t: 2850, outlineColor: 'transparent' }
    ]);
    const lineLeft = Math.min(R.portrait.x, R.copy.x);
    track(make('build-guide', lineLeft, R.desk.y + R.desk.h, R.desk.x + R.desk.w - lineLeft, 1), [
      { t: 2380, opacity: 0 }, { t: 2480, opacity: 1 }, { t: 2650 }, { t: 2900, opacity: 0 }
    ]);
    track(cursor('Claude', color.claude, '#11210d'), [
      { t: 0, ...at(W + 30, H * 0.22), opacity: 1 },
      { t: 150, ease: glide }, { t: 680, ...at(lg.x + off.lu, lg.y) },
      { t: 720, ...at(lg.x + off.lu, lg.y, 0.86), ease: spring },
      { t: 1350, ...at(lg.x, lg.y, 0.86) },
      { t: 1370, ...at(lg.x, lg.y) },
      { t: 1400, ease: glide }, { t: 1800, ...at(dg.x + off.desk.x, dg.y + off.desk.y) },
      { t: 1850, ...at(dg.x + off.desk.x, dg.y + off.desk.y, 0.86), ease: spring },
      { t: 2480, ...at(dg.x, dg.y, 0.86) },
      { t: 2500, ...at(dg.x, dg.y) },
      { t: 2600, ease: glide }, { t: 2950, ...at(dg.x + 30, dg.y + 20), opacity: 0 }
    ]);

    // Codex drops the portrait in and leaves first.
    const pg = { x: R.portrait.x + R.portrait.w / 2, y: R.portrait.y + R.portrait.h / 2 };
    track(els.portrait, [
      { t: 0, opacity: 0, transform: `translate(${off.portrait.x}px, ${off.portrait.y}px)`, outlineColor: 'transparent' },
      { t: 1099 }, { t: 1100, opacity: 1, outlineColor: color.codex },
      { t: 1120, ease: spring }, { t: 1680, transform: 'translate(0px, 0px)' },
      { t: 1800 }, { t: 2050, outlineColor: 'transparent' }
    ]);
    track(cursor('Codex', color.codex), [
      { t: 0, ...at(-30, H * 0.72), opacity: 1 },
      { t: 450, ease: glide }, { t: 1080, ...at(pg.x + off.portrait.x, pg.y + off.portrait.y) },
      { t: 1120, ...at(pg.x + off.portrait.x, pg.y + off.portrait.y, 0.86), ease: spring },
      { t: 1680, ...at(pg.x, pg.y, 0.86) },
      { t: 1700, ...at(pg.x, pg.y) },
      { t: 1800, ease: glide }, { t: 2150, ...at(pg.x - 20, pg.y + 24), opacity: 0 }
    ]);

    root.classList.add('intro-run');
    root.classList.remove('intro-pending');

    const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll', 'resize'];
    const finish = () => anims.forEach((a) => a.finish());
    skipEvents.forEach((e) => window.addEventListener(e, finish, { passive: true }));
    Promise.all(anims.map((a) => a.finished)).catch(() => {}).then(() => {
      skipEvents.forEach((e) => window.removeEventListener(e, finish));
      layer.remove();
      root.classList.replace('intro-run', 'intro-done');
    });
  }
})();
