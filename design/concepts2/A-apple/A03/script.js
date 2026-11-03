// 갤러리 이전/다음 버튼. 카드 한 장 너비만큼 부드럽게 넘깁니다.
(function () {
  var track = document.querySelector('.track');
  var btns = document.querySelectorAll('.arrow');
  var pos = document.getElementById('pos');
  if (!track) return;
  var cards = track.querySelectorAll('.card');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step() {
    var c = cards[1] || cards[0];
    return c.getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
  }
  function update() {
    var s = step();
    var i = Math.round(track.scrollLeft / s);
    var max = track.scrollWidth - track.clientWidth - 2;
    if (pos) pos.textContent = Math.min(cards.length, i + 1);
    btns[0].disabled = track.scrollLeft <= 2;
    btns[1].disabled = track.scrollLeft >= max;
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      track.scrollBy({ left: Number(b.dataset.dir) * step(), behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
