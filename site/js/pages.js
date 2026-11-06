/* 일반 페이지용 작은 동작 (순수 JS). 이 파일이 없어도 내용은 모두 보이고, 아래 기능만 빠집니다.
   1) 거르기 버튼: 제품 목록, 기술자료 표, 뉴스 목록
   2) 문의 폼: 문의 유형에 따라 입력칸 보이기/숨기기, 주소(?type=…&product=…)로 미리 채우기, 보내기(받는 주소가 있으면 전송, 없으면 "준비 중" 안내) */
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

    /* 3) 문의 보내기
       contact.html 의 <form data-endpoints="주소1, 주소2"> 에 받을 주소를 쉼표로 쓰면 그 주소들로 보냅니다.
       - 비어 있으면: 전송하지 않고 "온라인 접수 준비 중" 안내만 다시 읽어 줍니다 (버튼: "입력 내용 확인").
       - 주소가 있으면: 주소마다 JSON 을 POST 합니다 (버튼: "문의 보내기"). 하나라도 성공하면 "접수되었습니다",
         모두 실패하면 실패 안내. 자세한 설명은 site/INTEGRATION.md */
    var notice = d.getElementById('form-notice');
    var btn = d.getElementById('form-submit');
    var PHONE_HTML = '대표전화 <a class="link" href="tel:0255570505">02-557-0505</a>';
    var endpoints = (form.getAttribute('data-endpoints') || '').split(',')
      .map(function (s) { return s.trim(); }).filter(function (s) { return s; });
    var BTN_READY = endpoints.length ? '문의 보내기' : '입력 내용 확인';
    if (btn) btn.textContent = BTN_READY;
    if (endpoints.length && notice) {
      notice.innerHTML = '아래 양식을 작성해 \'문의 보내기\'를 눌러 주세요. 급하시면 ' + PHONE_HTML + '로 문의해 주세요.';
    }

    /* 안내 문구 바꾸기 (잠깐 비웠다가 채우면 화면 읽기 프로그램이 다시 읽어 줍니다) */
    function say(html, kind) {
      if (!notice) return;
      notice.innerHTML = '';
      window.setTimeout(function () {
        notice.innerHTML = html;
        notice.setAttribute('data-state', kind || '');
        notice.scrollIntoView({ block: 'center' });
      }, 50);
    }

    /* 화면에 보이는 입력칸만 모아 보낼 내용(JSON)을 만든다. 스팸 방지 칸(website)과 파일 내용은 제외 */
    function collect() {
      var data = {};
      [].forEach.call(form.elements, function (el) {
        if (!el.name || el.name === 'website' || el.disabled) return;
        if (el.closest('[hidden]')) return;
        if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; return; }
        if (el.type === 'checkbox') { data[el.name] = el.checked; return; }
        if (el.type === 'file') { data[el.name + 'FileName'] = el.files && el.files[0] ? el.files[0].name : ''; return; }
        data[el.name] = el.value;
      });
      var labels = { quote: '견적 요청', consult: '기술 상담', material: '자료 요청', as: 'A/S·유지보수', service: '서비스 접수(점검·수리)', lab: '위탁 시험', etc: '기타' };
      data.typeLabel = labels[data.type] || '';
      data.pageUrl = window.location.href;
      data.submittedAt = new Date().toISOString();
      return data;
    }

    /* 한 주소로 보내기. 성공하면 true, 실패하면 false */
    function send(url, payload) {
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = ctl ? window.setTimeout(function () { ctl.abort(); }, 15000) : null;
      return window.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctl ? ctl.signal : undefined
      }).then(function (res) { return res.ok; })
        .catch(function () { return false; })
        .then(function (ok) { if (timer) window.clearTimeout(timer); return ok; });
    }

    var sending = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;

      /* 주소가 없으면 전송하지 않고 준비 중 안내만 */
      if (!endpoints.length || !window.fetch) {
        if (notice) { var html = notice.innerHTML; say(html, 'pending'); }
        return;
      }

      /* 스팸 방지 칸이 채워져 있으면 사람이 아니므로 보내지 않고 성공한 척만 한다 */
      var trap = form.elements['website'];
      if (trap && trap.value) { say('접수되었습니다.', 'ok'); return; }

      var payload = collect();
      sending = true;
      if (btn) { btn.disabled = true; btn.textContent = '보내는 중…'; }

      Promise.all(endpoints.map(function (u) { return send(u, payload); })).then(function (results) {
        var okCount = results.filter(Boolean).length;
        sending = false;
        if (btn) { btn.disabled = false; btn.textContent = BTN_READY; }
        if (okCount > 0) {
          if (okCount < results.length && window.console) console.warn('문의 전송: 일부 받는 주소로 보내지 못했습니다.', results);
          say('접수되었습니다. 확인 후 연락드리겠습니다.', 'ok');
          form.reset();
          var r = radios.filter(function (x) { return x.checked; })[0];
          showFor(r ? r.value : 'quote');
        } else {
          say('전송에 실패했습니다. 전화·이메일로 문의해 주세요. ' + PHONE_HTML, 'error');
        }
      });
    });
  }
})();
