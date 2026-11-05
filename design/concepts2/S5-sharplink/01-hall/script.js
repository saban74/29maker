/* 왼쪽 주장이 화면 가운데에 오면 그 줄만 밝아지고 오른쪽 장비가 바뀐다 */
(function () {
  var rows = document.querySelectorAll('.row');
  var figs = document.querySelectorAll('.stage .fig');
  if (!rows.length || !('IntersectionObserver' in window)) return;
  function set(i) {
    rows.forEach(function (r, k) { r.classList.toggle('is-active', k === i); });
    figs.forEach(function (f, k) { f.classList.toggle('is-active', k === i); if (k === i) f.classList.add('is-in'); });
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) set(Array.prototype.indexOf.call(rows, e.target)); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  rows.forEach(function (r) { io.observe(r); });
})();
