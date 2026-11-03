/* 공통: 화면에 들어오면 추적 상자가 "잠금" 되듯 나타난다. 스크립트가 없으면 처음부터 보인다. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var shots = document.querySelectorAll('.shot, [data-reveal]');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    shots.forEach(function (s) { s.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: .25 });
  shots.forEach(function (s) { io.observe(s); });
})();
