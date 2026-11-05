/* GrowLab - theme + first-visit gate flag. Loaded in <head> so the right theme and the gate paint first.
   No JS: the page follows the system setting through CSS alone, and the gate never shows. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var KEY = 'growlab-theme', mq = window.matchMedia('(prefers-color-scheme: dark)');
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) {
    root.setAttribute('data-theme', t);
    var m = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < m.length; i++) m[i].setAttribute('content', t === 'dark' ? '#0c1719' : '#ffffff');
  }
  apply(saved() || (mq.matches ? 'dark' : 'light'));
  if (mq.addEventListener) mq.addEventListener('change', function (e) { if (!saved()) apply(e.matches ? 'dark' : 'light'); });

  // Used by the welcome gate (js/welcome.js).
  window.GL_theme = {
    get: function () { return root.getAttribute('data-theme'); },
    set: function (t, remember) {
      apply(t);
      if (remember) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    }
  };

  // First visit: no saved profile -> show the gate before the page paints.
  // ?intro=0 or #skip-intro skips it (for sharing a link or testing).
  var profile = null;
  try { profile = JSON.parse(localStorage.getItem('growlab-profile')); } catch (e) {}
  if (!profile && !/[?&]intro=0|#skip-intro/.test(location.href)) {
    root.classList.add('gate-on');
    // safety: if js/welcome.js never runs, never leave the visitor locked out
    setTimeout(function () { if (!window.GL_gateReady) root.classList.remove('gate-on'); }, 4000);
  }
})();
