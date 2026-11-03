(function () {
  // 장면 비율을 숫자로 바꿔 CSS가 화면 높이에 맞게 사진 폭을 계산한다.
  document.querySelectorAll('.frame').forEach(function (f) {
    var p = f.style.getPropertyValue('--r').split('/');
    f.style.setProperty('--r-n', (parseFloat(p[0]) / parseFloat(p[1])).toFixed(4));
  });

  var story = document.querySelector('[data-story]');
  var chs = document.querySelectorAll('.ch');
  var code = document.querySelector('[data-code]');
  var cur = -1;
  function update() {
    var r = story.getBoundingClientRect();
    var p = Math.min(Math.max(-r.top / (r.height - window.innerHeight), 0), 0.999);
    var i = Math.floor(p * chs.length);
    if (i !== cur) {
      cur = i;
      chs.forEach(function (c, k) { c.classList.toggle('on', k === i); c.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      if (code) code.textContent = i + 1;
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  // 밝은 카드: 마우스를 올리거나 키보드로 이동하면 그 카드가 넓어진다.
  var cards = document.querySelectorAll('[data-row] .card');
  function open(c) { cards.forEach(function (x) { x.classList.toggle('open', x === c); }); }
  cards.forEach(function (c) {
    c.addEventListener('mouseenter', function () { open(c); });
    c.addEventListener('focus', function () { open(c); });
  });
})();
