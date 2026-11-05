// 스크롤 위치에 따라 거대한 숫자가 밝아지며 등장합니다.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  document.documentElement.classList.add('js');
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.num'));
  var ticking = false;
  function update() {
    var vh = window.innerHeight;
    blocks.forEach(function (b) {
      var r = b.getBoundingClientRect();
      var center = r.top + r.height / 2;
      var p = 1 - Math.abs(center - vh * 0.5) / (vh * 0.6);
      p = Math.max(0, Math.min(1, p));
      var big = b.querySelector('.big');
      var txt = b.querySelector('.txt');
      big.style.opacity = (0.12 + 0.88 * p).toFixed(3);
      big.style.transform = 'translateX(' + (-4 * (1 - p)).toFixed(2) + '%) scale(' + (0.94 + 0.06 * p).toFixed(3) + ')';
      txt.style.opacity = (0.2 + 0.8 * p).toFixed(3);
    });
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
