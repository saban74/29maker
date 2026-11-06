/* 제이에스 엔지니어링 디자인 시스템 스크립트 (순수 JS, 라이브러리 없음)
   이 파일이 없어도 페이지 내용은 모두 보입니다. 아래 기능만 빠집니다.
   1) 머리말이 스크롤하면 불투명해짐  2) 큰 글자 목록에서 사진 바꾸기  3) 제품 갤러리 썸네일
   4) 제품 탭 현재 위치 표시          5) 3D 보기 (실패하면 사진으로)    (+ 모바일 메뉴 접근성, Esc 로 닫기) */
(function () {
  'use strict';
  var d = document;
  d.documentElement.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1) 머리말: 첫 화면 위에서는 투명, 스크롤하면 불투명 */
  var header = d.querySelector('.site-header');
  function syncHeader() {
    if (!header) return;
    var open = d.querySelector('.nav-toggle:checked');
    header.classList.toggle('is-solid', window.scrollY > 24 || !!open);
  }
  window.addEventListener('scroll', syncHeader, { passive: true });
  var navToggle = d.querySelector('.nav-toggle');
  /* 모바일 메뉴: 열림 상태를 화면 읽기 프로그램에 알리고, Esc 키로 닫는다 */
  function syncNavLabel() {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', navToggle.checked ? 'true' : 'false');
    navToggle.setAttribute('aria-label', navToggle.checked ? '메뉴 닫기' : '메뉴 열기');
  }
  if (navToggle) {
    navToggle.addEventListener('change', function () { syncHeader(); syncNavLabel(); });
    d.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && navToggle.checked) {
        navToggle.checked = false; syncHeader(); syncNavLabel(); navToggle.focus();
      }
    });
    syncNavLabel();
  }
  syncHeader();

  /* 1-2) 2차 디자인 머리말(.hd): 휴대폰 햄버거 버튼을 누르면 메뉴가 펼쳐지고, 다시 누르거나 Esc 를 누르면 닫힌다 */
  var hd = d.getElementById('site-header');
  var menuBtn = hd ? hd.querySelector('.menu-btn') : null;
  if (menuBtn) {
    var setMenu = function (open) {
      hd.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    };
    menuBtn.addEventListener('click', function () { setMenu(!hd.classList.contains('is-open')); });
    d.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && hd.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* 2) b-aw-bigword-list: 단어에 올리거나 포커스를 주면 오른쪽 사진이 바뀐다 */
  [].forEach.call(d.querySelectorAll('.b-aw-bigword-list'), function (block) {
    var links = [].slice.call(block.querySelectorAll('.bw-list a'));
    var imgs = [].slice.call(block.querySelectorAll('.bw-photo img'));
    function show(i) {
      links.forEach(function (a, k) { a.classList.toggle('is-on', k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
    }
    links.forEach(function (a, i) {
      a.addEventListener('mouseenter', function () { show(i); });
      a.addEventListener('focus', function () { show(i); });
    });
  });

  /* 3) b-r-product-hero: 썸네일을 누르면 큰 사진 교체 */
  var main = d.getElementById('main-photo');
  var thumbs = d.querySelectorAll('.pdp__thumbs button');
  [].forEach.call(thumbs, function (b) {
    b.addEventListener('click', function () {
      if (main) {
        main.src = b.getAttribute('data-src'); main.alt = b.getAttribute('data-alt');
        /* 사진마다 가로·세로 크기가 다르므로 속성도 함께 바꾼다 (버튼의 data-w / data-h) */
        if (b.getAttribute('data-w')) main.setAttribute('width', b.getAttribute('data-w'));
        if (b.getAttribute('data-h')) main.setAttribute('height', b.getAttribute('data-h'));
      }
      [].forEach.call(thumbs, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
  });

  /* 4) b-product-tabs: 지금 보고 있는 구역의 탭에 aria-current 표시 */
  var tabLinks = [].slice.call(d.querySelectorAll('.b-product-tabs a[href^="#"]'));
  if (tabLinks.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tabLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    tabLinks.forEach(function (a) {
      var t = d.getElementById(a.getAttribute('href').slice(1));
      if (t) io.observe(t);
    });
  }

  /* 5) b-aw-3d: 모델 파일이 있고 model-viewer 가 동작할 때만 3D 로 바꾼다.
        상태: fallback(사진 + "3D 모델 준비 중") -> loading -> ready(3D). 어느 단계에서든 실패하면 fallback. */
  [].forEach.call(d.querySelectorAll('.b-aw-3d__stage'), function (stage) {
    var mv = stage.querySelector('model-viewer');
    var url = stage.getAttribute('data-model');
    var rot = d.querySelector('[data-3d-rotate]');
    var sec3d = stage.closest ? stage.closest('.b-aw-3d') : null;
    function set(s) {
      stage.setAttribute('data-state', s); if (rot) rot.disabled = (s !== 'ready');
      if (sec3d) sec3d.setAttribute('data-3d-state', s); /* 안내 문장([data-3d-hint])을 상태에 맞게 바꾸는 신호 */
    }
    set('fallback');
    if (!mv || !url || !window.fetch || !window.customElements) return;

    function waitDefined() {
      return Promise.race([
        window.customElements.whenDefined('model-viewer'),
        new Promise(function (_, no) { setTimeout(no, 4000); })
      ]);
    }
    fetch(url, { method: 'HEAD' }).then(function (r) {
      if (r.status === 404 || r.status === 403 || r.status === 410) throw new Error('no model');
      return waitDefined();
    }).then(function () {
      set('loading');
      mv.addEventListener('load', function () { set('ready'); });
      mv.addEventListener('error', function () { set('fallback'); });
      if (reduce) mv.removeAttribute('auto-rotate');
      mv.setAttribute('src', url);
      setTimeout(function () { if (stage.getAttribute('data-state') === 'loading') set('fallback'); }, 25000);
    }).catch(function () { set('fallback'); });

    if (rot) rot.addEventListener('click', function () {
      var on = mv.hasAttribute('auto-rotate');
      if (on) mv.removeAttribute('auto-rotate'); else mv.setAttribute('auto-rotate', '');
      rot.setAttribute('aria-pressed', on ? 'false' : 'true');
      rot.textContent = on ? '자동 회전 켜기' : '자동 회전 끄기';
    });
  });

  /* (참고) 시안 비교용 "스타일 미리보기 전환" 코드는 실제 사이트에서 쓰지 않으므로 이 파일에서 제거했습니다.
     원본은 design/system/script.js 6번에 남아 있습니다. */
})();
