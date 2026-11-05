/* GrowLab · Choose your path: one deck, two sides.
   The 12 cards become 6 double-sided cards: "what you need" on the front, "who you are" on the back.
   The switch turns the deck over in a quick 3D wave. On desktop each card tilts toward the pointer and
   its parts float at different depths. Cards deal in when the section first scrolls into view.
   A picked card is carried into the Growth Check form. Without JS: both groups show, stacked. */
(function () {
  'use strict';
  var sec = document.getElementById('browse');
  if (!sec) return;
  var gNeed = sec.querySelector('.cards.by-need'), gWho = sec.querySelector('.cards.by-who');
  var sw = sec.querySelector('.pth-sw'), note = sec.querySelector('.pth-note');
  if (!gNeed || !gWho || !sw) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var E_OUT = 'cubic-bezier(.23,1,.32,1)', E_IO = 'cubic-bezier(.77,0,.175,1)';
  var NOTES = { need: 'Start from what you need.', who: 'Builders who are stuck, not lazy.' };

  var needs = [].slice.call(gNeed.children), whos = [].slice.call(gWho.children);
  needs.concat(whos).forEach(function (c, i) { c.dataset.k = i; });

  /* build the deck */
  var deck = document.createElement('div');
  deck.className = 'pth';
  var slots = [];
  for (var i = 0; i < 6; i++) {
    var slot = document.createElement('div');
    slot.className = 'pth-slot';
    slot.innerHTML = '<div class="flip"><div class="face f-need"></div><div class="face f-who"></div></div>';
    deck.appendChild(slot);
    slots.push(slot);
  }
  gNeed.parentNode.insertBefore(deck, gNeed);
  sec.querySelectorAll('.pth-sub').forEach(function (h) { h.remove(); });
  gNeed.remove(); gWho.remove();
  sw.hidden = false; note.hidden = false;

  var side = 'need';
  function order(list) {                              // the card that matches you first, the rest in their order
    return list.slice().sort(function (a, b) {
      var ya = a.classList.contains('is-you') ? 0 : 1, yb = b.classList.contains('is-you') ? 0 : 1;
      return ya - yb || a.dataset.k - b.dataset.k;
    });
  }
  function deal() {
    var n = order(needs), w = order(whos);
    slots.forEach(function (s, i) {
      s.querySelector('.f-need').appendChild(n[i]);
      s.querySelector('.f-who').appendChild(w[i]);
    });
    faces();
  }
  function faces() {
    slots.forEach(function (s) {
      var front = s.querySelector('.f-need'), back = s.querySelector('.f-who');
      front.inert = side !== 'need'; back.inert = side !== 'who';
      front.setAttribute('aria-hidden', side !== 'need'); back.setAttribute('aria-hidden', side !== 'who');
    });
  }
  deal();
  window.addEventListener('growlab:profile', function () { requestAnimationFrame(deal); });

  /* the switch: turn the deck over, card by card */
  function turn(to) {
    if (to === side) return;
    side = to;
    sw.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.side === to ? 'true' : 'false'); });
    sw.classList.toggle('who', to === 'who');
    note.textContent = NOTES[to];
    var from = to === 'who' ? 0 : 180, end = to === 'who' ? 180 : 0, dir = to === 'who' ? 1 : -1;
    slots.forEach(function (s, i) {
      var f = s.querySelector('.flip');
      f.style.transform = 'rotateY(' + end + 'deg)';
      if (reduce.matches) return;
      f.animate([
        { transform: 'rotateY(' + from + 'deg)' },
        { transform: 'rotateY(' + (from + dir * 90) + 'deg) translateZ(-60px)', offset: 0.5 },
        { transform: 'rotateY(' + end + 'deg)' }
      ], { duration: 760, delay: i * 70, easing: E_IO, fill: 'backwards' });
    });
    faces();
  }
  sw.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-side]');
    if (b) turn(b.dataset.side);
  });

  /* hover depth: the card tilts toward the pointer; its parts sit at different depths (CSS) */
  if (!reduce.matches) {
    deck.addEventListener('pointermove', function (e) {
      if (!fine.matches) return;
      var c = e.target.closest('.cd');
      if (!c) return;
      var r = c.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      c.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg');
      c.classList.add('tilt');
    });
    deck.addEventListener('pointerout', function (e) {
      var c = e.target.closest('.cd');
      if (c && !c.contains(e.relatedTarget)) { c.classList.remove('tilt'); c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); }
    });
  }

  /* entrance: the cards are dealt in from a tilted stack, once */
  if (!reduce.matches && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en, obs) {
      if (!en[0].isIntersecting) return;
      obs.disconnect();
      slots.forEach(function (s, i) {
        s.animate([
          { opacity: 0, transform: 'translateY(60px) rotateX(-28deg) rotateZ(' + (i % 2 ? 3 : -3) + 'deg) scale(.94)' },
          { opacity: 1, transform: 'none' }
        ], { duration: 900, delay: i * 80, easing: E_OUT, fill: 'backwards' });
      });
    }, { rootMargin: '0px 0px -15% 0px' }).observe(deck);
  }

  /* a picked card goes into the Growth Check form */
  var form = document.querySelector('#start form');
  if (form && form.elements.interest) {
    var chip = form.querySelector('[data-pick]');
    deck.addEventListener('click', function (e) {
      var c = e.target.closest('.cd');
      if (!c) return;
      var t = c.querySelector('h4').textContent;
      form.elements.interest.value = (side === 'need' ? 'Need: ' : 'I am: ') + t;
      chip.querySelector('[data-pick-text]').textContent = t;
      chip.hidden = false;
    });
    form.addEventListener('click', function (e) {
      if (!e.target.closest('[data-act="unpick"]')) return;
      form.elements.interest.value = '';
      chip.hidden = true;
    });
  }
})();
