# 3차 메인 시안 브리프 (2026-11-09)

사용자 요청: "제조사 홈피를 참조해서 메인 디자인 10개 다시 뽑아줘"
- 제조사 = ESPEC (www.espec.co.jp). 참고 캡처: `design/reference/espec-jp/` (top-full.png 일본 메인, top-top.png, en-top-full.png 영문 메인, en-products-full.png 제품 목록, pj-top.png/pj-half.png 제품 상세, list-top.png, tsa-top.png). Read로 꼭 열어 볼 것.
- 현재 운영 중인 메인(2차, G1 쇼룸형)은 `site/index.html` + `site/css/home.css`, 미리보기 `design/concepts5/previews/final-g1-top.png`. 이번 10개는 이것과 **다른** 안이어야 함(같은 쇼룸 한 줄형 반복 금지).
- 이번에도 ESPEC 느낌: 흰 바탕, 정돈된 정보, 작은 글씨, 큰 메인 비주얼 + 아래 공지 박스, 가운데 구역 제목 + 작은 영문 부제, 남색 타일·화살표 링크 목록, 회색 띠 구역, 뉴스 탭+날짜 목록, 촘촘한 꼬리말.
- **주인은 제이에스 엔지니어링.** ESPEC 로고·"ESPEC CORP." 문구·ESPEC 오렌지 로고색 그대로 쓰지 않음. 로고는 글자 로고 "J&S ENGINEERING / 제이에스 엔지니어링 · ESPEC 한국 총대리점".

## 공통 자료
- 공통 CSS: `design/concepts6/base.css` (운영 사이트 base.css 복사본: 토큰·머리말·꼬리말·버튼·.sec/.sec-h/.lk/.tiles 등). 각 시안은 base.css + 자기 CSS.
- 머리말/꼬리말 HTML: `design/concepts5/_header-footer.html` (오른쪽 "서비스접수/견적문의" 버튼). 그대로 복사.
- 장비 원본 사진: `site/assets/img/catalog/*.jpg` (pj-lineup, pj-single-1~4, tsa-pair, tsa-lineup, tsa-single-1/2, tsa-large, ehs-lineup, ehs-twin, ehs-single-*, ar-pair, walkin-white, walkin-white-2, walkin-open, walkin-dark-1/2, walkin-assembly), 배경 투명 PNG `site/assets/img/web/*-mv.png`, 산업 사진 `site/assets/img/industry/*.jpg`. 시안 파일 기준 상대경로 `../../site/assets/img/...`. 원본보다 1.2배 넘게 키우지 않기. 장비 사진 자르지 않기.
- 사실: `content/products/*.md`, `content/news/*.md`, `research/company/company.md`만. 모르는 값 쓰지 않거나 [확인 필요].
- 연락처: 대표전화 02-557-0505, 팩스 02-557-2253, 본사·공장 충남 아산시 둔포면 관대안길 31, 서울사무소 서울시 강남구 삼성로82길 26 제이에스B/D 3층, 대구지사 대구광역시 북구 유통단지로 8길 121-3 2층, 광주지사 광주광역시 광산구 첨단내촌로 70번길 64-24 201호.
- 사진이 없는 자리(사람·건물 등)는 `data-gen="생성 이미지: ..."` 회색 자리.

## 규칙
- 글씨: 본문 15px, 작은 글 13px, 구역 제목 26~28px, 메인 큰 카피 최대 48~56px.
- 390px 가로 넘침 없음, 햄버거, word-break: keep-all. 각 파일 맨 위 <!-- 한국어 한 줄 설명 -->.
- 각 시안은 메인 한 페이지 전체(첫 화면 → 공지 → 제품정보 → 서비스 → 회사 → 뉴스 → 꼬리말 등).
