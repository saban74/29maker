// 고정 장면: 스크롤 진행도에 따라 주장 목록의 밝은 줄이 한 줄씩 내려간다.
(function () {
  var scene = document.querySelector('[data-scene]');
  var items = document.querySelectorAll('[data-claims] li');
  var tl = document.querySelector('[data-tag-l]');
  var tr = document.querySelector('[data-tag-r]');
  var tags = [
    ['AR 시리즈 · -70~+180°C', '옵션 +200°C 확장 가능'],
    ['AR 시리즈 · 10~98%rh', 'Platinous J · 20~98%rh'],
    ['TSA-73ES · 고온 +60~+200°C', 'TSA-73ES · 저온 -70~0°C'],
    ['EHS-412 · +105~+162.2°C', 'EHS-412 · 0.020~0.392MPa'],
    ['워크인 · -40~+80°C', '워크인 · 10~95%rh'],
    ['PL-4J-ECO · 최대 70% 절감', '0°C 이하 운전 기준']
  ];
  var dist = document.querySelector('[data-dist]');
  var cur = -1;
  function update() {
    if (scene) {
      var r = scene.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = Math.min(Math.max(-r.top / total, 0), 0.999);
      var idx = Math.floor(p * items.length);
      if (idx !== cur) {
        cur = idx;
        items.forEach(function (li, i) { li.classList.toggle('on', i === idx); });
        if (tl) tl.textContent = tags[idx][0];
        if (tr) tr.textContent = tags[idx][1];
      }
    }
    if (dist) dist.textContent = Math.round(window.scrollY * 0.0265).toLocaleString('ko-KR'); // 화면 1px = 약 0.265mm(96dpi) = 0.0265cm
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
