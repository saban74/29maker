// 문장이 화면에 들어올 때 한 번만 올라옴. 스크립트가 없으면 처음부터 보임.
(function () {
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('on'); }); return; }
  var io = new IntersectionObserver(function (list) {
    list.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('on'); io.unobserve(x.target); } });
  }, { threshold: 0.25 });
  els.forEach(function (e) { io.observe(e); });
})();
