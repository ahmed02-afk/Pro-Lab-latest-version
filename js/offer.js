/* GrowLab · What we offer: a 3D turntable.
   Four tracks, four objects on one round platform (same family as the quiz board):
     The right people  -> you (the amber ball) linked to two of five vetted people
     Meetings & advice -> two speech bubbles in conversation
     Formations        -> a small amphitheatre filling with people
     Investors & grants-> coins stacking up
   As you read each track on the left, the platform turns its object to the front (scroll-linked, not pinned).
   No JS / no WebGL: the four cards stay as they are. Reduced motion: it turns without easing, objects stay still. */
(function () {
  'use strict';
  var sec = document.getElementById('offer');
  var wrap = sec && sec.querySelector('.ofr');
  var cv = wrap && wrap.querySelector('.ofr-cv');
  if (!cv || !window.THREE) return;
  var T = window.THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;   // brand colours are sRGB
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var items = [].slice.call(wrap.querySelectorAll('.trk'));

  // sticky parts sit right under the real header height
  function hdh() { var h = document.querySelector('.hd'); if (h) document.documentElement.style.setProperty('--hdh', h.offsetHeight + 'px'); }
  hdh(); window.addEventListener('resize', hdh);

  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  wrap.classList.add('ofr-js');
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  if ('outputEncoding' in renderer) renderer.outputEncoding = T.sRGBEncoding;

  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(30, 1, 0.1, 100);
  var LOOK = new T.Vector3(0, 1.25, 1.6);

  /* ---------- colours from the site tokens (light / dark) ---------- */
  var C = {};
  function tok(n, f) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || f; }
  function readColours() {
    C.amber = '#f2b23e'; C.k = '#0c1719'; C.cream = '#fbf7f0';
    C.ink = tok('--ink', '#0c1719'); C.tl = tok('--tl', '#1e6a63');
    C.top = tok('--board-top', '#fffdf8'); C.edge = tok('--board-edge', '#e2d8c6'); C.line = tok('--line', '#e4dccd');
    C.dark = document.documentElement.getAttribute('data-theme') === 'dark';
  }
  readColours();
  var M = {};                                   // shared materials, recoloured on theme change
  function mat(key, opts) { M[key] = new T.MeshStandardMaterial(Object.assign({ roughness: 0.55, metalness: 0 }, opts)); return M[key]; }
  mat('amber', { roughness: 0.38 });
  mat('coin', { roughness: 0.3, metalness: 0.35 });
  mat('ink', {});
  mat('teal', {});
  mat('cream', {});
  mat('top', { roughness: 0.8 });
  mat('edge', { roughness: 0.9 });
  mat('line', { roughness: 1 });
  function paint() {
    M.amber.color.set(C.amber); M.coin.color.set(C.amber);
    M.ink.color.set(C.dark ? '#26393d' : C.k);
    M.teal.color.set(C.tl);
    M.cream.color.set(C.dark ? '#e9e2d4' : C.cream);
    M.top.color.set(C.top); M.edge.color.set(C.edge); M.line.color.set(C.dark ? '#33494d' : '#d9cfbd');
    hemi.intensity = C.dark ? 0.55 : 0.75;
    if (M.glowA) { M.glowA.color.set(C.amber); M.glowT.color.set(C.dark ? '#6cc2b8' : '#2a8a80'); M.glass.color.set('#ffffff'); M.steam.color.set(C.dark ? '#c9d3d0' : '#ffffff'); }
    halos && halos.forEach(function (h) { h.s.material.blending = C.dark ? T.AdditiveBlending : T.NormalBlending; h.s.material.needsUpdate = true; });
  }

  /* ---------- light ---------- */
  var hemi = new T.HemisphereLight(0xffffff, 0x9c8f78, 0.75);
  scene.add(hemi);
  var sun = new T.DirectionalLight(0xffffff, 0.85);
  sun.position.set(-4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
  sun.shadow.radius = 4; sun.shadow.bias = -0.0008;
  scene.add(sun);
  var fill = new T.DirectionalLight(0xfff1d6, 0.25);
  fill.position.set(5, 3, -2);
  scene.add(fill);

  function mesh(geo, m, cast) { var o = new T.Mesh(geo, m); o.castShadow = cast !== false; o.receiveShadow = true; return o; }

  /* ---------- the platform ---------- */
  var table = new T.Group();
  scene.add(table);
  var R = 4.1;
  var top = mesh(new T.CylinderGeometry(R, R, 0.22, 120), M.top, false); top.position.y = 0.11; table.add(top);
  var rim = mesh(new T.CylinderGeometry(R - 0.02, R - 0.18, 0.38, 120), M.edge, false); rim.position.y = -0.18; table.add(rim);
  [R * 0.62, R * 0.92].forEach(function (r) {
    var ring = new T.Mesh(new T.RingGeometry(r - 0.012, r + 0.012, 160), M.line);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.225; table.add(ring);
  });
  // soft floor shadow under the floating platform
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 10, 64, 64, 64);
    gr.addColorStop(0, 'rgba(12,23,25,.35)'); gr.addColorStop(1, 'rgba(12,23,25,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    var sh = new T.Mesh(new T.PlaneGeometry(R * 2.6, R * 2.6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = -0.75; scene.add(sh);
  })();

  var SLOT_R = 2.2, TOP_Y = 0.22, BIG = 1.55;
  var objs = [];
  function slot(i, build) {
    var a = i * Math.PI / 2, g = new T.Group();
    g.position.set(Math.sin(a) * SLOT_R, TOP_Y, Math.cos(a) * SLOT_R);
    g.rotation.y = a;                                   // faces outward: toward the camera when at the front
    var o = build(g) || {};
    o.g = g; table.add(g); objs[i] = o;
  }

  /* ---------- glow: self-lit materials + soft halos (sprites) ---------- */
  mat('glowA', { roughness: 0.3, emissive: 0xf2b23e, emissiveIntensity: 0.45 });
  mat('glowT', { roughness: 0.35, emissive: 0x2c9a8f, emissiveIntensity: 0.8 });
  mat('glass', { roughness: 0.15, transparent: true, opacity: 0.35 });
  mat('steam', { roughness: 1, transparent: true, opacity: 0.45 });
  var haloTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  })();
  var halos = [];
  function halo(colour, size, parent, x, y, z, base) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: haloTex, color: colour, transparent: true, depthWrite: false, opacity: base || 0.7 }));
    sp.scale.set(size, size, 1); sp.position.set(x, y, z); parent.add(sp);
    var h = { s: sp, size: size, base: base || 0.7 }; halos.push(h); return h;
  }
  function pulse(h, t, speed, amt) { var k = 1 + Math.sin(t * speed) * amt; h.s.scale.set(h.size * k, h.size * k, 1); h.s.material.opacity = h.base * (0.75 + 0.25 * k); }

  // a glowing amber rim around the platform
  var rimGlow = new T.Mesh(new T.TorusGeometry(R + 0.01, 0.022, 10, 180), M.amber);
  rimGlow.rotation.x = Math.PI / 2; rimGlow.position.y = 0.2; table.add(rimGlow);


  function person(m, h) {                          // a small figure on a round base
    var p = new T.Group();
    var base = mesh(new T.CylinderGeometry(0.22, 0.24, 0.05, 28), M.edge); base.position.y = 0.025; p.add(base);
    var body = mesh(new T.CylinderGeometry(0.1, 0.17, h || 0.42, 20), m); body.position.y = 0.05 + (h || 0.42) / 2; p.add(body);
    var shoulders = mesh(new T.SphereGeometry(0.1, 18, 12), m); shoulders.position.y = 0.05 + (h || 0.42); shoulders.scale.set(1, 0.55, 1); p.add(shoulders);
    var head = mesh(new T.SphereGeometry(0.13, 24, 18), m); head.position.y = 0.05 + (h || 0.42) + 0.17; p.add(head);
    p.userData.top = 0.05 + (h || 0.42) + 0.3;
    return p;
  }

  /* 1 · The right people: you, five vetted people, two connected by glowing threads */
  slot(0, function (g) {
    var you = mesh(new T.SphereGeometry(0.34, 48, 32), M.glowA); you.position.set(0, 0.34, 0.6); g.add(you);
    var youHalo = halo(0xf2b23e, 1.6, g, 0, 0.36, 0.6, 0.55);
    var ring = mesh(new T.TorusGeometry(0.48, 0.02, 10, 64), M.amber); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.03, 0.6); g.add(ring);
    var people = [], threads = [];
    var spots = [[-1.3, -0.15], [-0.7, -0.75], [0, -1.0], [0.7, -0.75], [1.3, -0.15]];
    spots.forEach(function (p, i) {
      var lit = i === 1 || i === 3;
      var f = person(lit ? M.glowT : (i === 2 ? M.ink : M.cream), 0.42);
      f.position.set(p[0], 0, p[1]); f.rotation.y = Math.atan2(-p[0], 0.6 - p[1]) * 0.6; g.add(f);
      var item = { g: f, lit: lit, ph: i * 0.9 };
      if (lit) {
        item.halo = halo(0x6cc2b8, 1.1, g, p[0], 0.62, p[1], 0.5);
        var check = mesh(new T.TorusGeometry(0.24, 0.025, 8, 40), M.glowT); check.position.set(p[0], 1.05, p[1]); check.rotation.x = Math.PI / 2; g.add(check);
        item.check = check;
        var a = new T.Vector3(0, 0.45, 0.6), b = new T.Vector3(p[0], 0.62, p[1]);
        var mid = a.clone().lerp(b, 0.5); mid.y += 0.8;
        var curve = new T.QuadraticBezierCurve3(a, mid, b);
        var tube = mesh(new T.TubeGeometry(curve, 48, 0.03, 8, false), M.glowT, false);
        g.add(tube);
        var sparks = [0, 1, 2].map(function (k) { var sp = new T.Mesh(new T.SphereGeometry(0.06, 12, 8), M.glowA); g.add(sp); return { m: sp, off: k / 3 }; });
        threads.push({ tube: tube, curve: curve, sparks: sparks });
      }
      people.push(item);
    });
    return {
      enter: function (t) { this.t0 = t; },
      tick: function (t) {
        var e = Math.min(1, (t - (this.t0 || 0)) / 0.9);
        people.forEach(function (p) {
          p.g.position.y = Math.max(0, Math.sin(t * 2 + p.ph)) * (p.lit ? 0.07 : 0.025);
          if (p.check) { p.check.rotation.z = t * 1.2; p.check.scale.setScalar(0.85 + Math.sin(t * 3 + p.ph) * 0.12); }
          if (p.halo) pulse(p.halo, t + p.ph, 3, 0.15);
        });
        threads.forEach(function (th) {
          th.tube.geometry.setDrawRange(0, Math.floor(th.tube.geometry.index.count * e / 6) * 6);
          th.sparks.forEach(function (sp) {
            var u = ((t * 0.45 + sp.off) % 1) * e;
            sp.m.position.copy(th.curve.getPoint(u)); sp.m.visible = e > 0.2;
          });
        });
        you.position.y = 0.34 + Math.abs(Math.sin(t * 2.4)) * 0.07; youHalo.s.position.y = you.position.y;
        pulse(youHalo, t, 2.4, 0.18);
        ring.scale.setScalar(1 + (t * 0.8 % 1) * 0.6); ring.material.opacity = 1;
      },
      rest: function () { threads.forEach(function (th) { th.tube.geometry.setDrawRange(0, Infinity); }); people.forEach(function (p) { p.g.position.y = 0; }); you.position.y = 0.34; ring.scale.setScalar(1); }
    };
  });

  /* 2 · Meetings and advice: a conversation at a small table, under a warm lamp */
  slot(1, function (g) {
    function bubble(w, h, tailLeft) {
      var s = new T.Shape(), r = 0.22, x = -w / 2, y = 0;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      var tail = new T.Shape(), tx = tailLeft ? x + 0.3 : x + w - 0.3;
      tail.moveTo(tx - 0.12, 0.05); tail.lineTo(tx + (tailLeft ? -0.18 : 0.18), -0.28); tail.lineTo(tx + 0.12, 0.05);
      var geo = new T.ExtrudeGeometry([s, tail], { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 10 });
      geo.translate(0, 0, -0.08); return geo;
    }
    var A = new T.Group(), B = new T.Group();
    A.add(mesh(bubble(1.5, 0.9, true), M.amber));
    [0.62, 0.44, 0.26].forEach(function (y, i) { var l = mesh(new T.BoxGeometry(i === 2 ? 0.6 : 1.0, 0.07, 0.03), M.ink, false); l.position.set(i === 2 ? -0.25 : -0.05, y, 0.13); A.add(l); });
    var spark = mesh(new T.OctahedronGeometry(0.11), M.glowA); spark.position.set(0.62, 0.95, 0.05); A.add(spark);
    B.add(mesh(bubble(1.15, 0.6, false), M.cream));
    var dots = [-0.25, 0, 0.25].map(function (x) { var d = mesh(new T.SphereGeometry(0.075, 16, 12), M.glowT, false); d.position.set(x, 0.3, 0.14); B.add(d); return d; });
    A.position.set(-0.6, 1.25, 0.15); A.rotation.y = 0.28;
    B.position.set(0.8, 0.55, 0.65); B.rotation.y = -0.32;
    g.add(A); g.add(B);
    // table, two chairs, two cups with steam
    var top = mesh(new T.CylinderGeometry(0.5, 0.5, 0.06, 48), M.ink); top.position.set(0.05, 0.42, -0.45); g.add(top);
    var leg = mesh(new T.CylinderGeometry(0.05, 0.08, 0.4, 12), M.ink); leg.position.set(0.05, 0.2, -0.45); g.add(leg);
    [-0.75, 0.85].forEach(function (x, i) {
      var ch = new T.Group();
      var seat = mesh(new T.BoxGeometry(0.42, 0.06, 0.42), i ? M.teal : M.amber); seat.position.y = 0.3; ch.add(seat);
      var back = mesh(new T.BoxGeometry(0.42, 0.42, 0.06), i ? M.teal : M.amber); back.position.set(0, 0.52, -0.18); ch.add(back);
      var stem = mesh(new T.CylinderGeometry(0.03, 0.03, 0.3, 8), M.ink); stem.position.y = 0.15; ch.add(stem);
      ch.position.set(x, 0, -0.45); ch.rotation.y = i ? -1.1 : 1.1; g.add(ch);
    });
    var steams = [];
    [[-0.12, -0.35], [0.22, -0.55]].forEach(function (c, i) {
      var cup = mesh(new T.CylinderGeometry(0.075, 0.06, 0.13, 20), M.cream); cup.position.set(c[0], 0.515, c[1]); g.add(cup);
      var hd = mesh(new T.TorusGeometry(0.04, 0.012, 6, 16), M.cream); hd.position.set(c[0] + 0.08, 0.52, c[1]); g.add(hd);
      for (var k = 0; k < 3; k++) { var st = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), M.steam); g.add(st); steams.push({ m: st, x: c[0], z: c[1], off: k / 3 + i * 0.17 }); }
    });
    // the lamp: a shade and a warm glowing bulb
    var lamp = new T.Group();
    var cord = mesh(new T.CylinderGeometry(0.01, 0.01, 0.9, 6), M.ink, false); cord.position.y = 0.45; lamp.add(cord);
    var shade = mesh(new T.ConeGeometry(0.28, 0.24, 32, 1, true), M.ink); shade.material = M.ink; lamp.add(shade);
    var bulb = mesh(new T.SphereGeometry(0.09, 20, 14), M.glowA, false); bulb.position.y = -0.1; lamp.add(bulb);
    lamp.position.set(0.05, 2.0, -0.45); g.add(lamp);
    var bulbHalo = halo(0xffd27a, 1.3, g, 0.05, 1.87, -0.45, 0.65);
    var pool = new T.Mesh(new T.CircleGeometry(0.9, 48), new T.MeshBasicMaterial({ map: haloTex, color: 0xffd27a, transparent: true, opacity: 0.35, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0.05, 0.02, -0.45); g.add(pool);
    return {
      enter: function (t) { this.t0 = t; },
      tick: function (t) {
        var e = Math.min(1, (t - (this.t0 || 0)) / 0.7), ease = 1 - Math.pow(1 - e, 3);
        A.position.y = 1.25 + Math.sin(t * 1.6) * 0.08; B.position.y = 0.55 + Math.sin(t * 1.6 + 1.6) * 0.08;
        A.scale.setScalar(0.5 + 0.5 * ease);
        B.scale.setScalar(Math.max(0.5, Math.min(1, 0.5 + 0.5 * ((t - (this.t0 || 0) - 0.25) / 0.7))));
        dots.forEach(function (d, i) { d.position.y = 0.3 + Math.max(0, Math.sin(t * 6 - i * 0.7)) * 0.08; });
        spark.rotation.y = t * 2; spark.rotation.x = t;
        steams.forEach(function (st) {
          var u = (t * 0.5 + st.off) % 1;
          st.m.position.set(st.x + Math.sin(u * 6 + st.off * 9) * 0.04, 0.6 + u * 0.55, st.z);
          st.m.scale.setScalar(0.6 + u * 1.2); st.m.material.opacity = 0.45;
          st.m.visible = true;
        });
        lamp.rotation.z = Math.sin(t * 0.9) * 0.04;
        pulse(bulbHalo, t, 1.3, 0.08);
      },
      rest: function () { A.position.y = 1.25; B.position.y = 0.55; A.scale.setScalar(1); B.scale.setScalar(1); }
    };
  });

  /* 3 · Formations: an amphitheatre facing a lit screen; ideas light up over heads */
  slot(2, function (g) {
    var seats = [];
    // seen from the back row: the rows step down toward the lit screen
    [[1.25, 0.5, 0.45, 5], [0.75, 0.32, 0.45, 5], [0.25, 0.14, 0.45, 4]].forEach(function (row, r) {
      var z = row[0], h = row[1], d = row[2], n = row[3], w = 2.3 - r * 0.2;
      var step = mesh(new T.BoxGeometry(w, h, d), M.edge); step.position.set(0, h / 2, z - 0.55); g.add(step);
      var edgeLine = mesh(new T.BoxGeometry(w, 0.025, 0.025), M.glowA, false); edgeLine.position.set(0, h + 0.005, z - 0.55 - d / 2); g.add(edgeLine);
      for (var i = 0; i < n; i++) {
        var f = person((i + r) % 3 === 0 ? M.teal : M.cream, 0.22);
        f.scale.setScalar(0.8);
        f.position.set(-w / 2 + 0.32 + i * ((w - 0.64) / (n - 1)), h, z - 0.55);
        f.rotation.y = Math.PI;                           // they face the screen (backs to us)
        g.add(f); seats.push({ m: f, y: h, k: seats.length });
      }
    });
    // ideas: glowing bulbs that pop over three heads
    var ideas = [1, 6, 11].map(function (k, i) {
      var s = seats[k], b = mesh(new T.SphereGeometry(0.09, 16, 12), M.glowA, false);
      b.position.set(s.m.position.x, s.y + 0.75, s.m.position.z); g.add(b);
      return { m: b, h: halo(0xf2b23e, 0.7, g, b.position.x, b.position.y, b.position.z, 0.6), y: b.position.y, d: 0.7 + i * 0.35 };
    });
    // the screen, lit, on a stand at the front
    var board = new T.Group();
    var frame = mesh(new T.BoxGeometry(1.3, 0.82, 0.08), M.ink); frame.position.y = 1.0; board.add(frame);
    var screen = mesh(new T.PlaneGeometry(1.16, 0.68), M.glowT, false); screen.position.set(0, 1.0, 0.045); board.add(screen);
    var bars = [0.6, 0.42, 0.24].map(function (w, i) { var b = mesh(new T.BoxGeometry(w, 0.06, 0.01), i ? M.cream : M.amber, false); b.position.set(-0.5 + w / 2 + 0.05, 1.18 - i * 0.16, 0.06); board.add(b); return b; });
    [-0.45, 0.45].forEach(function (x) { var l = mesh(new T.CylinderGeometry(0.03, 0.03, 0.62, 8), M.ink); l.position.set(x, 0.31, 0); board.add(l); });
    board.position.set(0, 0.15, -1.15); board.scale.setScalar(1.25); g.add(board);
    var screenHalo = halo(0x6cc2b8, 2.6, g, 0, 1.4, -1.05, 0.35);
    // a spotlight beam from above onto the screen
    var beam = new T.Mesh(new T.ConeGeometry(0.9, 1.6, 32, 1, true), new T.MeshBasicMaterial({ color: 0xffe7b0, transparent: true, opacity: 0.12, depthWrite: false, side: T.DoubleSide }));
    beam.position.set(0, 1.55, -0.85); g.add(beam);
    return {
      enter: function (t) { this.t0 = t; },
      tick: function (t) {
        var t0 = this.t0 || 0;
        seats.forEach(function (s) {
          var f = Math.min(1, Math.max(0, (t - t0 - s.k * 0.06) / 0.4));
          s.m.scale.setScalar(Math.max(0.001, f * 0.8));
          s.m.position.y = s.y + (f < 1 ? Math.sin(f * Math.PI) * 0.3 : 0);
        });
        ideas.forEach(function (id, i) {
          var f = Math.min(1, Math.max(0, (t - t0 - id.d) / 0.35));
          var bob = Math.sin(t * 2.5 + i) * 0.04;
          id.m.scale.setScalar(Math.max(0.001, f)); id.m.position.y = id.y + bob;
          id.h.s.position.y = id.y + bob; id.h.s.material.opacity = id.h.base * f * (0.8 + 0.2 * Math.sin(t * 4 + i));
        });
        bars.forEach(function (b, i) { b.scale.x = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.8 + i)); });
        beam.material.opacity = 0.1 + Math.sin(t * 1.5) * 0.03;
        pulse(screenHalo, t, 1.5, 0.06);
      },
      rest: function () { seats.forEach(function (s) { s.m.scale.setScalar(0.8); s.m.position.y = s.y; }); ideas.forEach(function (id) { id.m.scale.setScalar(1); }); }
    };
  });

  /* 4 · Investors and grants: detailed coins stacking, a signed grant, sparkles and a glowing arrow */
  slot(3, function (g) {
    var coinGeo = new T.CylinderGeometry(0.42, 0.42, 0.12, 56);
    var rimGeo = new T.TorusGeometry(0.4, 0.022, 8, 56);
    var faceGeo = new T.CylinderGeometry(0.28, 0.28, 0.125, 40);
    function coin() {
      var c = new T.Group();
      c.add(mesh(coinGeo, M.coin));
      var rimT = mesh(rimGeo, M.amber, false); rimT.rotation.x = Math.PI / 2; rimT.position.y = 0.06; c.add(rimT);
      var face = mesh(faceGeo, M.amber, false); c.add(face);
      return c;
    }
    var stacks = [[-0.6, 0.3, 7], [0.55, 0.2, 4], [0.0, -0.7, 10]], coins = [];
    stacks.forEach(function (st, si) {
      for (var i = 0; i < st[2]; i++) {
        var c = coin(), y = 0.06 + i * 0.13;
        c.position.set(st[0] + (i % 2 ? 0.02 : -0.015), y, st[1]); c.rotation.y = i * 0.7;
        var item = { m: c, y: y, k: si * 0.32 + i * 0.1 };
        if (i === 0) {
          var rg = new T.Mesh(new T.RingGeometry(0.44, 0.5, 48), new T.MeshBasicMaterial({ color: 0xf2b23e, transparent: true, opacity: 0, depthWrite: false }));
          rg.rotation.x = -Math.PI / 2; rg.position.set(st[0], 0.012, st[1]); rg.visible = false; g.add(rg); item.ring = rg;
        }
        g.add(c); coins.push(item);
      }
    });
    // the top coin of the tall stack stands up and spins, with a € on it
    var hero = coin(); hero.rotation.x = Math.PI / 2; hero.position.set(0, 1.85, -0.7); g.add(hero);
    var euro = (function () {
      var s = new T.Shape(); s.absarc(0, 0, 0.16, 0.6, Math.PI * 2 - 0.6, false); s.absarc(0, 0, 0.1, Math.PI * 2 - 0.6, 0.6, true);
      var e = new T.Mesh(new T.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false, curveSegments: 20 }), M.ink);
      var bar1 = new T.Mesh(new T.BoxGeometry(0.22, 0.03, 0.03), M.ink); bar1.position.set(-0.05, 0.03, 0.015); e.add(bar1);
      var bar2 = bar1.clone(); bar2.position.y = -0.03; e.add(bar2);
      return e;
    })();
    euro.position.set(0, 0.065, 0); euro.rotation.x = -Math.PI / 2; hero.add(euro);
    var euro2 = euro.clone(); euro2.position.y = -0.065; euro2.rotation.x = Math.PI / 2; euro2.rotation.z = Math.PI; hero.add(euro2);
    var heroHalo = halo(0xf2b23e, 1.6, g, 0, 1.85, -0.7, 0.5);
    // the grant: a paper with lines and a teal seal
    var doc = new T.Group();
    var paper = mesh(new T.BoxGeometry(0.8, 0.02, 1.0), M.cream); doc.add(paper);
    [0.3, 0.15, 0, -0.15].forEach(function (z, i) { var l = mesh(new T.BoxGeometry(i === 3 ? 0.3 : 0.55, 0.01, 0.05), M.ink, false); l.position.set(i === 3 ? -0.08 : 0.02, 0.016, -z); doc.add(l); });
    var seal = mesh(new T.CylinderGeometry(0.11, 0.11, 0.04, 24), M.glowT); seal.position.set(0.22, 0.03, 0.32); doc.add(seal);
    doc.position.set(1.15, 0.03, 0.85); doc.rotation.y = -0.4; g.add(doc);
    // the arrow: growth, glowing
    var arrow = new T.Group();
    var shaft = mesh(new T.CylinderGeometry(0.06, 0.06, 0.9, 12), M.glowT); shaft.position.y = 0.45; arrow.add(shaft);
    var tip = mesh(new T.ConeGeometry(0.18, 0.32, 24), M.glowT); tip.position.y = 1.06; arrow.add(tip);
    arrow.position.set(-1.2, 0.05, -0.4); arrow.rotation.z = -0.25; g.add(arrow);
    var tipHalo = halo(0x6cc2b8, 0.9, g, -0.95, 1.1, -0.4, 0.5);
    // sparkles twinkling around the money
    var sparkles = [];
    for (var k = 0; k < 4; k++) {
      var sp = new T.Mesh(new T.OctahedronGeometry(0.04), M.glowA);
      sp.position.set(-1 + Math.random() * 2, 0.5 + Math.random() * 1.8, -1 + Math.random() * 1.6);
      sp.scale.y = 1.8; g.add(sp); sparkles.push({ m: sp, ph: Math.random() * 6 });
    }
    return {
      enter: function (t) { this.t0 = t; },
      tick: function (t) {
        var t0 = this.t0 || 0, e = t - t0;
        // coins: real gravity (accelerating fall), one small settle, a tilt that steadies, and a soft ring on impact
        coins.forEach(function (c, i) {
          var u = e - c.k, FALL = 0.42;
          c.m.visible = u >= 0;
          if (u < 0) return;
          var y;
          if (u < FALL) { var f = u / FALL; y = c.y + (1 - f * f) * 2.6; }
          else { var s = u - FALL; y = c.y + Math.abs(Math.sin(s * 14)) * 0.05 * Math.exp(-s * 9); }
          c.m.position.y = y;
          var tilt = u < FALL ? 0.25 * (1 - u / FALL) : Math.sin((u - FALL) * 18) * 0.06 * Math.exp(-(u - FALL) * 7);
          c.m.rotation.x = tilt * (i % 2 ? 1 : -1); c.m.rotation.z = tilt * 0.6;
          if (c.ring) {
            var r = u - FALL, on = r > 0 && r < 0.5;
            c.ring.visible = on;
            if (on) { c.ring.scale.setScalar(1 + r * 1.6); c.ring.material.opacity = 0.35 * (1 - r / 0.5); }
          }
        });
        // the € medallion: rises out of the stack once the last coin has settled, then turns slowly
        var fh = Math.min(1, Math.max(0, (e - 2.25) / 1.1)), ease = 1 - Math.pow(1 - fh, 4);
        hero.visible = fh > 0;
        hero.scale.setScalar(Math.max(0.001, 0.82 + 0.18 * ease));
        hero.position.y = 1.32 + 0.53 * ease + Math.sin(t * 1.1) * 0.05 * ease;
        hero.rotation.z = 0.35 + (t - t0) * 0.55 * ease;
        heroHalo.s.position.y = hero.position.y; pulse(heroHalo, t, 1.1, 0.06); heroHalo.s.material.opacity *= ease * ease;
        var fa = Math.min(1, Math.max(0, (e - 1.2) / 0.7)), ea = 1 - Math.pow(1 - fa, 3);
        arrow.scale.set(1, Math.max(0.001, ea), 1); tipHalo.s.material.opacity = 0.4 * ea;
        var fs = Math.min(1, Math.max(0, (e - 3.0) / 0.8));
        sparkles.forEach(function (sp) { var v = Math.max(0, Math.sin(t * 1.1 + sp.ph)) * fs * 0.8; sp.m.scale.set(Math.max(0.001, v), Math.max(0.001, v * 1.8), Math.max(0.001, v)); sp.m.rotation.y = t * 0.6; });
      },
      rest: function () { coins.forEach(function (c) { c.m.position.y = c.y; c.m.visible = true; c.m.rotation.x = c.m.rotation.z = 0; if (c.ring) c.ring.visible = false; }); arrow.scale.setScalar(1); hero.scale.setScalar(1); hero.visible = true; hero.position.y = 1.85; }
    };
  });

  paint();
  new MutationObserver(function () { readColours(); paint(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- size ---------- */
  function size() {
    var r = cv.parentNode.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    var narrow = w / h < 1.05;
    cam.fov = narrow ? 30 : 27;
    // pull back until the whole platform fits the width, with a margin on both sides
    var base = new T.Vector3(0, narrow ? 5.6 : 5.0, narrow ? 13.4 : 11.8);
    var dir = base.clone().sub(LOOK), dist = dir.length(); dir.normalize();
    var hHalf = Math.atan(Math.tan(T.MathUtils.degToRad(cam.fov / 2)) * cam.aspect);
    var need = (R * 1.04) / Math.tan(hHalf) + 0.4;
    cam.position.copy(LOOK).add(dir.multiplyScalar(Math.max(dist, need)));
    cam.updateProjectionMatrix();
    cam.lookAt(LOOK);
    need = true;
  }

  /* ---------- scroll: which track is being read ---------- */
  var target = 0, cur = 0, active = -1, need = true;
  function smooth(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
  // the reading line: middle of the screen, or (phone) middle of the space below the sticky 3D scene
  var stage = wrap.querySelector('.ofr-stage');
  function refLine() {
    var b = stage.getBoundingClientRect().bottom;
    return window.matchMedia('(min-width: 1000px)').matches ? innerHeight * 0.5 : b + (innerHeight - b) * 0.42;
  }
  function measure() {
    var mid = refLine(), cs = items.map(function (el) { var r = el.getBoundingClientRect(); return r.top + r.height / 2; });
    var p;
    if (mid <= cs[0]) p = 0;
    else if (mid >= cs[cs.length - 1]) p = cs.length - 1;
    else for (var i = 0; i < cs.length - 1; i++) if (mid >= cs[i] && mid < cs[i + 1]) { p = i + smooth(((mid - cs[i]) / (cs[i + 1] - cs[i]) - 0.3) / 0.4); break; }
    target = p;
    var a = Math.round(p);
    if (a !== active) setActive(a);
  }
  var clock = 0;
  function setActive(a) {
    if (objs[active] && objs[active].rest) objs[active].rest();
    active = a;
    items.forEach(function (el, i) { el.classList.toggle('on', i === a); });
    if (objs[a] && objs[a].enter && !reduce.matches) objs[a].enter(clock);
    need = true;
  }
  items.forEach(function (el, i) {
    el.addEventListener('click', function () {
      if (i === active) return;
      var r = el.getBoundingClientRect();
      window.scrollTo({ top: scrollY + r.top + r.height / 2 - refLine(), behavior: reduce.matches ? 'auto' : 'smooth' });
    });
  });

  /* ---------- pointer: the scene leans a touch toward the pointer (desktop) ---------- */
  var px = 0, py = 0, tpx = 0, tpy = 0;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  wrap.addEventListener('pointermove', function (e) {
    if (!fine.matches || reduce.matches) return;
    var r = cv.getBoundingClientRect();
    tpx = ((e.clientX - r.left) / r.width - 0.5); tpy = ((e.clientY - r.top) / r.height - 0.5);
  });
  wrap.addEventListener('pointerleave', function () { tpx = tpy = 0; });

  /* ---------- loop (only while on screen) ---------- */
  var running = false, last = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; clock += dt;
    var k = reduce.matches ? 1 : 1 - Math.pow(0.0009, dt);         // frame-rate independent ease
    cur += (target - cur) * k;
    px += (tpx - px) * k; py += (tpy - py) * k;
    table.rotation.y = -cur * Math.PI / 2 + Math.sin(clock * 0.4) * (reduce.matches ? 0 : 0.03);
    table.position.y = reduce.matches ? 0 : Math.sin(clock * 0.9) * 0.05;
    scene.rotation.x = py * 0.06; scene.rotation.z = -px * 0.03;
    // only the object at the front stands; the others sink into the platform as it turns
    objs.forEach(function (o, i) {
      var d = Math.abs(cur - i), s = Math.max(0, Math.min(1, 1 - (d - 0.12) * 1.8));
      s = s * s * (3 - 2 * s);
      o.g.scale.setScalar(Math.max(0.001, s * BIG));
      o.g.visible = s > 0.01;
    });
    if (!reduce.matches && objs[active] && objs[active].tick) objs[active].tick(clock);
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }
  function stop() { running = false; }

  size(); measure();
  if (objs[active] && objs[active].rest) objs[active].rest();
  cur = target;
  renderer.render(scene, cam);
  window.addEventListener('resize', function () { size(); measure(); });
  window.addEventListener('scroll', measure, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { rootMargin: '100px 0px' }).observe(wrap);
  } else start();
})();
