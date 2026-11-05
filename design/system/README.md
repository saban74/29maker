# 제이에스 엔지니어링 디자인 시스템 (AW05 + R06 통합)

AW05(회색 스튜디오, 거대한 글자)와 R06(흑연·은색, 흑백 사진, 가는 선)를 **같은 토큰** 위에 올린 부품 모음입니다.
블록은 "레고 조각"처럼 어떤 순서로 쌓아도 이어지도록 만들었습니다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `tokens.css` | 색, 글꼴, 글자 크기, 간격, 움직임 값 (여기만 바꾸면 전체가 바뀜) |
| `components.css` | 공통 부품 + 블록 (`tokens.css` 다음에 불러옴) |
| `script.js` | 작은 동작들 (머리말 투명→불투명, 큰 글자 목록 사진 바꾸기, 갤러리, 탭 표시, 3D, 스타일 미리보기). 없어도 내용은 다 보임 |
| `catalog.html` | 블록 견본집. 블록마다 "HTML 보기·복사" 창이 있음 |
| `templates/main-a.html`, `main-b.html` | 메인 2안 |
| `templates/product.html` | Platinous J 제품 상세 (첫 화면 두 가지 전환) |
| `vendor/model-viewer.min.js` | 3D 보기 도구 (Apache-2.0, v4.0.0) |
| `assets/3d/pr-3j.glb` | 3D 모델. **작업 컴퓨터에만 있고 저장소에는 없음** (ESPEC 공개 허락 확인 전) |

## 미리보기 방법 (중요)

3D 블록은 `<script type="module">`을 써서 **파일을 더블클릭해 열면 3D가 동작하지 않습니다.** (사진과 "3D 모델 준비 중"으로 보입니다. 나머지는 모두 정상입니다.)
3D까지 보려면 `design` 폴더에서 웹 서버를 켭니다.

```
cd design
python3 -m http.server 8000
```
그리고 브라우저에서 `http://localhost:8000/system/catalog.html` 을 엽니다. 사진 경로가 `../../concepts2/`라서 서버는 반드시 `design` 폴더에서 켜야 합니다.

## 토큰 (tokens.css)

- 색: `--studio-50/100/150/200`(흰 면, 기본 바탕, 줄무늬, 은회색 면), `--silver-400/500`, `--graphite-600/700/800/900`, `--ink`, 선 `--line`, 강조 `--brass`(황동 한 점: 링크 밑줄, 포커스, 현재 위치), `--tbd-bg/fg`([확인 필요] 노란 표시)
- 글꼴: `--font-display` = Michroma(영문·숫자 큰 글자 전용), `--font-body` = Pretendard(본문·한글)
- 글자 크기: `--fs-caption 14` · `--fs-body 16` · `--fs-lead 18` · `--fs-h3` · `--fs-h2`(R 구역 제목) · `--fs-hero-en`(R 첫 영문 문구) · `--fs-num`(숫자) · `--fs-word`(큰 글자 목록) · `--fs-big`(AW 구역 제목) · `--fs-giant`
- 간격: `--sp-1`~`--sp-10`(4px 단위), `--pad`(좌우 여백, 두 스타일 공통), `--sec-y`(블록 위아래), `--maxw 1440px`
- 모양: `--r: 0`(모서리 사각), `--photo-bw`(R 블록 흑백 사진 처리)
- 움직임: `--dur-fast/dur/dur-slow/dur-hero`, `--ease`. 움직임 줄이기 설정이면 모두 꺼짐

원본에서 합친 부분: R의 Inter 는 쓰지 않고 영문 큰 글자는 모두 Michroma 로 통일했습니다. 황동은 원본 #a8864a 에서 #9a7a3c 로 조금 진하게 했습니다(밝은 바탕에서 포커스 링 대비 3:1 확보). 좌우 여백은 AW 24px / R 48px 이던 것을 `--pad` 하나(화면 폭에 따라 20~56px)로 통일했습니다.

