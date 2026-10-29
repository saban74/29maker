# 29maker

## AI 에이전트

`.claude/agents/` 폴더에 Claude Code용 AI 에이전트(서브에이전트)가 들어 있습니다.

| 이름 | 하는 일 |
|------|---------|
| `code-explainer` | 코드를 입문자 눈높이로 쉽게 설명 (읽기 전용) |
| `web-planner` | 홈페이지 기획: 목적, 구성, 문구를 `site/PLAN.md`에 정리 |
| `web-builder` | 홈페이지 제작: 기획서대로 `site/` 폴더에 HTML/CSS/JS 작성 |
| `web-reviewer` | 홈페이지 검수: 기획서와 비교해 고칠 점 보고 (읽기 전용) |

사용 예: Claude Code에서 `code-explainer 에이전트로 README.md 설명해줘` 라고 입력하세요.

### 홈페이지 제작 팀 사용법

`web-planner` → `web-builder` → `web-reviewer` 순서로 일합니다. 메인 Claude에게 이렇게 부탁하세요.

```
홈페이지 제작 팀으로 카페 홈페이지 만들어줘.
web-planner로 기획하고, web-builder로 만들고, web-reviewer로 검사해서 고칠 점이 있으면 다시 고쳐줘.
```

결과물은 `site/` 폴더에 생기고, `site/index.html`을 브라우저로 열면 볼 수 있습니다.
