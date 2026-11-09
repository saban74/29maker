"""대시보드 웹 서버 (파이썬 기본 기능만 사용).

기본은 내 PC에서만 열린다(127.0.0.1). `--lan`으로 켜면 같은 와이파이의 다른 기기에서도
열 수 있고, 이때는 data/dashboard.token 의 비밀 열쇠가 있어야 들어올 수 있다.
"""
import json
import mimetypes
import secrets
import shutil
import urllib.parse
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from . import agents, connections, higgsfield, missions, net, paths, publish, share, skills, tts, video

STATIC = Path(__file__).parent / "static"
MAX_BODY = 1_000_000
ERRORS = (agents.AgentError, skills.SkillError, missions.MissionError, video.VideoError, tts.TTSError,
          publish.PublishError, higgsfield.HiggsfieldError, net.NetError)


def token_file() -> Path:
    return paths.data_dir() / "dashboard.token"


def ensure_token() -> str:
    f = token_file()
    if not f.is_file():
        f.write_text(secrets.token_urlsafe(24), encoding="utf-8")
    return f.read_text(encoding="utf-8").strip()


def state() -> dict:
    return {
        "agents": agents.list_agents(),
        "skills": skills.list_skills(),
        "director": paths.director_file().read_text(encoding="utf-8") if paths.director_file().is_file() else "",
        "missions": missions.list_missions()[:50],
        "activity": missions.activity(),
        "default_model": missions.last_model(),
        "videos": video.list_jobs()[:30],
        "publish": publish.list_drafts()[:50],
        "options": {"models": agents.MODELS, "colors": agents.COLORS, "tools": agents.TOOLS,
                    "max_skills": agents.MAX_SKILLS, "voices": tts.VOICES, "themes": list(video.THEMES),
                    "formats": {k: v["label"] for k, v in video.FORMATS.items()},
                    "image_formats": [k for k, v in video.FORMATS.items() if v.get("images")],
                    "engines": list(tts.ENGINES)},
        "checks": {"claude": bool(missions.claude_cmd()), **video.check()},
        "settings": missions.settings(),
        "connections": connections.view(),
        "linked": {
            "elevenlabs": connections.has("elevenlabs_key"), "typecast": connections.has("typecast_key"),
            "higgsfield": higgsfield.configured(), "youtube": connections.has("youtube_refresh_token"),
            "instagram": connections.has("instagram_token") and connections.has("instagram_user_id"),
            "public": bool(share.base_url()),
        },
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "crew29"
    token: str | None = None  # --lan 일 때만 설정
    port: int = 8129

    def log_message(self, fmt, *args):  # 조용히
        pass

    # ---------- 공통 ----------
    def _authorized(self, query: dict) -> bool:
        if not self.token:
            return True
        if query.get("token", [""])[0] == self.token:
            return True
        if self.headers.get("X-Crew-Token") == self.token:
            return True
        jar = cookies.SimpleCookie(self.headers.get("Cookie", ""))
        return "crew29" in jar and jar["crew29"].value == self.token

    def _send(self, code: int, body: bytes, ctype: str, extra: dict | None = None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _json(self, data, code: int = 200):
        self._send(code, json.dumps(data, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def _error(self, msg: str, code: int = 400):
        self._json({"error": msg}, code)

    def _body(self) -> dict:
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_BODY:
            raise ValueError("보낸 내용이 너무 커요.")
        raw = self.rfile.read(n) if n else b"{}"
        data = json.loads(raw.decode("utf-8") or "{}")
        if not isinstance(data, dict):
            raise ValueError("잘못된 요청이에요.")
        return data

    def _file(self, base: Path, rel: str):
        target = (base / rel).resolve()
        if not str(target).startswith(str(base.resolve())) or not target.is_file():
            return self._error("파일이 없어요.", 404)
        ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if ctype.startswith("text/") or target.suffix in (".srt", ".md", ".json"):
            ctype = (ctype if ctype.startswith("text/") else "text/plain") + "; charset=utf-8"
        self._send(200, target.read_bytes(), ctype)

    # ---------- 라우팅 ----------
    def do_GET(self):
        self._route("GET")

    def do_POST(self):
        self._route("POST")

    def do_DELETE(self):
        self._route("DELETE")

    def _route(self, method: str):
        url = urlparse(self.path)
        query = parse_qs(url.query)
        parts = [p for p in url.path.split("/") if p]
        if not self._authorized(query):
            return self._error("열쇠(token)가 필요해요. 대시보드를 켠 창에 나온 주소로 들어와 주세요.", 401)
        try:
            if method == "GET" and (not parts or parts == ["index.html"]):
                extra = {}
                if self.token and query.get("token"):
                    extra["Set-Cookie"] = f"crew29={self.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000"
                return self._send(200, (STATIC / "index.html").read_bytes(), "text/html; charset=utf-8", extra)
            if method == "GET" and parts[0] == "static" and len(parts) == 2:
                return self._file(STATIC, parts[1])
            if method == "GET" and parts[0] == "files" and len(parts) >= 4:
                base = {"videos": paths.videos_dir(), "missions": paths.missions_dir()}.get(parts[1])
                if base is None:
                    return self._error("파일이 없어요.", 404)
                sub = base / parts[2] / ("output" if parts[1] == "missions" else "")
                return self._file(sub, "/".join(parts[3:]))
            if method == "GET" and parts[0] == "oauth" and parts[1:] in (["youtube", "start"], ["youtube", "callback"]):
                return self._youtube_oauth(parts[2], query)
            if parts[0] == "api":
                return self._api(method, parts[1:])
            self._error("없는 주소예요.", 404)
        except skills.SkillChanged as e:
            self._error(str(e), 409)
        except ERRORS as e:
            self._error(str(e))
        except (ValueError, KeyError, TypeError) as e:
            self._error(f"잘못된 요청이에요: {e}")

    def _redirect(self, location: str):
        self.send_response(302)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _youtube_oauth(self, step: str, query: dict):
        # 구글은 이 PC 주소(127.0.0.1)로만 돌려보내 준다. 그래서 연결은 PC 브라우저에서 해야 한다.
        redirect_uri = f"http://127.0.0.1:{self.port}/oauth/youtube/callback"
        if step == "start":
            return self._redirect(publish.youtube_auth_url(redirect_uri))
        if query.get("error"):
            return self._redirect("/#/settings?yt=" + query["error"][0])
        try:
            name = publish.youtube_callback(query.get("code", [""])[0], query.get("state", [""])[0], redirect_uri)
        except publish.PublishError as e:
            return self._redirect("/#/settings?yt=error&msg=" + urllib.parse.quote(str(e)))
        self._redirect("/#/settings?yt=ok&channel=" + urllib.parse.quote(name))

    def _api(self, method: str, p: list[str]):
        if method == "GET" and p == ["state"]:
            return self._json(state())
        # 총감독
        if method == "POST" and p == ["director"]:
            text = str(self._body().get("text", "")).strip()
            if not text:
                return self._error("총감독 지시문을 적어 주세요.")
            paths.director_file().parent.mkdir(parents=True, exist_ok=True)
            paths.director_file().write_text(text + "\n", encoding="utf-8")
            return self._json({"ok": True})
        # 에이전트
        if method == "POST" and p == ["agents"]:
            return self._json(agents.save(self._body(), skills.names()))
        if method == "DELETE" and len(p) == 2 and p[0] == "agents":
            agents.delete(p[1])
            return self._json({"ok": True})
        # 스킬
        if method == "GET" and len(p) == 2 and p[0] == "skills":
            return self._json(skills.load(p[1]))
        if method == "POST" and p == ["skills"]:
            b = self._body()
            return self._json(skills.save(b.get("name", ""), b.get("description", ""), b.get("body", ""),
                                          b.get("source", "")))
        if method == "DELETE" and len(p) == 2 and p[0] == "skills":
            skills.delete(p[1])
            return self._json({"ok": True, "detached_from": agents.remove_skill_everywhere(p[1])})
        if method == "POST" and p == ["skills", "import", "preview"]:
            return self._json(skills.preview(self._body().get("url", "")))
        if method == "POST" and p == ["skills", "import", "save"]:
            b = self._body()
            return self._json(skills.import_save(b.get("url", ""), b.get("sha", ""), b.get("name", "")))
        # 미션
        if method == "POST" and p == ["missions"]:
            b = self._body()
            return self._json(missions.create(b.get("goal", ""), b.get("mode", "team"), b.get("agent", ""),
                                              b.get("review", True)))
        if method == "GET" and len(p) == 2 and p[0] == "missions":
            return self._json(missions.detail(p[1]))
        if method == "POST" and len(p) == 3 and p[0] == "missions" and p[2] == "stop":
            return self._json(missions.RUNNER.stop(p[1]))
        if method == "DELETE" and len(p) == 2 and p[0] == "missions":
            m = missions.load(p[1])
            if m["status"] in ("running", "stopping"):
                return self._error("돌고 있는 미션은 먼저 멈춰 주세요.")
            shutil.rmtree(paths.missions_dir() / p[1])
            return self._json({"ok": True})
        # 영상
        if method == "POST" and p == ["videos"]:
            return self._json(video.start_job(self._body()))
        if method == "POST" and p == ["videos", "preview"]:
            b = self._body()
            proj = video.normalize(b.get("project") or {})
            i = max(0, min(int(b.get("index", 0)), len(proj["cards"]) - 1))
            return self._send(200, video.card_html(proj, i).encode("utf-8"), "text/html; charset=utf-8")
        if method == "GET" and len(p) == 2 and p[0] == "videos":
            return self._json(video.job(p[1]))
        if method == "DELETE" and len(p) == 2 and p[0] == "videos":
            j = video.job(p[1])
            if j["status"] == "running":
                return self._error("만드는 중인 영상은 지울 수 없어요.")
            shutil.rmtree(paths.videos_dir() / p[1])
            return self._json({"ok": True})
        # 연결 (API 키, 계정)
        if method == "POST" and p == ["connections"]:
            return self._json(connections.update(self._body()))
        if method == "POST" and p == ["connections", "test", "instagram"]:
            return self._json({"ok": True, "message": "연결됨: @" + publish.test_instagram()})
        if method == "GET" and len(p) == 2 and p[0] == "voices":
            return self._json(tts.list_voices(p[1]))
        # 게시
        if method == "POST" and p == ["publish"]:
            b = self._body()
            return self._json(publish.create(b.get("video_id", ""), b.get("platforms") or [], b.get("title", ""),
                                             b.get("caption", ""), b.get("hashtags", ""), b.get("privacy", "private"),
                                             b.get("schedule_at")))
        if method == "POST" and len(p) == 3 and p[0] == "publish" and p[2] in ("approve", "reject", "retry"):
            return self._json(getattr(publish, p[2])(p[1]))
        if method == "DELETE" and len(p) == 2 and p[0] == "publish":
            publish.delete(p[1])
            return self._json({"ok": True})
        if method == "GET" and len(p) == 3 and p[0] == "videos" and p[2] == "manifest":
            return self._json(video.manifest(p[1]))
        # 설정
        if method == "POST" and p == ["settings"]:
            return self._json(missions.save_settings(self._body()))
        self._error("없는 주소예요.", 404)


def serve(port: int = 8129, lan: bool = False) -> None:
    host = "0.0.0.0" if lan else "127.0.0.1"
    Handler.token = ensure_token() if lan else None
    Handler.port = port
    missions.RUNNER.start()
    publish.PUBLISHER.start()
    httpd = ThreadingHTTPServer((host, port), Handler)
    print(f"29 Crew 대시보드가 켜졌어요: http://127.0.0.1:{port}/")
    public_port = share.start_server()
    if public_port:
        print(f"공개 파일 서버: {public_port}번 포트 → {share.base_url()} (인스타그램·힉스필드용)")
    if lan:
        print(f"다른 기기에서는: http://(이 PC의 IP):{port}/?token={Handler.token}")
        print("이 열쇠(token)는 다른 사람에게 알려 주지 마세요.")
    print("끄려면 이 창에서 Ctrl + C 를 누르세요.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n대시보드를 껐어요.")
