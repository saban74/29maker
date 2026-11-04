/* 일반 페이지용 작은 동작 (순수 JS). 이 파일이 없어도 내용은 모두 보이고, 아래 기능만 빠집니다.
   1) 거르기 버튼: 제품 목록, 기술자료 표, 뉴스 목록
   2) 문의 폼: 문의 유형에 따라 입력칸 보이기/숨기기, 주소(?type=…&product=…)로 미리 채우기, 보내기 연결 전 안내 */
(function () {
  'use strict';
  var d = document;

  /* 1) 거르기 버튼
     버튼 묶음: <div class="filters" data-filter-for="#목록아이디">  버튼에 data-filter="값" (전체는 "all")
     거를 대상: 목록 안에서 data-cat="값1 값2" 가 붙은 요소. 비었을 때 보여 줄 문구는 [data-empty] */
  [].forEach.call(d.querySelectorAll('[data-filter-for]'), function (bar) {
    var scope = d.querySelector(bar.getAttribute('data-filter-for'));
    if (!scope) return;
    var buttons = [].slice.call(bar.querySelectorAll('button[data-filter]'));
    var items = [].slice.call(scope.querySelectorAll('[data-cat]'));
    var empty = scope.querySelector('[data-empty]');
    function apply(key) {
      var shown = 0;
      items.forEach(function (it) {
        var cats = (it.getAttribute('data-cat') || '').split(/\s+/);
        var ok = key === 'all' || cats.indexOf(key) !== -1;
        it.hidden = !ok;
        if (ok) shown++;
      });
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === key ? 'true' : 'false'); });
      if (empty) empty.hidden = shown !== 0;
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); });
    });
    apply('all');
  });

  /* 2) 문의 폼 */
  var form = d.getElementById('contact-form');
  if (form) {
    var radios = [].slice.call(form.querySelectorAll('input[name="type"]'));
    var parts = [].slice.call(form.querySelectorAll('[data-for]'));
    function showFor(type) {
      parts.forEach(function (p) {
        var want = (p.getAttribute('data-for') || '').split(/\s+/);
        var on = want.indexOf(type) !== -1;
        p.hidden = !on;
        /* 숨겨진 칸이 '필수'로 남아 제출을 막지 않게 한다 */
        [].forEach.call(p.querySelectorAll('[data-req]'), function (f) { f.required = on; });
      });
    }
    radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) showFor(r.value); }); });

    /* 주소로 미리 채우기: contact.html?type=quote&product=Platinous+J */
    var params = new URLSearchParams(window.location.search);
    var t = params.get('type');
    var valid = radios.some(function (r) { return r.value === t; });
    if (valid) radios.forEach(function (r) { r.checked = r.value === t; });
    var prod = params.get('product') || params.get('item');
    var prodField = d.getElementById('f-product');
    if (prod && prodField) prodField.value = prod;
    var checked = radios.filter(function (r) { return r.checked; })[0];
    showFor(checked ? checked.value : 'quote');

    /* 보내기 연결 전: 실제로 전송하지 않고 접수 완료 안내 페이지로만 이동한다 */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.location.href = 'contact-done.html';
    });
  }
})();
