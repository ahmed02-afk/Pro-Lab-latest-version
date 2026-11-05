/* GrowLab · welcome gate + personalisation.
   First visit: a full-screen gate asks 4 things (style, who, need, name). Answers stay in this browser
   (localStorage "growlab-profile") and shape the page: greeting, matching cards first, fitting people,
   and the Growth Check form for that profession.
   The idea: the period of "growlab." is the visitor's ball. It drops out of the logo, carries them
   through the steps, and flies back into the header logo when the gate opens onto the site.
   Without JS the gate never shows (theme.js only flags it when JS runs). */
(function () {
  'use strict';
  var root = document.documentElement;
  var gate = document.getElementById('gate');
  var ball = document.querySelector('.gate-ball');
  if (!gate || !ball) return;
  window.GL_gateReady = true;

  var KEY = 'growlab-profile';
  var ROLE = { founder: 'Founder-led business', local: 'Established organization', institution: 'Innovation support', tech: 'CIO-led IT team' };
  var NEED = { problem: 'Find the real problem', people: 'Build the right team', grow: 'Help people work better together', ai: 'Lead change and bring in AI' };
  // the hero line speaks to each kind of client (Hamed's messages); no answer: the default line in the HTML
  var MSG = {
    founder: 'Build a team that <span class="hl">grows beyond you</span>.',
    local: 'Help good people <span class="hl">work better together</span>.',
    institution: 'Support the <span class="hl">people behind the ventures</span>.',
    tech: 'Help your people <span class="hl">deliver your transformation</span>.'
  };
  var heroLead = document.querySelector('.hero .lead'), heroMsg = document.querySelector('.hero [data-msg]');
  // older answers from before the lists were merged
  var OLD_ROLE = { shop: 'founder', creator: 'founder' };
  var TITLES = ['Pick your style', 'Who are you?', 'What do you need most right now?', 'What should we call you?'];
  var E_OUT = 'cubic-bezier(.23,1,.32,1)', E_IO = 'cubic-bezier(.77,0,.175,1)';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var steps = [].slice.call(gate.querySelectorAll('.gs'));
  var dots = [].slice.call(gate.querySelectorAll('.gate-dots i'));
  var logo = gate.querySelector('.gate-logo');
  var back = gate.querySelector('[data-g="back"]');
  var live = gate.querySelector('[data-glive]');
  var nameIn = gate.querySelector('input[name="gate-name"]');
  var cur = -1, respawn = false, ballFade = null, isOpen = false, editing = false, busy = false, draft = {}, bx = -100, by = -100, spin = 0;

  function load() {
    var p; try { p = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
    if (p && OLD_ROLE[p.role]) p.role = OLD_ROLE[p.role];
    if (p && p.need === 'moving') p.need = 'problem';
    return p;
  }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function motion() { return !reduce.matches; }
  function T(x, y, s) { return 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + s + ')'; }
  function mid(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  // where the period sits inside a "growlab." logo box (measured from the font, see _tools/make-logo.py)
  function periodOf(el) {
    var r = el.getBoundingClientRect();
    return [r.left + r.width * 0.9762, r.top + r.height * 0.6773, r.width * 0.0426 / 16];
  }

  /* ---------- the ball ---------- */
  function placeBall(x, y, s, instant) {
    if (instant) ball.classList.add('snap');
    if (Math.abs(x - bx) > 0.5) { spin += (x >= bx ? 1 : -1) * Math.hypot(x - bx, y - by) * 1.8; }
    ball.style.setProperty('--spin', Math.round(spin) + 'deg');
    ball.style.setProperty('--bx', x + 'px');
    ball.style.setProperty('--by', y + 'px');
    ball.style.setProperty('--bs', s);
    bx = x; by = y;
    if (instant) { void ball.offsetWidth; ball.classList.remove('snap'); }
  }
  function ballToDot(i, instant) { var c = mid(dots[i]); placeBall(c[0], c[1], 1, instant || !motion()); }

  /* ---------- steps ---------- */
  function parts(step) { return [].slice.call(step.querySelectorAll('.gs-t,.gs-q,.gopt,.gs-name,.gate-next,.gs-fine')); }

  function enter(step) {
    parts(step).forEach(function (el, i) {
      if (!motion()) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, fill: 'backwards' }); return; }
      var title = i === 0;
      el.animate([
        { opacity: 0, transform: title ? 'translateY(34px)' : 'translateY(22px) scale(.97)' },
        { opacity: 1, transform: 'none' }
      ], { duration: title ? 700 : 560, delay: 60 + i * 50, easing: E_OUT, fill: 'backwards' });
    });
  }
  function leave(step) {
    if (!motion()) return Promise.resolve();
    var anims = parts(step).map(function (el, i) {
      return el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-14px)' }],
        { duration: 200, delay: i * 18, easing: E_OUT, fill: 'forwards' });
    });
    return Promise.all(anims.map(function (a) { return a.finished; })).then(function () {
      anims.forEach(function (a) { a.cancel(); });
    });
  }

  function show(n, animate) {
    cur = n;
    steps.forEach(function (s, i) {
      var on = i === n;
      s.classList.toggle('on', on);
      s.inert = !on;
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    gate.setAttribute('aria-labelledby', 'gate-t' + n);
    gate.style.setProperty('--rot', (n * -120) + 'deg');       // the backdrop triangle turns one corner per step
    back.hidden = n === 0;
    if (respawn) { respawn = false; spawnAtDot(n); } else { if (ballFade) { ballFade.cancel(); ballFade = null; } ball.style.opacity = ''; ballToDot(n); }
    live.textContent = 'Step ' + (n + 1) + ' of 4. ' + TITLES[n];
    if (animate) enter(steps[n]);
    // focus the question (read out, no ring); on the name step, the field itself
    var f = n === 3 ? nameIn : steps[n].querySelector('h2');
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, animate && motion() ? 350 : 0);
    if (n === 3) sizeName();
  }

  function go(n) {
    if (n === cur || n < 0 || n > 3) return;
    busy = true;
    var from = steps[cur];
    leave(from).then(function () { show(n, true); busy = false; });
  }

  /* ---------- choices ---------- */
  function press(group, btn) {
    group.querySelectorAll('.gopt').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
  }

  function pickTheme(btn) {
    var t = btn.dataset.v;
    press(btn.parentNode, btn);
    draft.theme = t;
    if (t === window.GL_theme.get()) return;
    var c = mid(btn.querySelector('.mini'));
    if (!document.startViewTransition || !motion()) { window.GL_theme.set(t, true); return; }
    // the new style spreads from the card you picked
    var vt = document.startViewTransition(function () { window.GL_theme.set(t, true); });
    vt.ready.then(function () {
      var r = Math.hypot(Math.max(c[0], innerWidth - c[0]), Math.max(c[1], innerHeight - c[1]));
      root.animate({ clipPath: ['circle(0px at ' + c[0] + 'px ' + c[1] + 'px)', 'circle(' + r + 'px at ' + c[0] + 'px ' + c[1] + 'px)'] },
        { duration: 600, easing: E_OUT, pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  }

  function pickCard(btn, key) {
    if (busy) return;
    busy = true;
    press(btn.parentNode, btn);
    draft[key] = btn.dataset.v;
    var r = btn.getBoundingClientRect();
    placeBall(r.right - 20, r.top + 20, 1, !motion());      // the ball lands on your answer...
    respawn = true;
    if (!motion()) { ball.style.opacity = '0'; setTimeout(function () { busy = false; go(cur + 1); }, 120); return; }
    setTimeout(function () {                                // ...and stays there: it fades out on the card
      ballFade = ball.animate([{ opacity: 1, transform: getComputedStyle(ball).transform },
                               { opacity: 0, transform: getComputedStyle(ball).transform + ' scale(.6)' }],
        { duration: 300, easing: 'ease', fill: 'forwards' });
    }, 820);                                                // lands (~700ms), rests a beat, then fades
    setTimeout(function () { busy = false; go(cur + 1); }, 1020);
  }

  // a new ball appears at the next dot (no roll back from the card)
  function spawnAtDot(n) {
    if (ballFade) { ballFade.cancel(); ballFade = null; }
    ball.style.opacity = '';
    ballToDot(n, true);
    if (motion()) {
      var c = mid(dots[n]);
      ball.animate([{ opacity: 0, transform: T(c[0], c[1], 0.4) }, { opacity: 1, transform: T(c[0], c[1], 1.15), offset: 0.7 }, { opacity: 1, transform: T(c[0], c[1], 1) }],
        { duration: 420, delay: 120, easing: E_OUT, fill: 'backwards' });
    }
  }

  function sizeName() {
    var m = nameIn.parentNode.querySelector('.gs-mirror');
    if (!m) { m = document.createElement('span'); m.className = 'gs-mirror'; m.setAttribute('aria-hidden', 'true'); nameIn.parentNode.appendChild(m); }
    m.textContent = nameIn.value || nameIn.placeholder;
    nameIn.style.width = Math.ceil(m.getBoundingClientRect().width + 8) + 'px';
  }

  gate.addEventListener('click', function (e) {
    if (!isOpen) return;
    var opt = e.target.closest('.gopt');
    if (opt) {
      if (opt.classList.contains('gth')) pickTheme(opt);
      else pickCard(opt, cur === 1 ? 'role' : 'need');
      return;
    }
    var g = e.target.closest('[data-g]');
    if (!g || busy) return;
    var a = g.dataset.g;
    if (a === 'next') { draft.theme = window.GL_theme.get(); go(1); }
    if (a === 'back') go(cur - 1);
    if (a === 'skip') skip();
    if (a === 'enter') finish();
  });
  nameIn.addEventListener('input', sizeName);
  nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); finish(); } });
  window.addEventListener('resize', function () { if (isOpen && cur >= 0) ballToDot(cur, true); });

  /* ---------- open / close ---------- */
  function setInert(on) {
    [].forEach.call(document.body.children, function (el) {
      if (el !== gate && el !== ball && el.tagName !== 'SCRIPT') el.inert = on;
    });
  }

  function openGate(edit) {
    editing = edit;
    var p = load() || {};
    draft = { theme: window.GL_theme.get(), role: p.role || null, need: p.need || null };
    steps.forEach(function (s) {
      s.querySelectorAll('.gopt').forEach(function (b) {
        var v = b.dataset.v;
        b.setAttribute('aria-pressed', (v === draft.theme || v === draft.role || v === draft.need) ? 'true' : 'false');
      });
    });
    nameIn.value = editing ? (p.name || '') : '';
    isOpen = true;
    root.classList.add('gate-on');
    setInert(true);
    gate.scrollTop = 0;

    if (editing) {
      // the period leaves the header logo and comes back to the gate
      var hp = periodOf(document.querySelector('.hd .logo'));
      placeBall(hp[0], hp[1], hp[2], true);
      if (motion()) gate.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: E_OUT });
      cur = -1;
      show(0, true);
      return;
    }
    intro();
  }

  function intro() {
    if (!motion()) { show(0, true); return; }
    // 1. the logo writes on  2. its period appears  3. the period drops out and rolls to the first dot
    logo.animate([{ clipPath: 'inset(-20% 100% -20% 0)' }, { clipPath: 'inset(-20% 0% -20% 0)' }],
      { duration: 800, easing: E_OUT, fill: 'backwards' });
    var p = periodOf(logo), d = mid(dots[0]);
    placeBall(p[0], p[1], p[2], true);
    ball.animate([{ opacity: 0, transform: T(p[0], p[1], p[2] * 0.5) }, { opacity: 1, transform: T(p[0], p[1], p[2]) }],
      { duration: 260, delay: 640, easing: E_OUT, fill: 'backwards' });
    spin += 540;
    var fall = ball.animate([
      { transform: T(p[0], p[1], p[2]), easing: E_OUT },
      { transform: T(p[0] + 6, p[1] - 22, p[2] * 1.5), offset: 0.16, easing: 'cubic-bezier(.55,0,.85,.35)' },  // hop off the logo
      { transform: T(d[0], d[1], 1), offset: 0.62, easing: E_OUT },                                            // fall (gravity)
      { transform: T(d[0], d[1] - 18, 1), offset: 0.78, easing: 'cubic-bezier(.55,0,.85,.35)' },             // one bounce
      { transform: T(d[0], d[1], 1) }
    ], { duration: 1150, delay: 980, fill: 'forwards' });
    setTimeout(function () { ball.style.setProperty('--spin', spin + 'deg'); }, 1150);
    fall.finished.then(function () { placeBall(d[0], d[1], 1, true); fall.cancel(); }).catch(function () {});
    setTimeout(function () { show(0, true); }, 1250);
  }

  function close() {
    isOpen = false;
    var done = function () {
      root.classList.remove('gate-on');
      setInert(false);
      gate.style.clipPath = '';
      gate.style.opacity = '';
      ball.classList.remove('flying');
      root.classList.remove('tb-wait');
      if (!editing) window.scrollTo(0, 0);
      greet();
    };
    if (!motion()) {
      gate.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: E_OUT }).finished.then(done);
      return;
    }
    ball.classList.add('flying');
    root.classList.add('tb-wait');            // the hero's own ball waits until this one has landed
    var fade = parts(steps[cur]).concat([].slice.call(gate.querySelectorAll('.gate-top,.gate-dots')));
    fade.forEach(function (el) { el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: E_OUT, fill: 'forwards' }); });
    // the gate closes into the ball...
    var R = Math.hypot(Math.max(bx, innerWidth - bx), Math.max(by, innerHeight - by));
    var shut = gate.animate({ clipPath: ['circle(' + R + 'px at ' + bx + 'px ' + by + 'px)', 'circle(0px at ' + bx + 'px ' + by + 'px)'] },
      { duration: 850, delay: 160, easing: E_IO, fill: 'forwards' });
    shut.finished.then(function () {
      gate.style.opacity = '0';
      shut.cancel();
      fade.forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); });
      root.classList.remove('gate-on');
      setInert(false);
      if (!editing) window.scrollTo(0, 0);
      // ...and the ball flies home: into the hero headline as the period of "traction."
      // (when editing from further down the page, back into the header logo instead)
      var hp;
      if (!editing && window.GL_heroDot) { var d = window.GL_heroDot(); hp = [d.x, d.y, d.d / 16]; }
      else hp = periodOf(document.querySelector('.hd .logo'));
      placeBall(hp[0], hp[1], hp[2], false);
      setTimeout(function () {
        ball.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: E_OUT, fill: 'forwards' }).finished.then(function (a) {
          ball.getAnimations().forEach(function (x) { x.cancel(); });
          done();
        });
      }, 720);
    });
  }

  function greet() {
    var h = document.querySelector('[data-hello]');
    if (!h || h.hidden || !motion()) return;
    h.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: E_OUT });
  }

  function finish() {
    var name = nameIn.value.replace(/\s+/g, ' ').trim().slice(0, 40);
    var p = { v: 1, done: true, theme: window.GL_theme.get(), role: draft.role || null, need: draft.need || null, name: name || null };
    save(p);
    apply(p);
    close();
  }
  function skip() {
    var p = load() || { v: 1 };
    p.theme = window.GL_theme.get();
    if (!p.done) p.skipped = true;
    save(p);
    apply(p);
    close();
  }

  /* ---------- the page, shaped by the answers ---------- */
  function highlight(sel, attr, val) {
    var els = [].slice.call(document.querySelectorAll(sel));
    els.forEach(function (el, i) { if (el.dataset.o == null) el.dataset.o = [].indexOf.call(el.parentNode.children, el); });
    els.forEach(function (el) {
      var on = !!val && el.dataset[attr] === val;
      el.classList.toggle('is-you', on);
    });
    // restore the original order, then move the match to the front of its grid
    var parent = els.length && els[0].parentNode;
    if (!parent || parent.classList.contains('face')) return;   // the flip deck (js/paths.js) orders its own cards
    [].slice.call(parent.children).sort(function (a, b) { return a.dataset.o - b.dataset.o; }).forEach(function (el) { parent.appendChild(el); });
    var hit = els.filter(function (el) { return el.classList.contains('is-you'); })[0];
    if (hit) parent.insertBefore(hit, parent.firstChild);
  }

  var form = document.querySelector('#start form');
  function showRx() {
    if (!form) return;
    var role = form.elements.role.value;
    form.querySelectorAll('.rx').forEach(function (rx) {
      var on = rx.dataset.rx === role;
      rx.hidden = !on;
      rx.querySelectorAll('input,select').forEach(function (f) { f.disabled = !on; });
    });
  }
  if (form) {
    form.elements.role.addEventListener('change', showRx);
    /* Sending: one button. Every Growth Check is
       1 · saved to the GrowLab Google Sheet (data-sheet on the form = the Apps Script web-app URL), always,
           so nothing is lost even if the visitor never presses send in WhatsApp or has no WhatsApp;
       2 · opened in WhatsApp to Hamed with the message already written.
       The email or phone in "Reach me at" can be either. */
    var WA = '21653595585';
    var sent = form.querySelector('[data-sent]'), row = form.querySelector('.sendrow'), note = form.querySelector('[data-send-note]');
    function txt(sel) { var o = sel.options[sel.selectedIndex]; return sel.value ? o.textContent.trim() : ''; }
    function message() {
      var f = form.elements, org = f.organization.value.trim();
      var m = 'Hi Hamed, I’m ' + f.name.value.trim() + (org ? ' from ' + org : '') + '. We’re ' + txt(f.role) + ' and we need to ' + txt(f.need) + '. Reach me at ' + f.contact.value.trim() + '.';
      if (f.note.value.trim()) m += '\n\n' + f.note.value.trim();
      return m;
    }
    function save() {
      var url = form.dataset.sheet;
      if (!url) return;
      var f = form.elements, body = new URLSearchParams({
        name: f.name.value.trim(), organization: f.organization.value.trim(), type: txt(f.role), need: txt(f.need),
        contact: f.contact.value.trim(), note: f.note.value.trim(), page: location.href.split('#')[0]
      });
      try { fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, body: body }).catch(function () {}); } catch (e) {}
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ['name', 'organization', 'contact'].forEach(function (n) { check(form.elements[n], false); });
      if (!form.checkValidity()) {
        var bad = form.querySelector('.ml-f :invalid');
        if (bad) {
          bad.closest('.ml-f').classList.add('miss');
          err.textContent = bad.tagName === 'SELECT' ? 'Please choose an option in the sentence.' : bad.validationMessage;
          err.hidden = false;
          bad.focus();
        }
        return;
      }
      err.hidden = true;
      var link = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message());
      save();                                         // to the sheet, whatever happens next
      window.open(link, '_blank', 'noopener');        // straight to Hamed's WhatsApp (opened inside the click, so it is never blocked)
      form.querySelector('[data-send-wa]').href = link;
      row.hidden = true; if (note) note.hidden = true; sent.hidden = false;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) sent.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.23,1,.32,1)' });
      sent.focus({ preventScroll: true });
    });
    /* real answers only: a name with letters, and a contact that is a real email or a real phone number */
    var err = form.querySelector('[data-ml-err]');
    var RULES = {
      name: function (v) { return /\p{L}.*\p{L}/u.test(v) && v.length <= 60 ? '' : 'Please write your name.'; },
      organization: function (v) { return !v || (/\p{L}|\d/u.test(v) && v.length >= 2) ? '' : 'Please check your organization’s name.'; },
      contact: function (v) {
        if (!v) return 'Please add your email or WhatsApp number.';
        if (v.indexOf('@') > -1) {
          return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(v) && !/\.\./.test(v) ? '' : 'This email doesn’t look right. Example: name@company.com';
        }
        if (!/^[+\d\s().\-\/]+$/.test(v)) return 'Please enter a real email or phone number.';
        var d = v.replace(/\D/g, ''), intl = /^\s*(\+|00)/.test(v);
        if (/^00/.test(d)) d = d.slice(2);
        if (d.length < 8) return 'This number is too short. Example: 53 595 585, or +33 6 12 34 56 78 outside Tunisia.';
        if (/^(\d)\1+$/.test(d)) return 'Please enter a real phone number.';
        if (!intl && d.length === 8) return /^[2-9]/.test(d) ? '' : 'This Tunisian number doesn’t look right. Example: 53 595 585';
        if (!intl && /^216\d{8}$/.test(d)) return '';
        if (d.length >= 9 && d.length <= 15) return '';
        return 'This number is too ' + (d.length < 8 ? 'short' : 'long') + '. Add the country code if you’re outside Tunisia, for example +33 6 12 34 56 78.';
      }
    };
    function check(el, show) {
      var rule = RULES[el.name];
      if (!rule) return true;
      var msg = rule(el.value.trim());
      el.setCustomValidity(msg && (el.required || el.value.trim()) ? msg : '');
      var bad = !el.validity.valid;
      if (show) {
        el.closest('.ml-f').classList.toggle('miss', bad);
        err.textContent = bad ? el.validationMessage : '';
        err.hidden = !bad;
      }
      return !bad;
    }
    ['name', 'organization', 'contact'].forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener('input', function () { check(el, el.closest('.ml-f').classList.contains('miss')); });
      el.addEventListener('blur', function () { if (el.value.trim()) check(el, true); });
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.ml-f');
      if (f && e.target.tagName === 'SELECT') { f.classList.remove('miss'); if (!form.querySelector('.ml-f.miss')) err.hidden = true; }
    });
    form.querySelector('[data-send-edit]').addEventListener('click', function () { sent.hidden = true; row.hidden = false; if (note) note.hidden = false; form.elements.name.focus(); });
  }

  function apply(p) {
    p = p || {};
    var name = (p.name || '').replace(/(^|[\s-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });   // ahmed -> Ahmed
    var hello = name ? 'Welcome, ' + name + '.' : '';
    ['[data-hello]', '[data-hello-form]'].forEach(function (s) {
      var el = document.querySelector(s);
      if (el) { el.textContent = hello; el.hidden = !hello; }
    });
    // their message sits on top, the promise line stays under it
    if (heroMsg) { heroMsg.innerHTML = MSG[p.role] || ''; heroMsg.hidden = !MSG[p.role]; }
    if (heroLead) heroLead.classList.toggle('lead-q', !!MSG[p.role]);
    highlight('.cd[data-role]', 'role', p.role);
    highlight('.cd[data-need]', 'need', p.need);
    document.querySelectorAll('.pp[data-fit]').forEach(function (el) {
      el.classList.toggle('is-you', !!p.role && el.dataset.fit.split(' ').indexOf(p.role) > -1);
    });
    if (form) {
      if (name && !form.elements.name.value) form.elements.name.value = name;
      if (p.role) form.elements.role.value = p.role;
      if (p.need && !form.elements.need.value) form.elements.need.value = p.need;
      showRx();
    }
    var me = document.querySelector('[data-me]');
    if (me) {
      var bits = [name, ROLE[p.role], p.theme === 'dark' ? 'Dark' : p.theme === 'light' ? 'Light' : ''].filter(Boolean);
      me.querySelector('[data-me-text]').textContent = bits.length ? 'You: ' + bits.join(' · ') : 'Make this page yours';
      me.hidden = false;
    }
    window.dispatchEvent(new CustomEvent('growlab:profile', { detail: p }));
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-g="edit"]')) openGate(true);
  });

  apply(load());
  if (root.classList.contains('gate-on')) openGate(false);
})();
