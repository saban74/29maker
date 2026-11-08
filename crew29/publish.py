"""게시: 만든 영상·카드를 유튜브와 인스타그램에 올린다.

흐름: 게시 준비(초안) → 사람이 승인 → (예약 시간이 되면) 업로드.
AI나 명령어는 초안까지만 만들 수 있고, 승인은 대시보드에서 사람이 누른다.
"""
import json
import os
import random
import secrets as pysecrets
import threading
import time
import urllib.parse
from datetime import datetime
from pathlib import Path

from . import connections, net, paths, share, video

PLATFORMS = ("youtube", "instagram")
PRIVACY = ("private", "unlisted", "public")
VERTICAL = ("reels", "shorts", "tiktok")
GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN = "https://oauth2.googleapis.com/token"
YT_SCOPES = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"
YT_UPLOAD = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
YT_CHANNELS = "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true"


class PublishError(ValueError):
    pass


# ---------- 초안 ----------

def _dir() -> Path:
    d = paths.data_dir() / "publish"
    d.mkdir(exist_ok=True)
    return d


def _path(pid: str) -> Path:
    if not pid.replace("-", "").isalnum():
        raise PublishError("게시 번호가 올바르지 않아요.")
    return _dir() / f"{pid}.json"


def load(pid: str) -> dict:
    f = _path(pid)
    if not f.is_file():
        raise PublishError("그런 게시 초안이 없어요.")
    return json.loads(f.read_text(encoding="utf-8"))


def _write(d: dict) -> None:
    f = _path(d["id"])
    tmp = f.with_suffix(".tmp")
    tmp.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, f)


def list_drafts() -> list[dict]:
    out = []
    for f in sorted(_dir().glob("*.json"), reverse=True):
        try:
            out.append(json.loads(f.read_text(encoding="utf-8")))
        except ValueError:
            continue
    return out


def create(video_id: str, platforms: list[str], title: str = "", caption: str = "", hashtags: str = "",
           privacy: str = "private", schedule_at: float | None = None) -> dict:
    job = video.job(video_id)
    if job["status"] != "done":
        raise PublishError("완성된 영상만 게시할 수 있어요.")
    platforms = [p for p in platforms if p in PLATFORMS]
    if not platforms:
        raise PublishError("올릴 곳(유튜브, 인스타그램)을 하나 이상 골라 주세요.")
    if job["kind"] == "images" and platforms != ["instagram"]:
        raise PublishError("카드형 이미지는 인스타그램에만 올릴 수 있어요.")
    if job["kind"] == "images" and not 1 <= len(job.get("images", [])) <= 10:
        raise PublishError("인스타 카드형은 1~10장이어야 해요.")
    title = " ".join(title.split()) or job["title"]
    if "youtube" in platforms and len(title) > 100:
        raise PublishError("유튜브 제목은 100자까지예요.")
    tags = [t if t.startswith("#") else "#" + t for t in hashtags.replace(",", " ").split() if t.strip("#")]
    if len(tags) > 30:
        raise PublishError("해시태그는 30개까지예요.")
    if len(caption) + len(" ".join(tags)) > 2100:
        raise PublishError("설명(캡션)이 너무 길어요. 2,100자 안으로 줄여 주세요.")
    if privacy not in PRIVACY:
        privacy = "private"
    if schedule_at and float(schedule_at) < time.time() - 60:
        raise PublishError("예약 시간이 이미 지났어요.")
    d = {
        "id": datetime.now().strftime("%Y%m%d-%H%M%S") + f"-{random.randint(0, 0xfff):03x}",
        "video_id": video_id, "kind": job["kind"], "format": job.get("format", "reels"), "title": title,
        "caption": caption.strip(), "hashtags": tags, "privacy": privacy,
        "schedule_at": float(schedule_at) if schedule_at else None,
        "platforms": platforms, "status": "pending", "created_at": time.time(), "approved_at": None,
        "results": {p: {"status": "waiting", "url": "", "error": ""} for p in platforms},
    }
    _write(d)
    return d


def approve(pid: str) -> dict:
    d = load(pid)
    if d["status"] not in ("pending", "rejected"):
        raise PublishError("승인 대기 중인 초안만 승인할 수 있어요.")
    d["status"] = "scheduled" if d["schedule_at"] and d["schedule_at"] > time.time() else "approved"
    d["approved_at"] = time.time()
    _write(d)
    PUBLISHER.wake()
    return d


def reject(pid: str) -> dict:
    d = load(pid)
    if d["status"] not in ("pending", "scheduled", "approved"):
        raise PublishError("이미 올리고 있거나 끝난 초안이에요.")
    d["status"] = "rejected"
    _write(d)
    return d


