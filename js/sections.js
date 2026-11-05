/* GrowLab · the remaining sections, each with its own idea.
   People: filter chips, cards re-deal (FLIP). Club: a founding card that tilts with a moving sheen; perks open one at a time.
   Prices: TND / EUR switch with a split-flap change. Story: a growth line drawn by scroll.
   Quotes: a stack of cards to flip through. About: a big sticky year. Vouches: two ribbons of names.
   FAQ: the doubt is struck through, the answer slides open. Form: a ring fills as you answer. Footer: the period drops in.
   Without JS every section reads as plain content. Reduced motion: changes are instant. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var E_OUT = 'cubic-bezier(.23,1,.32,1)', E_IO = 'cubic-bezier(.77,0,.175,1)';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function once(el, fn, margin) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return fn();
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { o.disconnect(); fn(); } }, { rootMargin: margin || '0px 0px -15% 0px' }).observe(el);
  }

  /* ---------- People: a full-width shelf; instant filter; arrows, drag, swipe ---------- */
  (function () {
    var bar = $('.pf-filter'), grid = $('#pools .pl'), nav = $('.pl-nav');
    if (!bar || !grid) return;
    bar.hidden = false; if (nav) nav.hidden = false;
    var cards = $$('.pp', grid), prev = $('.pl-prev'), next = $('.pl-next'), count = $('.pl-count');
    function visible() { return cards.filter(function (c) { return !c.hidden; }); }
    function step() { var v = visible()[0]; return v ? v.getBoundingClientRect().width + 16 : 300; }
    function upd() {
      var max = grid.scrollWidth - grid.clientWidth - 2;
      if (prev) prev.disabled = grid.scrollLeft <= 2;
      if (next) next.disabled = grid.scrollLeft >= max;
      if (count) count.textContent = visible().length + ' profiles';
    }
    grid.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    if (prev) prev.addEventListener('click', function () { grid.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { grid.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });

    // drag to scroll with the mouse (touch scrolls natively)
    var down = null, moved = false;
    grid.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, l: grid.scrollLeft }; moved = false; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x;
      if (Math.abs(dx) > 5) { moved = true; grid.classList.add('drag'); }
      if (moved) grid.scrollLeft = down.l - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = null;
      if (moved) { grid.classList.remove('drag'); var s = step(); grid.scrollTo({ left: Math.round(grid.scrollLeft / s) * s, behavior: reduce ? 'auto' : 'smooth' }); }
    });
    grid.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);

    // filter: no waiting. Out in 120ms, in with a short stagger, back to the start of the shelf.
    var anims = [];
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]');
      if (!b || b.getAttribute('aria-pressed') === 'true') return;
      $$('button', bar).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var f = b.dataset.f;
      anims.forEach(function (a) { a.cancel(); }); anims = [];
      function swap() {
        cards.forEach(function (c) { c.hidden = f !== 'all' && c.dataset.kind !== f; });
        grid.scrollLeft = 0; upd();
        if (reduce) return;
        visible().forEach(function (c, i) {
          anims.push(c.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
            { duration: 380, delay: i * 45, easing: E_OUT, fill: 'backwards' }));
        });
      }
      if (reduce) { swap(); return; }
      var out = visible().map(function (c) { return c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 120, easing: 'ease-in', fill: 'forwards' }); });
      setTimeout(function () { out.forEach(function (a) { a.cancel(); }); swap(); }, 120);
    });
    upd();

    /* "All": the carousel wheel. The profiles stand on a 3D ring; the front one is full size and
       active, the sides curve back into depth. Every 3s the ring turns one step, then rests.
       Hover or focus pauses; arrows, swipe, drag or a click on a side card turn it. */
    if (reduce) return;
    var on = false, cur = 0, from = 0, to = 0, t0 = 0, DUR = 820, paused = 0, inView = false, timer = 0, raf = 0;
    var N = cards.length, STEP = 360 / N;
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function layout() {
      var w = cards[0].offsetWidth, R = w * 1.25;
      grid.style.setProperty('--pph', Math.max.apply(null, cards.map(function (c) { return c.offsetHeight; })) + 'px');
      cards.forEach(function (c, i) {
        var a = ((i - cur) * STEP % 360 + 540) % 360 - 180;            // -180..180, 0 = front
        var rad = a * Math.PI / 180, front = Math.cos(rad);
        // spread the ring across the width the screen has: wide screens show five cards
        var spread = Math.min(1.75, Math.max(1.05, (grid.clientWidth * 0.46) / R));
        var x = Math.sin(rad) * R * spread, z = (front - 1) * R * 0.9;
        c.style.transform = 'translateX(' + x.toFixed(1) + 'px) translateZ(' + z.toFixed(1) + 'px) rotateY(' + (a * 0.55).toFixed(1) + 'deg)';
        var vis = Math.abs(a) < 96;
        c.style.opacity = vis ? Math.max(0, 0.35 + 0.65 * front).toFixed(2) : '0';
        c.style.zIndex = Math.round(100 + front * 100);
        c.style.visibility = vis ? 'visible' : 'hidden';
        var isFront = Math.abs(a) < STEP / 2;
        c.classList.toggle('now', isFront);
        c.tabIndex = isFront ? 0 : -1;
        c.setAttribute('aria-hidden', isFront ? 'false' : 'true');
      });
      if (count) count.textContent = (((Math.round(cur) % N) + N) % N + 1) + ' / ' + N + ' profiles';
    }
    function go(target) {
      from = cur; to = target; t0 = performance.now();
      cancelAnimationFrame(raf);
      (function anim(now) {
        var f = Math.min(1, (now - t0) / DUR);
        cur = from + (to - from) * ease(f);
        layout();
        if (f < 1) raf = requestAnimationFrame(anim); else { cur = to; layout(); }
      })(t0);
    }
    function by(n) { go(Math.round(to) + n); }
    function hold(ms) { paused = Math.max(paused, performance.now() + ms); }
    function auto() {
      clearInterval(timer);
      timer = setInterval(function () { if (on && inView && performance.now() > paused && !document.hidden) by(1); }, 3000);
    }
    function start() {
      if (on) return;
      on = true; grid.scrollLeft = 0; grid.classList.add('wheel');
      if (prev) prev.disabled = false; if (next) next.disabled = false;
      layout(); auto();
    }
    function stop() {
      if (!on) return;
      on = false; clearInterval(timer); cancelAnimationFrame(raf); grid.classList.remove('wheel');
      cards.forEach(function (c) { ['transform', 'opacity', 'zIndex', 'visibility'].forEach(function (k) { c.style[k] = ''; }); c.classList.remove('now'); c.tabIndex = 0; c.removeAttribute('aria-hidden'); });
      upd();
    }
    // arrows turn the wheel (the shelf handlers above are skipped while the wheel is on)
    [[prev, -1], [next, 1]].forEach(function (p) {
      if (p[0]) p[0].addEventListener('click', function (e) { if (!on) return; e.stopImmediatePropagation(); hold(5000); by(p[1]); }, true);
    });
    // a click on a side card brings it to the front; only the front card's link works
    grid.addEventListener('click', function (e) {
      if (!on) return;
      var c = e.target.closest('.pp');
      if (!c || c.classList.contains('now')) return;
      e.preventDefault();
      var i = cards.indexOf(c), d = ((i - Math.round(to)) % N + N) % N;
      hold(5000); by(d > N / 2 ? d - N : d);
    }, true);
    // swipe / drag
    var sx = null;
    grid.addEventListener('pointerdown', function (e) { if (on) sx = e.clientX; });
    window.addEventListener('pointerup', function (e) {
      if (!on || sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) { hold(5000); by(dx < 0 ? 1 : -1); }
    });
    grid.addEventListener('pointerenter', function (e) { if (on && e.pointerType === 'mouse') hold(1e9); });
    grid.addEventListener('pointerleave', function () { if (on) paused = performance.now() + 1200; });
    grid.addEventListener('focusin', function () { if (on) hold(1e9); });
    grid.addEventListener('focusout', function () { if (on) paused = performance.now() + 1200; });
    grid.addEventListener('keydown', function (e) {
      if (!on) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); by(1); grid.querySelector('.pp.now') && setTimeout(function () { var f = grid.querySelector('.pp.now'); f && f.focus({ preventScroll: true }); }, DUR); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); by(-1); setTimeout(function () { var f = grid.querySelector('.pp.now'); f && f.focus({ preventScroll: true }); }, DUR); }
    });
    window.addEventListener('resize', function () { if (on) layout(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }).observe(grid);
    else inView = true;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]');
      if (!b) return;
      if (b.dataset.f === 'all') setTimeout(start, 130); else stop();
    });
    start();
  })();

  /* ---------- Club: the founding card tilts, a sheen follows the pointer; perks open one at a time ---------- */
  (function () {
    var wrap = $('#club .cc3'), card = wrap && $('.cc', wrap);
    if (card && !reduce) {
      wrap.addEventListener('pointermove', function (e) {
        if (!fine.matches) return;
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - 0.5) * 16).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(2) + 'deg');
        card.style.setProperty('--sx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--sy', (y * 100).toFixed(1) + '%');
        card.classList.add('tilt');
      });
      wrap.addEventListener('pointerleave', function () { card.classList.remove('tilt'); card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); });
    }
    var list = $('#club .ct');
    if (!list) return;
    list.classList.add('ct-js');
    var items = $$('li', list), idx = 0, hoverT = 0, holdUntil = 0, inView = false;
    function open(li) {
      idx = items.indexOf(li);
      items.forEach(function (x) { var on = x === li; x.classList.toggle('on', on); x.setAttribute('aria-expanded', on); });
    }
    function hold(ms) { holdUntil = Date.now() + ms; }
    items.forEach(function (li) {
      li.tabIndex = 0; li.setAttribute('role', 'button');
      li.addEventListener('click', function () { hold(9000); open(li); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(9000); open(li); } });
      // hover opens after a short intent delay, so passing over tiles does not flicker
      li.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(hoverT); hold(1e9);
        hoverT = setTimeout(function () { open(li); }, 160);
      });
    });
    list.addEventListener('pointerleave', function () { clearTimeout(hoverT); hold(3000); });
    // nobody touching it: it shows the next perk by itself every 3 seconds
    setInterval(function () {
      if (!inView || Date.now() < holdUntil || document.hidden) return;
      open(items[(idx + 1) % items.length]);
    }, 3000);
    open(items[0]);

    /* entrance: the card walks in from the left in steps; the four perks arrive from four sides */
    var cl = $('#club .cl');
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }).observe(list);
    else inView = true;
    if (reduce || !cl || !card) return;
    var steps = 5, kf = [];
    for (var k = 0; k <= steps * 2; k++) {
      var f = k / (steps * 2), x = (1 - (1 - Math.pow(1 - f, 2))) * -110;     // eases in: the walk slows as it arrives
      var up = k % 2 ? -18 * (1 - f * 0.6) : 0, rz = k % 2 ? (k % 4 === 1 ? -3 : 3) * (1 - f) : 0;
      kf.push({ offset: f, transform: 'translateX(' + x.toFixed(1) + 'vw) translateY(' + up.toFixed(1) + 'px) rotate(' + rz.toFixed(1) + 'deg)', opacity: f < 0.1 ? f * 10 : 1 });
    }
    kf[kf.length - 1].transform = 'none';
    card.style.opacity = '0';
    var from = [['0px', '-90px', -6], ['90px', '0px', 5], ['0px', '90px', 6], ['-90px', '40px', -5]];
    items.forEach(function (li) { li.style.opacity = '0'; });
    new IntersectionObserver(function (en, o) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      card.style.opacity = '';
      card.animate(kf, { duration: 1700, easing: 'linear', fill: 'backwards' });
      items.forEach(function (li, i) {
        var d = from[i % 4];
        li.style.opacity = '';
        li.animate([{ opacity: 0, transform: 'translate(' + d[0] + ',' + d[1] + ') rotate(' + d[2] + 'deg) scale(.9)' }, { opacity: 1, transform: 'none' }],
          { duration: 900, delay: 700 + i * 130, easing: E_OUT, fill: 'backwards' });
      });
    }, { rootMargin: '0px 0px -25% 0px' }).observe(cl);
  })();

  /* ---------- Prices: TND / EUR with a split-flap change ---------- */
  (function () {
    var sw = $('#prices .cur');
    if (!sw) return;
    sw.hidden = false;
    var cur = 'tnd';
    try { cur = localStorage.getItem('growlab-cur') || 'tnd'; } catch (e) {}
    var prices = $$('#prices [data-tnd]');
    function flap(el, text, delay) {
      if (reduce || el.textContent === text) { el.textContent = text; return; }
      var old = el.textContent, n = Math.max(old.length, text.length), html = '';
      for (var i = 0; i < n; i++) html += '<span class="flp" aria-hidden="true">' + (old[i] || ' ').replace(' ', '&nbsp;') + '</span>';
      el.innerHTML = html + '<span class="sr">' + text + '</span>';
      $$('.flp', el).forEach(function (s, i) {
        var a = s.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(-90deg)' }], { duration: 140, delay: delay + i * 28, easing: 'ease-in', fill: 'forwards' });
        a.onfinish = function () {
          s.innerHTML = (text[i] || ' ').replace(' ', '&nbsp;');
          s.animate([{ transform: 'rotateX(90deg)' }, { transform: 'none' }], { duration: 200, easing: E_OUT, fill: 'forwards' });
        };
      });
      setTimeout(function () { el.textContent = text; }, delay + n * 28 + 420);
    }
    function set(c, animate) {
      cur = c;
      try { localStorage.setItem('growlab-cur', c); } catch (e) {}
      $$('button', sw).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.c === c ? 'true' : 'false'); });
      sw.classList.toggle('eur', c === 'eur');
      prices.forEach(function (p, i) {
        var main = c === 'eur' ? p.dataset.eur : p.dataset.tnd, alt = c === 'eur' ? p.dataset.tnd : p.dataset.eur;
        var amt = $('.amt', p), a2 = $('.altv', p);
        if (animate) flap(amt, main, i * 70); else amt.textContent = main;
        a2.textContent = alt;
      });
    }
    sw.addEventListener('click', function (e) { var b = e.target.closest('button[data-c]'); if (b && b.dataset.c !== cur) set(b.dataset.c, true); });
    if (cur === 'eur') set('eur', false);
  })();

  /* ---------- Story: the growth line draws as you scroll ---------- */
  (function () {
    var sec = $('#story'), line = sec && $('.st-line', sec);
    if (!line) return;
    sec.classList.add('st-js');
    line.setAttribute('pathLength', '1');           // dash in path units: unaffected by the chart's stretch
    var steps = $$('.tl li', sec), svg = $('svg', sec.querySelector('.st-chart')), rv = $('.st-reveal', sec);
    var at = [0.2, 0.42, 0.66, 0.97], L = line.getTotalLength();
    function draw(p) {
      line.style.strokeDashoffset = (1 - p).toFixed(4);
      if (rv) rv.setAttribute('width', line.getPointAtLength(L * p).x.toFixed(1));   // the fill follows the tip of the line
      if (svg) svg.classList.toggle('on-end', p >= 0.97);
      steps.forEach(function (s, i) { s.classList.toggle('on', p >= at[i]); });
    }
    var bars = $$('.st-bar', sec);
    function fill(p) { bars.forEach(function (bar, i) { bar.classList.toggle('on', p >= at[i] - 0.02); }); }
    if (reduce || !('IntersectionObserver' in window)) { draw(1); fill(1); return; }
    draw(0); fill(0);
    // plays by itself, once, when the section is in view (not tied to the scroll)
    new IntersectionObserver(function (en, o) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var t0 = performance.now(), D = 3600;
      (function run(now) {
        var f = Math.min(1, (now - t0) / D), p = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
        draw(p); fill(p);
        if (f < 1) requestAnimationFrame(run);
      })(t0);
    }, { threshold: 0.35 }).observe(sec);
  })();

  /* ---------- Quotes: a deck. The front card lifts away, the next rises from behind; the names on the
     left show which voice you are reading and a thin line fills until the next one (every 7s). ---------- */
  (function () {
    var box = $('#stories .qs'), side = $('#stories .qside');
    if (!box || !side) return;
    box.classList.add('qs-js'); side.hidden = false;
    var cards = $$('.q', box), n = cards.length, top = 0, busy = false, timer = 0, T = 7000, inView = false, hover = false;
    var names = $$('.q-names button', side), cur = $('.q-cur', side);
    function lay() {
      cards.forEach(function (c, i) {
        var d = (i - top + n) % n;
        c.style.setProperty('--d', d); c.style.zIndex = n - d;
        c.setAttribute('aria-hidden', d ? 'true' : 'false'); c.inert = !!d;
      });
      names.forEach(function (b, i) { b.classList.toggle('on', i === top); b.setAttribute('aria-current', i === top ? 'true' : 'false'); });
      cur.textContent = ('0' + (top + 1)).slice(-2);
      restart();
    }
    function restart() {
      names.forEach(function (b) { var p = $('.q-prog', b); p.getAnimations().forEach(function (a) { a.cancel(); }); });
      clearTimeout(timer);
      if (reduce || !inView || hover) return;
      var p = $('.q-prog', names[top]);
      p.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: T, easing: 'linear', fill: 'forwards' });
      timer = setTimeout(function () { go(top + 1); }, T);
    }
    function go(k) {
      k = (k + n) % n;
      if (busy || k === top) return;
      var front = cards[top], fwd = k === (top + 1) % n;
      if (reduce) { top = k; lay(); return; }
      busy = true;
      // the front card swings out to the side in 3D and slips to the back of the stack
      front.animate([
        { transform: 'none' },
        { transform: 'translate(' + (fwd ? 34 : -34) + '%,-4%) rotate(' + (fwd ? 5 : -5) + 'deg) rotateY(' + (fwd ? -10 : 10) + 'deg) scale(.99)', offset: 0.32 },
        { transform: 'translate(' + (fwd ? 58 : -58) + '%,-5%) rotate(' + (fwd ? 7 : -7) + 'deg) rotateY(' + (fwd ? -14 : 14) + 'deg) scale(.97)', offset: 0.5 },
        { transform: 'translate(calc(' + (n - 1) + ' * 16px),calc(' + (n - 1) + ' * 14px)) rotate(' + (n - 1) * -2 + 'deg) scale(' + (1 - (n - 1) * 0.03) + ')' }
      ], { duration: 1150, easing: 'cubic-bezier(.65,0,.35,1)' });
      setTimeout(function () { top = k; lay(); }, 560);              // swap the order while it is out to the side
      setTimeout(function () { busy = false; }, 1150);
    }
    names.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    $('.q-next', side).addEventListener('click', function () { go(top + 1); });
    $('.q-prev', side).addEventListener('click', function () { go(top - 1); });
    var sx = null;
    box.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    box.addEventListener('pointerup', function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(top + (e.clientX < sx ? 1 : -1)); sx = null; });
    box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; restart(); } });
    box.addEventListener('pointerleave', function () { hover = false; restart(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; restart(); }, { threshold: 0.4 }).observe(box);
    lay();
  })();

  /* ---------- About: a big year that follows the role you are reading ---------- */
  (function () {
    var yr = $('#about .yr span'), rows = $$('#about .xp li');
    if (!yr || !rows.length || !('IntersectionObserver' in window)) return;
    $('#about').classList.add('ab-js');
    var cur = null;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var li = e.target, t = li.querySelector('i').textContent;
        rows.forEach(function (r) { r.classList.toggle('on', r === li); });
        if (t === cur) return;
        cur = t;
        if (reduce) { yr.textContent = t; return; }
        yr.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-30%)', opacity: 0 }], { duration: 180, easing: 'ease-in' }).onfinish = function () {
          yr.textContent = t;
          yr.animate([{ transform: 'translateY(30%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: E_OUT });
        };
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    rows.forEach(function (r) { io.observe(r); });
  })();

  /* ---------- Vouches: two ribbons of names, moving in opposite directions ---------- */
  (function () {
    var list = $('#trust .rf');
    if (!list || reduce) return;
    var names = list.innerHTML;
    var wrap = document.createElement('div');
    wrap.className = 'rbn';
    wrap.setAttribute('aria-hidden', 'true');
    var half = $$('li', list), a = half.slice(0, 5).map(function (l) { return l.outerHTML; }).join(''), b = half.slice(5).map(function (l) { return l.outerHTML; }).join('');
    wrap.innerHTML = '<div class="rbn-row"><ul>' + names + names + '</ul></div><div class="rbn-row rev"><ul>' + b + a + b + a + '</ul></div>';
    list.classList.add('sr');                         // the real list stays for screen readers
    list.parentNode.insertBefore(wrap, list.nextSibling);
  })();

  /* ---------- Hero "Worked with": logo cards travel along a curved 3D rail; the one in the middle comes
     forward in full colour and its name shows under it, the ones near the edges turn away and recede.
     Hover slows it. ---------- */
  (function () {
    var box = $('.wk'), row = box && $('.wk-row', box);
    if (!row || reduce) return;
    box.classList.add('wk-js');
    row.innerHTML += row.innerHTML;                    // two sets for an endless loop
    $$('li', row).forEach(function (li, i) { if (i >= row.children.length / 2) li.setAttribute('aria-hidden', 'true'); });
    var track = $('.wk-track', box), items = $$('li', row), x = 0, last = 0, speed = 34, slow = 1, on = false, half = 0;
    var name = $('.wk-name', box), shown = '';
    function measure() { half = row.scrollWidth / 2; }
    function frame(now) {
      if (!on) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      slow += ((box.matches(':hover') ? 0.15 : 1) - slow) * Math.min(1, dt * 4);
      x -= speed * slow * dt; if (half && -x >= half) x += half;
      row.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      var tr = track.getBoundingClientRect(), mid = tr.left + tr.width / 2, hw = tr.width / 2;
      var best = -1, top = null;
      items.forEach(function (li) {
        var r = li.getBoundingClientRect(), d = Math.max(-1.2, Math.min(1.2, (r.left + r.width / 2 - mid) / hw));
        var k = Math.exp(-d * d * 5);                   // 1 in the middle
        li.style.transform = 'perspective(900px) translateZ(' + (-140 * d * d + 30 * k).toFixed(1) + 'px) rotateY(' + (-38 * d).toFixed(1) + 'deg)';
        li.style.opacity = Math.max(0.25, 1 - d * d * 0.7).toFixed(2);
        if (k > best) { best = k; top = li; }
      });
      items.forEach(function (li) { li.classList.toggle('lit', li === top); });
      if (name && top && top.dataset.n !== shown) {
        shown = top.dataset.n;
        name.textContent = shown;
        name.animate([{ opacity: 0, transform: 'translateY(4px)', letterSpacing: '.3em' }, { opacity: 1, transform: 'none', letterSpacing: '.14em' }], { duration: 500, easing: 'cubic-bezier(.23,1,.32,1)' });
      }
      requestAnimationFrame(frame);
    }
    measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    function start() { if (on) return; on = true; last = 0; requestAnimationFrame(frame); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : (on = false); }).observe(box);
    else start();
  })();

  /* ---------- FAQ: the doubt is struck through, the answer slides open ---------- */
  (function () {
    $$('#faq details').forEach(function (d) {
      var sum = $('summary', d), body = $('p', d);
      sum.addEventListener('click', function (e) {
        if (reduce) return;
        e.preventDefault();
        if (d.open) {
          d.classList.remove('opening');
          var h = body.offsetHeight;
          body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: E_OUT }).onfinish = function () { d.open = false; };
        } else {
          d.open = true;
          d.classList.add('opening');
          var h2 = body.offsetHeight;
          body.animate([{ height: '0px', opacity: 0, transform: 'translateY(-6px)' }, { height: h2 + 'px', opacity: 1, transform: 'none' }], { duration: 420, delay: 120, easing: E_OUT, fill: 'backwards' });
        }
      });
    });
  })();

  /* ---------- Form: a ring fills as the four needed answers come in ---------- */
  (function () {
    var form = $('#start form'), fr = form && $('.fr', form);
    if (!fr) return;
    fr.hidden = false;
    var need = ['name', 'role', 'need', 'contact'].map(function (n) { return form.elements[n]; });
    var on = $('.fr-on', fr), txt = $('[data-fr]', fr), C = 2 * Math.PI * 18;
    on.style.strokeDasharray = C;
    function upd() {
      var k = need.filter(function (f) { return f.value.trim() && f.validity.valid; }).length;
      on.style.strokeDashoffset = C * (1 - k / 4);
      txt.textContent = k === 4 ? 'Ready to send' : k + ' of 4 answered';
      fr.classList.toggle('done', k === 4);
    }
    form.addEventListener('input', upd);
    upd();
    setTimeout(upd, 300);                              // after the name is filled from the welcome gate
  })();

  /* ---------- Footer: the period drops into the giant wordmark ---------- */
  (function () {
    var big = $('.ft-big');
    if (!big) return;
    once(big, function () { big.classList.add('in'); }, '0px 0px -10% 0px');
  })();

  /* ---------- FAQ: the questions for the visitor's own type (from the gate) come first, then the shared ones.
     No answer in the gate: only the shared questions. Without JS every question shows ---------- */
  (function () {
    var list = document.querySelector('#faq .faq');
    if (!list) return;
    var items = $$('details', list), shared = items.filter(function (d) { return d.dataset.for === 'all'; });
    function show(role) {
      items.forEach(function (d) {
        var on = d.dataset.for === 'all' || d.dataset.for === role;
        if (!on) d.open = false;
        d.classList.toggle('faq-off', !on);
      });
      // the visitor's own questions sit above the shared ones
      items.forEach(function (d) { if (d.dataset.for === role) list.insertBefore(d, shared[0]); });
    }
    var prof = null; try { prof = JSON.parse(localStorage.getItem('growlab-profile')); } catch (e) {}
    show(prof && prof.role);
    window.addEventListener('growlab:profile', function (e) { show(e.detail && e.detail.role); });
  })();

  /* ---------- Every "Growth Check" link glides to the form instead of jumping: the page eases down,
     the form card rises to meet it, a light runs along its edge, and the first empty blank is ready to type ---------- */
  (function () {
    var start = document.getElementById('start'), card = start && start.querySelector('.cta');
    if (!card) return;
    var form = card.querySelector('form');
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function firstEmpty() {
      return form && [].slice.call(form.querySelectorAll('.ml-f input, .ml-f select')).filter(function (f) { return f.required && !f.value.trim(); })[0];
    }
    function arrive() {
      var f = firstEmpty();
      if (!reduce) {
        card.animate([{ transform: 'translateY(26px) scale(.975)', boxShadow: '0 0 0 0 rgba(242,178,62,0)' },
          { transform: 'none', boxShadow: '0 0 0 3px rgba(242,178,62,.55)', offset: .55 },
          { transform: 'none', boxShadow: '0 0 0 0 rgba(242,178,62,0)' }], { duration: 1100, easing: 'cubic-bezier(.23,1,.32,1)' });
        $$('.ml-f input, .ml-f select', card).forEach(function (el, i) {
          el.animate([{ borderBottomColor: 'rgba(244,239,230,.35)' }, { borderBottomColor: '#f2b23e', offset: .4 }, { borderBottomColor: 'rgba(244,239,230,.35)' }], { duration: 700, delay: 250 + i * 90 });
        });
      }
      if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, reduce ? 0 : 650);
    }
    var veil;
    function curtain(to, off) {
      if (!veil) {
        veil = document.createElement('div');
        veil.className = 'jump-veil';
        veil.setAttribute('aria-hidden', 'true');
        veil.innerHTML = '<i></i>';
        document.body.appendChild(veil);
      }
      var ball = veil.firstChild, E2 = 'cubic-bezier(.76,0,.24,1)';
      veil.style.display = 'block';
      veil.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 420, easing: E2, fill: 'forwards' });
      ball.animate([{ transform: 'translateY(40vh) scale(.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' })
        .onfinish = function () {
          document.documentElement.style.scrollBehavior = 'auto';
          scrollTo(0, to);
          var fix = card.getBoundingClientRect().top - off;
          if (Math.abs(fix) > 2) scrollTo(0, scrollY + fix);
          requestAnimationFrame(function () {
            ball.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-36vh) scale(.5)', opacity: 0 }], { duration: 480, easing: E2, fill: 'forwards' });
            veil.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 560, delay: 80, easing: E2, fill: 'forwards' })
              .onfinish = function () { veil.style.display = 'none'; };
            setTimeout(arrive, 260);
          });
        };
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="#start"]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var hd = document.querySelector('.hd'), off = (hd ? hd.offsetHeight : 0) + 16;
      var to = Math.max(0, card.getBoundingClientRect().top + scrollY - off), from = scrollY, dist = to - from;
      if (history.pushState) history.pushState(null, '', '#start');
      if (reduce || Math.abs(dist) < 4) { scrollTo(0, to); arrive(); return; }
      // far away: don't drag the visitor through every scroll scene on the way. A dark curtain with the amber
      // ball rises, the page moves behind it in one step, then the curtain lifts off the form
      if (Math.abs(dist) > innerHeight * 1.2) { curtain(to, off); return; }
      var D = Math.min(1700, Math.max(800, Math.abs(dist) * 0.22)), t0 = 0;
      // the user takes over the scroll: stop gliding
      var stop = false; function cancel() { stop = true; }
      ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, cancel, { once: true, passive: true }); });
      document.documentElement.style.scrollBehavior = 'auto';
      (function step(now) {
        if (stop) return;
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / D);
        scrollTo(0, from + dist * ease(p));
        if (p < 1) requestAnimationFrame(step);
        else {
          // anything above may have changed height while we travelled: settle exactly on the card
          var fix = card.getBoundingClientRect().top - off;
          if (Math.abs(fix) > 2) scrollTo(0, scrollY + fix);
          ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { removeEventListener(ev, cancel); });
          arrive();
        }
      })(performance.now());
    });
  })();
})();
