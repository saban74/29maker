// 산업 레일 버튼, 문장·사진 등장. 스크립트가 없어도 레일은 손으로 밀어 볼 수 있고 내용은 모두 보임.
(function () {
  var rail = document.getElementById('rail');
  function step(dir) {
    var card = rail.querySelector('.card');
    var w = card.getBoundingClientRect().width + 14;
    rail.scrollBy({ left: dir * w, behavior: 'smooth' });
  }
  document.getElementById('next').addEventListener('click', function () { step(1); });
  document.getElementById('prev').addEventListener('click', function () { step(-1); });

  var els = document.querySelectorAll('.rv, .wipe');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('on'); }); return; }
  var io = new IntersectionObserver(function (list) {
    list.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('on'); io.unobserve(x.target); } });
  }, { threshold: 0.2 });
  els.forEach(function (e) { io.observe(e); });
})();
