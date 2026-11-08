"""유료 서비스·게시 연동 테스트. 실제 인터넷 대신 가짜 응답(net.request 바꿔 끼우기)을 쓴다."""
import base64
import json
import os
import shutil
import sys
import tempfile
import threading
import time
import unittest
import urllib.parse
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from crew29 import connections, higgsfield, net, publish, share, tts, video, web  # noqa: E402


class FakeNet:
    """(메서드, 주소 일부) → 응답 목록. 부른 기록을 calls에 남긴다."""

    def __init__(self, routes):
        self.routes = routes
        self.calls = []

    def __call__(self, method, url, headers=None, data=None, json_body=None, form=None, timeout=120):
        self.calls.append({"method": method, "url": url, "headers": headers or {}, "json": json_body,
                           "form": form, "data": data})
        for (m, part), replies in self.routes.items():
            if m == method and part in url:
                reply = replies.pop(0) if len(replies) > 1 else replies[0]
                if isinstance(reply, Exception):
                    raise reply
                status, body, hdrs = reply if len(reply) == 3 else (*reply, {})
                raw = body if isinstance(body, bytes) else json.dumps(body).encode()
                if not isinstance(body, bytes):
                    hdrs = {"Content-Type": "application/json", **hdrs}
                return net.Response(status, hdrs, raw)
        raise AssertionError(f"예상하지 못한 요청: {method} {url}")


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        os.environ["CREW29_ROOT"] = str(self.tmp)
        self._orig = net.request
        self._sleep = time.sleep

    def tearDown(self):
        net.request = self._orig
        publish.time.sleep = self._sleep
        higgsfield.time.sleep = self._sleep
        for k in ("CREW29_ROOT", "ELEVENLABS_API_KEY"):
            os.environ.pop(k, None)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def fake(self, routes):
        f = FakeNet(routes)
        net.request = f
        return f

    def done_job(self, kind="video", fmt="shorts", images=()):
        self.jobs = getattr(self, "jobs", 0) + 1
        vid = f"20260101-00000{self.jobs}"
        d = self.tmp / "data" / "videos" / vid
        (d / "cards").mkdir(parents=True)
        (d / "video.mp4").write_bytes(b"\x00" * 1000)
        for name in images:
            (d / name).write_bytes(b"\xff\xd8jpeg")
        (d / "job.json").write_text(json.dumps({"id": vid, "title": "테스트 영상", "status": "done", "kind": kind,
                                                "format": fmt, "images": list(images)}), encoding="utf-8")
        return vid


class ConnectionsTest(Base):
    def test_masks_secrets_keeps_plain_and_env_wins(self):
        connections.update({"elevenlabs_key": "sk-abcdef1234", "instagram_user_id": "1784", "nope": "x"})
        v = connections.view()
        self.assertEqual(v["elevenlabs_key"], "••••1234")
        self.assertEqual(v["instagram_user_id"], "1784")
        self.assertNotIn("nope", v)
        connections.update({"elevenlabs_key": ""})  # 빈 값은 그대로 둔다
        self.assertEqual(connections.get("elevenlabs_key"), "sk-abcdef1234")
        os.environ["ELEVENLABS_API_KEY"] = "env-key"
        self.assertEqual(connections.get("elevenlabs_key"), "env-key")
        connections.update({"instagram_user_id": "__clear__"})
        self.assertEqual(connections.get("instagram_user_id"), "")

    def test_defaults(self):
        self.assertEqual(connections.get("instagram_api"), "https://graph.instagram.com/v23.0")


