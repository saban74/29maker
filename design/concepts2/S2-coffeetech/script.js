/* 화면에 들어올 때 한 번만 나타나게 합니다. 스크립트가 없어도 내용은 모두 보입니다. */
(function () {
  var els = document.querySelectorAll('[data-r]');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (list) {
    list.forEach(function (it) { if (it.isIntersecting) { it.target.classList.add('in'); io.unobserve(it.target); } });
  }, { threshold: 0.2 });
  els.forEach(function (e) { io.observe(e); });
})();
