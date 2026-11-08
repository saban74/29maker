---
name: reels-maker
description: 릴스 카드영상(세로 1080x1920 MP4)을 만드는 방법. 프로젝트 JSON을 쓰고 python -m crew29 video render 명령으로 카드 이미지, 목소리, 자막, 영상을 한 번에 만든다.
---

# 릴스 카드영상 만들기

## 1. 프로젝트 JSON 쓰기

```json
{
  "title": "영상 제목 (카드 위쪽에 작게 표시)",
  "theme": "dark",
  "accent": "#8b9cff",
  "voice": {"engine": "edge", "name": "ko-KR-SunHiNeural", "rate": "+10%"},
  "bgm": "",
  "cards": [
    {"emoji": "🤖", "title": "첫 장: 눈길 끄는 질문", "body": "짧은 부제", "narration": "읽어 줄 문장"},
    {"title": "1. 핵심 내용", "body": "설명은 두 줄 이내", "narration": "읽어 줄 문장"}
  ]
}
```

- `theme`: `dark`(어둡게), `light`(밝게), `pop`(화려하게)
- `voice.engine`: `none`(목소리 없음), `edge`(무료 목소리), `command`(외부 프로그램)
- 목소리: `ko-KR-SunHiNeural`(여성), `ko-KR-InJoonNeural`(남성), `ko-KR-HyunsuMultilingualNeural`(남성)
- `duration`(초)을 비우면 목소리 길이에 맞춰 자동으로 정해진다.
- `bgm`: 배경음악 파일 경로(선택), `bgm_volume`: 0~1 (기본 0.15)

## 2. 좋은 카드 문구 규칙
- 카드는 5~8장. 첫 장은 질문이나 숫자로 눈길을 끈다. 마지막 장은 정리나 행동 유도(저장, 팔로우).
- 제목 20자 이내, 내용 60자 이내. 한 장에 메시지 하나.
- narration은 카드 내용을 말로 풀어 쓴 한두 문장. 너무 길면 카드가 오래 머문다.

## 3. 영상 만들기

저장소 맨 위 폴더에서 실행한다. 윈도우에서 `python`이 안 되면 `py`를 쓴다.

```bash
python -m crew29 video render data/missions/<미션번호>/output/project.json --out data/missions/<미션번호>/output/video
```

결과 폴더:
- `video.mp4`: 완성 영상
- `subtitles.srt`: 자막 (캡컷·프리미어에서 불러오기)
- `cards/`: 카드 이미지, `voice/`: 목소리 파일
- `manifest.json`: 장면별 시작·끝 시간 (외부 편집 프로그램 연동용)

## 4. 문제가 생기면
- `ffmpeg를 찾지 못했어요` → 사용자에게 `winget install ffmpeg` 설치를 안내한다.
- `edge-tts가 설치되어 있지 않아요` → `pip install edge-tts` 안내, 또는 `"engine": "none"`으로 다시 만든다.
- 목소리 서버 연결 오류 → 인터넷 연결 확인을 안내하고 `"engine": "none"`으로 만든다.