def retry(pid: str) -> dict:
    d = load(pid)
    if d["status"] != "failed":
        raise PublishError("실패한 게시만 다시 시도할 수 있어요.")
    for r in d["results"].values():
        if r["status"] == "failed":
            r.update(status="waiting", error="")
    d["status"] = "approved"
    _write(d)
    PUBLISHER.wake()
    return d


def delete(pid: str) -> None:
    d = load(pid)
    if d["status"] == "publishing":
        raise PublishError("올리는 중에는 지울 수 없어요.")
    _path(pid).unlink()


def text_for(d: dict) -> str:
    return "\n\n".join(x for x in (d["caption"], " ".join(d["hashtags"])) if x)


# ---------- 유튜브 ----------

_oauth_states: dict[str, float] = {}


def youtube_auth_url(redirect_uri: str) -> str:
    cid = connections.get("youtube_client_id")
    if not (cid and connections.get("youtube_client_secret")):
        raise PublishError("먼저 유튜브 OAuth 클라이언트 ID와 비밀번호를 저장해 주세요.")
    state = pysecrets.token_urlsafe(16)
    _oauth_states[state] = time.time()
    q = {"client_id": cid, "redirect_uri": redirect_uri, "response_type": "code", "scope": YT_SCOPES,
         "access_type": "offline", "prompt": "consent", "state": state}
    return GOOGLE_AUTH + "?" + urllib.parse.urlencode(q)


def youtube_callback(code: str, state: str, redirect_uri: str) -> str:
    started = _oauth_states.pop(state, None)
    if not started or time.time() - started > 900:
        raise PublishError("연결 요청이 만료됐어요. 다시 '유튜브 연결'을 눌러 주세요.")
    try:
        tok = net.request("POST", GOOGLE_TOKEN, form={
            "code": code, "client_id": connections.get("youtube_client_id"),
            "client_secret": connections.get("youtube_client_secret"),
            "redirect_uri": redirect_uri, "grant_type": "authorization_code"}).json()
    except (net.NetError, ValueError) as e:
        raise PublishError(f"구글 로그인을 마치지 못했어요: {e}") from e
    if not tok.get("refresh_token"):
        raise PublishError("구글이 오래 쓰는 열쇠(refresh token)를 주지 않았어요. 다시 연결해 주세요.")
    connections.update({"youtube_refresh_token": tok["refresh_token"]})
    try:
        ch = net.request("GET", YT_CHANNELS, headers={"Authorization": f"Bearer {tok['access_token']}"}).json()
        name = ch["items"][0]["snippet"]["title"]
    except (net.NetError, ValueError, KeyError, IndexError):
        name = "연결됨"
    connections.update({"youtube_channel": name})
    return name


def _youtube_token() -> str:
    rt = connections.get("youtube_refresh_token")
    if not rt:
        raise PublishError("유튜브가 연결되어 있지 않아요. 설정 → 연결에서 '유튜브 연결'을 눌러 주세요.")
    try:
        return net.request("POST", GOOGLE_TOKEN, form={
            "client_id": connections.get("youtube_client_id"),
            "client_secret": connections.get("youtube_client_secret"),
            "refresh_token": rt, "grant_type": "refresh_token"}).json()["access_token"]
    except (net.NetError, ValueError, KeyError) as e:
        raise PublishError(f"유튜브 열쇠를 새로 받지 못했어요. 다시 연결해 주세요: {e}") from e


def upload_youtube(d: dict) -> str:
    f = paths.videos_dir() / d["video_id"] / "video.mp4"
    title = d["title"]
    desc = text_for(d)
    if d["format"] in VERTICAL and "#shorts" not in (title + desc).lower():
        desc = (desc + "\n\n#Shorts").strip()
    token = _youtube_token()
    meta = {"snippet": {"title": title, "description": desc, "categoryId": "22",
                        "tags": [t.lstrip("#") for t in d["hashtags"]][:30]},
            "status": {"privacyStatus": d["privacy"], "selfDeclaredMadeForKids": False}}
    data = f.read_bytes()
    start = net.request("POST", YT_UPLOAD, json_body=meta, headers={
        "Authorization": f"Bearer {token}", "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": str(len(data))})
    location = start.header("Location")
    if not location:
        raise PublishError("유튜브가 업로드 주소를 주지 않았어요.")
    res = net.request("PUT", location, data=data, timeout=1800,
                      headers={"Authorization": f"Bearer {token}", "Content-Type": "video/mp4"}).json()
    vid = res["id"]
    return f"https://youtube.com/shorts/{vid}" if d["format"] in VERTICAL else f"https://youtu.be/{vid}"


# ---------- 인스타그램 ----------

