/* GrowLab · proof section.
   On first view: numbers roll up like an odometer (distance travelled = traction), and the dots
   (one per real person / place) drop in like the hero ball landing. Once only.
   Reduced motion or no JS: final numbers and dots are already in the HTML. */
(function () {
  'use strict';
  var sec = document.getElementById('proof');
  if (!sec || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var E_OUT = 'cubic-bezier(.23,1,.32,1)';

  /* odometer: each digit becomes a column that rolls to its final value; the right-most rolls most */
  var odos = [].slice.call(sec.querySelectorAll('.odo'));
  odos.forEach(function (el) {
    var txt = el.textContent, digits = txt.replace(/\D/g, '').length, seen = 0, html = '';
    for (var i = 0; i < txt.length; i++) {
      var ch = txt[i];
      if (!/\d/.test(ch)) { html += '<span aria-hidden="true">' + ch + '</span>'; continue; }
      var d = +ch, fromRight = digits - 1 - seen++, rounds = Math.min(2, fromRight === 0 ? 2 : fromRight === 1 ? 1 : 0);
      var strip = '';
      for (var n = 0; n <= rounds * 10 + d; n++) strip += '<span>' + (n % 10) + '</span>';
      // the strip rests on the final digit; the animation rolls it there from 0
      html += '<span class="dg" aria-hidden="true" data-n="' + (rounds * 10 + d) + '"><i>' + d + '</i><span class="strip" style="transform:translate(-50%,' + (-(rounds * 10 + d)) + 'em)">' + strip + '</span></span>';
    }
    el.innerHTML = '<span class="sr">' + txt + '</span>' + html;   // screen readers get the plain number
  });

  function roll(el, delay) {
    el.querySelectorAll('.dg').forEach(function (dg, i, all) {
      var n = +dg.dataset.n, strip = dg.querySelector('.strip');
      strip.animate([{ transform: 'translate(-50%,0)' }, { transform: 'translate(-50%,' + (-n) + 'em)' }],
        { duration: 1100 + (all.length - i) * 60, delay: delay, easing: E_OUT, fill: 'both' });
    });
  }

  function drop(group, delay) {
    var dots = [].slice.call(group.querySelectorAll('.pd'));
    var on = dots.filter(function (d) { return d.classList.contains('on'); });
    var off = dots.filter(function (d) { return !d.classList.contains('on'); });
    var step = Math.max(10, Math.min(28, 700 / dots.length));
    on.forEach(function (d, i) {
      d.animate([
        { transform: 'translateY(-16px)', opacity: 0 },
        { transform: 'translateY(2px)', opacity: 1, offset: 0.7 },
        { transform: 'none', opacity: 1 }
      ], { duration: 420, delay: delay + i * step, easing: E_OUT, fill: 'backwards' });
    });
    // the honest part: the ones that are not filled appear last, quietly
    var after = delay + on.length * step + 200;
    off.forEach(function (d, i) {
      d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: after + i * 40, easing: 'ease', fill: 'backwards' });
    });
  }

  function start() {
    sec.querySelectorAll('.pf-t').forEach(function (tile, i) {
      var delay = i * 90;
      tile.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
        { duration: 650, delay: delay, easing: E_OUT, fill: 'backwards' });
      tile.querySelectorAll('.odo').forEach(function (o, k) { roll(o, delay + 120 + k * 80); });
      var g = tile.querySelector('.pf-dots');
      if (g) drop(g, delay + 260);
      var r = tile.querySelector('.rank-bar');
      if (r) r.querySelectorAll('i').forEach(function (t, k) {     // the leaderboard grows from 1st to 42nd
        t.animate([{ transform: 'scaleY(0)' }, { transform: 'none' }],
          { duration: 500, delay: delay + 260 + k * 16, easing: E_OUT, fill: 'backwards' });
      });
    });
  }

  // hold the final state hidden only until the section is about to show (never if the script stops)
  new IntersectionObserver(function (en, obs) {
    if (!en[0].isIntersecting) return;
    obs.disconnect();
    start();
  }, { rootMargin: '0px 0px -20% 0px' }).observe(sec.querySelector('.pf'));
})();
