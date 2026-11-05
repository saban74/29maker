---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

<!--
이 저장소용으로 고친 점:
- 원본(vercel-labs/agent-skills, skills/web-design-guidelines)은 검사할 때마다 인터넷에서 규칙을 받아 옵니다.
  이 작업 환경은 인터넷 접근이 제한되어 있고, 매번 바뀔 수 있는 원격 지시문을 그대로 따르지 않도록
  규칙 파일을 한 번 받아 검토한 뒤 같은 폴더의 rules.md 로 저장했습니다.
- 규칙 원본: https://github.com/vercel-labs/web-interface-guidelines (command.md, 2026-10-27 기준, MIT License → LICENSE)
-->

## How It Works

1. Read the rules in `rules.md` next to this file (`.claude/skills/web-design-guidelines/rules.md`)
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in `rules.md`
4. Output findings in the terse `file:line` format

## 이 프로젝트에 적용할 때 (제이에스 엔지니어링 홈페이지)

- 사이트는 React가 아닌 순수 HTML/CSS/JS입니다. `onKeyDown`, `useState`, hydration, Tailwind 클래스 같은 React·Tailwind 전용 규칙은 같은 뜻의 HTML/CSS 기준으로 바꿔 적용하고, 해당 없는 규칙은 건너뜁니다.
- 문구가 한국어입니다. "Title Case", 영어 곧은따옴표/둥근따옴표 같은 영어 문장 규칙은 적용하지 않습니다. 한국어 문구는 능동형, 구체적인 버튼 이름, 오류에 해결 방법 포함 원칙만 적용합니다.
- 결과는 `파일:줄번호 - 문제` 형식으로, 한국어로 씁니다.