class VoiceTest(Base):
    def test_elevenlabs_writes_audio_and_timings(self):
        connections.update({"elevenlabs_key": "k"})
        f = self.fake({("POST", "/with-timestamps"): [(200, {
            "audio_base64": base64.b64encode(b"mp3data").decode(),
            "alignment": {"characters": ["가", "나"], "character_start_times_seconds": [0, 0.3],
                          "character_end_times_seconds": [0.3, 0.6]}})]})
        out = self.tmp / "v.mp3"
        r = tts.speak("가나", str(out), {"engine": "elevenlabs", "name": "voice1"})
        self.assertEqual(out.read_bytes(), b"mp3data")
        self.assertEqual(r["timings"], [("가", 0, 0.3), ("나", 0.3, 0.6)])
        self.assertEqual(f.calls[0]["headers"]["xi-api-key"], "k")
        self.assertIn("/voice1/", f.calls[0]["url"])

    def test_elevenlabs_needs_key_and_voice(self):
        with self.assertRaises(tts.TTSError):
            tts.speak("가", str(self.tmp / "v.mp3"), {"engine": "elevenlabs", "name": "x"})
        connections.update({"elevenlabs_key": "k"})
        with self.assertRaises(tts.TTSError):
            tts.speak("가", str(self.tmp / "v.mp3"), {"engine": "elevenlabs", "name": ""})

    def test_typecast_and_voice_list(self):
        connections.update({"typecast_key": "t"})
        self.fake({("POST", "typecast.ai/v1/text-to-speech"): [(200, b"RIFFwav", {"Content-Type": "audio/wav"})],
                   ("GET", "typecast.ai/v1/voices"): [(200, [{"voice_id": "tc_1", "voice_name": "민지"}])]})
        out = self.tmp / "t.mp3"
        self.assertEqual(tts.speak("안녕", str(out), {"engine": "typecast", "name": "tc_1"}), {"timings": None})
        self.assertEqual(out.read_bytes(), b"RIFFwav")
        self.assertEqual(tts.list_voices("typecast"), [{"id": "tc_1", "label": "민지"}])

    def test_api_error_becomes_friendly(self):
        connections.update({"typecast_key": "t"})
        self.fake({("POST", "text-to-speech"): [net.NetError("api.typecast.ai 응답 오류 401", 401)]})
        with self.assertRaises(tts.TTSError) as e:
            tts.speak("안녕", str(self.tmp / "t.mp3"), {"engine": "typecast", "name": "tc_1"})
        self.assertIn("401", str(e.exception))


class HiggsfieldTest(Base):
    def test_generate_polls_and_downloads(self):
        connections.update({"higgsfield_key_id": "id", "higgsfield_key_secret": "sec"})
        higgsfield.time.sleep = lambda s: None
        f = self.fake({
            ("POST", "higgsfield-ai/dop/standard"): [(200, {"request_id": "r1", "status": "queued",
                                                         "status_url": "https://h.example/requests/r1/status"})],
            ("GET", "/requests/r1/status"): [(200, {"status": "in_progress"}),
                                             (200, {"status": "completed", "video": {"url": "https://cdn.example/out.mp4"}})],
            ("GET", "cdn.example/out.mp4"): [(200, b"MP4DATA", {"Content-Type": "video/mp4"})],
        })
        out = higgsfield.generate("바다 위 노을", self.tmp / "c.mp4")
        self.assertEqual(out.read_bytes(), b"MP4DATA")
        self.assertEqual(f.calls[0]["headers"]["Authorization"], "Key id:sec")
        self.assertEqual(f.calls[0]["json"], {"prompt": "바다 위 노을", "duration": 5})

    def test_failure_and_missing_keys(self):
        with self.assertRaises(higgsfield.HiggsfieldError):
            higgsfield.generate("x", self.tmp / "c.mp4")
        connections.update({"higgsfield_key_id": "id", "higgsfield_key_secret": "sec"})
        self.fake({("POST", "platform.higgsfield.ai"): [(200, {"id": "r2", "status": "nsfw"})]})
        with self.assertRaises(higgsfield.HiggsfieldError):
            higgsfield.generate("x", self.tmp / "c.mp4")

    def test_find_video_url_prefers_mp4(self):
        data = {"thumb": "https://a/t.jpg", "outputs": [{"url": "https://a/v.mp4"}], "url": "https://a/page"}
        self.assertEqual(higgsfield.find_video_url(data), "https://a/v.mp4")


class ShareTest(Base):
    def test_public_url_and_server(self):
        f = self.tmp / "video.mp4"
        f.write_bytes(b"0123456789")
        self.assertIsNone(share.public_url(f))  # 공개 주소 설정 전
        connections.update({"public_base_url": "https://pc.example.ts.net/"})
        url = share.public_url(f)
        self.assertTrue(url.startswith("https://pc.example.ts.net/p/") and url.endswith("/video.mp4"))
        path = urllib.parse.urlparse(url).path
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), share.PublicHandler)
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{httpd.server_address[1]}"
        try:
            with urllib.request.urlopen(base + path) as r:
                self.assertEqual(r.read(), b"0123456789")
            req = urllib.request.Request(base + path, headers={"Range": "bytes=2-4"})
            with urllib.request.urlopen(req) as r:
                self.assertEqual((r.status, r.read()), (206, b"234"))
            for bad in ("/p/wrongtoken/video.mp4", path.rsplit("/", 1)[0] + "/other.mp4", "/data/connections.json"):
                with self.assertRaises(urllib.error.HTTPError):
                    urllib.request.urlopen(base + bad)
        finally:
            httpd.shutdown()
            httpd.server_close()


