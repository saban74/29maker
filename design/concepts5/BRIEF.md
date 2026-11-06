# 2차 시안 브리프 (2026-11-05)

## 사용자 요청 (원문 요약)
- 1차(밝은 b01+b05)는 보관. **www.espec.co.jp 와 같은 느낌, 유사한 구성**으로 새 시안.
- 장비는 제품 페이지처럼 **원본 사진 위주**, 카탈로그 이미지 참조.
- 제품 페이지: 각 제품 첫 화면에 **제조사 장비 페이지 사진** + **정돈된 장비 소개 PDF 다운로드**.
- 회사 메인: **대표 장비 5종 각각 멋진 시안 5개** + **5종이 모두 모인 시안 4개(각각 다른 스타일)**.
- 추가 사진: 저작권 없는 이미지나 생성 이미지로 채움 → 이 환경에서 무료 사진 사이트 접속이 막혀 있음. 자리만 만들고 `data-gen="설명"` 속성 + 연회색 그라데이션/선 그림(SVG)으로 채워 둠(나중에 생성 이미지로 교체).

## ESPEC 사이트 느낌 (참고 캡처: design/reference/espec-jp/)
- top-full.png(일본 본사 메인), en-top-*.png, en-products-*.png, pj-top.png·pj-half.png(제품 상세), tsa-top.png, list-top.png(제품 목록).
- 특징: 흰 바탕, **오렌지 계열 포인트 선(헤더 아래 굵은 선)**, 남색 버튼·아이콘 타일, 작은 글씨(14~15px), 섹션 제목 가운데 정렬 + 작은 영문 부제, 회색 띠 구역, 정돈된 2~3단 링크 목록, 오른쪽 화살표 링크, 큰 메인 비주얼 + 아래 공지 박스, 제품 상세는 회색 그라데이션 띠 안 제목+장비 사진 + 오른쪽 사이드(카탈로그·PDF·문의).
- **주의: 주인은 제이에스 엔지니어링.** ESPEC 로고·"ESPEC CORP." 카피·오렌지 로고색 그대로 쓰지 않기. 포인트 색은 ESPEC 오렌지(#e8650a 류) 대신 **제이에스 색**: 포인트 `--accent:#d9480f`(조금 다른 주황) 또는 남색 `--navy:#1b3a6b` 중심으로. 로고는 글자 로고 "J&S ENGINEERING / 제이에스 엔지니어링".

## 공통 자료
- 공통 CSS: `design/concepts5/base.css` (토큰·머리말·꼬리말·버튼·제목·링크목록). 각 시안은 이것 + 자기 CSS.
- 머리말/꼬리말 HTML: `design/concepts5/_header-footer.html` 을 그대로 복사해 쓰기(링크는 `#`).
- 사진(원본 카탈로그, 품질 좋음): `design/concepts5/assets/catalog/`
  - Platinous J: pj-lineup.jpg(4대, 1812×1359), pj-single-1~4.jpg(1대씩, ~1450×980)
  - 열충격 TSA: tsa-pair.jpg(2대, 2079×1560), tsa-lineup.jpg(3대), tsa-single-1/2.jpg, tsa-large.jpg(대형)
  - HAST EHS: ehs-lineup.jpg(3대), ehs-twin.jpg(2단), ehs-single-small/large.jpg
  - AR 시리즈: ar-pair.jpg(2대, 1714×1143)
  - 워크인 TBE: walkin-white.jpg, walkin-white-2.jpg, walkin-open.jpg(문 열림), walkin-dark-1/2.jpg(어두운 배경 극적), walkin-assembly.jpg(조립 장면, 사람)
  - 제조사 홈페이지 메인 사진(배경 투명 PNG, 작음): `site/assets/img/web/*-mv.png`
  - 산업 현장 사진: `site/assets/img/industry/*.jpg`
  - 경로는 시안 파일 기준 상대경로(`assets/catalog/...`, `../../site/assets/img/...`).
- 대표 장비 5종(카탈로그가 있는 5종): **Platinous J 항온항습기, 열충격 시험기 TSA, HAST 가속수명 시험기 EHS, AR 시리즈 급속 온도변화 시험기, 워크인 챔버 E 시리즈(TBE)**.
- 사실 자료: `content/products/<slug>.md` (platinous-j, thermal-shock, hast, ar-series, walk-in), `research/espec/products/`, `research/company/company.md`. 수치는 여기서만. 없으면 쓰지 않거나 `[확인 필요]`.
- 연락처: 대표전화 02-557-0505, 팩스 02-557-2253, 본사·공장 충남 아산시 둔포면 관대안길 31, 서울사무소 서울시 강남구 삼성로82길 26 제이에스B/D 3층, 대구지사 대구광역시 북구 유통단지로 8길 121-3 2층, 광주지사 광주광역시 광산구 첨단내촌로 70번길 64-24 201호.

## 공통 규칙
- 글씨: 본문 15px, 작은 글 13px, 구역 제목 26~28px, 메인 큰 카피 최대 48~56px. ESPEC처럼 단정하고 작게.
- 사진 원본보다 1.2배 넘게 키우지 않기. 장비 사진은 자르지 말고 온전히(배경 연회색과 자연스럽게).
- 휴대폰 390px 가로 넘침 없음, 햄버거 메뉴(base.css에 있음), `word-break: keep-all`.
- 각 파일 맨 위 `<!-- 한국어 한 줄 설명 -->`.
