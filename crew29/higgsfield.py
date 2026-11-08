"""힉스필드(Higgsfield) AI로 짧은 영상 클립 만들기.

요청을 보내면 작업 번호가 오고, 끝날 때까지 상태를 확인한 뒤 영상을 내려받는다.
모델 경로와 추가 옵션은 설정 → 연결에서 바꿀 수 있다(힉스필드 콘솔의 모델 문서 참고).
결과 주소는 힉스필드 쪽에서 7일쯤 뒤 사라질 수 있어서 바로 내려받아 둔다.
"""
import json
import time
from pathlib import Path

from . import connections, net

DONE = {"completed", "succeeded", "success", "done", "finished"}
FAILED = {"failed", "error", "nsfw", "canceled", "cancelled"}


class HiggsfieldError(RuntimeError):
    pass


def configured() -> bool:
    return connections.has("higgsfield_key_id") and connections.has("higgsfield_key_secret")


def _headers() -> dict:
    kid, sec = connections.get("higgsfield_key_id"), connections.get("higgsfield_key_secret")
    if not (kid and sec):
        raise HiggsfieldError("힉스필드 API 키(Key ID, Secret)가 없어요. 설정 → 연결에서 넣어 주세요.")
    return {"Authorization": f"Key {kid}:{sec}", "hf-api-key": kid, "hf-secret": sec}


def find_video_url(data) -> str | None:
    """응답 모양이 모델마다 달라서, 영상 주소처럼 보이는 값을 찾아낸다."""
    found = []

    def walk(o, key=""):
        if isinstance(o, dict):
            for k, v in o.items():
                walk(v, k)
        elif isinstance(o, list):
            for v in o:
                walk(v, key)
        elif isinstance(o, str) and o.startswith("http"):
            score = 2 if o.split("?")[0].lower().endswith((".mp4", ".mov", ".webm")) else 1 if "video" in key.lower() or key == "url" else 0
            if score:
                found.append((score, o))
    walk(data)
    return max(found)[1] if found else None


def generate(prompt: str, out: Path, image_url: str | None = None, progress=lambda m: None,
             poll_seconds: float = 5, timeout: float = 900) -> Path:
    base = connections.get("higgsfield_base").rstrip("/")
    model = connections.get("higgsfield_model").strip("/")
    try:
        extra = json.loads(connections.get("higgsfield_extra") or "{}")
    except ValueError as e:
        raise HiggsfieldError("힉스필드 추가 옵션(JSON)을 읽지 못했어요.") from e
    body = {"prompt": prompt, **extra}
    if image_url:
        body["image_url"] = image_url
    try:
        sub = net.request("POST", f"{base}/{model}", headers=_headers(), json_body=body).json()
    except (net.NetError, ValueError) as e:
        raise HiggsfieldError(f"힉스필드에 요청하지 못했어요: {e}") from e
    rid = sub.get("request_id") or sub.get("id")
    status_url = sub.get("status_url") or (f"{base}/requests/{rid}/status" if rid else None)
    if not status_url:
        raise HiggsfieldError(f"힉스필드 응답에서 작업 번호를 찾지 못했어요: {str(sub)[:200]}")

    deadline = time.time() + timeout
    data = sub
    while True:
        st = str(data.get("status", "")).lower()
        if st in DONE or (not st and find_video_url(data)):
            break
        if st in FAILED:
            raise HiggsfieldError(f"힉스필드 영상 만들기가 실패했어요 (상태: {st}).")
        if time.time() > deadline:
            raise HiggsfieldError("힉스필드 영상이 너무 오래 걸려서 기다리기를 멈췄어요.")
        progress(f"AI 클립 만드는 중 ({st or '대기'})")
        time.sleep(poll_seconds)
        try:
            data = net.request("GET", status_url, headers=_headers()).json()
        except (net.NetError, ValueError) as e:
            raise HiggsfieldError(f"힉스필드 상태를 확인하지 못했어요: {e}") from e

    url = find_video_url(data)
    if not url:
        raise HiggsfieldError(f"완성됐지만 영상 주소를 찾지 못했어요: {str(data)[:200]}")
    try:
        out.write_bytes(net.request("GET", url, timeout=300).body)
    except net.NetError as e:
        raise HiggsfieldError(f"AI 클립을 내려받지 못했어요: {e}") from e
    return out
