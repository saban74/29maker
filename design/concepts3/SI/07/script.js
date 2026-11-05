/* 눈금 바늘: 스크롤 진행률(0~1)을 온도(+200 -> -70)로 바꿔 보여 줍니다. 눈금이 없어도 페이지는 그대로 읽힙니다. */
(function () {
  var root = document.documentElement;
  var gauge = document.querySelector('.gauge-needle');
  var read = document.getElementById('gread');
  if (!gauge || !read) return;
  var ticking = false;

  function update() {
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    gauge.style.setProperty('--p', p.toFixed(4));
    var t = Math.round(200 - p * 270);
    read.textContent = (t > 0 ? '+' : '') + t;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
