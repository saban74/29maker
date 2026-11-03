/* 1) 장이 바뀌면 바탕색이 부드럽게 바뀐다  2) 점선 상자가 장비의 부분을 돌아가며 잡는다 */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var chaps = document.querySelectorAll('.chap');
  if ('IntersectionObserver' in window) {
    document.body.style.backgroundColor = chaps[0].dataset.bg;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) document.body.style.backgroundColor = e.target.dataset.bg; });
    }, { rootMargin: '-50% 0px -50% 0px' });
    chaps.forEach(function (c) { io.observe(c); });
  }

  var boxes = document.querySelectorAll('.scan .trk');
  if (!boxes.length) return;
  if (reduce) { boxes.forEach(function (b) { b.classList.add('on'); }); return; }
  var i = 0;
  setInterval(function () {
    boxes[i].classList.remove('on');
    i = (i + 1) % boxes.length;
    boxes[i].classList.add('on');
  }, 2600);
})();
