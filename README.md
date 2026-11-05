# 29maker

제이에스 엔지니어링(ESPEC 한국 총대리점) 홈페이지 제작 프로젝트입니다.

## AI 에이전트

`.claude/agents/` 폴더에 Claude Code용 AI 에이전트(서브에이전트)가 들어 있습니다.
팀 운영 규칙은 `CLAUDE.md`에 있습니다.

### 홈페이지 제작 팀

| 순서 | 이름 | 하는 일 | 결과물 |
|---|---|---|---|
| ① | `espec-researcher` | ESPEC 제품 정보, 카탈로그 파일, 뉴스 수집 | `research/espec/` |
| ① | `trend-researcher` | 기업용 홈페이지 디자인 트렌드 수집 | `research/trends/` |
| ② | `site-architect` | 사이트맵, 메뉴, 페이지별 문구 설계 | `site/PLAN.md` |
| ③ | `web-designer` | 메인, 전체 페이지, 제품 페이지 디자인 시안 | `design/` |
| ④ | `web-builder` | 실제 홈페이지 제작 | `site/` |
| ⑤ | `web-reviewer` | 검수 후 고칠 점 보고 (읽기 전용) | 보고 |

①의 두 팀원은 동시에 일합니다.

### 기타

| 이름 | 하는 일 |
|---|---|
| `code-explainer` | 코드를 입문자 눈높이로 쉽게 설명 (읽기 전용) |

### 디자인 스킬 (`.claude/skills/`)

| 스킬 | 출처 | 쓰는 팀원 | 하는 일 |
|---|---|---|---|
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) (Apache 2.0) | `web-designer` | 뻔한 "AI 디자인"을 피하고 개성 있는 색·글꼴·배치를 정하는 원칙 |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT) | `web-designer` (보조) | 247개 수상 사이트 연구 기반의 엄격한 디자인 원칙. 참고 시안과 겹치지 않는 원칙만 적용 |
| `web-design-guidelines` | [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) (MIT) | `web-reviewer` | 접근성·폼·포커스 등 100여 개 웹 화면 규칙으로 검사 |

`web-design-guidelines`는 원래 검사할 때마다 인터넷에서 규칙을 받아 오지만, 여기서는 규칙을 `rules.md`로 저장해 두고 씁니다.

## 사용법

Claude Code에서 이렇게 부탁하세요. 메인 Claude가 감독자가 되어 팀을 순서대로 움직입니다.

```
홈페이지 제작 팀으로 제이에스 엔지니어링 홈페이지 만들어줘
```

일부만 다시 하고 싶을 때:

```
@agent-web-designer 메인 시안을 더 밝은 분위기로 다시 만들어줘
```

## 홈페이지 만드는 구조 (2026-11-04부터: Eleventy + 관리자 화면)

홈페이지는 이제 **틀(site/) + 정보 파일(content/)** 을 합쳐 자동으로 만듭니다. 그래서 `site/index.html`을 더블클릭해서 바로 볼 수는 없고, 아래 명령으로 만든 결과(`_site/`)를 웹 서버로 봅니다.

```
npm install          # 처음 한 번 (필요한 프로그램 설치)
npm run build        # 홈페이지 만들기 → _site/ 폴더
npm start            # 만들면서 미리보기: http://localhost:8080/
```

관리자 화면을 내 컴퓨터에서 시험하려면 창 두 개에서 `npm start` 와 `npm run cms`(= `npx decap-server`)를 켜고 `http://localhost:8080/admin/` 을 엽니다. GitHub 로그인 없이 내 컴퓨터 파일에 바로 저장됩니다.