class PublishTest(Base):
    def test_draft_rules(self):
        vid = self.done_job()
        with self.assertRaises(publish.PublishError):
            publish.create(vid, [])
        d = publish.create(vid, ["youtube", "instagram"], hashtags="여행, #캠핑", privacy="weird")
        self.assertEqual((d["status"], d["privacy"], d["hashtags"]), ("pending", "private", ["#여행", "#캠핑"]))
        img = self.done_job("images", "carousel", ["cards/card01.jpg"])
        with self.assertRaises(publish.PublishError):
            publish.create(img, ["youtube"])
        with self.assertRaises(publish.PublishError):
            publish.create(vid, ["youtube"], schedule_at=time.time() - 3600)

    def test_nothing_uploads_without_approval(self):
        vid = self.done_job()
        publish.create(vid, ["youtube"])
        self.fake({})  # 요청이 나가면 AssertionError
        publish.PUBLISHER.run_due()
        self.assertEqual(publish.list_drafts()[0]["status"], "pending")

    def test_schedule_waits_until_time(self):
        vid = self.done_job()
        d = publish.create(vid, ["youtube"], schedule_at=time.time() + 3600)
        self.assertEqual(publish.approve(d["id"])["status"], "scheduled")
        self.fake({})
        publish.PUBLISHER.run_due()
        self.assertEqual(publish.load(d["id"])["status"], "scheduled")

    def test_youtube_upload_flow(self):
        vid = self.done_job(fmt="shorts")
        connections.update({"youtube_client_id": "cid", "youtube_client_secret": "cs", "youtube_refresh_token": "rt"})
        f = self.fake({
            ("POST", "oauth2.googleapis.com/token"): [(200, {"access_token": "at"})],
            ("POST", "upload/youtube/v3/videos"): [(200, {}, {"Location": "https://upload.example/session1"})],
            ("PUT", "upload.example/session1"): [(200, {"id": "abc123"})],
        })
        d = publish.approve(publish.create(vid, ["youtube"], title="제목", caption="설명", hashtags="여행")["id"])
        d = publish.PUBLISHER.run(publish.load(d["id"]))
        self.assertEqual(d["status"], "done")
        self.assertEqual(d["results"]["youtube"]["url"], "https://youtube.com/shorts/abc123")
        meta = f.calls[1]["json"]
        self.assertIn("#Shorts", meta["snippet"]["description"])
        self.assertEqual(meta["status"]["privacyStatus"], "private")
        self.assertEqual(f.calls[2]["data"], b"\x00" * 1000)

    def test_instagram_reels_needs_public_url_then_publishes(self):
        vid = self.done_job(fmt="reels")
        connections.update({"instagram_user_id": "17", "instagram_token": "tok"})
        publish.time.sleep = lambda s: None
        d = publish.approve(publish.create(vid, ["instagram"], caption="캡션")["id"])
        d = publish.PUBLISHER.run(publish.load(d["id"]))
        self.assertEqual(d["status"], "failed")
        self.assertIn("공개 주소", d["results"]["instagram"]["error"])

        connections.update({"public_base_url": "https://pc.example.ts.net"})
        f = self.fake({
            ("POST", "/17/media_publish"): [(200, {"id": "m1"})],
            ("POST", "/17/media"): [(200, {"id": "c1"})],
            ("GET", "/c1?fields=status_code"): [(200, {"status_code": "IN_PROGRESS"}), (200, {"status_code": "FINISHED"})],
            ("GET", "/m1?fields=permalink"): [(200, {"permalink": "https://instagram.com/reel/x"})],
        })
        d = publish.PUBLISHER.run(publish.retry(d["id"]))
        self.assertEqual((d["status"], d["results"]["instagram"]["url"]), ("done", "https://instagram.com/reel/x"))
        form = f.calls[0]["form"]
        self.assertEqual((form["media_type"], form["share_to_feed"]), ("REELS", "true"))
        self.assertTrue(form["video_url"].startswith("https://pc.example.ts.net/p/"))

    def test_instagram_carousel(self):
        vid = self.done_job("images", "carousel", ["cards/card01.jpg", "cards/card02.jpg"])
        connections.update({"instagram_user_id": "17", "instagram_token": "tok", "public_base_url": "https://x.example"})
        publish.time.sleep = lambda s: None
        f = self.fake({
            ("POST", "/17/media_publish"): [(200, {"id": "m9"})],
            ("POST", "/17/media"): [(200, {"id": "k1"}), (200, {"id": "k2"}), (200, {"id": "parent"})],
            ("GET", "fields=status_code"): [(200, {"status_code": "FINISHED"})],
            ("GET", "fields=permalink"): [(200, {"permalink": "https://instagram.com/p/y"})],
        })
        d = publish.approve(publish.create(vid, ["instagram"], caption="카드")["id"])
        d = publish.PUBLISHER.run(publish.load(d["id"]))
        self.assertEqual(d["status"], "done")
        forms = [c["form"] for c in f.calls if c["method"] == "POST" and c["url"].endswith("/17/media")]
        self.assertEqual(forms[0]["is_carousel_item"], "true")
        self.assertEqual((forms[2]["media_type"], forms[2]["children"]), ("CAROUSEL", "k1,k2"))

    def test_youtube_oauth(self):
        with self.assertRaises(publish.PublishError):
            publish.youtube_auth_url("http://127.0.0.1:8129/oauth/youtube/callback")
        connections.update({"youtube_client_id": "cid", "youtube_client_secret": "cs"})
        url = publish.youtube_auth_url("http://127.0.0.1:8129/oauth/youtube/callback")
        q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
        self.assertEqual((q["access_type"][0], q["client_id"][0]), ("offline", "cid"))
        self.fake({("POST", "oauth2.googleapis.com/token"): [(200, {"access_token": "a", "refresh_token": "r"})],
                   ("GET", "youtube/v3/channels"): [(200, {"items": [{"snippet": {"title": "내 채널"}}]})]})
        with self.assertRaises(publish.PublishError):
            publish.youtube_callback("code", "bad-state", "x")
        self.assertEqual(publish.youtube_callback("code", q["state"][0], "x"), "내 채널")
        self.assertEqual(connections.get("youtube_refresh_token"), "r")


