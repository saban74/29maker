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

완성된 홈페이지는 `site/index.html`을 브라우저로 열면 볼 수 있습니다.
