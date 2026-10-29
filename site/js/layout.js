/* =========================================================
   공통 머리말(메뉴) / 꼬리말 / "도입부터 사후관리까지" 블록을 모든 페이지에 넣어 주는 파일
   -------------------------------------------------------
   * 메뉴를 고치고 싶으면 아래 MENU 부분만 고치면 모든 페이지에 한 번에 적용됩니다.
   * 푸터의 회사 정보(주소, 전화 등)는 아래 FOOTER 부분을 고치세요.
     [확인 필요] 표시를 지우고 실제 값을 넣으면 됩니다.
   * 각 HTML 의 <body data-root="" data-nav="..."> 로 위치를 알려 줍니다.
       data-root : 현재 페이지에서 site 폴더까지의 길이 ("" 또는 "../")
       data-nav  : 메뉴에서 굵게 표시할 곳 (about, products, solutions, resources, service, support)
   ========================================================= */
(function () {
  var body = document.body;
  var R = body.getAttribute('data-root') || '';
  var CUR = body.getAttribute('data-nav') || '';

  /* ---------- 메뉴 (상단 6개) ---------- */
  var MENU = [
    { key: 'about', label: '회사소개', href: 'about.html', desc: '1981년부터 이어 온 신뢰', links: [
      ['회사 개요·인사말', 'about.html#overview'], ['연혁', 'about.html#history'],
      ['ESPEC 단독 총대리점', 'about.html#agent'], ['파트너 네트워크', 'network.html'], ['오시는 길', 'about.html#location'] ] },
    { key: 'products', label: '제품소개', href: 'products/index.html', desc: '환경시험·평가 장비', links: [
      ['항온항습기', 'products/index.html?cat=humid'], ['급속 온도변화·온도 사이클', 'products/index.html?cat=rapid'],
      ['열충격 시험기', 'products/index.html?cat=shock'], ['HAST 가속수명 시험기', 'products/index.html?cat=hast'],
      ['워크인 챔버', 'products/index.html?cat=walkin'], ['산업용 오븐', 'products/index.html?cat=oven'],
      ['2차전지 시험 장비', 'products/index.html?cat=battery'], ['반도체·전자부품 평가', 'products/semiconductor-evaluation.html'],
      ['진동 시험기', 'products/index.html?cat=vibration'], ['그 밖의 라인업', 'products/index.html#others'] ] },
    { key: 'solutions', label: '솔루션', href: 'solutions/index.html', desc: '산업별 신뢰성 시험 제안', links: [
      ['반도체', 'solutions/semiconductor.html'], ['전기전자', 'solutions/electronics.html'], ['배터리', 'solutions/battery.html'],
      ['자동차·모빌리티', 'solutions/mobility.html'], ['항공우주·방산', 'solutions/aerospace-defense.html'],
      ['소재·기타', 'solutions/materials.html'], ['시험 목적별 찾기', 'solutions/index.html#purpose'] ] },
    { key: 'resources', label: '기술자료', href: 'resources.html', desc: '카탈로그와 규격 정보', links: [
      ['카탈로그', 'resources.html#catalog'], ['규격별 장비 찾기', 'resources.html#standard'], ['세미나·기술 자료', 'resources.html#seminar'] ] },
    { key: 'service', label: '서비스', href: 'service.html', desc: '도입 이후까지 함께합니다', links: [
      ['A/S·기술 지원', 'service.html#as'], ['위탁 시험소', 'service.html#test'],
      ['기술 세미나·교육', 'service.html#seminar'], ['기술 연구소', 'service.html#lab'] ] },
    { key: 'support', label: '고객지원', href: 'contact.html', desc: '문의와 소식', links: [
      ['견적·문의', 'contact.html'], ['뉴스·공지', 'news.html'], ['오시는 길', 'about.html#location'] ] }
  ];

  function a(href, text, extra) { return '<a href="' + R + href + '"' + (extra || '') + '>' + text + '</a>'; }

  function buildHeader() {
    var items = MENU.map(function (m) {
      var links = m.links.map(function (l) { return a(l[1], l[0]); }).join('');
      return '<li>' + a(m.href, m.label, CUR === m.key ? ' aria-current="page"' : '') +
        '<div class="sub"><div class="container sub__in"><div class="sub__title"><strong>' + m.label + '</strong><span>' + m.desc +
        '</span></div><div class="sub__links">' + links + '</div></div></div></li>';
    }).join('');
    return '<div class="agent-strip">ESPEC 한국 단독 총대리점 · 제이에스 엔지니어링</div><header class="site-header"><div class="container header-inner">' +
      a('index.html', '<strong>J&amp;S ENGINEERING</strong><small>TOTAL TEST SOLUTION</small>', ' class="brand" aria-label="J&amp;S ENGINEERING 메인으로"') +
      '<span class="badge-agent">ESPEC 한국 단독 총대리점</span>' +
      '<input type="checkbox" id="nav-toggle" class="nav-toggle" aria-label="메뉴 열기">' +
      '<label for="nav-toggle" class="nav-burger" aria-label="메뉴 열기"><span></span></label>' +
      '<nav class="nav" aria-label="주 메뉴"><ul>' + items + '</ul></nav>' +
      '<div class="header-right">' +
      a('products/index.html#search', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>', ' class="icon-btn" aria-label="제품 검색"') +
      a('contact.html', '견적문의', ' class="btn btn--sm"') +
      '</div></div></header>';
  }

  /* ---------- 꼬리말 (회사 정보) ---------- */
  function buildFooter() {
    var tbd = '<span class="tbd">[확인 필요]</span>';
    return '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
      '<div><div class="footer-brand">J&amp;S ENGINEERING<small>TOTAL TEST SOLUTION</small></div>' +
      '<p>(주)제이에스 엔지니어링 · 대표이사 정창현<br>제이에스 엔지니어링은 1981년부터 ESPEC Corp.의 한국 단독 총대리점입니다.</p>' +
      '<p>사업자등록번호 ' + tbd + '<br>주소 ' + tbd + '<br>전화 ' + tbd + ' · 팩스 ' + tbd + ' · 이메일 ' + tbd + '</p></div>' +
      '<div><h4>COMPANY</h4><ul><li>' + a('about.html', '회사소개') + '</li><li>' + a('network.html', '파트너 네트워크') + '</li><li>' +
      a('products/index.html', '제품소개') + '</li><li>' + a('solutions/index.html', '솔루션') + '</li></ul></div>' +
      '<div><h4>SUPPORT</h4><ul><li>' + a('resources.html', '기술자료') + '</li><li>' + a('service.html', '서비스') + '</li><li>' +
      a('contact.html', '견적·문의') + '</li><li>' + a('news.html', '뉴스·공지') + '</li></ul></div>' +
      '<div><h4>LINK</h4><ul><li>' + a('privacy.html', '개인정보처리방침') + '</li><li>' +
      '<a href="https://www.espec.co.jp/english/" target="_blank" rel="noopener">ESPEC 공식 사이트 (영문, 새 창)</a></li></ul></div>' +
      '</div><div class="footer-legal">ESPEC 및 각 제품명은 ESPEC Corp.의 상표입니다. 제품 정보는 ESPEC 공개 자료를 바탕으로 제이에스 엔지니어링이 정리했습니다. © J&amp;S ENGINEERING ' +
      '<span class="tbd">[확인 필요: 영문 표기]</span></div></div></footer>';
  }

  /* ---------- 제품 상세 공통 블록: 도입부터 사후관리까지 ---------- */
  function buildSupport() {
    var t = '<span class="tbd">[확인 필요]</span>';
    return '<div class="container"><div class="section__head"><div><span class="eyebrow">J&amp;S Support</span><h2>도입부터 사후관리까지</h2>' +
      '<p>ESPEC 기술진과 정기 기술 협력하는 제이에스 엔지니어링 서비스 조직이 사후 관리를 맡습니다. 단계별 자세한 내용은 문의해 주시면 안내해 드립니다.</p></div>' +
      a('service.html', '서비스 보기', ' class="link-arrow"') + '</div>' +
      '<ol class="flow"><li><strong>도입 상담</strong>' + t + '</li><li><strong>사양 확정</strong>' + t + '</li><li><strong>견적</strong>' + t +
      '</li><li><strong>납품·설치</strong>' + t + '</li><li><strong>A/S</strong>' + t + '</li></ol></div>';
  }

  var h = document.getElementById('site-header'); if (h) h.outerHTML = buildHeader();
  var f = document.getElementById('site-footer'); if (f) f.outerHTML = buildFooter();
  var s = document.querySelectorAll('[data-include="support"]');
  for (var i = 0; i < s.length; i++) s[i].innerHTML = buildSupport();
})();