| 폴더·파일 | 하는 일 |
|---|---|
| `content/products/*.md` | 제품 11개 (관리자 화면 "제품") |
| `content/news/*.md` | 뉴스·공지 (관리자 화면 "뉴스·공지") |
| `content/catalogs/*.md` | 기술자료 카탈로그 표의 줄 (관리자 화면 "카탈로그 자료") |
| `content/solutions.yml` | 산업 솔루션 페이지의 추천 장비 목록 |
| `site/` | 페이지 틀. 주소(파일 이름)는 예전과 같음. `.html` 파일 맨 위 `---` 사이는 페이지 정보, 아래는 본문 |
| `site/products/product.njk` | 제품 상세 페이지 **틀 하나** → 제품 정보 파일마다 `products/(주소용이름).html` 생성 |
| `site/_includes/layouts/base.njk` | 모든 페이지 공통 `<head>`·머리말·꼬리말 (`partials/header.njk`, `partials/footer.njk`) |
| `site/_includes/partials/card.njk` | 제품 카드 한 장 (목록·메인·관련 제품·솔루션 추천 장비에 공통) |
| `site/_data/*.js` | 제품군, 산업, 뉴스 분류, 카탈로그 분류 이름 |
| `site/admin/` | 관리자 화면(Decap CMS 3.17.1)과 설정 `config.yml` |
| `site/assets/img/uploads/` | 관리자 화면에서 올린 사진 |
| `eleventy.config.js`, `lib/content.js` | 만드는 규칙 (정보 파일 읽기, 주소 계산 등) |
| `netlify.toml` | Netlify 배포 설정 (빌드 명령, 출력 폴더) |
| `_site/`, `node_modules/` | 자동 생성. 저장소에 올리지 않음 |

### 정한 것과 이유
- **site/ 를 입력 폴더로 유지**: 문서들(CLAUDE.md, BUILD.md, INTEGRATION.md)이 site/ 를 가리키고, 페이지 주소도 그대로 유지하려고.
- **content/ 는 site/ 밖**: 관리자 화면이 저장하는 "정보"와 개발자가 고치는 "틀"을 나누려고. Eleventy 는 `lib/content.js` 로 읽어 씁니다.
- **주소는 상대 주소**: 모든 페이지 안 주소를 "지금 페이지 기준"(`../css/...`)으로 자동 계산합니다(`rel` 필터). 그래서 도메인 맨 위(Netlify)든 하위 폴더(GitHub Pages `/29maker/`)든 `pathPrefix` 설정 없이 그대로 동작합니다.
- **글 안의 `[확인 필요...]`** 는 자동으로 노란 표시(`span.tbd`)가 됩니다. 정보 파일에는 그냥 글자로 씁니다.
- **사진 가로·세로 크기**를 비워 두면 만들 때 사진 파일에서 읽어 채웁니다(`image-size`).
- **뉴스 분류**: 브리프의 "ESPEC 소식"은 지금 사이트처럼 `ESPEC 신제품`(new)·`ESPEC 회사 소식`(corp) 둘로 나눠 두었고, `제이에스 엔지니어링 소식`(js), `세미나·전시회`(event), **`공지사항`(notice)** 이 있습니다. news.html 분류 버튼에 "공지사항"이 하나 늘었습니다.
- **목록 순서 규칙**
  - 제품 목록: "정렬 순서" 작은 숫자부터. 메인 대표 제품: "메인 대표 제품으로 표시"를 켠 제품을 "메인 표시 순서"대로.
  - 뉴스 목록: "맨 위에 고정"한 글 → 날짜 최신순.
  - 메인 최신 소식 3개: 고정한 글 먼저, 그다음 "메인 '최신 소식'에 보이기"를 켠 글을 최신순으로. (공지사항도 이 규칙대로 섞입니다. 중요한 공지는 고정을 켜면 메인 맨 앞에 나옵니다.)
  - "홈페이지에 공개"를 끈 글·제품·카탈로그는 어디에도 나오지 않습니다(초안). 예시 공지 `content/news/2026-11-04-notice-example.md` 가 초안입니다.
- **카드 글자가 페이지마다 조금 다른 경우**(예: 배터리 솔루션의 "Platinous J 시리즈 (ECO형)")는 예전 화면을 그대로 지키려고 "이 페이지에서만 다르게" 칸으로 옮겼습니다(제품의 `card_home`, `card_related`, 관련 제품·솔루션 목록의 덮어쓰기 칸).

자세한 사용법은 `ADMIN-GUIDE.md`, 인터넷에 올리는 방법은 `DEPLOY.md`.