## 톤 (배경 바꾸는 법)

블록에 클래스 하나만 붙입니다. 글자색, 선 색, 버튼 색이 자동으로 따라 바뀝니다.

- `tone-studio` 기본 회색 / `tone-silver` 은회색 / `tone-white` 흰색 / `tone-graphite` 어두운 띠
- 같은 톤 블록이 연달아 오면 위 여백이 자동으로 없어집니다. 그래도 가능하면 **밝음-어두움을 번갈아** 쓰세요.

## 블록 목록

이름의 `b-aw-`는 AW05 계열, `b-r-`은 R06 계열, 나머지는 두 스타일이 함께 씁니다.

**메인용**

| 블록 | 출처 | 용도 |
|---|---|---|
| `b-aw-wordcut-hero` | AW05 | 거대한 단어 + 장비가 가운데 글자를 가리는 첫 화면 |
| `b-r-hero` | R06 | 영문 큰 문구 + 장비 사진(흑백) 첫 화면 |
| `b-r-shortcuts` | R06 | 01~04 바로가기 (첫 화면 바로 아래) |
| `b-r-industries` | R06 | 산업 6칸 (사진 자리표시) |
| `b-aw-bigword-list` | AW05 | 큰 글자 제품 목록, 올리면 사진이 바뀜 |
| `b-r-products` | R06 | 제품 카드 줄 (`card-prod`) |
| `b-aw-numbers` | AW05 | 큰 글자 네 줄 숫자 + 사진 |
| `b-aw-exploded` | AW05 | 부분 사진 가로 분해도 |
| `b-r-stats` | R06 | 숫자 줄 |
| `b-r-partners` | R06 | 파트너 |
| `b-r-news` | R06 | 뉴스 카드 3장 |
| `b-cta` | 공통 | 견적 띠 |

**제품 상세용**

| 블록 | 출처 | 용도 |
|---|---|---|
| `b-aw-product-hero` | AW05 | 첫 화면 ① (word-cut + 경로 + 버튼 3개) |
| `b-r-product-hero` | R06 | 첫 화면 ② (갤러리 + 핵심 수치 + 체크 목록 + 버튼) |
| `b-product-tabs` | 공통 | 스크롤해도 붙어 있는 탭, 현재 구역 표시 |
| `b-product-kpi` | AW05 | 핵심 수치 큰 글자 (`only-aw`: AW 첫 화면일 때만 표시) |
| `b-product-overview` | 공통 | 이런 시험에 씁니다 (사진이 큰 글자를 가림) |
| `b-aw-3d` | AW05 계열 | 3D 보기 (실패하면 사진 대체) |
| `b-product-features` | 공통 | 특징. 기본 큰 수치, `--cards` 붙이면 카드형 |
| `b-product-spec` | 공통 | 모델별 사양표 |
| `b-product-awards` | AW05 | 규격과 수상 |
| `b-product-support` | 공통 | 지원 5단계 |
| `b-product-docs` | 공통 | 자료 목록 |
| `b-product-related` | 공통 | 함께 보는 장비 |

**공통 부품:** `site-header`(메뉴 6개 + 견적문의), `site-footer`, `btn`(`--ghost` `--sm` `--light`), `link`, `link-arrow`, `label`, `chip`, `tbd`([확인 필요]), `crumbs`(경로), `table-scroll` + `spec`(표), `ph`(사진 자리), `crop`/`pack`(사진 자르기).

## 페이지를 블록으로 조립하는 법

