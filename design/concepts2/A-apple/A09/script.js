// 담기, 거르기, 견적함 목록. 순수 JS.
(function () {
  var cards = [].slice.call(document.querySelectorAll('.card'));
  var picked = document.getElementById('picked');
  var bar = document.getElementById('bar');
  var counts = document.querySelectorAll('[data-count]');
  var chosen = [];

  function render() {
    counts.forEach(function (c) { c.textContent = chosen.length; });
    bar.hidden = chosen.length === 0;
    picked.innerHTML = '';
    if (!chosen.length) {
      var e = document.createElement('li'); e.className = 'empty';
      e.textContent = '아직 담은 장비가 없습니다. 위에서 장비를 골라 담아 보세요.';
      picked.appendChild(e); return;
    }
    chosen.forEach(function (name) {
      var li = document.createElement('li');
      var s = document.createElement('span'); s.textContent = name;
      var b = document.createElement('button'); b.type = 'button'; b.textContent = '빼기';
      b.setAttribute('aria-label', name + ' 견적함에서 빼기');
      b.addEventListener('click', function () { toggle(name); });
      li.appendChild(s); li.appendChild(b); picked.appendChild(li);
    });
  }
  function toggle(name) {
    var i = chosen.indexOf(name);
    if (i > -1) chosen.splice(i, 1); else chosen.push(name);
    cards.forEach(function (c) {
      var on = chosen.indexOf(c.dataset.name) > -1;
      c.classList.toggle('picked', on);
      c.querySelector('.add').setAttribute('aria-pressed', on);
      c.querySelector('.add').textContent = on ? '담김' : '담기';
    });
    render();
  }
  cards.forEach(function (c) {
    c.querySelector('.add').addEventListener('click', function () { toggle(c.dataset.name); });
  });

  var chips = document.querySelectorAll('.chip');
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
      ch.classList.add('on'); ch.setAttribute('aria-pressed', 'true');
      var f = ch.dataset.f;
      cards.forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.cat.split(' ').indexOf(f) > -1); });
    });
  });
})();
