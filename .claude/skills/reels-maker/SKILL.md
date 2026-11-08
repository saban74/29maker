---
name: reels-maker
description: 유튜브 쇼츠·인스타 릴스·틱톡·유튜브 가로 영상·인스타 카드형 이미지를 만드는 방법. 프로젝트 JSON을 쓰고 python -m crew29 video render 로 카드, 목소리, 자동 편집(자막·확대·로고·배경음악)까지 한 번에 만들고, 게시 초안을 만든다.
---

# 숏폼·카드형 만들기

## 1. 프로젝트 JSON

```json
{
  "title": "영상 제목 (카드 위쪽에 작게 표시)",
  "format": "shorts",
  "theme": "dark",
  "accent": "#ffd400",
  "voice": {"engine": "edge", "name": "ko-KR-SunHiNeural", "rate": "+10%"},
  "bgm": "",
  "edit": {"subtitles": true, "subtitle_style": "box", "motion": true, "duck": true,
           "logo": "", "intro": "", "outro": ""},
  "cards": [
    {"emoji": "🤖", "title": "첫 장: 눈길 끄는 질문", "body": "짧은 부제", "narration": "읽어 줄 문장"},
    {"title": "1. 핵심 내용", "body": "설명은 두 줄 이내", "narration": "읽어 줄 문장",
     "background": {"type": "higgsfield", "prompt": "slow drone shot over a camping site at sunset"}}
  ]
}
```

- `format`: `reels`(인스타 릴스), `shorts`(유튜브 쇼츠), `tiktok`, `youtube`(가로 16:9), `square`(1:1), `carousel`(인스타 카드형 이미지 4:5, 1~10장, 목소리·편집 없음)
- `theme`: `dark`, `light`, `pop`
- `voice.engine`: `none`, `edge`(무료), `elevenlabs`·`typecast`(유료, 설정에 키가 있어야 함, `name`은 목소리 ID), `command`
- `edit.subtitles`: 읽어 줄 문장을 영상에 자막으로 입힌다 (말하는 단어 강조)
- `edit.motion`: 카드가 천천히 확대된다. `edit.duck`: 목소리가 나올 때 배경음악을 줄인다
- `background.type`: `none`, `video`(`path`에 내 영상 파일), `higgsfield`(`prompt`로 AI 클립, 영어 설명이 잘 됨, 유료)
- `duration`(초)을 비우면 목소리 길이에 맞춰진다

## 2. 좋은 문구 규칙
- 카드 5~8장. 첫 장은 질문이나 숫자로 눈길을 끈다. 마지막 장은 정리나 행동 유도(저장, 팔로우).
- 제목 20자, 내용 60자 이내. 한 장에 메시지 하나.
- narration은 한두 문장. 자막으로도 쓰이니 맞춤법을 지킨다.
- 카드형(carousel)은 글만으로 이해되게 쓴다 (목소리 없음).

## 3. 만들기

저장소 맨 위 폴더에서 실행한다. 윈도우에서 `python`이 안 되면 `py`를 쓴다.

```bash
python -m crew29 video render data/missions/<미션번호>/output/project.json
```

끝에 `영상 번호: 20261108-223012` 처럼 번호가 나온다. 결과는 `data/videos/<영상 번호>/`에 생긴다
(`video.mp4`, `subtitles.srt`·`subtitles.ass`, `cards/`, `voice/`, `manifest.json`).

## 4. 게시 초안 (선택)

사용자가 원하면 초안을 만든다. **실제 업로드는 사람이 대시보드 게시 화면에서 승인해야 한다.**

```bash
python -m crew29 publish draft <영상 번호> --to youtube --to instagram --title "제목" --caption "설명" --hashtags "#태그1 #태그2"
```

카드형은 `--to instagram`만 된다.

## 5. 문제가 생기면
- `ffmpeg를 찾지 못했어요` → `winget install ffmpeg` 안내.
- `edge-tts가 설치되어 있지 않아요` → `pip install edge-tts` 안내, 또는 `"engine": "none"`.
- 유료 목소리·힉스필드 키 없음 → 설정 → 연결 안내, 또는 무료 옵션으로 다시 만든다.
- 목소리·AI 서버 연결 오류 → 인터넷 확인을 안내하고 무료/없음 옵션으로 만든다.
