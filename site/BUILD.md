# 홈페이지 본 제작 안내 (2026-11-04)

사용자 결정: **통합 디자인 시스템(AW05 + R06)**으로 전체 사이트를 만든다. 메인은 **A안**(`design/system/templates/main-a.html`).

## 기준 자료
- 디자인 시스템: `design/system/README.md`(블록 목록, 조립법), `design/system/catalog.html`(블록 HTML 견본), `design/system/templates/main-a.html`(메인), `design/system/templates/product.html`(제품 상세 틀).
- 기획서: `site/PLAN.md`(사이트맵, 페이지별 내용, 파일 이름은 2장 표).
- 사실 자료: `research/company/company.md`, `research/espec/products/*.md`, `research/espec/news.md`, `research/espec/files.md`(카탈로그 링크).
- 이전 제작본(내용 참고용, 디자인은 버림): git 기록의 이전 `site/` 페이지들. 필요하면 `git show HEAD~1:site/products/hast.html` 처럼 내용 문구를 참고할 수 있다.

## 폴더 구조 (이미 준비됨)
- `site/css/tokens.css`, `site/css/components.css`: 디자인 시스템 원본 복사본. **고치지 말 것.** 페이지 묶음에 필요한 추가 규칙은 담당 파일에만:
  - 공통·일반 페이지 담당: `site/css/pages.css`
  - 제품 담당: `site/css/products.css`
  - 솔루션 담당: `site/css/solutions.css`
- `site/js/script.js`: 디자인 시스템 스크립트(고치지 말 것). 추가 동작이 필요하면 담당별 `site/js/pages.js`, `products.js`, `solutions.js`.
- 3D 보기는 2026-11-04 사용자 결정으로 사이트에서 뺐음(CAD 모델이 실사처럼 보이지 않음). 3D 블록과 뷰어는 `design/system/`에만 남아 있음.
- `site/assets/img/hires/`, `site/assets/img/web/`: 장비 사진(출처 `SOURCES.md`). 원본 가로 1.2배 넘게 키우지 않기.

## 공통 머리말·꼬리말
`design/system/templates/main-a.html`의 `<header class="site-header ...">`와 `<footer class="site-footer">`를 기준으로 모든 페이지에 같은 내용을 넣는다. 링크는 실제 파일로:
- 메뉴 6개: 회사소개 `about.html`, 제품소개 `products/index.html`, 솔루션 `solutions/index.html`, 기술자료 `resources.html`, 서비스 `service.html`, 고객지원 `contact.html`(펼침 메뉴가 있으면 뉴스 `news.html`, 견적·문의 `contact.html`), 견적문의 버튼 `contact.html`.
- 하위 폴더(`products/`, `solutions/`) 페이지는 경로 앞에 `../`.
- 첫 화면이 AW형 큰 글자(`b-aw-wordcut-hero`, `b-aw-product-hero`)인 페이지만 `site-header--overlay`, 나머지는 기본 머리말.
- `<head>`의 글꼴·CSS·스크립트 연결은 템플릿과 같게(경로만 `css/…`, `js/…`, 하위 폴더는 `../css/…`).
- 맨 아래 "장비 이미지 출처: ESPEC Corp. 공식 웹사이트 및 제품 카탈로그" 유지.

## 제품 상세 첫 화면 기본값 (`<body data-hero>`)
- **aw**: platinous-j, ar-series, thermal-shock(TSA), hast(EHS), walk-in — 고해상도 회색 배경 사진이 있는 제품. 큰 단어는 제품 계열명(예: PLATINOUS, AR SERIES, TSA, HAST/EHS, WALK-IN). 
- **r**: sh-series, mtp-101, tcc-series, industrial-oven, battery, semiconductor-evaluation — 작은 웹 사진만 있는 제품.
- 실제 사이트에는 "스타일 미리보기" 전환 버튼(`style-switch`)을 넣지 않는다(템플릿 주석 참고).

## 공통 규칙
- 사실만. 사양은 `research/espec/products/`, 회사 내용은 `company.md`. 모르는 값은 `[확인 필요]`. 판독 불가 연혁 항목은 쓰지 않는다. 방문자에게 개발자용 문장("수집 자료에 없어" 등)을 보이지 않는다.
- 모든 링크는 실제 파일로(없는 파일 링크 0). ESPEC 원문·카탈로그 링크는 `research/espec/` 의 주소.
- 휴대폰 390px 가로 넘침 없음(표는 가로 스크롤 상자 안, `th, td { position: relative }`로 숨김 글자가 빠져나가지 않게 — components.css에 없으면 담당 CSS에 추가), `word-break: keep-all`, 키보드 포커스, 움직임 줄이기 존중.
- 문의 폼은 아직 전송 연결이 없다: `[확인 필요: 문의 접수 방법 연결 전]` 노란 표시 유지.
- 각 섹션 위 한국어 주석.
