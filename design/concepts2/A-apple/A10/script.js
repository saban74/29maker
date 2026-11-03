// 장면이 화면에 들어오면 한 번만 천천히 밝아집니다.
(function () {
  var els = document.querySelectorAll('.stage');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.3 });
  els.forEach(function (e) { io.observe(e); });
})();
