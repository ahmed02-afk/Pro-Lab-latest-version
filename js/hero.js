/* GrowLab · hero ball.
   The period of "traction." is the amber ball (the same ball as the welcome gate).
   Idle: it spins in place in short bursts (busy, no traction).
   Scroll: it grips, hops out of the headline, rolls down the page and lands on "You", the start of the
   method map, where the map's own ball takes over. Scrolling back up reverses it exactly.
   Reduced motion / no JS / no GSAP: the period is plain text and the map ball is already there. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var root = document.documentElement;
  var slot = document.querySelector('.hero h1 .slot');
  var tb = document.querySelector('.tball');
  var hero = document.querySelector('.hero');
  var how = document.getElementById('how');
  if (!slot || !tb || !hero || !how || !window.GL_methodStart) return;

  root.classList.add('tb-on', 'tb-away');
  var state = { t: 0 }, samples = [], total = 1, s0 = 0.6, size = 30, endScroll = 1000;
  var landed = false, idle = true, heroOnScreen = true, phone = false;

  /* where the "." of traction really sits: its baseline from a zero-height marker, its box from the font */
  var ctx = document.createElement('canvas').getContext('2d');
  function dot() {
    var cs = getComputedStyle(slot), fs = parseFloat(cs.fontSize);
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    var m = ctx.measureText('.');
    var r = slot.getBoundingClientRect(), base = slot.querySelector('.bl').getBoundingClientRect().top;
    var w = m.actualBoundingBoxRight + m.actualBoundingBoxLeft;
    var h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    return {
      x: r.left + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
      y: base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
      d: Math.max(w, h)
    };
  }
  window.GL_heroDot = dot;                     // the welcome gate lands its ball here


  // Catmull-Rom through the control points, sampled by length so the roll speed is even
  function spline(p) {
    var out = [];
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      for (var k = 0; k < 40; k++) {
        var t = k / 40, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    out.push(p[p.length - 1]);
    var len = 0;
    out.forEach(function (q, i) { if (i) len += Math.hypot(q.x - out[i - 1].x, q.y - out[i - 1].y); q.l = len; });
    return out;
  }

  function build() {
    var d = dot();
    var S = { x: d.x + scrollX, y: d.y + scrollY };
    var E = window.GL_methodStart();
    if (!E) return;
    size = E.w || 30;
    s0 = Math.min(1, d.d / size);
    tb.style.setProperty('--tbs', size + 'px');

    var b = document.querySelectorAll('.hero .acts .btn');
    var r1 = b[0].getBoundingClientRect(), r2 = b[1].getBoundingClientRect();
    var hop = { x: S.x + 10, y: S.y - 30 };
    var pts;
    phone = Math.abs(r1.top - r2.top) >= 10;
    if (!phone) {
      // desktop / laptop: between the two buttons, across the gap above the method heading,
      // down the free space right of its intro text, then onto "You"
      var A = { x: (r1.right + r2.left) / 2 + scrollX, y: (r1.top + r1.bottom) / 2 + scrollY };
      var howTop = how.getBoundingClientRect().top + scrollY;
      var howPad = parseFloat(getComputedStyle(how).paddingTop) || 60;
      var ld = how.querySelector('.lead').getBoundingClientRect();
      var side = Math.min(document.documentElement.clientWidth - 60, ld.right + 70) + scrollX;
      var B = { x: side, y: howTop + howPad * 0.5 };
      var C = { x: side, y: ld.bottom + scrollY + 20 };
      pts = [S, hop, A, B, C, E];
    } else {
      // phone: everything is one column, so roll down the right edge where no text runs, then onto "You"
      var edge = document.documentElement.clientWidth - Math.max(17, size * 1.8 * 1.15 + 8) + scrollX;   // the lifted ball and its shadow stay on screen
      pts = [S, hop, { x: edge, y: S.y + 70 }, { x: edge, y: E.y - 70 }, E];
    }
    samples = spline(pts);
    total = samples[samples.length - 1].l;
    // landed while "You" is still low on screen, before the map starts to hold and draw
    var mapStart = how.querySelector('.mth').getBoundingClientRect().top + scrollY - (document.querySelector('.hd') || {}).offsetHeight;
    endScroll = Math.max(200, Math.min(E.y - innerHeight * 0.7, mapStart - 2));
  }

  function at(dist) {
    var lo = 0, hi = samples.length - 1;
    while (lo < hi) { var m = (lo + hi) >> 1; if (samples[m].l < dist) lo = m + 1; else hi = m; }
    var b = samples[lo], a = samples[Math.max(0, lo - 1)], seg = (b.l - a.l) || 1, f = Math.min(1, Math.max(0, (dist - a.l) / seg));
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  var PEAK = 2.6;            // how close to the screen it comes, in board-ball sizes
  function render() {
    if (!samples.length) return;
    var t = state.t;
    // distance eases out: it launches, then floats down slower and slower onto the board
    var u = 1 - Math.pow(1 - t, 1.6), dist = u * total, p = at(dist);
    // size: period -> lifted toward the screen (PEAK) -> exactly the board ball's size
    var sc, f, peak = phone ? 1.8 : PEAK;
    if (t < 0.06) sc = s0;
    else if (t < 0.5) { f = (t - 0.06) / 0.44; sc = s0 + (peak - s0) * (1 - Math.pow(1 - f, 3)); }
    else { f = (t - 0.5) / 0.5; sc = peak + (1 - peak) * (f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2); }
    var lift = t < 0.06 ? 0 : Math.max(0, Math.min(1, (sc - 1) / (peak - 1)));
    tb.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
    tb.style.setProperty('--tbsc', sc.toFixed(3));
    tb.style.setProperty('--lift', lift.toFixed(3));
    tb.style.setProperty('--rot', Math.round(dist / (size * sc / 2) * 57.3) + 'deg');   // it really rolls

    var wasIdle = idle;
    idle = t < 0.004;
    if (!idle) { tb.classList.remove('spin', 'lean'); }
    if (idle !== wasIdle) { clearTimeout(burstT); if (idle) burstT = setTimeout(burst, 1200); }

    // hand-over to the map's ball: instant swap, same size and place, no extra effect
    var nowLanded = t > 0.995;
    if (nowLanded !== landed) {
      landed = nowLanded;
      tb.style.visibility = landed ? 'hidden' : '';
      root.classList.toggle('tb-away', !landed);
    }
  }

  /* idle: spin in place for 1.5s, rest 2.5s, try again (only while the hero is on screen) */
  var burstT;
  function burst() {
    clearTimeout(burstT);
    if (!idle) return;
    if (heroOnScreen && !document.hidden && !root.classList.contains('gate-on')) {
      tb.classList.add('spin');
      setTimeout(function () { tb.classList.remove('spin'); }, 1500);
    }
    burstT = setTimeout(burst, 4000);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { heroOnScreen = en[0].isIntersecting; }).observe(hero);
  }

  gsap.to(state, {
    t: 1, ease: 'none', onUpdate: render,
    scrollTrigger: { start: 0, end: function () { return endScroll; }, scrub: 0.5, invalidateOnRefresh: true }
  });
  ScrollTrigger.addEventListener('refreshInit', build);
  ScrollTrigger.addEventListener('refresh', render);

  // personalisation reorders cards and changes the hero greeting: re-measure
  window.addEventListener('growlab:profile', function () { requestAnimationFrame(function () { ScrollTrigger.refresh(); }); });

  build(); render();
  burstT = setTimeout(burst, 1200);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
