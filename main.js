/* Two behaviours: sections open in a side panel, and the menu button on phones. */
(() => {
  // Sections open in a panel that grows out of a matching tile and covers
  // everything right of the wordmark column; only the panel scrolls.
  const panel = document.getElementById('panel');
  const closeBtn = document.getElementById('panelClose');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.getElementById('hero');
  const photoTile = document.querySelector('.t-about');
  // Measure where the wordmark's letters sit, so it can shrink into the
  // top-left corner of its tile (about 150px wide) while About me is open.
  const markTile = document.querySelector('.t-mark');
  const mark = markTile.querySelector('.mark');
  const shrinkMark = () => {
    const rects = [...mark.querySelectorAll('.name.is-on text')].map((t) => t.getBoundingClientRect());
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const m = mark.getBoundingClientRect();
    const t = markTile.getBoundingClientRect();
    const gap = 25;
    mark.style.setProperty('--mo-x', `${left - m.left}px`);
    mark.style.setProperty('--mo-y', `${top - m.top}px`);
    mark.style.setProperty('--m-dx', `${t.left + gap - left}px`);
    mark.style.setProperty('--m-dy', `${t.top + gap - top}px`);
    mark.style.setProperty('--m-s', String(150 / (right - left)));
  };
  const resetHero = () => {
    hero.classList.remove('is-growing');
    ['top', 'left', 'width', 'height', 'bottom', 'transition'].forEach((k) => { hero.style[k] = ''; });
  };
  const ghost = document.getElementById('ghost');
  const SOURCE = {
    about: '.t-mark', contact: '.t-contact', resume: '.t-resume',
    projects: '.t-projects', interests: '.t-interests',
  };
  let opener = null;
  // set later by the name switcher; opening any section puts the name back
  // into English
  let toEnglish = () => {};
  let timer = 0;

  const openSection = (target) => {
    const sec = target.closest('.sec');
    clearTimeout(timer);
    clearTimeout(closeTimer);
    // if a close is still shrinking things back, settle it first
    if (!panel.classList.contains('is-open')) { hero.classList.remove('is-open'); resetHero(); }
    panel.querySelectorAll('.sec').forEach((s) => s.classList.toggle('is-on', s === sec));
    const bg = getComputedStyle(sec).backgroundColor;
    panel.style.setProperty('--panel-bg', bg === 'rgba(0, 0, 0, 0)' ? '#fff' : bg);
    panel.classList.remove('is-growing', 'is-shown');
    ghost.hidden = true;
    // About me: the headshot grows to its full portrait size, as on the reference
    const isAbout = sec.id === 'about';
    const heroWasOpen = hero.classList.contains('is-open');
    panel.classList.toggle('is-about', isAbout);
    toEnglish();
    if (isAbout && !document.body.classList.contains('about-open')) shrinkMark();
    document.body.classList.toggle('about-open', isAbout);
    hero.classList.remove('is-growing');
    if (isAbout) {
      // The photo frame itself resizes from its tile to the full portrait
      // size, so the crop changes continuously instead of jumping.
      hero.classList.add('is-open');
      if (!heroWasOpen && !reduce.matches) {
        const from = photoTile.getBoundingClientRect();
        hero.style.transition = 'none';
        Object.assign(hero.style, { top: '0px', left: '0px', width: '', bottom: '' });
        const to = hero.getBoundingClientRect();
        Object.assign(hero.style, { top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px`, bottom: 'auto' });
        void hero.offsetWidth;
        hero.style.transition = '';
        hero.classList.add('is-growing');
        Object.assign(hero.style, { top: `${to.top}px`, left: `${to.left}px`, width: `${to.width}px`, height: `${to.height}px` });
      }
    } else {
      hero.classList.remove('is-open');
    }
    // A box in the section's colour grows out of its matching tile (the white
    // wordmark tile for About me and Contact) into the panel's place; then
    // the panel's text fades in over it.
    const wasOpen = panel.classList.contains('is-open');
    const source = document.querySelector(SOURCE[sec.id] || '.t-mark');
    const animate = !wasOpen && !reduce.matches && source && source.offsetParent;
    panel.style.setProperty('--from', 'none');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    panel.scrollTop = 0;
    if (animate) {
      const r = source.getBoundingClientRect();
      const to = panel.getBoundingClientRect();
      panel.classList.add('is-hidden');
      ghost.style.transition = 'none';
      ghost.style.background = panel.style.getPropertyValue('--panel-bg');
      Object.assign(ghost.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
      ghost.hidden = false;
      void ghost.offsetWidth;
      ghost.style.transition = '';
      Object.assign(ghost.style, { top: `${to.top}px`, left: `${to.left}px`, width: `${to.width}px`, height: `${to.height}px` });
    }
    timer = setTimeout(() => {
      // land fully open even if a transition didn't run
      panel.classList.remove('is-hidden');
      ghost.hidden = true;
      resetHero();
      panel.classList.add('is-shown');
      if (target !== sec) target.scrollIntoView();
      panel.focus({ preventScroll: true });
    }, animate ? 1000 : 0);
  };

  // Closing runs the opening in reverse: the panel's colour shrinks back
  // into its tile, and for About me the photo shrinks back into its own tile
  // while the name grows back into place.
  let closeTimer = 0;
  const closePanel = () => {
    if (!panel.classList.contains('is-open')) return;
    clearTimeout(timer);
    clearTimeout(closeTimer);
    const sec = panel.querySelector('.sec.is-on');
    const source = sec && document.querySelector(SOURCE[sec.id] || '.t-mark');
    const animate = !reduce.matches && source && source.offsetParent;
    const pr = panel.getBoundingClientRect();
    const wasAbout = hero.classList.contains('is-open');

    if (animate) {
      const to = source.getBoundingClientRect();
      ghost.style.transition = 'none';
      ghost.style.background = panel.style.getPropertyValue('--panel-bg') || '#fff';
      Object.assign(ghost.style, { top: `${pr.top}px`, left: `${pr.left}px`, width: `${pr.width}px`, height: `${pr.height}px` });
      ghost.hidden = false;
      void ghost.offsetWidth;
      ghost.style.transition = '';
      Object.assign(ghost.style, { top: `${to.top}px`, left: `${to.left}px`, width: `${to.width}px`, height: `${to.height}px` });
      if (wasAbout) {
        const hr = hero.getBoundingClientRect();
        const tile = photoTile.getBoundingClientRect();
        hero.style.transition = 'none';
        Object.assign(hero.style, { top: `${hr.top}px`, left: `${hr.left}px`, width: `${hr.width}px`, height: `${hr.height}px`, bottom: 'auto' });
        void hero.offsetWidth;
        hero.style.transition = '';
        hero.classList.add('is-growing');
        Object.assign(hero.style, { top: `${tile.top}px`, left: `${tile.left}px`, width: `${tile.width}px`, height: `${tile.height}px` });
      }
    }

    panel.classList.remove('is-open', 'is-growing', 'is-shown', 'is-about', 'is-hidden');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('about-open');
    history.replaceState(null, '', location.pathname);
    if (opener) opener.focus({ preventScroll: true });

    const finish = () => {
      ghost.hidden = true;
      hero.classList.remove('is-open');
      resetHero();
    };
    if (animate) closeTimer = setTimeout(finish, 1000);
    else finish();
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    e.preventDefault();
    if (!target || !panel.contains(target)) { closePanel(); return; }
    if (!panel.contains(a)) opener = a;
    history.replaceState(null, '', '#' + id);
    openSection(target);
  });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
  const start = location.hash && document.getElementById(location.hash.slice(1));
  if (start && panel.contains(start)) openSection(start);

  // Name in three scripts. Switching breaks the name into ink pixels that
  // drift apart and reassemble as the next script, after the pixel-art
  // toggle on inspora.design.
  const names = [...mark.querySelectorAll('.name')];
  const ORDER = [
    { name: 'en', label: 'English' },
    { name: 'kanji', label: 'Japanese · Kanji' },
    { name: 'kana', label: 'Japanese · Hiragana' },
  ];
  const bars = [...document.querySelectorAll('.name-timer i')];
  const label = document.getElementById('nameLabel');
  const cv = document.getElementById('markPixels');
  const ctx = cv.getContext('2d');
  const PX = 3; // pixel size in CSS px
  let morphing = 0;

  // Sample a name version into pixel centres, in canvas coordinates.
  const sample = (group, box) => {
    const dpr = 1;
    const off = document.createElement('canvas');
    off.width = Math.ceil(box.width * dpr);
    off.height = Math.ceil(box.height * dpr);
    const o = off.getContext('2d');
    o.fillStyle = '#000';
    group.querySelectorAll('text').forEach((t) => {
      const cs = getComputedStyle(t);
      const ctm = t.getScreenCTM();
      const size = parseFloat(cs.fontSize) * ctm.a;
      o.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      o.textBaseline = 'alphabetic';
      for (let i = 0; i < t.getNumberOfChars(); i += 1) {
        const p = t.getStartPositionOfChar(i);
        const sp = new DOMPoint(p.x, p.y).matrixTransform(ctm);
        o.fillText(t.textContent[i], sp.x - box.left, sp.y - box.top);
      }
    });
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const pts = [];
    for (let y = 0; y < off.height; y += PX) {
      for (let x = 0; x < off.width; x += PX) {
        if (data[(y * off.width + x) * 4 + 3] > 110) pts.push([x, y]);
      }
    }
    return pts;
  };

  const smooth = (t) => { const x = Math.min(Math.max(t, 0), 1); return x * x * (3 - 2 * x); };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const show = (name) => {
    names.forEach((g) => g.classList.toggle('is-on', g.dataset.name === name));
  };

  // Centre each version by its actual ink (not the font's line box) in the
  // tile, in the space above the language label.
  const nameSwitch = document.querySelector('.name-switch');
  const centerNames = () => {
    if (document.body.classList.contains('about-open')) return;
    const tile = markTile.getBoundingClientRect();
    if (!tile.width) return;
    const off = document.createElement('canvas');
    off.width = Math.ceil(tile.width);
    off.height = Math.ceil(tile.height);
    const o = off.getContext('2d', { willReadFrequently: true });
    const cx = tile.width / 2;
    const cy = (nameSwitch.getBoundingClientRect().top - tile.top) / 2 + 4;
    names.forEach((g) => {
      g.removeAttribute('transform');
      o.clearRect(0, 0, off.width, off.height);
      o.fillStyle = '#000';
      g.querySelectorAll('text').forEach((t) => {
        const cs = getComputedStyle(t);
        const ctm = t.getScreenCTM();
        o.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * ctm.a}px ${cs.fontFamily}`;
        o.textBaseline = 'alphabetic';
        for (let i = 0; i < t.getNumberOfChars(); i += 1) {
          const sp = new DOMPoint(t.getStartPositionOfChar(i).x, t.getStartPositionOfChar(i).y).matrixTransform(ctm);
          o.fillText(t.textContent[i], sp.x - tile.left, sp.y - tile.top);
        }
      });
      const d = o.getImageData(0, 0, off.width, off.height).data;
      let x0 = off.width, x1 = -1, y0 = off.height, y1 = -1;
      for (let y = 0; y < off.height; y += 1) {
        for (let x = 0; x < off.width; x += 1) {
          if (d[(y * off.width + x) * 4 + 3] > 100) {
            if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      if (x1 < 0) return;
      const k = g.querySelector('text').getScreenCTM().a;
      const dx = (cx - (x0 + x1 + 1) / 2) / k;
      const dy = (cy - (y0 + y1 + 1) / 2) / k;
      g.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
    });
  };
  document.fonts.ready.then(centerNames);
  let centerTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(centerTimer); centerTimer = setTimeout(centerNames, 150); });

  const morph = (fromG, toG) => {
    const box = markTile.getBoundingClientRect();
    const tile = markTile.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    Object.assign(cv.style, {
      left: `${box.left - tile.left}px`, top: `${box.top - tile.top}px`,
      width: `${box.width}px`, height: `${box.height}px`,
    });
    cv.width = Math.round(box.width * dpr);
    cv.height = Math.round(box.height * dpr);
    const A = sample(fromG, box);
    const B = sample(toG, box);
    // shuffle both, then pair; the shorter list is reused so nothing pops
    const shuf = (arr) => { for (let i = arr.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    shuf(A); shuf(B);
    // sort by x so pixels mostly travel sideways a short way, sweeping left to right
    A.sort((p, q) => p[0] - q[0]); B.sort((p, q) => p[0] - q[0]);
    const n = Math.max(A.length, B.length);
    const parts = [];
    for (let i = 0; i < n; i += 1) {
      const a = A[Math.floor(i * A.length / n)];
      const b = B[Math.floor(i * B.length / n)];
      const ang = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * 34;
      parts.push({
        ax: a[0], ay: a[1], bx: b[0], by: b[1],
        mx: (a[0] + b[0]) / 2 + Math.cos(ang) * r,
        my: (a[1] + b[1]) / 2 + Math.sin(ang) * r,
        delay: (a[0] / box.width) * 0.3 + Math.random() * 0.1,
      });
    }
    const ink = getComputedStyle(fromG.querySelector('text')).fill;
    const DUR = 1100;
    const id = ++morphing;
    names.forEach((g) => { g.style.opacity = ''; }); // a newer switch takes over cleanly
    mark.classList.add('is-morphing');
    const t0 = performance.now();
    const frame = (now) => {
      if (id !== morphing) return;
      const T = (now - t0) / DUR;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, box.width, box.height);
      ctx.fillStyle = ink;
      // overlap instead of swapping: the old name fades into the pixels as
      // they lift off, and the new lettering fades in under the pixels while
      // they are still settling, so nothing freezes and nothing snaps
      const fadeOut = 1 - smooth(T / 0.2);
      const fadeIn = smooth((T - 0.5) / 0.45);
      fromG.style.opacity = String(fadeOut);
      toG.style.opacity = String(fadeIn);
      ctx.globalAlpha = Math.min(smooth(T / 0.12), 1 - fadeIn);
      for (const p of parts) {
        const t = Math.min(Math.max((T - p.delay) / 0.6, 0), 1);
        const e = ease(t);
        // quadratic curve through the scattered midpoint
        const u = 1 - e;
        const x = u * u * p.ax + 2 * u * e * p.mx + e * e * p.bx;
        const y = u * u * p.ay + 2 * u * e * p.my + e * e * p.by;
        // pixels shrink a little mid-flight, like loose grains
        const s = PX * (1 - 0.25 * Math.sin(Math.PI * t));
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      if (T < 1) { requestAnimationFrame(frame); return; }
      finish();
    };
    // land on the new name without a second fade, even if frames stall
    const finish = () => {
      if (id !== morphing || !mark.classList.contains('is-morphing')) return;
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, cv.width, cv.height);
      fromG.style.opacity = '';
      toG.style.opacity = '';
      names.forEach((g) => { g.style.transition = 'none'; });
      mark.classList.remove('is-morphing');
      void mark.getBoundingClientRect();
      names.forEach((g) => { g.style.transition = ''; });
    };
    setTimeout(finish, DUR + 800);
    requestAnimationFrame(frame);
  };

  // Every three seconds the name moves on to the next script; the label says
  // which one it is and a small bar fills while each version is up. The
  // cycle rests while a section is open and when the tab is hidden.
  const STEP = 3000;
  let at = 0;
  let cycle = 0;
  const markBars = () => {
    bars.forEach((b, i) => {
      b.classList.remove('is-filling');
      b.classList.toggle('is-done', i < at);
    });
    const cur = bars[at];
    if (cur) { void cur.offsetWidth; cur.classList.add('is-filling'); }
  };
  const go = (i) => {
    const from = names.find((g) => g.classList.contains('is-on'));
    const to = names.find((g) => g.dataset.name === ORDER[i].name);
    at = i;
    label.textContent = ORDER[i].label;
    markBars();
    if (!to || from === to) return;
    if (reduce.matches) { show(to.dataset.name); return; }
    morph(from, to);
    // swap underneath straight away (hidden while morphing) so state is right
    show(to.dataset.name);
  };
  const paused = () => document.hidden || panel.classList.contains('is-open');
  const tick = () => {
    clearTimeout(cycle);
    if (paused()) return;
    cycle = setTimeout(() => { if (!paused()) go((at + 1) % ORDER.length); tick(); }, STEP);
  };
  toEnglish = () => {
    clearTimeout(cycle);
    morphing += 1; // stop any pixel morph in flight
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, cv.width, cv.height);
    names.forEach((g) => { g.style.opacity = ''; });
    mark.classList.remove('is-morphing');
    at = 0;
    label.textContent = ORDER[0].label;
    bars.forEach((b) => b.classList.remove('is-filling', 'is-done'));
    names.forEach((g) => { g.style.transition = 'none'; });
    show('en');
    void mark.getBoundingClientRect();
    names.forEach((g) => { g.style.transition = ''; });
  };
  // start again from English whenever the panel closes or the tab returns
  new MutationObserver(() => { if (!panel.classList.contains('is-open')) { markBars(); tick(); } })
    .observe(panel, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { markBars(); tick(); } });
  markBars();
  tick();

  // GitHub card: short lines about what I build, typed out in a mono face
  // with words lit in flat blocks of colour, each stanza stepping in and out
  // like a wave and trickling down the card.
  const codeCard = document.querySelector('.group.g-code');
  if (codeCard) {
    const cv = document.createElement('canvas');
    cv.className = 'g-anim';
    cv.setAttribute('aria-hidden', 'true');
    codeCard.prepend(cv);
    const c = cv.getContext('2d');
    const STAR = '✱';
    const LINES = [
      `ANY IDEA ${STAR} ANY STACK ${STAR} ONE PUSH`,
      `HTML, CSS, JAVASCRIPT, PYTHON ${STAR}`,
      `GIT COMMIT ${STAR} BUILD ${STAR} DEPLOY ${STAR} LIVE`,
      `CFC LDN ${STAR} 1 SITE ${STAR} 26/27 SQUAD`,
      `5 AI AGENTS ${STAR} 6-TAB DASHBOARD`,
      `CODE ${STAR} DESIGN ${STAR} SHIP ${STAR} REPEAT`,
    ];
    // [block, text]
    const PAL = [['#2027ff', '#fff'], ['#f4e600', '#000'], ['#e3120b', '#fff'], ['#16d9d2', '#000'],
      ['#19d33a', '#000'], ['#f17fe7', '#fff'], ['#f4f4f4', '#000']];
    const pick = () => (Math.random() < 0.34 ? PAL[Math.floor(Math.random() * PAL.length)] : null);
    const WAVE = [0, 1, 2, 3, 4, 3, 2, 1];
    let W = 0, H = 0, fs = 11, lh = 13, cw = 6.6, dpr = 1;
    let lines = [], stanza = 0, phrase = 0, typed = 0, total = 0, pause = 0, scroll = 0, raf = 0, last = 0, flick = 0;

    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      fs = Math.max(10, Math.min(15, W / 24));
      lh = Math.round(fs * 1.22);
      c.font = `700 ${fs}px "Space Mono", ui-monospace, Menlo, monospace`;
      cw = c.measureText('M').width;
    };
    const bottom = () => (lines.length ? lines[lines.length - 1].y + lh : 0);
    // one stanza: two or three lines, the last cut off mid-type, then a lone star
    const addStanza = () => {
      const x = 12 + WAVE[stanza % WAVE.length] * cw * 1.6;
      let y = lines.length ? bottom() + lh * 1.1 : 12;
      const n = 2 + (Math.random() < 0.5 ? 1 : 0);
      let longest = 0;
      for (let i = 0; i < n; i += 1) {
        let text = LINES[(phrase + i) % LINES.length];
        if (i === n - 1) text = text.slice(0, Math.max(6, Math.floor(text.length * (0.35 + Math.random() * 0.5))));
        const words = text.split(' ').map((w) => ({ w, col: pick() }));
        lines.push({ x, y, words, len: text.length + 1 });
        longest = Math.max(longest, text.length);
        y += lh;
      }
      lines.push({ x: x + Math.round(longest * (0.45 + Math.random() * 0.25)) * cw, y, words: [{ w: STAR, col: PAL[Math.floor(Math.random() * PAL.length)] }], len: 2 });
      phrase = (phrase + 1) % LINES.length;
      stanza += 1;
      total += lines.slice(-n - 1).reduce((a, l) => a + l.len, 0);
    };
    const draw = () => {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#000';
      c.fillRect(0, 0, W, H);
      c.font = `700 ${fs}px "Space Mono", ui-monospace, Menlo, monospace`;
      c.textBaseline = 'middle';
      let left = typed;
      for (const l of lines) {
        if (left <= 0) break;
        const y = l.y - scroll;
        let x = l.x;
        for (const { w, col } of l.words) {
          if (left <= 0) break;
          const shown = w.slice(0, Math.max(0, Math.floor(left)));
          left -= w.length + 1;
          if (y > -lh && y < H + lh) {
            const ww = shown.length * cw;
            if (col) { c.fillStyle = col[0]; c.fillRect(x - 1, y, ww + 2, lh - 1); }
            c.fillStyle = col ? col[1] : '#fff';
            c.fillText(shown, x, y + lh / 2);
          }
          x += (w.length + 1) * cw;
        }
      }
    };
    const reset = () => { lines = []; stanza = 0; typed = 0; total = 0; pause = 0; scroll = 0; addStanza(); addStanza(); };
    const live = () => panel.classList.contains('is-open') && codeCard.offsetParent && !document.hidden;
    const frame = (t) => {
      raf = 0;
      if (!live()) return;
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      if (pause > 0) pause -= dt;
      else if (typed < total) { typed += dt * 46; if (typed >= total) pause = 0.25; }
      // keep a stanza queued, and drift up once the text reaches the bottom
      if (typed > total - 40) addStanza();
      let tail = 0, left = typed;
      for (const l of lines) { if (left <= 0) break; tail = l.y + lh; left -= l.len; }
      const want = Math.max(0, tail - H + 84);
      scroll += (want - scroll) * Math.min(1, dt * 4);
      // forget what has scrolled off the top
      while (lines.length && lines[0].y + lh < scroll - lh) {
        const l = lines.shift(); typed -= l.len; total -= l.len;
      }
      // a word somewhere changes its colour now and then
      flick += dt;
      if (flick > 0.35) {
        flick = 0;
        const l = lines[Math.floor(Math.random() * lines.length)];
        if (l && l.words.length > 1) l.words[Math.floor(Math.random() * l.words.length)].col = pick();
      }
      draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !live()) return;
      size();
      if (reduce.matches) { reset(); typed = total; draw(); return; }
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    // start fresh each time Projects opens
    new MutationObserver(() => {
      if (panel.classList.contains('is-open') && codeCard.offsetParent) { if (!raf) { reset(); start(); } }
    }).observe(panel, { attributes: true, attributeFilter: ['class'] });
    new ResizeObserver(() => { if (W) { size(); draw(); } }).observe(codeCard);
    document.addEventListener('visibilitychange', start);
    document.fonts.load('700 12px "Space Mono"').then(() => { if (raf) size(); });
    reset();
  }

  // A canvas behind a project card that runs only while Projects is open,
  // restarting from the beginning each time it opens.
  const cardArt = (card, paint) => {
    if (!card) return;
    const cv = document.createElement('canvas');
    cv.className = 'g-anim';
    cv.setAttribute('aria-hidden', 'true');
    card.prepend(cv);
    const c = cv.getContext('2d');
    const st = { W: 0, H: 0, t: 0 };
    let raf = 0, last = 0;
    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      st.W = r.width; st.H = r.height;
      cv.width = Math.round(st.W * dpr); cv.height = Math.round(st.H * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const live = () => panel.classList.contains('is-open') && card.offsetParent && !document.hidden;
    const frame = (now) => {
      raf = 0;
      if (!live()) return;
      st.t += Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      paint(c, st);
      raf = requestAnimationFrame(frame);
    };
    const start = (fresh) => {
      if (raf || !live()) return;
      size();
      if (fresh) st.t = 0;
      if (reduce.matches) { st.t = 1e3; st.still = true; paint(c, st); return; }
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    new MutationObserver(() => start(true)).observe(panel, { attributes: true, attributeFilter: ['class'] });
    new ResizeObserver(() => { if (st.W) { size(); paint(c, st); } }).observe(card);
    document.addEventListener('visibilitychange', () => start(false));
  };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;

  // Research: on graph paper, points land one by one, a fitted line sweeps
  // through them and the fit is labelled, then the next figure.
  {
    const LOOP = 9;
    const FIGS = ['FIG. 1  OLYMPIC HOSTING COST', 'FIG. 2  CAPITAL RELOCATION', 'FIG. 3  TOURISM AFTER THE GAMES'];
    let seed = -1, pts = [], fit = null;
    const make = (k) => {
      let r = k * 9301 + 49297;
      const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
      const slope = 0.35 + rnd() * 0.5 * (k % 2 ? -1 : 1) + (k % 2 ? 0.2 : 0);
      pts = Array.from({ length: 24 }, () => {
        const x = 0.06 + rnd() * 0.88;
        return [x, clamp01(0.5 + (x - 0.5) * slope * 1.4 + (rnd() - 0.5) * 0.32)];
      }).sort((a, b) => a[0] - b[0]);
      const n = pts.length;
      const mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
      const b = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
      const ssr = pts.reduce((a, p) => a + (p[1] - (my + b * (p[0] - mx))) ** 2, 0);
      const sst = pts.reduce((a, p) => a + (p[1] - my) ** 2, 0);
      fit = { a: my - b * mx, b, r2: 1 - ssr / sst };
    };
    cardArt(document.querySelector('.group.g-chart'), (c, { W, H, t, still }) => {
      const k = Math.floor(t / LOOP);
      const u = still ? 6 : t % LOOP;
      if (k !== seed) { seed = k; make(k); }
      c.fillStyle = '#f1ebdf';
      c.fillRect(0, 0, W, H);
      // graph paper
      c.lineWidth = 1;
      for (let x = 0.5; x < W; x += 14) { c.strokeStyle = x % 70 < 1 ? 'rgba(29,45,68,.13)' : 'rgba(29,45,68,.06)'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0.5; y < H; y += 14) { c.strokeStyle = y % 70 < 1 ? 'rgba(29,45,68,.13)' : 'rgba(29,45,68,.06)'; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      const fade = still ? 1 : clamp01(u / 0.4) * clamp01((LOOP - u) / 0.6);
      c.globalAlpha = fade;
      const L = 30, R = W - 18, T = 34, B = H - 100;
      const X = (x) => L + x * (R - L), Y = (y) => B - y * (B - T);
      c.font = '700 9px "Space Mono", ui-monospace, monospace';
      c.fillStyle = '#1d2d44';
      c.textBaseline = 'alphabetic';
      c.fillText(FIGS[k % FIGS.length], L - 12, 20);
      // axes, drawn in
      const ax = easeOut(u / 0.8);
      c.strokeStyle = '#1d2d44';
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(L, Y(0) - (B - T) * ax); c.lineTo(L, B); c.lineTo(L + (R - L) * ax, B); c.stroke();
      for (let i = 1; i <= 4; i += 1) { const tx = L + (R - L) * i / 4; if (tx <= L + (R - L) * ax) { c.beginPath(); c.moveTo(tx, B); c.lineTo(tx, B + 4); c.stroke(); } }
      // points land one by one
      pts.forEach(([x, y], i) => {
        const p = easeOut((u - 0.7 - i * 0.08) / 0.3);
        if (p <= 0) return;
        c.fillStyle = '#1d2d44';
        c.beginPath();
        c.arc(X(x), Y(y) - (1 - p) * 10, 2.6 * (0.6 + 0.4 * p), 0, Math.PI * 2);
        c.fill();
      });
      // the fitted line sweeps across
      const lp = easeOut((u - 3) / 1.3);
      if (lp > 0) {
        const x1 = 0.02 + 0.96 * lp;
        c.strokeStyle = '#c0392b';
        c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(X(0.02), Y(fit.a + fit.b * 0.02)); c.lineTo(X(x1), Y(fit.a + fit.b * x1)); c.stroke();
      }
      // and is labelled
      const lb = easeOut((u - 4.4) / 0.5);
      if (lb > 0) {
        c.globalAlpha = fade * lb;
        const txt = `R² = ${fit.r2.toFixed(2)}   n = ${pts.length}`;
        c.font = '700 10px "Space Mono", ui-monospace, monospace';
        const w = c.measureText(txt).width + 12;
        const bx = R - w, by = fit.b > 0 ? B - 22 : T - 6;
        c.fillStyle = '#c0392b';
        c.fillRect(bx, by, w, 17);
        c.fillStyle = '#fff';
        c.fillText(txt, bx + 6, by + 12);
      }
      c.globalAlpha = 1;
    });
  }

  // Writing: lines type out across a ruled page, then a red pen strikes one
  // word and writes a better one above it, then a new paragraph.
  {
    const PARAS = [
      { lines: ['Indonesia is moving its', 'capital from Jakarta to', 'Nusantara, a city built', 'from scratch in Borneo.'], edit: [2, 'built', 'carved'] },
      { lines: ['The Olympics rarely pay', 'for themselves; the bill', 'outlasts the closing', 'ceremony by decades.'], edit: [0, 'rarely', 'seldom'] },
      { lines: ['Small states shape world', 'affairs more than their', 'size suggests, through', 'trade and alliances.'], edit: [2, 'suggests,', 'implies,'] },
    ];
    const CPS = 20;
    cardArt(document.querySelector('.group.g-pen'), (c, { W, H, t, still }) => {
      // each paragraph: typing, then the edit, a hold, and a fade
      const dur = (p) => p.lines.join(' ').length / CPS + 3.4;
      let u = t, k = 0;
      while (!still && u > dur(PARAS[k % PARAS.length])) { u -= dur(PARAS[k % PARAS.length]); k += 1; }
      const P = PARAS[k % PARAS.length];
      const D = dur(P);
      if (still) u = D - 0.7;
      c.fillStyle = '#fbf9f4';
      c.fillRect(0, 0, W, H);
      const fs = Math.max(13, Math.min(18, W / 15));
      const lh = Math.round(fs * 1.75);
      const top = 26 + lh * 0.75;
      // ruled lines and a red margin
      c.strokeStyle = 'rgba(64,110,170,.18)';
      c.lineWidth = 1;
      for (let y = top + 6.5; y < H; y += lh) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.strokeStyle = 'rgba(192,57,43,.35)';
      c.beginPath(); c.moveTo(22.5, 0); c.lineTo(22.5, H); c.stroke();
      c.globalAlpha = clamp01((D - u) / 0.6);
      c.font = `${fs}px "Libre Caslon Text", Georgia, serif`;
      c.textBaseline = 'alphabetic';
      c.fillStyle = '#1b1b1b';
      let left = u * CPS;
      let cx = 34, cy = top;
      P.lines.forEach((line, i) => {
        if (left <= 0) return;
        const shown = line.slice(0, Math.floor(left));
        left -= line.length + 1;
        c.fillText(shown, 34, top + i * lh);
        cx = 34 + c.measureText(shown).width; cy = top + i * lh;
      });
      const typedAll = u * CPS >= P.lines.join(' ').length;
      // blinking caret while typing
      if (!typedAll && Math.floor(t * 2.4) % 2 === 0) c.fillRect(cx + 1, cy - fs * 0.8, 1.5, fs);
      // red pen: strike the word, then write the new one above it
      const e0 = P.lines.join(' ').length / CPS + 0.4;
      const [li, word, repl] = P.edit;
      const line = P.lines[li];
      const at = line.indexOf(word);
      const wx = 34 + c.measureText(line.slice(0, at)).width;
      const ww = c.measureText(word).width;
      const wy = top + li * lh;
      const sp = easeOut((u - e0) / 0.45);
      if (sp > 0) {
        c.strokeStyle = '#c0392b';
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(wx - 2, wy - fs * 0.32); c.lineTo(wx - 2 + (ww + 4) * sp, wy - fs * 0.32 - 1.5 * sp); c.stroke();
      }
      const rp = (u - e0 - 0.6) * CPS * 0.8;
      if (rp > 0) {
        c.fillStyle = '#c0392b';
        c.font = `italic ${fs * 0.8}px "Libre Caslon Text", Georgia, serif`;
        c.fillText(repl.slice(0, Math.floor(rp)), wx, wy - lh * 0.52);
        // a caret mark under the gap
        c.strokeStyle = '#c0392b';
        c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(wx - 4, wy + 4); c.lineTo(wx, wy - 2); c.lineTo(wx + 4, wy + 4); c.stroke();
      }
      c.globalAlpha = 1;
    });
  }

  // A second box over the panel for one job or project group. It grows out
  // of what was clicked, shows that template's content, and Back (or Escape)
  // closes it and leaves the panel as it was.
  const detail = document.getElementById('detail');
  const detailBody = document.getElementById('detailBody');
  const detailBack = document.getElementById('detailBack');
  let detailFrom = null;
  let detailTimer = 0;

  const openDetail = (trigger) => {
    const tpl = document.getElementById(trigger.dataset.detail);
    if (!tpl) return;
    clearTimeout(detailTimer);
    detailFrom = trigger;
    detailBody.replaceChildren(tpl.content.cloneNode(true));
    const pr = panel.getBoundingClientRect();
    Object.assign(detail.style, { left: `${pr.left}px`, top: `${pr.top}px`, width: `${pr.width}px`, height: `${pr.height}px` });
    detail.style.setProperty('--detail-bg', panel.style.getPropertyValue('--panel-bg') || '#fff');
    detail.classList.toggle('is-dark', !!trigger.closest('.sec-blue, .sec-orange, .sec-red, .sec-gold'));
    const r = trigger.getBoundingClientRect();
    const grow = !reduce.matches;
    detail.classList.remove('is-growing', 'is-shown', 'is-closing');
    detail.style.setProperty('--detail-from', grow
      ? `inset(${Math.max(0, r.top - pr.top)}px ${Math.max(0, pr.right - r.right)}px ${Math.max(0, pr.bottom - r.bottom)}px ${Math.max(0, r.left - pr.left)}px round 12px)`
      : 'inset(0)');
    detail.scrollTop = 0;
    detail.classList.add('is-open');
    detail.setAttribute('aria-hidden', 'false');
    void detail.offsetWidth;
    detail.classList.add('is-growing');
    detailTimer = setTimeout(() => {
      detail.style.setProperty('--detail-from', 'none');
      detail.classList.remove('is-growing');
      detail.classList.add('is-shown');
      detailBack.focus({ preventScroll: true });
      startPeeks();
    }, grow ? 700 : 0);
  };

  // Live previews of my sites: each iframe loads only once its box is open,
  // so the site's loading screen plays in view, then rests on its hero. The
  // site is laid out at desktop size and scaled down to the frame.
  const PEEK_W = 1440;
  const fitPeek = (screen) => {
    const f = screen.querySelector('iframe');
    if (f) f.style.transform = `scale(${screen.clientWidth / PEEK_W})`;
  };
  const peekObserver = new ResizeObserver((entries) => entries.forEach((en) => fitPeek(en.target)));
  const startPeeks = () => {
    detailBody.querySelectorAll('.peek-screen').forEach((screen) => {
      const f = screen.querySelector('iframe');
      fitPeek(screen);
      peekObserver.observe(screen);
      if (f && !f.src) f.src = f.dataset.src;
    });
  };
  detailBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.peek-replay');
    if (!btn) return;
    const f = btn.closest('.peek').querySelector('iframe');
    f.removeAttribute('src');
    requestAnimationFrame(() => { f.src = f.dataset.src; });
  });

  // Back shrinks the box back into the job or card it came from.
  const closeDetail = (refocus = true, animate = true) => {
    if (!detail.classList.contains('is-open')) return false;
    clearTimeout(detailTimer);
    const done = () => {
      detail.classList.remove('is-open', 'is-growing', 'is-shown', 'is-closing');
      detail.setAttribute('aria-hidden', 'true');
    };
    if (animate && !reduce.matches && detailFrom && detailFrom.offsetParent) {
      const pr = detail.getBoundingClientRect();
      const r = detailFrom.getBoundingClientRect();
      detail.classList.remove('is-growing');
      detail.style.setProperty('--detail-from', 'inset(0 round 0px)');
      void detail.offsetWidth;
      detail.classList.remove('is-shown');
      detail.classList.add('is-closing');
      detail.style.setProperty('--detail-from',
        `inset(${Math.max(0, r.top - pr.top)}px ${Math.max(0, pr.right - r.right)}px ${Math.max(0, pr.bottom - r.bottom)}px ${Math.max(0, r.left - pr.left)}px round 12px)`);
      detailTimer = setTimeout(done, 650);
    } else {
      done();
    }
    if (refocus && detailFrom) detailFrom.focus({ preventScroll: true });
    return true;
  };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-detail]');
    // a link inside a job (like Student Manager) goes to its page instead
    const link = e.target.closest('a[href]');
    if (t && !(link && t.contains(link))) { openDetail(t); return; }
    // following a link elsewhere (another section, home) closes the box
    if (e.target.closest('a[href^="#"]') && !detail.contains(e.target)) closeDetail(false, false);
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target.matches && e.target.matches('[data-detail][role="button"]') ? e.target : null;
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetail(t); }
  });
  // Escape closes the box first, before the panel under it
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && closeDetail()) e.stopImmediatePropagation();
  }, true);
  detailBack.addEventListener('click', () => closeDetail());
  // closing the panel closes the box with it
  new MutationObserver(() => { if (!panel.classList.contains('is-open')) closeDetail(false, false); })
    .observe(panel, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', () => {
    if (!detail.classList.contains('is-open')) return;
    const pr = panel.getBoundingClientRect();
    Object.assign(detail.style, { left: `${pr.left}px`, top: `${pr.top}px`, width: `${pr.width}px`, height: `${pr.height}px` });
  });

  // Phones: the menu button opens the section links.
  const bar = document.querySelector('.bar');
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('barNav');
  if (bar && btn && nav) {
    const set = (open) => {
      bar.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', () => set(!bar.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    document.addEventListener('click', (e) => { if (!bar.contains(e.target)) set(false); });
  }
})();
