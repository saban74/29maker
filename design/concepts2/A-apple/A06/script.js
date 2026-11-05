// 막대가 화면에 들어오면 한 번만 차오릅니다.
(function () {
  var bars = document.querySelector('.bars');
  if (!bars) return;
  if (!('IntersectionObserver' in window)) { bars.classList.add('in'); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { bars.classList.add('in'); io.disconnect(); } });
  }, { threshold: 0.4 });
  io.observe(bars);
})();
