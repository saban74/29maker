// 큰 숫자가 화면에 들어오면 0에서 목표값까지 올라갑니다. 스크립트가 없거나 움직임 줄이기면 처음부터 최종값이 보입니다.
(function () {
  var nums = document.querySelectorAll('.n[data-count]');
  if (!nums.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  function run(el) {
    var to = Number(el.dataset.count);
    var sign = el.dataset.sign || '';
    var start = null;
    var dur = 1400;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = sign + Math.round(to * eased);
      if (p < 1) window.requestAnimationFrame(tick);
    }
    el.textContent = sign + '0';
    window.requestAnimationFrame(tick);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  nums.forEach(function (n) { io.observe(n); });
})();
