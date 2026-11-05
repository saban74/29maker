# 메인 시안 3차 브리프: 갤러리 레퍼런스 21종 (2026-11-03)

사용자 요청: "awwwards, godly, siteinspire 디자인 참조 사이트를 보고 좋은 디자인을 선별해서 각 7개씩 디자인 시안."

레퍼런스 21개와 각 디자인 핵심, "J&S에 빌릴 원리", 확실도는 **`design/concepts3/REFERENCES.md`**에 있습니다. 반드시 맡은 레퍼런스 항목을 먼저 읽으세요. Awwwards 항목은 `.claude/skills/design-taste-frontend/library/sites.json`에 더 자세한 기록(hero, type, colour, layout, sections, steal, motion)이 있으니 python3 -I 로 해당 name을 뽑아 함께 읽으세요.

| 묶음 | 폴더 | 레퍼런스 |
|---|---|---|
| AW. Awwwards | `design/concepts3/AW/01` ~ `07` | REFERENCES.md A1~A7 |
| GD. Godly(Recent) | `design/concepts3/GD/01` ~ `07` | REFERENCES.md B1~B7 |
| SI. siteinspire | `design/concepts3/SI/01` ~ `07` | REFERENCES.md C1~C7 |

시안 번호는 레퍼런스 번호와 같습니다(AW/01 = A1 Seasats).

## 원칙
- **원본을 베끼지 않습니다.** 레퍼런스의 디자인 언어(첫 화면 구성, 색의 역할, 글자 체계, 사진 다루는 법, 레이아웃 원리, 움직임)만 빌려 제이에스 엔지니어링에 맞게 새로 만듭니다. 로고, 문구, 고유 그래픽, 브랜드 색을 그대로 쓰지 않습니다.
- 레퍼런스 설명이 `[미확인]`이거나 확실도가 낮은 부분은 상상으로 채우지 말고, 확인된 원리만 쓰고 나머지는 이 회사에 맞게 스스로 결정합니다. NOTE.md에 "레퍼런스에서 빌린 것 / 스스로 정한 것"을 나눠 적습니다.
- 업종이 먼 레퍼런스(REFERENCES.md에 "형식만 빌릴 것"으로 표시)는 배치·글자 형식만 빌립니다.
- **이 레퍼런스의 언어가 Taste Skill의 금지 규칙이나 참고 시안 우선 규칙보다 우선합니다.** 단 사실·접근성 규칙은 그대로.

## 공통 조건 (2차와 같음)
- 범위: **메인 페이지 1장**. 시안마다 폴더(`index.html` + `style.css`, 필요하면 `script.js`) + `NOTE.md`. 묶음 안 공통 파일은 담당자별 이름(`_base-<담당>.css`)으로.
- 회사: 제이에스 엔지니어링 / J&S ENGINEERING, "ESPEC 한국 단독 총대리점", 1981년 설립(45년). 회사 정보 `research/company/company.md`, 제품 `research/espec/products/`, 뉴스 `research/espec/news.md`.
- 메뉴: 회사소개 / 제품소개 / 솔루션 / 기술자료 / 서비스 / 고객지원 + 견적문의(링크 `#` 가능).
- **사실만:** 근거 있는 숫자(1981, 45년, 연 3~4회 세미나, 제품 사양)만. 지어낸 실적·고객 수·인증·후기·해외 거점 금지. 모르는 값은 `[확인 필요]`.
- 순수 HTML/CSS/JS, 외부 JS 라이브러리 없음. 글꼴: Pretendard(jsDelivr) 기본 + Google Fonts에서 1종까지(전체 2종 이내, 시스템 고정폭은 데이터 표기용으로 허용).
- 휴대폰 390px 가로 넘침 없음, 한글 `word-break: keep-all`, 키보드 포커스, `prefers-reduced-motion` 존중.
- **"고급지게":** 절제된 색(바탕·글자·강조 + 보조 1~2), 큰 글자 대비, 넉넉한 여백, 움직임은 한두 곳만 정교하게.
- 맨 아래 작은 글씨: "장비 이미지 출처: ESPEC Corp. 공식 웹사이트 및 제품 카탈로그".

## 사진
`design/concepts2/assets/` 를 그대로 씁니다(시안 HTML에서 `../../../concepts2/assets/hires/파일명`, `../../../concepts2/assets/web/파일명`). 목록과 크기는 `design/concepts2/BRIEF.md`의 "사진" 절. 원본 가로의 1.2배 넘게 키우지 않기. 건물·현장·사람 사진 없음(필요하면 글로 적은 자리표시). 외부 사진 금지.

## 스킬
`.claude/skills/frontend-design/SKILL.md`(필수), `.claude/skills/design-taste-frontend/SKILL.md`와 `references/`(원칙). 스크립트(`*.mjs`)는 실행하지 않습니다.
