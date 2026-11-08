# 29maker

Claude Code로 움직이는 개인용 AI 에이전트 팀과, 그 팀을 관리하는 대시보드 **29 Crew**가 들어 있어요.
모두 Claude Max 요금제 안에서 돌아가요. 다른 AI 회사의 API 키는 필요 없어요.

## 29 Crew 대시보드

| 화면 | 할 수 있는 일 |
|------|---------------|
| 홈 | 진행 중인 미션, 최근 결과, 설치가 필요한 도구 |
| 미션 | 팀(총감독이 일을 나눔) 또는 에이전트 한 명에게 일 맡기기. 진행 기록이 실시간으로 보이고, 최종 보고와 결과물 파일을 볼 수 있어요 |
| 팀 | 에이전트 추가·수정·삭제, 모델·도구·스킬 고르기, 총감독 지시문 고치기 |
| 스킬 | 직접 만들기, GitHub에서 가져오기(미리보기 후 저장, 같은 이름이면 교체), 지우기 |
| 영상 | 릴스 카드영상 만들기: 카드 편집, 실시간 미리보기, 목소리, 배경음악, MP4·자막 내려받기, AI에게 맡기기 |
| 설정 | 도구 점검, 미션에서 허락 없이 쓸 수 있는 도구 정하기 |

### 처음 준비 (윈도우, 한 번만)

1. Python과 Claude Code가 설치되어 있어야 해요.
2. 영상을 만들려면 ffmpeg를 설치해요.

```powershell
winget install ffmpeg
```

3. 무료 목소리를 쓰려면 edge-tts를 설치해요. (선택)

```powershell
pip install edge-tts
```

### 켜기

`start-crew.bat`를 더블클릭하면 대시보드가 켜지고 브라우저가 열려요. 또는:

```powershell
py -m crew29 dashboard
```

주소: http://127.0.0.1:8129/ · 끄려면 켜 둔 창에서 `Ctrl + C`

같은 와이파이의 휴대폰에서도 열려면 `--lan`을 붙여요. 이때는 창에 나오는 열쇠(token)가 붙은 주소로 들어가야 해요.

```powershell
py -m crew29 dashboard --lan
```

### 명령어로 쓰기 (자동화·외부 연동)

```powershell
py -m crew29 check
```

```powershell
py -m crew29 video render 프로젝트.json
```

```powershell
py -m crew29 mission "가을 캠핑 준비물 블로그 글 써 줘"
```

영상 결과 폴더(`data/videos/날짜시간/`)에는 `video.mp4`, `subtitles.srt`(자막), `cards/`(카드 이미지), `voice/`(목소리), `manifest.json`(장면별 시간)이 함께 생겨요. 캡컷·프리미어에 그대로 불러와 이어서 편집할 수 있어요.

목소리는 `none`(없음), `edge`(무료), `command`(외부 프로그램) 중에서 골라요. `command`에 `{text}`, `{out}`, `{voice}`가 들어간 명령을 적으면 ElevenLabs 같은 다른 음성 서비스도 연결할 수 있어요.

### 알아 둘 점

- 미션은 Claude Code를 자동 실행(`claude -p`)해서 돌아가요. Max 요금제 사용량이 쓰여요.
- 미션 중에는 설정 화면의 "허락 없이 쓸 수 있는 도구"만 써요. 아무 명령이나 실행하는 도구는 기본으로 막혀 있어요.
- `data/` 폴더(미션 기록, 영상, 열쇠)는 git에 올라가지 않아요.

## AI 에이전트

`.claude/agents/` 폴더에 Claude Code용 에이전트가 들어 있어요. 대시보드 팀 화면에서 고칠 수 있어요.

| 이름 | 하는 일 | 파일 수정 |
|------|---------|-----------|
| `researcher` | 어떤 주제든 웹에서 조사해 출처와 함께 정리 | 안 함 |
| `planner` | 막연한 아이디어를 단계별 계획으로 정리 | 안 함 |
| `writer` | 글쓰기, 요약, 번역, 다듬기 | 요청할 때만 |
| `reels-producer` | 릴스 카드영상 기획부터 MP4까지 (스킬: `reels-maker`) | 함 |
| `code-explainer` | 코드를 입문자 눈높이로 쉽게 설명 | 안 함 |
| `code-reviewer` | 코드의 버그, 보안 문제, 개선점 점검 (검수 담당) | 안 함 |
| `content-reviewer` | 글·대본·영상 결과물 점검 (검수 담당) | 안 함 |

Claude Code에서 바로 써도 돼요. 예: `researcher 에이전트로 초보자용 3D 프린터 비교해줘`

## 테스트

```powershell
py -m unittest discover -s tests
```
