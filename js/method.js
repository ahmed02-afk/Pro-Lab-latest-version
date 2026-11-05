/* GrowLab · The method as a route map.
   Find: tangled lines (real quiz answers) pass through the GrowLab hub and come out as one line, "the real problem".
   Connect: the line fans out to five kinds of people; two light up, agreed on both sides.
   Grow: the lines merge and climb in steps (sprint demos) to the day-30 roadmap.
   The amber ball ("You") travels the route as you scroll; the section holds while the map draws, then lets go.
   No JS: the captions show in order. Reduced motion: the finished map, no hold. */
(function () {
  'use strict';
  var sec = document.getElementById('how');
  var wrap = sec && sec.querySelector('.mth');
  var fig = wrap && wrap.querySelector('.mth-map');
  if (!fig) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NS = 'http://www.w3.org/2000/svg';

  /* two layouts: landscape (tablet and up) and portrait (phone) */
  var L = {
    wide: {
      vb: [1040, 520],
      you: [70, 260], youLab: [70, 298, 'middle'],
      tangles: [
        'M86 254 C130 150 170 330 200 210 S270 120 302 250',
        'M86 262 C140 300 160 200 210 300 S280 330 302 262',
        'M86 268 C120 420 200 400 230 330 S280 290 302 270'
      ],
      tLabs: [[40, 92, 'Ten ideas', 'start'], [40, 124, 'Everyone has a different opinion', 'start'], [40, 156, 'Things keep slipping', 'start']],
      hub: [330, 260, 30], hubLab: [330, 170, 'middle'], brief: [330, 194, 'middle'],
      line: [360, 260, 440, 260], lineLab: [330, 330, 'middle'],
      people: [[540, 100, 'Fractional team'], [540, 180, 'Talent', 1], [540, 260, 'Agency or partner'], [540, 340, 'Expert', 1], [540, 420, 'Investor']],
      labDx: 20, labDy: 7, labAnchor: 'start',
      fan: function (p) { return 'M440 260 C490 260 490 ' + p[1] + ' 528 ' + p[1]; },
      merge: ['M630 180 H690 C770 180 790 300 820 300', 'M630 340 H690 C770 340 790 300 820 300'],
      stairs: 'M820 300 H860 V250 H900 V200 H940 V150 H962',
      steps: [[840, 300], [880, 250], [920, 200]], stepLab: [[846, 338, '3 sprints,', 'start'], [846, 362, 'a demo each', 'start']],
      flag: [962, 150], flagLab: [990, 76, 'end'],
      day15: [700, 470, 'middle'],
      journey: [
        'M70 260 C140 300 160 200 210 300 S280 330 330 260 L440 260',
        'M440 260 C490 260 490 180 540 180 H690 C770 180 790 300 820 300',
        'M820 300 H860 V250 H900 V200 H940 V150 H962'
      ]
    },
    tall: {
      vb: [400, 740],
      you: [200, 34], youLab: [236, 39, 'start'],
      tangles: [
        'M196 50 C80 96 330 126 150 178 S118 222 196 238',
        'M200 50 C300 106 90 150 262 198 S232 230 200 238',
        'M204 50 C360 88 250 170 330 160 S262 228 204 240'
      ],
      tLabs: [[14, 120, 'Ten ideas', 'start'], [386, 96, 'Everyone has a', 'end'], [386, 113, 'different opinion', 'end'], [14, 208, 'Things keep slipping', 'start']],
      hub: [200, 264, 26], hubLab: [236, 260, 'start'], brief: [236, 279, 'start'],
      line: [200, 290, 200, 372], lineLab: [212, 336, 'start'],
      people: [[40, 440, 'Team'], [120, 440, 'Talent', 1], [200, 440, 'Partner'], [280, 440, 'Expert', 1], [360, 440, 'Investor']],
      labDx: 0, labDy: 32, labAnchor: 'middle',
      fan: function (p) { return 'M200 372 C200 404 ' + p[0] + ' 400 ' + p[0] + ' 428'; },
      merge: ['M120 452 C120 500 200 500 200 540', 'M280 452 C280 500 200 500 200 540'],
      stairs: 'M200 540 V690 H244 V650 H288 V610 H332 V570 H352',
      steps: [[222, 690], [266, 650], [310, 610]], stepLab: [[188, 640, '3 sprints,', 'end'], [188, 662, 'a demo each', 'end']],
      flag: [352, 570], flagLab: [314, 512, 'end'], flagLines: ['Day 30', 'roadmap'],
      day15: [212, 398, 'start'],
      journey: [
        'M200 34 C300 106 90 150 262 198 S232 230 200 264 L200 372',
        'M200 372 C200 404 120 400 120 440 C120 500 200 500 200 540',
        'M200 540 V690 H244 V650 H288 V610 H332 V570 H352'
      ]
    }
  };

  function el(name, attrs, parent, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function label(g, x, y, t, anchor, cls) { return el('text', { x: x, y: y, 'text-anchor': anchor || 'middle', class: cls || 'ml' }, g, t); }

  var parts, mode, segLen = [], ballEl, svg;

  function build() {
    var m = window.matchMedia('(min-width: 640px)').matches ? 'wide' : 'tall';
    if (m === mode && svg) return;
    mode = m;
    var S = L[m];
    fig.innerHTML = '';
    svg = el('svg', { viewBox: '0 0 ' + S.vb[0] + ' ' + S.vb[1], class: 'mth-svg ' + m }, fig);
    parts = { draw: [], show: [] };
    function draw(d, cls, a, b) { var p = el('path', { d: d, class: cls }, svg); parts.draw.push({ el: p, a: a, b: b, len: p.getTotalLength() }); return p; }
    function show(node, a, b) { parts.show.push({ el: node, a: a, b: b }); return node; }

    // FIND
    S.tangles.forEach(function (d, i) { draw(d, 'mt tangle', 0.02 + i * 0.03, 0.2 + i * 0.03); });
    S.tLabs.forEach(function (t) { show(label(svg, t[0], t[1], t[2], t[3], 'ml q'), 0.03, 0.12); });
    var you = el('g', { class: 'mn you' }, svg);
    el('circle', { cx: S.you[0], cy: S.you[1], r: 14 }, you);
    show(label(svg, S.youLab[0], S.youLab[1], 'You', S.youLab[2], 'ml strong'), 0, 0.05);
    var hub = show(el('g', { class: 'mn hub' }, svg), 0.08, 0.16);
    el('circle', { cx: S.hub[0], cy: S.hub[1], r: S.hub[2] }, hub);
    el('circle', { cx: S.hub[0], cy: S.hub[1], r: S.hub[2] * 0.32, class: 'core' }, hub);
    show(label(svg, S.hubLab[0], S.hubLab[1], 'GrowLab', S.hubLab[2], 'ml strong'), 0.08, 0.16);
    show(label(svg, S.brief[0], S.brief[1], 'Growth Brief', S.brief[2], 'ml'), 0.24, 0.3);
    draw('M' + S.line[0] + ' ' + S.line[1] + ' L' + S.line[2] + ' ' + S.line[3], 'mt main', 0.25, 0.33);
    show(label(svg, S.lineLab[0], S.lineLab[1], 'the real problem', S.lineLab[2], 'ml tl'), 0.28, 0.34);

    // CONNECT
    S.people.forEach(function (p, i) {
      draw(S.fan(p), 'mt fan', 0.35 + i * 0.012, 0.44 + i * 0.012);
      if (p[3]) draw(S.fan(p), 'mt lit', 0.45, 0.55);
      var g = show(el('g', { class: 'mn person' + (p[3] ? ' lit' : '') }, svg), 0.37 + i * 0.012, 0.43 + i * 0.012);
      el('circle', { cx: p[0], cy: p[1], r: 11 }, g);
      show(label(svg, p[0] + S.labDx, p[1] + S.labDy, p[2], S.labAnchor, 'ml' + (p[3] ? ' strong' : '')), 0.38 + i * 0.012, 0.44 + i * 0.012);
      if (p[3]) {   // agreed on both sides: a check at each end
        var ck = show(el('g', { class: 'ck' }, svg), 0.55, 0.6);
        el('circle', { cx: p[0], cy: p[1], r: 17, class: 'ring' }, ck);
        el('path', { d: 'M' + (p[0] - 4) + ' ' + p[1] + ' l3 3 6-7', class: 'tick' }, ck);
      }
    });
    show(label(svg, S.day15[0], S.day15[1], 'first intro by day 15', S.day15[2], 'ml tl'), 0.55, 0.62);

    // GROW
    S.merge.forEach(function (d) { draw(d, 'mt lit', 0.66, 0.74); });
    draw(S.stairs, 'mt main', 0.74, 0.92);
    // each step of the stairs is one sprint, numbered, with its demo
    S.steps.forEach(function (t, i) {
      var g = show(el('g', { class: 'mn sprint' }, svg), 0.78 + i * 0.04, 0.82 + i * 0.04);
      el('circle', { cx: t[0], cy: t[1], r: 12 }, g);
      el('text', { x: t[0], y: t[1] + 5, 'text-anchor': 'middle', class: 'sn' }, g, String(i + 1));
    });
    S.stepLab.forEach(function (t) { show(label(svg, t[0], t[1], t[2], t[3], 'ml q'), 0.8, 0.88); });
    var flag = show(el('g', { class: 'flag' }, svg), 0.9, 0.97);
    el('path', { d: 'M' + S.flag[0] + ' ' + S.flag[1] + ' V' + (S.flag[1] - 56), class: 'pole' }, flag);
    el('path', { d: 'M' + S.flag[0] + ' ' + (S.flag[1] - 56) + ' h-30 l8 10 -8 10 h30 z', class: 'cloth' }, flag);
    (S.flagLines || ['Day 30 · roadmap']).forEach(function (t, i) {
      show(label(svg, S.flagLab[0], S.flagLab[1] + i * 22, t, S.flagLab[2], 'ml strong'), 0.92, 0.98);
    });

    // the ball: the visitor, travelling the route
    segLen = S.journey.map(function (d) { var p = el('path', { d: d, class: 'jr' }, svg); return { el: p, len: p.getTotalLength() }; });
    // the ball: the same lit amber sphere as the hero ball. The light stays put, the seam turns as it rolls,
    // and a soft shadow keeps it on the ground
    var R = m === 'wide' ? 10 : 9, defs = el('defs', {}, svg);
    var g = el('radialGradient', { id: 'mth-bg', cx: '34%', cy: '30%', r: '75%' }, defs);
    [['0', '#fff6dc'], ['.11', '#fff6dc'], ['.3', '#f7c45e'], ['.6', '#f2b23e'], ['.9', '#c98a1c'], ['1', '#9c6a12']].forEach(function (st) { el('stop', { offset: st[0], 'stop-color': st[1] }, g); });
    var sg = el('radialGradient', { id: 'mth-bs' }, defs);
    el('stop', { offset: '0', 'stop-color': '#000', 'stop-opacity': '.45' }, sg);
    el('stop', { offset: '1', 'stop-color': '#000', 'stop-opacity': '0' }, sg);
    var cp = el('clipPath', { id: 'mth-bc' }, defs);
    el('circle', { r: R }, cp);
    ballEl = el('g', { class: 'mball' }, svg);
    el('ellipse', { cx: R * 0.25, cy: R * 0.85, rx: R * 1.05, ry: R * 0.42, fill: 'url(#mth-bs)', class: 'sh' }, ballEl);
    el('circle', { r: R, class: 'b', fill: 'url(#mth-bg)' }, ballEl);
    var seam = el('g', { 'clip-path': 'url(#mth-bc)' }, ballEl);
    ballEl.seam = el('ellipse', { rx: R * 0.13, ry: R * 1.25, class: 'stripe' }, seam);
    el('circle', { r: R, class: 'rim' }, ballEl);
    render(lastP);
  }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var SEG = [[0.04, 0.33], [0.36, 0.62], [0.68, 0.96]];
  var lastP = reduce.matches ? 1 : 0;
  var caps = [].slice.call(sec.querySelectorAll('.mth-st')), prog = [].slice.call(sec.querySelectorAll('.mth-prog li')), stage = -1;

  function render(p) {
    lastP = p;
    if (!parts) return;
    parts.draw.forEach(function (d) {
      var f = clamp((p - d.a) / (d.b - d.a));
      d.el.style.strokeDasharray = d.len;
      d.el.style.strokeDashoffset = (d.len * (1 - f)).toFixed(1);
    });
    parts.show.forEach(function (s) {
      var f = clamp((p - s.a) / (s.b - s.a));
      s.el.style.opacity = f;
      s.el.style.transform = 'translateY(' + ((1 - f) * 6).toFixed(1) + 'px)';
    });
    // ball position along the three journey segments
    var seg = 0, f = 0;
    for (var i = 0; i < 3; i++) {
      if (p >= SEG[i][0]) { seg = i; f = clamp((p - SEG[i][0]) / (SEG[i][1] - SEG[i][0])); }
    }
    var J = segLen[seg], pt = J.el.getPointAtLength(J.len * f);
    var rolled = 0; for (var k = 0; k < seg; k++) rolled += segLen[k].len; rolled += J.len * f;
    ballEl.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
    ballEl.seam.setAttribute('transform', 'rotate(' + Math.round(rolled / 10 * 57.3) + ')');   // it really rolls

    var st = p < 0.345 ? 0 : p < 0.655 ? 1 : 2;
    if (st !== stage) {
      stage = st;
      caps.forEach(function (c, i) { c.classList.toggle('on', i === st); });
      prog.forEach(function (li, i) { li.classList.toggle('on', i <= st); });
    }
    wrap.style.setProperty('--mp', p.toFixed(3));
  }

  /* where the hero ball lands: the ball's resting place on "You", in page coordinates, as if the map were not pinned */
  window.GL_methodStart = function () {
    var c = svg && svg.querySelector('.mn.you circle'), b = ballEl && ballEl.querySelector('.b'), st = wrap.querySelector('.mth-stick');
    if (!c || !b) return null;
    var r = c.getBoundingClientRect(), sr = st.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    return { x: r.left + r.width / 2 + scrollX, y: wr.top + scrollY + (r.top + r.height / 2 - sr.top), w: b.getBoundingClientRect().width };
  };

  wrap.classList.add('mth-js');
  if (reduce.matches || !window.gsap || !window.ScrollTrigger) {
    wrap.classList.add('mth-static');            // finished map, every caption visible, no hold
    build(); render(1);
    caps.forEach(function (c) { c.classList.add('on'); });
    window.addEventListener('resize', function () { build(); render(1); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  build();
  var hdH = function () { return document.querySelector('.hd').offsetHeight; };
  var target = 0, cur = 0, raf = 0, last = 0;
  ScrollTrigger.create({
    trigger: wrap,
    start: function () { return 'top ' + hdH() + 'px'; },
    end: 'bottom bottom',
    onUpdate: function (self) { target = self.progress; if (!raf) raf = requestAnimationFrame(tick); }
  });
  /* the map never rushes: it glides after the scroll at its own calm pace, even on a fast flick,
     and catches up within a moment once you stop */
  function tick(now) {
    var dt = last ? Math.min(50, now - last) : 16; last = now;
    var d = target - cur, step = d * (1 - Math.pow(0.0025, dt / 1000)), max = 0.45 * dt / 1000;
    if (Math.abs(step) > max) step = step > 0 ? max : -max;
    cur = Math.abs(d) < 0.0005 ? target : cur + step;
    render(cur);
    if (cur !== target) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
  }
  ScrollTrigger.addEventListener('refreshInit', build);
})();
