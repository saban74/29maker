"""외부 서비스가 내 PC의 파일을 가져갈 수 있게 잠깐 공개하는 작은 서버.

인스타그램과 힉스필드는 영상·이미지를 '인터넷 주소'로 받아 간다.
대시보드는 공개하지 않고, 이 서버(기본 8130번 포트)만 공개 주소에 연결한다.
- 공개하는 파일마다 추측할 수 없는 열쇠가 붙고, 정해진 시간이 지나면 막힌다.
- 등록한 파일 말고는 아무것도 보여 주지 않는다.
"""
import json
import mimetypes
import os
import secrets
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from . import connections, paths

_lock = threading.Lock()


def _file() -> Path:
    return paths.data_dir() / "shares.json"


def _load() -> dict:
    f = _file()
    if not f.is_file():
        return {}
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
    except ValueError:
        return {}
    now = time.time()
    return {k: v for k, v in data.items() if v.get("exp", 0) > now}


def base_url() -> str:
    return connections.get("public_base_url").rstrip("/")


def public_url(path: Path, hours: float = 24) -> str | None:
    """파일을 공개하고 주소를 돌려준다. 공개 주소 설정이 없으면 None."""
    base = base_url()
    if not base:
        return None
    path = Path(path).resolve()
    if not path.is_file():
        raise FileNotFoundError(path)
    token = secrets.token_urlsafe(18)
    with _lock:
        data = _load()
        data[token] = {"path": str(path), "exp": time.time() + hours * 3600}
        _file().write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return f"{base}/p/{token}/{path.name}"


def lookup(token: str) -> Path | None:
    with _lock:
        item = _load().get(token)
    if not item:
        return None
    p = Path(item["path"])
    return p if p.is_file() else None


class PublicHandler(BaseHTTPRequestHandler):
    server_version = "crew29-share"

    def log_message(self, fmt, *args):
        pass

    def do_HEAD(self):
        self._serve(head=True)

    def do_GET(self):
        self._serve()

    def _serve(self, head: bool = False):
        parts = [p for p in self.path.split("?")[0].split("/") if p]
        target = lookup(parts[1]) if len(parts) == 3 and parts[0] == "p" else None
        if not target or target.name != parts[2]:
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        size = target.stat().st_size
        start, end = 0, size - 1
        rng = self.headers.get("Range", "")
        if rng.startswith("bytes="):
            a, _, b = rng[6:].partition("-")
            try:
                start = int(a) if a else max(size - int(b), 0)
                end = min(int(b), size - 1) if a and b else end
            except ValueError:
                start, end = 0, size - 1
        length = max(end - start + 1, 0)
        self.send_response(206 if rng else 200)
        self.send_header("Content-Type", mimetypes.guess_type(target.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(length))
        self.send_header("Accept-Ranges", "bytes")
        if rng:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        if head:
            return
        with open(target, "rb") as f:
            f.seek(start)
            left = length
            while left > 0:
                chunk = f.read(min(1 << 20, left))
                if not chunk:
                    break
                self.wfile.write(chunk)
                left -= len(chunk)


def start_server() -> int | None:
    """공개 주소 설정이 있을 때만 공개 파일 서버를 켠다."""
    if not base_url():
        return None
    port = int(connections.get("public_port") or 8130)
    httpd = ThreadingHTTPServer(("127.0.0.1" if os.environ.get("CREW29_SHARE_LOCAL") else "0.0.0.0", port),
                                PublicHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return port