1. `templates/main-a.html`을 복사해 새 파일을 만듭니다.
2. `<main>` 안에서 `catalog.html`의 블록을 복사해 붙이거나 순서를 바꿉니다. (견본집의 코드는 templates 폴더 기준 경로입니다.)
3. 블록의 `tone-...` 클래스로 배경을 바꿔 밝음과 어두움이 번갈아 오게 맞춥니다.
4. 페이지에는 `h1`이 하나, 블록마다 `h2`가 있어야 합니다. 첫 화면 블록 안의 제목이 `h1`입니다.
5. 사진 경로, `[확인 필요]`, 문구만 새 내용으로 바꿉니다.
6. 머리말이 AW 첫 화면 위에 투명하게 겹쳐야 하면 `<header class="site-header site-header--overlay">`, R 첫 화면이면 `site-header` 그대로.
7. 페이지 맨 아래에 `<script src="../script.js" defer></script>`를 넣습니다.

메인 구성 순서(톤):
- **A안** AW 첫 화면 + R 구성: `b-aw-wordcut-hero` → `b-r-shortcuts`(graphite) → `b-r-industries`(studio) → `b-r-products`(white) → `b-aw-numbers`(silver) → `b-aw-exploded`(graphite) → `b-r-partners`(studio) → `b-r-news`(white) → `b-cta`(graphite)
- **B안** R 첫 화면 + AW 목록·분해도: `b-r-hero` → `b-r-shortcuts`(graphite) → `b-aw-bigword-list`(studio) → `b-r-industries`(white) → `b-aw-exploded`(graphite) → `b-r-products`(studio) → `b-r-stats`(graphite) → `b-r-partners`(studio) → `b-r-news`(white) → `b-cta`(graphite)

## 제품 상세의 `data-hero`

`templates/product.html`의 `<body data-hero="aw">`(거대한 단어 + 장비) 또는 `data-hero="r"`(갤러리 + 핵심 수치)로 첫 화면을 고릅니다.
- 화면 왼쪽 아래의 **"스타일 미리보기" 버튼**을 누르면 두 첫 화면을 바로 비교할 수 있습니다. 주소 뒤에 `?hero=r` 또는 `?hero=aw`를 붙여도 됩니다.
- **이 버튼은 시안 확인용입니다.** 실제 사이트에서는 `data-hero` 값 하나만 남기고, 버튼 블록(`class="style-switch"`)과 안 쓰는 첫 화면 블록을 지웁니다.
- `data-hero="r"`이면 `only-aw` 블록(핵심 수치 큰 글자)이 숨겨집니다. R 첫 화면에 핵심 수치가 이미 있기 때문입니다.

## 3D 블록 (`b-aw-3d`)

- 모델 파일 경로는 `data-model="../assets/3d/pr-3j.glb"`(templates 기준). 이 파일은 `.gitignore`로 저장소에서 제외되어 작업 컴퓨터에만 있습니다.
- 처음에는 정면 사진 + "3D 모델 준비 중"이 보입니다. 스크립트가 파일 존재, model-viewer 동작을 확인한 뒤 불러오기에 성공하면 3D로 바뀌고, 어느 단계에서 실패해도(파일 없음, 스크립트 실패, 불러오기 오류, 파일을 더블클릭해 열기) 사진으로 남습니다. JS 가 꺼져 있어도 사진이 보입니다.
- ESPEC 3D 모델의 공개 허락이 확인되기 전에는 모델을 저장소에 올리지 마세요. 확인되면 블록 안의 `[확인 필요]` 안내 문장도 지웁니다.

## 지킨 약속

- 사진은 원본 그대로 쓰고(흑백은 CSS filter), 원본 가로의 1.2배를 넘게 키우지 않습니다.
- 휴대폰 390px에서 가로로 넘치지 않도록 표는 `table-scroll` 안에, 글자는 `word-break: keep-all`.
- 키보드 포커스 링(황동), 움직임 줄이기 설정 존중, 본문 16px 이상.
- 로고는 글자 워드마크(J&S ENGINEERING / 제이에스 엔지니어링). 모르는 값은 `[확인 필요]`.
- 맨 아래에 "장비 이미지 출처: ESPEC Corp. 공식 웹사이트 및 제품 카탈로그".
