/* GrowLab · gap compass quiz.
   One question at a time. Each answer pulls the dot toward a corner of the triangle:
   first answers -> Direction, second -> Capability, third -> Delivery.
   Result rule = Hamed's demo: most answers wins; a 1-1-1 tie goes to Direction.
   Without JS the static gap cards show instead (see .nojs-gaps in site.css). */
(function () {
  'use strict';
  var root = document.getElementById('quiz');
  if (!root) return;

  var CORNER = [[200, 92], [60, 318], [340, 318]];
  var MID = [200, 242.67];
  var LAND = 0.84;                        // how far toward the winning corner the ball lands
  var NAMES = [], gaps = [].slice.call(document.querySelectorAll('.gp[data-gap]'));
  gaps.forEach(function (g) { NAMES[+g.dataset.gap] = g.dataset.name; });

  var steps = [].slice.call(root.querySelectorAll('.qstep'));
  var bar = root.querySelector('.qbar i');
  var back = root.querySelector('[data-act="back"]');
  var live = root.querySelector('[data-live]');
  var lean = root.querySelector('[data-lean]');
  var cmp = root.querySelector('.cmp');
  var trail = root.querySelector('.cmp-trail');
  var marks = root.querySelector('.cmp-steps');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SVGNS = 'http://www.w3.org/2000/svg';

  var answers = [], cur = 0, busy = false;

  function counts(a) { var c = [0, 0, 0]; a.forEach(function (k) { c[k]++; }); return c; }
  function winner(c) { return c.indexOf(Math.max.apply(null, c)); }
  function leader(c) {                       // null while the top is tied
    var m = Math.max.apply(null, c), n = c.filter(function (x) { return x === m; }).length;
    return n > 1 ? null : c.indexOf(m);
  }
  function point(a, final) {
    if (!a.length) return MID;
    var c = counts(a);
    if (final) {
      var w = CORNER[winner(c)];
      return [MID[0] + (w[0] - MID[0]) * LAND, MID[1] + (w[1] - MID[1]) * LAND];
    }
    var wt = c.map(function (n) { return 1 + 2 * n; }), s = wt[0] + wt[1] + wt[2];
    return [0, 1].map(function (ax) {
      return (wt[0] * CORNER[0][ax] + wt[1] * CORNER[1][ax] + wt[2] * CORNER[2][ax]) / s;
    });
  }
  function f(n) { return Math.round(n * 100) / 100; }

  /* ---- the 2.5D board ---- */
  var world = root.querySelector('.cmp-tilt');
  var ball = root.querySelector('.cmp-ball');
  var shadow = root.querySelector('.cmp-shadow');
  var fx = root.querySelector('.cmp-fx');
  var pins = [].slice.call(root.querySelectorAll('.cmp-pin'));
  var slab = root.querySelector('.cmp-slab');
  var shape = root.querySelector('.cmp-top .shape').outerHTML;
  for (var L = 1; L <= 8; L++) {             // stacked layers = the board's thickness
    var d = document.createElement('div');
    d.style.setProperty('--i', L);
    d.innerHTML = '<svg viewBox="0 0 400 400">' + shape + '</svg>';
    slab.appendChild(d);
  }
  var lastPos = MID, spin = 0, pulseUntil = 0, pulseTimer;
  // the welcome gate's "what do you need" answer gives the board a first lean (the quiz still decides)
  var NEED_GAP = { problem: 0, people: 1, moving: 2 }, prefGap = null;
  window.addEventListener('growlab:profile', function (e) {
    prefGap = e.detail && e.detail.need in NEED_GAP ? NEED_GAP[e.detail.need] : null;
    if (!answers.length) drawCompass();
  });

  function tilt(k, deg) {                    // tip the board so corner k goes down
    if (k === null || !deg) { world.style.transform = 'rotate3d(1,0,0,0deg)'; return; }
    var vx = CORNER[k][0] - MID[0], vy = CORNER[k][1] - MID[1], len = Math.hypot(vx, vy);
    world.style.transform = 'rotate3d(' + f(vy / len) + ',' + f(-vx / len) + ',0,' + (-deg) + 'deg)';
  }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function ripple(k, big) {
    if (reduce.matches) return;
    var r = document.createElement('i');
    r.className = 'rip' + (big ? ' big' : '');
    r.style.left = (CORNER[k][0] / 4) + 'cqw';
    r.style.top = (CORNER[k][1] / 4) + 'cqw';
    r.addEventListener('animationend', function () { r.remove(); });
    fx.appendChild(r);
  }

  function drawCompass(hit) {
    var done = answers.length === 3;
    var path = [MID];
    for (var i = 1; i <= answers.length; i++) path.push(point(answers.slice(0, i), done && i === 3));
    var p = path[path.length - 1];
    trail.setAttribute('points', path.map(function (q) { return f(q[0]) + ',' + f(q[1]); }).join(' '));
    while (marks.firstChild) marks.removeChild(marks.firstChild);
    path.slice(0, -1).forEach(function (q) {
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', f(q[0])); c.setAttribute('cy', f(q[1])); c.setAttribute('r', 5);
      marks.appendChild(c);
    });

    // the ball rolls: move, spin by distance travelled (left/right decides the direction), hop
    var dist = Math.hypot(p[0] - lastPos[0], p[1] - lastPos[1]);
    if (dist > 0.5) {
      spin += (p[0] >= lastPos[0] ? 1 : -1) * dist * 2.4;
      ball.style.setProperty('--spin', f(spin) + 'deg');
      [ball, shadow].forEach(function (el) {
        el.style.setProperty('--bx', f(p[0] / 4));
        el.style.setProperty('--by', f(p[1] / 4));
        if (!reduce.matches) restart(el, 'hopping');
      });
      lastPos = p;
      setTimeout(function () { window.dispatchEvent(new Event('growlab:quizmove')); }, 950);
    }

    var c = counts(answers), lead = answers.length ? leader(c) : null, win = done ? winner(c) : null;
    root.querySelectorAll('[data-z]').forEach(function (z) {
      var k = +z.dataset.z;
      z.classList.toggle('lean', !done && k === lead);
      z.classList.toggle('on', done && k === win);
    });
    pins.forEach(function (n) {
      var k = +n.dataset.n;
      n.classList.toggle('on', done && k === win);
      n.classList.toggle('dim', done && k !== win);
    });
    cmp.classList.toggle('done', done);

    // board tilt: a hard tip toward the answer just given, then a gentle lean toward the leader
    var restK = done ? win : lead, restDeg = done ? 7 : (lead === null ? 0 : 3.5);
    if (!answers.length && prefGap !== null) { restK = prefGap; restDeg = 3; }
    if (hit != null && !reduce.matches) {
      restart(pins[hit], 'hit');
      ripple(hit, false);
      if (done) setTimeout(function () { ripple(win, true); }, 650);
      tilt(hit, 10);
      pulseUntil = Date.now() + 480;
      clearTimeout(pulseTimer);
      pulseTimer = setTimeout(function () { tilt(restK, restDeg); }, 480);
    } else if (Date.now() >= pulseUntil) {
      tilt(restK, restDeg);
    }

    if (done) lean.textContent = 'You landed on ' + NAMES[win] + '.';
    else if (!answers.length) lean.textContent = 'You start in the middle.';
    else if (lead === null) lean.textContent = 'Too close to call.';
    else lean.textContent = 'Leaning toward ' + NAMES[lead] + '.';
  }

  // the hero ball lands on the board: two shrinking bounces (height only, no squash)
  window.addEventListener('growlab:land', function () {
    if (reduce.matches) return;
    [ball, shadow].forEach(function (el) { el.classList.remove('hopping'); restart(el, 'landing'); });
  });

  // perspective stretches the ball a little taller than wide; correct it so it reads as a true sphere
  // (and matches the hero ball exactly when it lands)
  var sph = root.querySelector('.cmp-ball .sphere');
  function roundBall() {
    sph.style.setProperty('--sq', 1);
    var r = sph.getBoundingClientRect();
    if (r.width && r.height) sph.style.setProperty('--sq', (r.width / r.height).toFixed(3));
  }
  window.addEventListener('resize', roundBall);
  window.addEventListener('load', roundBall);
  setTimeout(roundBall, 60);

  /* gentle parallax toward the pointer (desktop), and pause the idle drift when off screen */
  var par = root.querySelector('.cmp-par');
  var section = document.getElementById('gap');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  section.addEventListener('pointermove', function (e) {
    if (!fine.matches || reduce.matches) return;
    var r = section.getBoundingClientRect();
    par.style.setProperty('--px', f(((e.clientX - r.left) / r.width - 0.5) * 12) + 'deg');
    par.style.setProperty('--py', f(-((e.clientY - r.top) / r.height - 0.5) * 6) + 'deg');
  });
  section.addEventListener('pointerleave', function () {
    par.style.setProperty('--px', '0deg'); par.style.setProperty('--py', '0deg');
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { cmp.classList.toggle('paused', !en[0].isIntersecting); }).observe(cmp);
  }

  function fillResult() {
    var c = counts(answers), w = winner(c), g = gaps[w];
    var res = steps[3];
    res.querySelector('[data-r="name"]').textContent = NAMES[w] + '.';
    res.querySelector('[data-r="desc"]').textContent = g.querySelector('.gp-d').textContent;
    res.querySelector('[data-r="fix"]').innerHTML = g.querySelector('.fix').innerHTML;
    res.querySelector('[data-r="count"]').textContent =
      c[w] === 1 ? 'Your answers were split evenly' : c[w] + ' of 3 answers point here';
  }

  function show(n, moveFocus) {
    cur = n;
    steps.forEach(function (s, i) {
      var on = i === n;
      s.classList.toggle('is-on', on);
      s.classList.toggle('is-past', i < n);
      s.inert = !on;
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (on && i < 3) s.querySelectorAll('.op').forEach(function (b) {
        b.classList.remove('picked'); b.setAttribute('aria-pressed', 'false');
      });
    });
    bar.style.width = (Math.min(n, 3) / 3 * 100) + '%';
    back.hidden = n === 0;
    if (n === 3) fillResult();
    drawCompass();
    live.textContent = n === 3
      ? 'Result: your gap is ' + NAMES[winner(counts(answers))] + '.'
      : 'Question ' + (n + 1) + ' of 3';
    if (moveFocus) steps[n].querySelector('h3').focus({ preventScroll: true });
  }

  function choose(btn) {
    if (busy || cur > 2) return;
    busy = true;
    btn.classList.add('picked');
    btn.setAttribute('aria-pressed', 'true');
    answers.push(+btn.dataset.k);
    drawCompass(+btn.dataset.k);        // the board reacts at once; the card follows
    setTimeout(function () {
      busy = false;
      show(cur + 1, true);         // focus follows the card; the ring only shows for keyboard users
    }, reduce.matches ? 0 : 380);
  }

  root.addEventListener('click', function (e) {
    var op = e.target.closest('.op');
    if (op) { choose(op); return; }
    var act = e.target.closest('[data-act]');
    if (!act) return;
    var kb = e.detail === 0, a = act.dataset.act;
    if (a === 'back' && cur > 0 && !busy) { answers.pop(); show(cur - 1, kb); }
    if (a === 'retake') { answers = []; show(0, true); }
    if (a === 'go') carry(NAMES[winner(counts(answers))]);
  });

  root.addEventListener('keydown', function (e) {
    if (cur > 2 || e.altKey || e.ctrlKey || e.metaKey) return;
    var k = '123'.indexOf(e.key);
    if (k < 0) return;
    var b = steps[cur].querySelectorAll('.op')[k];
    if (b) { e.preventDefault(); choose(b); }
  });

  /* ---- carry the result into the Growth Check form ---- */
  var form = document.querySelector('#start form');
  function carry(name) {
    if (!form) return;
    form.elements.gap.value = 'Quiz result: ' + name + ' gap';
    var chip = form.querySelector('.carry');
    chip.querySelector('[data-carry]').textContent = name + ' gap';
    chip.hidden = false;
    (form.closest('.cta') || form).scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    var first = form.querySelector('input:not([type=hidden])');
    setTimeout(function () { first.focus({ preventScroll: true }); }, reduce.matches ? 0 : 600);
  }
  if (form) form.addEventListener('click', function (e) {
    if (!e.target.closest('[data-act="uncarry"]')) return;
    form.elements.gap.value = '';
    form.querySelector('.carry').hidden = true;
    form.querySelector('input:not([type=hidden])').focus();
  });

  root.classList.add('ready');
  show(0, false);
})();