class WebIntegrationTest(Base):
    def setUp(self):
        super().setUp()
        web.Handler.token = None
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), web.Handler)
        self.base = f"http://127.0.0.1:{self.httpd.server_address[1]}"
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        super().tearDown()

    def call(self, path, body=None, method=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method or ("POST" if data else "GET"),
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def test_state_never_leaks_secrets(self):
        self.call("/api/connections", {"instagram_token": "SECRET-TOKEN-9999"})
        code, s = self.call("/api/state")
        self.assertNotIn("SECRET-TOKEN", json.dumps(s))
        self.assertTrue(s["connections"]["instagram_token"].endswith("9999"))
        self.assertIn("carousel", s["options"]["formats"])

    def test_publish_api_flow(self):
        vid = self.done_job()
        code, d = self.call("/api/publish", {"video_id": vid, "platforms": ["youtube"], "title": "t"})
        self.assertEqual((code, d["status"]), (200, "pending"))
        code, d = self.call(f"/api/publish/{d['id']}/reject", {})
        self.assertEqual(d["status"], "rejected")
        code, err = self.call(f"/api/publish/{d['id']}/retry", {})
        self.assertEqual(code, 400)
        code, _ = self.call(f"/api/publish/{d['id']}", method="DELETE")
        self.assertEqual(code, 200)

    def test_oauth_start_redirects_to_google(self):
        connections.update({"youtube_client_id": "cid", "youtube_client_secret": "cs"})

        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *a, **k):
                return None
        opener = urllib.request.build_opener(NoRedirect)
        with self.assertRaises(urllib.error.HTTPError) as e:
            opener.open(self.base + "/oauth/youtube/start")
        self.assertEqual(e.exception.code, 302)
        self.assertIn("accounts.google.com", e.exception.headers["Location"])


if __name__ == "__main__":
    unittest.main()
