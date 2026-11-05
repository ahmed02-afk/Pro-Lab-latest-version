/* GrowLab · section entrances (for everything that has no motion of its own).
   Headings: each word rises out of a mask. Small labels, leads, links and notes fade up.
   Groups (price cards, plans, FAQ rows, About roles, chips, the form fields) arrive one after another.
   Plays once per element as it enters. Nothing is hidden until the script is running;
   reduced motion: no entrances at all. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  var E = 'cubic-bezier(.23,1,.32,1)';
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  /* split a heading into masked words, keeping <em> and other inline tags */
  function split(el) {
    var words = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var o = document.createElement('span'), i = document.createElement('span');
            o.className = 'rv-w'; i.className = 'rv-wi'; i.textContent = p;
            o.appendChild(i); frag.appendChild(o); words.push(i);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('slot')) walk(n);
      });
    })(el);
    return words;
  }

  var jobs = [];
  function add(el, play) { if (!el || el.dataset.rv) return; el.dataset.rv = '1'; jobs.push({ el: el, play: play }); }
  function fade(el, delay, y) {
    el.style.opacity = '0';
    return function () {
      el.style.opacity = '';
      el.animate([{ opacity: 0, transform: 'translateY(' + (y || 18) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 750, delay: delay || 0, easing: E, fill: 'backwards' });
    };
  }

  /* 1 · section headings (not the hero headline, the welcome gate or the 3D/scroll scenes) */
  $$('main section h2').forEach(function (h) {
    if (h.closest('.hero,.gate,.qs,.mth-st,.cc,.ofr-stage')) return;
    var words = split(h);
    words.forEach(function (w) { w.style.transform = 'translateY(110%)'; });
    add(h, function () {
      words.forEach(function (w, i) {
        w.style.transform = '';
        w.animate([{ transform: 'translateY(110%) rotate(4deg)' }, { transform: 'none' }], { duration: 900, delay: i * 45, easing: E, fill: 'backwards' });
      });
    });
  });

  /* 2 · single elements that fade up */
  $$('main section .tag, main section > .w > .lead, main section .nx, main section > .w > .fine, #about .lead, #about .fine, #prices .gb, #offer .def, .wk-l').forEach(function (el) {
    if (el.closest('.hero .hg,.gate,.cc,.mth-st,.cta')) return;
    add(el, fade(el, el.classList.contains('tag') ? 0 : 120));
  });

  /* 3 · hero supporting lines (the headline stays put: the ball sits on its period) */
  (function () {
    var hx = document.querySelector('.hero .hx');
    if (!hx) return;
    var parts = $$('.hello:not([hidden]), .msg:not([hidden]), .lead, .acts', hx);
    parts.forEach(function (el) { el.style.opacity = '0'; });
    var ph = document.querySelector('.hero .ph'), card = ph && ph.querySelector('.ph-card'), img = card && card.querySelector('img');
    var shine = ph && ph.querySelector('.ph-shine'), stk = ph && ph.querySelector('.stk'), note = ph && ph.querySelector('.note'), num = stk && stk.querySelector('.stk-n');
    [card, stk, note].forEach(function (el) { if (el) el.style.opacity = '0'; });
    var go = function () {
      parts.forEach(function (el, i) {
        el.style.opacity = '';
        el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 150 + i * 110, easing: E, fill: 'backwards' });
      });
      if (!card) return;
      // 1 · the card rises and tips up into place while the photo is uncovered from the bottom; the amber outline draws itself
      card.style.opacity = '';
      card.animate([
        { opacity: 0, transform: 'translateY(22%) rotateX(38deg) rotateZ(-4deg) scale(.86)', clipPath: 'inset(100% 0 0 0 round 0)' },
        { opacity: 1, transform: 'translateY(-1.5%) rotateX(-3deg) rotateZ(.5deg) scale(1.01)', clipPath: 'inset(0% 0 0 0 round 0)', offset: 0.7 },
        { opacity: 1, transform: 'none', clipPath: 'inset(0% 0 0 0 round 0)' }
      ], { duration: 1500, delay: 200, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
      if (img) img.animate([{ transform: 'scale(1.3) translateY(6%)', filter: 'saturate(.3) brightness(.7)' }, { transform: 'none', filter: 'none' }], { duration: 2000, delay: 200, easing: E, fill: 'backwards' });
      var arc = ph.querySelector('.ph-arc path');
      if (arc) arc.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1600, delay: 700, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' });
      // 2 · a light sweeps across the glass once it has landed
      if (shine) shine.animate([{ opacity: 0, backgroundPosition: '120% 0' }, { opacity: 1, offset: 0.2 }, { opacity: 0, backgroundPosition: '-20% 0' }], { duration: 1200, delay: 1450, easing: 'ease-in-out' });
      // 3 · the rating seal is stamped on: drops from above, the card takes the hit, the number counts up
      if (stk) {
        stk.style.opacity = '';
        stk.animate([
          { opacity: 0, transform: 'translateY(-60px) scale(2.2) rotate(-14deg)' },
          { opacity: 1, transform: 'scale(.92) rotate(7deg)', offset: 0.55 },
          { opacity: 1, transform: 'scale(1.04) rotate(3deg)', offset: 0.78 },
          { opacity: 1, transform: 'rotate(4deg)' }
        ], { duration: 700, delay: 1500, easing: 'cubic-bezier(.55,0,.4,1)', fill: 'backwards' });
        setTimeout(function () { card.animate([{ transform: 'none' }, { transform: 'translateY(4px) rotate(.6deg)' }, { transform: 'none' }], { duration: 380, easing: E }); }, 1880);
        $$('.stars i', stk).forEach(function (st, i) {
          st.animate([{ opacity: 0, transform: 'scale(0) rotate(-90deg)' }, { opacity: 1, transform: 'scale(1.5) rotate(10deg)', offset: .6 }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 1850 + i * 110, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
        });
        if (num) {
          var t0 = 0, D = 900;
          setTimeout(function () {
            (function step(now) {
              if (!t0) t0 = now;
              var f = Math.min(1, (now - t0) / D), v = 1 - Math.pow(1 - f, 3);
              num.textContent = (Math.round(v * 50) / 10).toFixed(f < 1 ? 1 : 0) + '/5';
              if (f < 1) requestAnimationFrame(step); else num.textContent = '5/5';
            })(performance.now());
          }, 1700);
        }
      }
      // 4 · the note arrives like a chat message: it pops up, types for a moment, then the words appear
      if (note) {
        setTimeout(function () {
          note.style.opacity = '';
          note.classList.add('typing');
          note.animate([{ opacity: 0, transform: 'translateY(24px) scale(.7) rotate(-2deg)' }, { opacity: 1, transform: 'rotate(-2deg)' }], { duration: 600, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
          setTimeout(function () {
            note.classList.remove('typing');
            var t = note.querySelector('.note-t');
            t.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(4px)' }, { opacity: 1, filter: 'none', transform: 'none' }], { duration: 600, easing: E });
          }, 1300);
        }, 2100);
      }
      // 5 · after it lands, the card follows the pointer in 3D: the labels float in front of the photo
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setTimeout(function () {
        var hero = document.querySelector('.hero'), raf = 0;
        hero.addEventListener('pointermove', function (e) {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = 0;
            var r = ph.getBoundingClientRect(), x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
            ph.style.transform = 'perspective(1200px) rotateY(' + (x * 14).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg)';
          });
        });
        hero.addEventListener('pointerleave', function () { ph.style.transform = ''; });
      }, 3400);
    };
    // wait for the welcome gate to close on a first visit
    if (document.documentElement.classList.contains('gate-on')) {
      var mo = new MutationObserver(function () { if (!document.documentElement.classList.contains('gate-on')) { mo.disconnect(); go(); } });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } else go();
  })();

  /* 4 · groups that arrive one after another */
  function group(sel, item, opts) {
    $$(sel).forEach(function (g) {
      var kids = $$(item, g).filter(function (k) { return !k.hidden; });
      if (!kids.length) return;
      kids.forEach(function (k) { k.style.opacity = '0'; });
      add(g, function () {
        kids.forEach(function (k, i) {
          k.style.opacity = '';
          k.animate([{ opacity: 0, transform: opts.from }, { opacity: 1, transform: 'none' }], { duration: opts.d || 800, delay: i * (opts.s || 90), easing: E, fill: 'backwards' });
        });
      });
    });
  }
  group('#prices .pg', '.pc', { from: 'translateY(40px) rotateX(-12deg)', s: 110 });
  group('#prices .mo', 'article', { from: 'translateY(24px)' });
  group('#faq .faq', 'details', { from: 'translateX(-24px)', s: 70 });
  group('#about .xp', 'li', { from: 'translateX(30px)', s: 70 });
  group('#about .chips.ol', 'li', { from: 'translateY(12px) scale(.9)', s: 40, d: 600 });
  group('#gap .qx', '.qcard', { from: 'translateY(30px)' });
  group('#start form', ':scope > *', { from: 'translateY(16px)', s: 50, d: 650 });
  group('#start .cta > div:first-child', ':scope > *', { from: 'translateY(16px)', s: 80 });
  group('#pools', '.pf-bar, .key', { from: 'translateY(14px)', s: 80 });
  group('.ft', '.ft-big, .w:not(.ft-big)', { from: 'translateY(24px)', s: 120 });

  /* the CTA box itself grows in */
  var cta = document.querySelector('#start .cta');
  if (cta) {
    cta.style.opacity = '0';
    add(cta, function () {
      cta.style.opacity = '';
      cta.animate([{ opacity: 0, transform: 'translateY(40px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 1000, easing: E, fill: 'backwards' });
    });
  }

  /* run each one once, as it enters */
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var j = jobs.filter(function (x) { return x.el === e.target; })[0];
      if (j) j.play();
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  jobs.forEach(function (j) {
    // already on screen when the page opens: play right away
    var r = j.el.getBoundingClientRect();
    if (r.top < innerHeight * 0.88 && r.bottom > 0) { j.play(); return; }
    io.observe(j.el);
  });
})();
