/* 제품 목록 페이지용 작은 동작 (순수 JS). 이 파일이 없어도 제품 카드는 모두 보입니다.
   1) 검색: 검색칸에 쓴 글(또는 주소의 ?q=검색어)에 맞는 제품만 보여 줍니다.
   2) 왼쪽 분류 메뉴: 누른 분류에 "현재 위치" 표시를 합니다. */
(function () {
  'use strict';
  var d = document;

  /* 1) 검색 */
  var input = d.getElementById('l-q');
  var cards = [].slice.call(d.querySelectorAll('.pcard[data-q]'));
  var secs = [].slice.call(d.querySelectorAll('.l-sec'));
  var empty = d.getElementById('l-empty');
  var form = d.getElementById('l-search');
  function apply(q) {
    q = (q || '').toLowerCase().replace(/\s+/g, ' ').trim();
    var shown = 0;
    cards.forEach(function (c) {
      var ok = !q || c.getAttribute('data-q').indexOf(q) !== -1;
      c.hidden = !ok;
      if (ok) shown++;
    });
    secs.forEach(function (s) {
      if (s.id === 'cat-others') { s.hidden = !!q; return; } /* 검색 중에는 "그 밖의 라인업" 숨김 */
      s.hidden = !!q && !s.querySelector('.pcard:not([hidden])');
    });
    if (empty) empty.hidden = !q || shown !== 0;
  }
  if (input) {
    var m = /[?&]q=([^&]*)/.exec(window.location.search);
    if (m) {
      try { input.value = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { input.value = m[1]; }
    }
    input.addEventListener('input', function () { apply(input.value); });
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); apply(input.value); });
    apply(input.value);
  }

  /* 2) 분류 메뉴 현재 위치 */
  var links = [].slice.call(d.querySelectorAll('#cat-menu a'));
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      links.forEach(function (x) { x.removeAttribute('aria-current'); });
      a.setAttribute('aria-current', 'true');
    });
  });
})();
