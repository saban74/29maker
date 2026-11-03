// 장이 화면 가운데에 오면 사진이 밝아지고 오른쪽 장 목록이 따라 켜진다.
(function () {
  document.documentElement.classList.add('js');
  var chapters = document.querySelectorAll('.chapter');
  var links = document.querySelectorAll('.rail a');
  if (!('IntersectionObserver' in window)) {
    chapters.forEach(function (c) { c.classList.add('lit'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('lit');
        links.forEach(function (a) {
          a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { rootMargin: '-35% 0px -35% 0px' });
  chapters.forEach(function (c) { io.observe(c); });
})();
