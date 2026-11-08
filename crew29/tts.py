"""목소리(TTS) 만들기.

엔진:
- none: 목소리 없음
- edge: 무료 Microsoft Edge 음성 (`pip install edge-tts` 필요, 인터넷 연결 필요)
- command: 내가 정한 외부 프로그램 명령. 예) `my-tts --text {text} --out {out} --voice {voice}`
  ElevenLabs 같은 유료 서비스도 스크립트를 하나 만들어 여기에 연결하면 된다.
"""
import importlib.util
import shlex
import subprocess
import sys

ENGINES = ("none", "edge", "command")
VOICES = [
    {"id": "ko-KR-SunHiNeural", "label": "선희 (여성, 밝고 또렷함)"},
    {"id": "ko-KR-InJoonNeural", "label": "인준 (남성, 차분함)"},
    {"id": "ko-KR-HyunsuMultilingualNeural", "label": "현수 (남성, 여러 언어)"},
    {"id": "en-US-JennyNeural", "label": "Jenny (영어, 여성)"},
    {"id": "en-US-GuyNeural", "label": "Guy (영어, 남성)"},
    {"id": "ja-JP-NanamiNeural", "label": "Nanami (일본어, 여성)"},
]


class TTSError(RuntimeError):
    pass


def edge_available() -> bool:
    return importlib.util.find_spec("edge_tts") is not None


def speak(text: str, out: str, voice: dict) -> bool:
    """text를 읽은 음성 파일을 out에 만든다. 목소리를 안 쓰면 False."""
    engine = voice.get("engine", "none")
    if engine == "none" or not text.strip():
        return False
    if engine == "edge":
        if not edge_available():
            raise TTSError("edge-tts가 설치되어 있지 않아요. PowerShell에서 `pip install edge-tts`를 실행해 주세요.")
        cmd = [sys.executable, "-m", "edge_tts", "--voice", voice.get("name") or VOICES[0]["id"],
               f"--rate={voice.get('rate') or '+0%'}", "--text", text, "--write-media", out]
    elif engine == "command":
        template = voice.get("command", "").strip()
        if not template:
            raise TTSError("command 엔진은 실행할 명령을 적어야 해요.")
        cmd = [part.replace("{text}", text).replace("{out}", out).replace("{voice}", voice.get("name", ""))
               for part in shlex.split(template, posix=(sys.platform != "win32"))]
    else:
        raise TTSError(f"모르는 목소리 엔진이에요: {engine}")
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        tail = (r.stderr or r.stdout).strip().splitlines()[-1:] or ["알 수 없는 오류"]
        raise TTSError(f"목소리를 만들지 못했어요: {tail[0]}")
    return True
