# 홈페이지 본 제작 안내 (2026-11-04)

> **2026-11-04 이후 변경**: 사이트는 Eleventy 로 만듭니다. 공통 머리말·꼬리말은 `site/_includes/`, 제품 상세 11개는 `site/products/product.njk` 틀 하나 + `content/products/*.md` 정보 파일입니다. 아래 "모든 페이지에 같은 내용을 넣는다", "하위 폴더는 `../`" 같은 손작업 규칙은 이제 틀이 자동으로 처리합니다. 구조는 저장소 맨 위 `README.md` 참고.

사용자 결정: **통합 디자인 시스템(AW05 + R06)**으로 전체 사이트를 만든다. 메인은 **A안**(`design/system/templates/main-a.html`).

## 2026-11-06 2차 디자인 전환 (design/concepts5)
- 시안: `design/concepts5/`(흰 바탕, 주황 `--accent` 포인트 선, 남색 버튼, ESPEC 사이트 같은 단정한 구성). 공통 CSS는 `site/css/base.css`이고, 기본 틀(`layouts/base.njk`)이 `tokens.css`·`components.css`(옛 페이지용, 유지) 뒤에 `base.css`를 불러와 새 머리말·꼬리말·버튼이 이깁니다.
- 공통 머리말·꼬리말: `_includes/partials/header.njk`, `footer.njk`(맨 위 작은 줄, 메뉴 6개, 오른쪽 "서비스접수 → contact.html?type=as" / "견적문의 → contact.html?type=quote"). 햄버거 메뉴 동작은 `js/script.js` 1-2번.
- 메인: `site/index.html` + `css/home.css`. 첫 화면 G1(쇼룸 5종, 50%)·G2·G3·G4(각 약 16.7%)가 무작위로 나오며 주소 뒤 `?hero=g1~g4` 로 고정할 수 있습니다. 장비 5종의 문구·사진은 `_data/homeShowcase.js`, 수치는 제품 md의 핵심 수치, 픽업은 `_data/homePickup.js`, 공지 띠·뉴스는 `content/news/`에서 자동입니다.
- 제품 상세 `products/product.njk`, 제품 목록 `products/index.html`(`css/products.css`, `js/products.js` 검색), 그 밖의 라인업은 `_data/otherLineup.js`.
- 장비 소개서(PDF용 A4): `products/sheet.njk`가 제품마다 `products/sheet-<주소>.html`을 만듭니다(noindex, sitemap 제외, `css/sheet.css`). 이를 변환한 PDF를 `site/assets/pdf/<주소>.pdf`에 두면 상세 페이지의 다운로드 버튼이 연결됩니다.
- 제품 md 새 칸: `catalog_image`(상세 첫 화면·목록·소개서의 큰 사진). 기존 `gallery`는 "모델별 사진" 구역(사진 아래 설명 글 = `label`)으로 바뀌었습니다. 큰 사진은 `site/assets/img/catalog/`에 둡니다(원본은 `design/concepts5/assets/catalog/`).
- 옛 시안과 이름이 겹치지 않도록 새 CSS의 사진 칸은 `.pt`, 사양표는 `.stbl`, 주석은 `.pn`을 씁니다.

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

## 제품 상세 페이지 (2026-11-05 변경)
- 모든 제품이 `site/products/product.njk` 한 틀("한 화면" 구성)을 씁니다: 첫 화면(제품명·사진·핵심 수치·특징 요약·버튼) → 구역 바로가기 → 사양표 → 개요 → 특징 → 규격·수상 → 지원 → 자료 → 관련 제품, 오른쪽 고정 사이드바(카탈로그·견적·대표전화·제품 목록).
- 예전의 `<body data-hero="aw|r">` 첫 화면 구분과 거대한 단어 첫 화면은 제품 페이지에서 쓰지 않습니다(메인·회사소개에만 `b-aw-wordcut-hero`). 스타일은 `css/products.css`.

## 메인 (2026-11-05)
- 2026-11-05: 메인은 밝은 b01+b05 합본(design/concepts4). 첫 화면은 b01(둥근 틀·검은 바로가기 띠), 바로 아래 b05의 3칸 정보 줄, 그 아래는 흰 바탕·얇은 선 구역. 메인 전용 CSS는 `css/home.css`(index.html 앞부분 `extraCss: home`, `bodyClass: home`)이고 옛 `b-aw-wordcut-hero`는 메인에서 쓰지 않습니다.

## 공통 규칙
- 사실만. 사양은 `research/espec/products/`, 회사 내용은 `company.md`. 모르는 값은 `[확인 필요]`. 판독 불가 연혁 항목은 쓰지 않는다. 방문자에게 개발자용 문장("수집 자료에 없어" 등)을 보이지 않는다.
- 모든 링크는 실제 파일로(없는 파일 링크 0). ESPEC 원문·카탈로그 링크는 `research/espec/` 의 주소.
- 휴대폰 390px 가로 넘침 없음(표는 가로 스크롤 상자 안, `th, td { position: relative }`로 숨김 글자가 빠져나가지 않게 — components.css에 없으면 담당 CSS에 추가), `word-break: keep-all`, 키보드 포커스, 움직임 줄이기 존중.
- 문의 폼은 아직 전송 연결이 없다: `[확인 필요: 문의 접수 방법 연결 전]` 노란 표시 유지.
- 각 섹션 위 한국어 주석.
