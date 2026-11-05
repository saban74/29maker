# 통합 디자인 시스템 브리프: AW05 + R06 (2026-11-04)

사용자 결정: "AW05와 R06 스타일로 구성. 메인 페이지와 제품 페이지는 두 스타일을 혼용할 수 있도록."

- **AW05** (`design/finalists/AW05/`): 회색 스튜디오 바탕, 무채색, 거대한 제품명 글자 뒤에 장비가 서서 가운데 글자를 가리는 장치(word-cut), Michroma + Pretendard, 부분 사진 분해도, 큰 글자 목록.
- **R06** (`design/finalists/R06/`): 흑연·은색 모노크롬, 흑백 사진, 가는 선, 참고 시안 구성(메뉴 6개 + 견적문의, 영문 큰 문구, 01~04 바로가기, 산업 카드, 숫자 줄, 파트너), 정돈된 기업형 제품 상세(사진 갤러리 + 핵심 수치 + 체크 목록 + 탭).

## 목표
두 스타일이 **같은 색·글꼴·간격 체계(토큰)** 위에서 움직이게 통합하고, 각 스타일의 대표 구성 요소를 **블록(섹션 부품)**으로 만들어 메인과 제품 페이지에서 자유롭게 섞어 쓴다.

## 만들 것 → `design/system/`
1. `tokens.css`: 공통 토큰. 두 스타일이 공유할 무채색 팔레트(스튜디오 회색, 흑연, 은색, 흰색, 글자색, 선 색), 강조색 1개(R06·AW05에서 합의, 예: 황동 또는 없음), 글꼴(Michroma = 영문 디스플레이, Pretendard = 본문·한글), 글자 크기 단계, 간격 단계, 최대 폭, 모서리(사각), 움직임 시간.
2. `components.css`: 공통 부품(머리말·메뉴 6개 + 견적문의, 꼬리말, 버튼, 링크, 라벨, 표, 탭, 경로 표시, [확인 필요] 표시) + 블록. 블록 이름에 출처 접두사: `b-aw-*`(AW05 계열), `b-r-*`(R06 계열). 최소한 다음 블록:
   - 메인용: `b-aw-wordcut-hero`(거대 단어 + 장비), `b-r-hero`(영문 큰 문구 + 장비 사진 + 01~04 바로가기), `b-r-shortcuts`, `b-r-industries`(산업 6칸), `b-aw-bigword-list`(큰 글자 제품 목록, 올리면 사진 바뀜), `b-r-products`(제품 카드 줄), `b-r-stats`(숫자 줄), `b-aw-exploded`(부분 사진 가로 분해도), `b-r-partners`, `b-r-news`, `b-cta`(견적 띠).
   - 제품 상세용: 첫 화면 2종 `b-aw-product-hero`(word-cut) / `b-r-product-hero`(갤러리 + 핵심 수치 + 체크 + 버튼), 공통 `b-product-tabs`, `b-product-kpi`, `b-product-features`, `b-product-spec`(모델별 사양표), `b-product-support`(지원 5단계), `b-product-docs`, `b-product-related`, 선택 `b-aw-3d`(3D 보기 자리, 아래 3D 절).
   - 블록은 어떤 순서로 쌓아도 이웃 블록과 간격·배경 전환이 자연스러워야 한다(배경 톤: `tone-studio`, `tone-graphite`, `tone-white` 같은 수식 클래스).
3. `catalog.html`: 모든 블록을 한 페이지에 나열한 **부품 견본집**(블록 이름, 출처, 쓰는 곳, HTML 조각 예시). 입문자도 "이 블록을 복사해 붙이면 된다"를 알 수 있게.
4. `templates/main-a.html`, `templates/main-b.html`: 같은 블록으로 순서·조합만 바꾼 메인 2안(예: A = AW 첫 화면 + R 구성, B = R 첫 화면 + AW 큰 글자 목록·분해도). 
5. `templates/product.html`: Platinous J 제품 상세. `<body data-hero="aw">` / `data-hero="r"`로 첫 화면을 바꿀 수 있고, 화면 구석의 작은 **"스타일 미리보기" 전환 버튼**(aw ↔ r)으로 즉시 비교(이 버튼은 시안 확인용이며 실제 사이트에서는 `data-hero` 값만 남긴다고 주석).
6. `README.md`: 토큰 목록, 블록 목록(이름, 출처, 용도), 메인·제품 페이지를 블록으로 조립하는 방법(입문자용 한국어), `data-hero` 사용법.

## 조건
- 원본 두 후보의 CSS(`design/finalists/AW05/style.css`, `design/finalists/R06/style.css`)와 페이지를 읽고 재구성. 원본 폴더는 수정하지 않는다.
- 사실만(사양은 `research/espec/products/`), 모르는 값은 `[확인 필요]`. 회사 정보 `research/company/company.md`.
- 사진: `design/concepts2/assets/`(상대 경로). 원본 가로 1.2배 넘게 키우지 않기. R06 블록의 흑백 처리는 CSS filter로(원본 사진 그대로).
- 순수 HTML/CSS/JS, 외부 라이브러리 없음(3D 제외). 휴대폰 390px 넘침 없음(표는 가로 스크롤 상자 안, 숨김 글자 포함 확인), `word-break: keep-all`, 키보드 포커스, 움직임 줄이기 존중.
- 로고·글꼴은 미확정: 로고는 글자 워드마크(J&S ENGINEERING / 제이에스 엔지니어링).
- 맨 아래 "장비 이미지 출처: ESPEC Corp. 공식 웹사이트 및 제품 카탈로그".

## 3D (`b-aw-3d`)
- ESPEC PR-3J 3D 모델(GLB)은 **공개 허락 확인 전이라 저장소에 올리지 않는다.** 블록은 `design/system/assets/3d/pr-3j.glb`(이 파일은 작업 컴퓨터에만 있고 저장소에서 제외됨, .gitignore)를 Google model-viewer로 보여 주고, 파일이 없으면 "3D 모델 준비 중" 자리표시와 정면 사진을 보여 준다.
- model-viewer 스크립트는 저장소에 함께 둔다: `design/system/vendor/model-viewer.min.js`(Apache-2.0, v4.0.0, 메인 감독자가 넣어 둠). `<script type="module">`이라 파일을 더블클릭해 열면 동작하지 않고 웹 서버로 열어야 한다는 점을 README에 적는다.