def _ig() -> tuple[str, str, str]:
    base, uid, token = (connections.get("instagram_api").rstrip("/"), connections.get("instagram_user_id"),
                        connections.get("instagram_token"))
    if not (uid and token):
        raise PublishError("인스타그램 계정 ID와 액세스 토큰이 없어요. 설정 → 연결에서 넣어 주세요.")
    return base, uid, token


def _public(f: Path) -> str:
    url = share.public_url(f, hours=6)
    if not url:
        raise PublishError("인스타그램은 파일을 인터넷 주소로 가져가요. 설정 → 연결에서 '공개 주소'를 먼저 설정해 주세요.")
    return url


def _ig_create(params: dict) -> str:
    base, uid, token = _ig()
    return net.request("POST", f"{base}/{uid}/media", form={**params, "access_token": token}).json()["id"]


def _ig_wait(cid: str, poll: float = 5, timeout: float = 600) -> None:
    base, _, token = _ig()
    deadline = time.time() + timeout
    while True:
        st = net.request("GET", f"{base}/{cid}?fields=status_code,status&access_token={token}").json()
        code = st.get("status_code")
        if code in ("FINISHED", "PUBLISHED"):
            return
        if code in ("ERROR", "EXPIRED"):
            raise PublishError(f"인스타그램이 파일을 처리하지 못했어요: {st.get('status', code)}")
        if time.time() > deadline:
            raise PublishError("인스타그램 처리가 너무 오래 걸려요.")
        time.sleep(poll)


def _ig_publish(cid: str) -> str:
    base, uid, token = _ig()
    mid = net.request("POST", f"{base}/{uid}/media_publish", form={"creation_id": cid, "access_token": token}).json()["id"]
    try:
        return net.request("GET", f"{base}/{mid}?fields=permalink&access_token={token}").json().get("permalink", "")
    except (net.NetError, ValueError):
        return ""


def upload_instagram(d: dict, poll: float = 5) -> str:
    folder = paths.videos_dir() / d["video_id"]
    caption = text_for(d)
    if d["kind"] == "images":
        images = [folder / p for p in video.job(d["video_id"]).get("images", [])]
        if len(images) == 1:
            cid = _ig_create({"image_url": _public(images[0]), "caption": caption})
        else:
            children = []
            for img in images:
                child = _ig_create({"image_url": _public(img), "is_carousel_item": "true"})
                _ig_wait(child, poll)
                children.append(child)
            cid = _ig_create({"media_type": "CAROUSEL", "children": ",".join(children), "caption": caption})
    else:
        cid = _ig_create({"media_type": "REELS", "video_url": _public(folder / "video.mp4"),
                          "caption": caption, "share_to_feed": "true"})
    _ig_wait(cid, poll)
    return _ig_publish(cid)


def test_instagram() -> str:
    base, uid, token = _ig()
    try:
        me = net.request("GET", f"{base}/{uid}?fields=username&access_token={token}").json()
    except (net.NetError, ValueError) as e:
        raise PublishError(f"인스타그램 연결 확인 실패: {e}") from e
    return me.get("username", "연결됨")


UPLOADERS = {"youtube": upload_youtube, "instagram": upload_instagram}


# ---------- 예약·업로드 실행기 ----------

class Publisher:
    def __init__(self):
        self._event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        for d in list_drafts():  # 대시보드가 꺼질 때 올리던 것
            if d["status"] == "publishing":
                d["status"] = "failed"
                for r in d["results"].values():
                    if r["status"] == "uploading":
                        r.update(status="failed", error="대시보드가 꺼져서 중단됐어요.")
                _write(d)
        if not self._thread:
            self._thread = threading.Thread(target=self._loop, daemon=True)
            self._thread.start()

    def wake(self) -> None:
        self._event.set()

    def _loop(self) -> None:
        while True:
            self._event.wait(15)
            self._event.clear()
            self.run_due()

    def run_due(self) -> None:
        now = time.time()
        for d in list_drafts():
            if d["status"] == "approved" or (d["status"] == "scheduled" and d["schedule_at"] <= now):
                self.run(d)

    def run(self, d: dict) -> dict:
        d["status"] = "publishing"
        _write(d)
        for name in d["platforms"]:
            r = d["results"][name]
            if r["status"] == "done":
                continue
            r.update(status="uploading", error="")
            _write(d)
            try:
                r.update(status="done", url=UPLOADERS[name](d))
            except (PublishError, net.NetError, video.VideoError, OSError, KeyError, ValueError) as e:
                r.update(status="failed", error=str(e))
            _write(d)
        d["status"] = "done" if all(r["status"] == "done" for r in d["results"].values()) else "failed"
        d["finished_at"] = time.time()
        _write(d)
        return d


PUBLISHER = Publisher()
