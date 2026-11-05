(function () {
  // 1) 긴 문장을 글자 단위로 쪼개 스크롤에 따라 회색에서 검정으로 물들인다.
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var leads = document.querySelectorAll('.reveal');
  var all = [];
  leads.forEach(function (el) {
    var chars = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      Array.from(n.textContent).forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'ch'; s.textContent = c; frag.appendChild(s); chars.push(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
    all.push({ el: el, chars: chars });
  });
  function paint() {
    var h = window.innerHeight;
    all.forEach(function (o) {
      var r = o.el.getBoundingClientRect();
      var p = reduce ? 1 : Math.min(Math.max((h * 0.85 - r.top) / (h * 0.55), 0), 1);
      var n = Math.round(p * o.chars.length);
      o.chars.forEach(function (c, i) { c.classList.toggle('dk', i < n); });
    });
  }
  window.addEventListener('scroll', paint, { passive: true });
  window.addEventListener('resize', paint);
  paint();

  // 2) 제품 라인: 목록을 고르면 링 안의 장비와 채워진 눈금이 바뀐다.
  var data = [
    { img: 'platinous-j-mv.png', alt: 'Platinous J 항온항습기', spec: '-70~+100°C<br>20~98%rh' },
    { img: 'ar-series-mv.png', alt: 'AR 시리즈 항온항습기', spec: '-70~+180°C<br>10~98%rh' },
    { img: 'tsa-thermal-shock-mv.png', alt: 'TSA 열충격 시험기', spec: '고온 +200°C<br>저온 -70°C' },
    { img: 'hast-ehs-mv.png', alt: 'HAST 시험기 EHS', spec: '+105~+162.2°C<br>0.392MPa' },
    { img: 'walk-in-chamber-tbe-mv.png', alt: '워크인 챔버 TBE', spec: '-40~+80°C<br>10~95%rh' }
  ];
  var btns = document.querySelectorAll('[data-mins] button');
  var img = document.querySelector('[data-ring-img]');
  var ring = document.querySelector('[data-ring]');
  var spec = document.querySelector('[data-spec]');
  function pick(i) {
    btns.forEach(function (b, k) { b.classList.toggle('on', k === i); });
    img.src = '../../../concepts2/assets/web/' + data[i].img;
    img.alt = data[i].alt;
    spec.innerHTML = data[i].spec;
    ring.style.setProperty('--fill', ((i + 1) / data.length * 360) + 'deg');
  }
  btns.forEach(function (b, i) {
    b.addEventListener('click', function () { pick(i); });
    b.addEventListener('mouseenter', function () { pick(i); });
    b.addEventListener('focus', function () { pick(i); });
  });
  pick(0);
})();
