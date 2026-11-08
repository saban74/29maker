"""목소리(TTS) 만들기.

엔진:
- none: 목소리 없음
- edge: 무료 Microsoft Edge 음성 (`pip install edge-tts`, 인터넷 필요)
- elevenlabs: ElevenLabs 유료 음성 (API 키 필요, 글자별 시간 정보를 받아 자막을 정확히 맞춘다)
- typecast: 타입캐스트 유료 음성 (API 키 필요)
- command: 내가 정한 외부 프로그램 명령. 예) `my-tts --text {text} --out {out} --voice {voice}`
"""
import base64
import importlib.util
import shlex
import subprocess
import sys

from . import connections, net

ENGINES = ("none", "edge", "elevenlabs", "typecast", "command")
VOICES = [
    {"id": "ko-KR-SunHiNeural", "label": "선희 (여성, 밝고 또렷함)"},
    {"id": "ko-KR-InJoonNeural", "label": "인준 (남성, 차분함)"},
    {"id": "ko-KR-HyunsuMultilingualNeural", "label": "현수 (남성, 여러 언어)"},
    {"id": "en-US-JennyNeural", "label": "Jenny (영어, 여성)"},
    {"id": "en-US-GuyNeural", "label": "Guy (영어, 남성)"},
    {"id": "ja-JP-NanamiNeural", "label": "Nanami (일본어, 여성)"},
]
ELEVEN = "https://api.elevenlabs.io/v1"
TYPECAST = "https://api.typecast.ai/v1"


class TTSError(RuntimeError):
    pass


def edge_available() -> bool:
    return importlib.util.find_spec("edge_tts") is not None


def speak(text: str, out: str, voice: dict) -> dict | None:
    """text를 읽은 음성 파일을 out에 만든다.

    목소리를 안 쓰면 None. 만들면 {"timings": [(글자, 시작초, 끝초), ...] 또는 None}.
    """
    engine = voice.get("engine", "none")
    if engine == "none" or not text.strip():
        return None
    if engine == "elevenlabs":
        return _elevenlabs(text, out, voice)
    if engine == "typecast":
        return _typecast(text, out, voice)
    if engine == "edge":
        if not edge_available():
            raise TTSError("edge-tts가 설치되어 있지 않아요. PowerShell에서 `pip install edge-tts`를 실행해 주세요.")
        cmd = [sys.executable, "-m", "edge_tts", "--voice", voice.get("name") or VOICES[0]["id"],
               f"--rate={voice.get('rate') or '+0%'}", "--text", text, "--write-media", out]
    elif engine == "command":
        template = voice.get("command", "").strip()
        if not template:
            raise TTSError("외부 프로그램 연결은 실행할 명령을 적어야 해요.")
        cmd = [part.replace("{text}", text).replace("{out}", out).replace("{voice}", voice.get("name", ""))
               for part in shlex.split(template, posix=(sys.platform != "win32"))]
    else:
        raise TTSError(f"모르는 목소리 엔진이에요: {engine}")
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        tail = (r.stderr or r.stdout).strip().splitlines()[-1:] or ["알 수 없는 오류"]
        raise TTSError(f"목소리를 만들지 못했어요: {tail[0]}")
    return {"timings": None}


def _elevenlabs(text: str, out: str, voice: dict) -> dict:
    key = connections.get("elevenlabs_key")
    if not key:
        raise TTSError("ElevenLabs API 키가 없어요. 설정 → 연결에서 넣어 주세요.")
    vid = voice.get("name", "").strip()
    if not vid:
        raise TTSError("ElevenLabs 목소리를 골라 주세요.")
    try:
        r = net.request("POST", f"{ELEVEN}/text-to-speech/{vid}/with-timestamps?output_format=mp3_44100_128",
                        headers={"xi-api-key": key},
                        json_body={"text": text, "model_id": connections.get("elevenlabs_model")})
        data = r.json()
    except (net.NetError, ValueError) as e:
        raise TTSError(f"ElevenLabs 목소리를 만들지 못했어요: {e}") from e
    with open(out, "wb") as f:
        f.write(base64.b64decode(data["audio_base64"]))
    a = data.get("alignment") or {}
    chars = a.get("characters") or []
    timings = list(zip(chars, a.get("character_start_times_seconds") or [], a.get("character_end_times_seconds") or []))
    return {"timings": timings if len(timings) == len(chars) and timings else None}


def _typecast(text: str, out: str, voice: dict) -> dict:
    key = connections.get("typecast_key")
    if not key:
        raise TTSError("타입캐스트 API 키가 없어요. 설정 → 연결에서 넣어 주세요.")
    vid = voice.get("name", "").strip()
    if not vid:
        raise TTSError("타입캐스트 목소리를 골라 주세요.")
    try:
        r = net.request("POST", f"{TYPECAST}/text-to-speech", headers={"X-API-KEY": key},
                        json_body={"voice_id": vid, "text": text, "model": connections.get("typecast_model"),
                                   "language": "kor", "output": {"audio_format": "mp3"}})
    except net.NetError as e:
        raise TTSError(f"타입캐스트 목소리를 만들지 못했어요: {e}") from e
    if "json" in r.header("Content-Type"):
        raise TTSError(f"타입캐스트가 음성 대신 다른 응답을 보냈어요: {r.body[:200]!r}")
    with open(out, "wb") as f:
        f.write(r.body)
    return {"timings": None}


def list_voices(engine: str) -> list[dict]:
    """유료 엔진의 목소리 목록 [{id, label}]."""
    try:
        if engine == "elevenlabs":
            key = connections.get("elevenlabs_key")
            if not key:
                raise TTSError("ElevenLabs API 키가 없어요.")
            data = net.request("GET", f"{ELEVEN}/voices", headers={"xi-api-key": key}).json()
            return [{"id": v["voice_id"], "label": v.get("name", v["voice_id"])} for v in data.get("voices", [])]
        if engine == "typecast":
            key = connections.get("typecast_key")
            if not key:
                raise TTSError("타입캐스트 API 키가 없어요.")
            data = net.request("GET", f"{TYPECAST}/voices", headers={"X-API-KEY": key}).json()
            items = data if isinstance(data, list) else data.get("voices") or data.get("result") or []
            return [{"id": v.get("voice_id") or v.get("id"), "label": v.get("voice_name") or v.get("name") or v.get("voice_id")}
                    for v in items if v.get("voice_id") or v.get("id")]
    except (net.NetError, ValueError, KeyError) as e:
        raise TTSError(f"목소리 목록을 가져오지 못했어요: {e}") from e
    return VOICES if engine == "edge" else []
