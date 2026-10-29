/* =========================================================
   페이지 안에서 움직이는 기능 모음 (site/js/main.js)
   1) 제품 상세/솔루션 탭 줄: 스크롤하면 지금 보는 곳이 굵게 표시됨
   2) 제품소개 목록: 제품군 / 산업 / 검색 / 정렬
   3) 기술자료·뉴스: 분류 버튼으로 걸러 보기
   4) 견적·문의 폼: 문의 유형에 따라 입력칸 바뀜, 제품명 자동 입력
   ========================================================= */
(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function getParam(name) {
    var m = location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return m[1]; }
  }

  /* ---------- 1) 탭 줄 스크롤 표시 ---------- */
  var tabs = $$('.tabs a[href^="#"]');
  if (tabs.length) {
    var onScroll = function () {
      var pos = window.scrollY + 160, cur = tabs[0];
      tabs.forEach(function (t) {
        var el = document.getElementById(t.getAttribute('href').slice(1));
        if (el && el.getBoundingClientRect().top + window.scrollY <= pos) cur = t;
      });
      tabs.forEach(function (t) { t.classList.toggle('is-on', t === cur); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 2) 제품소개 목록 ---------- */
  var grid = $('#prod-grid');
  if (grid) {
    var cards = $$('.prod-card', grid);
    var state = { cat: getParam('cat') || 'all', ind: 'all', q: '', sort: 'default' };
    var input = $('#q'), count = $('#count'), empty = $('#empty');
    cards.forEach(function (c, i) { c.setAttribute('data-order', i); });

    var render = function () {
      var shown = 0;
      cards.forEach(function (c) {
        var okCat = state.cat === 'all' || state.cat === 'others' || (c.getAttribute('data-cat') || '') === state.cat;
        var okInd = state.ind === 'all' || (' ' + (c.getAttribute('data-ind') || '') + ' ').indexOf(' ' + state.ind + ' ') > -1;
        var okQ = !state.q || (c.getAttribute('data-name') || '').toLowerCase().indexOf(state.q) > -1;
        var ok = okCat && okInd && okQ;
        c.hidden = !ok;
        if (ok) shown++;
      });
      var arr = cards.slice().sort(function (a, b) {
        if (state.sort === 'name') return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '');
        return a.getAttribute('data-order') - b.getAttribute('data-order');
      });
      arr.forEach(function (c) { grid.appendChild(c); });
      if (count) count.textContent = '제품 ' + shown + '개 표시';
      if (empty) empty.hidden = shown !== 0;
      $$('.side-list a[data-cat]').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-cat') === state.cat); });
      $$('.filters a[data-ind]').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-ind') === state.ind); });
      $$('.sort-links button').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-sort') === state.sort); });
    };
    $$('.side-list a[data-cat]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); state.cat = a.getAttribute('data-cat'); render();
        if (state.cat === 'others') { var o = document.getElementById('others'); if (o) o.scrollIntoView(); }
      });
    });
    $$('.filters a[data-ind]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); state.ind = a.getAttribute('data-ind'); render(); });
    });
    $$('.sort-links button').forEach(function (b) {
      b.addEventListener('click', function () { state.sort = b.getAttribute('data-sort'); render(); });
    });
    if (input) {
      input.addEventListener('input', function () { state.q = input.value.trim().toLowerCase(); render(); });
      if (location.hash === '#search') input.focus();
    }
    render();
  }

  /* ---------- 3) 분류 버튼으로 걸러 보기 (기술자료, 뉴스) ---------- */
  $$('.filters[data-target]').forEach(function (box) {
    var items = $$(box.getAttribute('data-target'));
    var empty = $(box.getAttribute('data-empty') || '#none');
    var links = $$('a[data-f]', box);
    links.forEach(function (l) {
      l.addEventListener('click', function (e) {
        e.preventDefault();
        var f = l.getAttribute('data-f'), shown = 0;
        links.forEach(function (x) { x.classList.toggle('is-on', x === l); });
        items.forEach(function (it) {
          var ok = f === 'all' || (' ' + (it.getAttribute('data-g') || '') + ' ').indexOf(' ' + f + ' ') > -1;
          it.hidden = !ok; if (ok) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });
  });

  /* ---------- 4) 견적·문의 폼 ---------- */
  var form = $('#contact-form');
  if (form) {
    var LABEL = { quote: '관심 제품', tech: '관심 제품', data: '자료명 (또는 제품명)', as: '제품명·모델명·장비 번호', lab: '시험할 제품·시험 내용', etc: '관련 제품 (있다면)' };
    var HINT = {
      quote: '적용 규격, 희망 도입 시기 등을 자유롭게 적어 주세요.',
      tech: '시험 조건이나 궁금한 점을 자유롭게 적어 주세요.',
      data: '필요한 자료 종류(예: 한국어 사양 요약, 견적용 사양서)를 적어 주세요.',
      as: '증상이나 요청 내용을 적어 주세요.',
      lab: '시험하려는 제품, 시험 항목, 조건을 적어 주세요.',
      etc: '문의 내용을 자유롭게 적어 주세요.'
    };
    var radios = $$('input[name="type"]', form);
    var apply = function (t) {
      $$('[data-types]', form).forEach(function (g) {
        g.hidden = (' ' + g.getAttribute('data-types') + ' ').indexOf(' ' + t + ' ') < 0;
      });
      var lab = $('#prod-label'); if (lab) lab.textContent = LABEL[t] || LABEL.quote;
      var memo = $('#memo'); if (memo) memo.placeholder = HINT[t] || HINT.quote;
      var purpose = $('#purpose'); if (purpose) purpose.required = (t === 'quote');
    };
    var t0 = getParam('type') || 'quote';
    radios.forEach(function (r) {
      r.checked = r.value === t0;
      r.addEventListener('change', function () { apply(r.value); });
    });
    if (!radios.some(function (r) { return r.checked; })) { radios[0].checked = true; t0 = radios[0].value; }
    apply(t0);
    var prod = getParam('product'); if (prod && $('#prod')) $('#prod').value = prod;

    /* 주의: 지금은 서버가 없어서 입력 내용이 어디로도 전송되지 않습니다.
       문의를 받을 방법(이메일, 서버 등)이 정해지면 이 부분을 바꿔야 합니다. */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      location.href = 'contact-done.html';
    });
  }
})();
