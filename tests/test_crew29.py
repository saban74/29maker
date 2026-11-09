"""29 Crew 테스트. 실행: python -m unittest discover -s tests"""
import json
import os
import shutil
import sys
import tempfile
import textwrap
import threading
import time
import unittest
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from crew29 import agents, frontmatter, missions, skills, video, web  # noqa: E402


class Sandbox(unittest.TestCase):
    """테스트마다 빈 저장소 폴더를 만들어 CREW29_ROOT로 쓴다."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        os.environ["CREW29_ROOT"] = str(self.tmp)
        (self.tmp / ".claude" / "agents").mkdir(parents=True)
        (self.tmp / ".claude" / "skills").mkdir(parents=True)

    def tearDown(self):
        os.environ.pop("CREW29_ROOT", None)
        os.environ.pop("CREW29_CLAUDE", None)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def agent(self, name="writer", **kw):
        data = {"name": name, "description": "글 담당", "model": "sonnet", "tools": ["Read"], "role": "당신은 작가입니다."}
        data.update(kw)
        return agents.save(data, skills.names())


class FrontmatterTest(unittest.TestCase):
    def test_reads_inline_and_dash_lists(self):
        meta, body = frontmatter.parse("---\nname: a\ntools: Read, Grep\nskills:\n  - x\n  - y\n---\n\n본문\n")
        self.assertEqual(meta["tools"], ["Read", "Grep"])
        self.assertEqual(meta["skills"], ["x", "y"])
        self.assertEqual(body, "본문\n")

    def test_round_trip_keeps_values(self):
        text = frontmatter.dump({"name": "a", "description": "설명", "tools": ["Read"], "skills": []}, "본문")
        meta, body = frontmatter.parse(text)
        self.assertEqual((meta["name"], meta["tools"], body.strip()), ("a", ["Read"], "본문"))
        self.assertNotIn("skills", meta)

    def test_risky_values_are_quoted_and_read_back(self):
        for value in ['"인용"으로 시작', "주의: 콜론", "# 해시", "- 대시"]:
            text = frontmatter.dump({"description": value}, "b")
            self.assertEqual(frontmatter.parse(text)[0]["description"], value)
        self.assertIn('description: "주의: 콜론"', frontmatter.dump({"description": "주의: 콜론"}, "b"))

    def test_crlf_files_are_read(self):
        meta, _ = frontmatter.parse("---\r\nname: a\r\n---\r\nbody")
        self.assertEqual(meta["name"], "a")


class AgentsTest(Sandbox):
    def test_save_and_load(self):
        a = self.agent(color="blue")
        self.assertEqual(a["model"], "sonnet")
        self.assertEqual(agents.list_agents()[0]["name"], "writer")

    def test_rejects_bad_name_and_unknown_skill(self):
        with self.assertRaises(agents.AgentError):
            self.agent(name="Bad Name")
        with self.assertRaises(agents.AgentError):
            self.agent(skills=["nope"])

    def test_skill_limit(self):
        for i in range(6):
            skills.save(f"s{i}", "설명", "내용")
        with self.assertRaises(agents.AgentError):
            self.agent(skills=[f"s{i}" for i in range(6)])

    def test_deleting_a_skill_detaches_it(self):
        skills.save("blog", "블로그 규칙", "내용")
        self.agent(skills=["blog"])
        skills.delete("blog")
        self.assertEqual(agents.remove_skill_everywhere("blog"), ["writer"])
        self.assertEqual(agents.load("writer")["skills"], [])

    def test_existing_repo_agents_round_trip_unchanged(self):
        os.environ.pop("CREW29_ROOT")
        for a in agents.list_agents():
            meta = {k: a[k] for k in ("name", "description", "tools", "model", "color", "skills")}
            again = frontmatter.parse(frontmatter.dump(meta, a["role"]))[0]
            self.assertEqual(again["description"], a["description"], a["name"])

    def test_existing_repo_agents_parse(self):
        os.environ.pop("CREW29_ROOT")
        names = {a["name"] for a in agents.list_agents()}
        self.assertTrue({"researcher", "writer", "reels-producer", "content-reviewer"} <= names)
        self.assertEqual(agents.load("reels-producer")["skills"], ["reels-maker"])


class SkillsTest(Sandbox):
    SKILL = b"---\nname: Deep Research\ndescription: research well\n---\n\n# How\nsteps\n"

    def test_raw_url_conversion(self):
        self.assertEqual(skills.raw_url("https://github.com/o/r/tree/main/skills/x"),
                         "https://raw.githubusercontent.com/o/r/main/skills/x/SKILL.md")
        self.assertEqual(skills.raw_url("https://github.com/o/r/blob/dev/a/SKILL.md"),
                         "https://raw.githubusercontent.com/o/r/dev/a/SKILL.md")
        with self.assertRaises(skills.SkillError):
            skills.raw_url("https://example.com/x")

    def test_preview_then_save_and_replace(self):
        fetch = lambda url: self.SKILL  # noqa: E731
        p = skills.preview("https://github.com/o/r/tree/main/x", fetch)
        self.assertEqual((p["name"], p["exists"]), ("deep-research", False))
        skills.import_save("https://github.com/o/r/tree/main/x", p["sha"], fetcher=fetch)
        self.assertTrue(skills.preview("https://github.com/o/r/tree/main/x", fetch)["exists"])
        changed = lambda url: self.SKILL + b"more"  # noqa: E731
        with self.assertRaises(skills.SkillChanged):
            skills.import_save("https://github.com/o/r/tree/main/x", p["sha"], fetcher=changed)
        p2 = skills.preview("https://github.com/o/r/tree/main/x", changed)
        skills.import_save("https://github.com/o/r/tree/main/x", p2["sha"], fetcher=changed)
        self.assertIn("more", skills.load("deep-research")["body"])

    def test_save_requires_sha(self):
        with self.assertRaises(skills.SkillError):
            skills.import_save("https://github.com/o/r/tree/main/x", "", fetcher=lambda u: self.SKILL)


class MissionsTest(Sandbox):
    def fake_claude(self, lines, code=0):
        script = self.tmp / "fake_claude.py"
        script.write_text(textwrap.dedent(f"""
            import json, sys
            prompt = sys.stdin.read()
            assert "[미션 " in prompt and "-p" in sys.argv, (prompt[:80], sys.argv)
            for line in {lines!r}:
                print(json.dumps(line, ensure_ascii=False))
            sys.exit({code})
        """), encoding="utf-8")
        wrapper = self.tmp / ("fake.bat" if os.name == "nt" else "fake.sh")
        if os.name == "nt":
            wrapper.write_text(f'@"{sys.executable}" "{script}" %*\n')
        else:
            wrapper.write_text(f'#!/bin/sh\nexec "{sys.executable}" "{script}" "$@"\n')
            wrapper.chmod(0o755)
        os.environ["CREW29_CLAUDE"] = str(wrapper)

    def test_prompt_lists_workers_and_reviewers(self):
        self.agent()
        self.agent(name="content-reviewer", description="검수")
        m = missions.create("블로그 글 써 줘")
        text = missions.build_prompt(m)
        self.assertIn("- writer: 글 담당", text)
        self.assertNotIn("- content-reviewer", text)
        self.assertIn("검수 에이전트(content-reviewer)", text)
        self.assertIn(f"data/missions/{m['id']}/output/", text)

    def test_one_agent_mode_checks_agent(self):
        self.agent()
        self.agent(name="content-reviewer", description="검수")
        with self.assertRaises(missions.MissionError):
            missions.create("x", "one", "nobody")
        with self.assertRaises(missions.MissionError):
            missions.create("x", "one", "content-reviewer")
        m = missions.create("x", "one", "writer", review=False)
        self.assertIn("'writer' 에이전트에게", missions.build_prompt(m))

    def test_run_records_log_and_result(self):
        self.agent()
        self.fake_claude([
            {"type": "system", "subtype": "init", "model": "test-model"},
            {"type": "assistant", "message": {"content": [
                {"type": "text", "text": "계획을 세울게요"},
                {"type": "tool_use", "name": "Agent", "input": {"subagent_type": "writer"}}]}},
            {"type": "result", "result": "다 했어요", "num_turns": 3, "duration_ms": 4000},
        ])
        m = missions.create("글 써 줘")
        missions.RUNNER.run(missions.load(m["id"]))
        d = missions.detail(m["id"])
        self.assertEqual(d["status"], "done")
        self.assertEqual(d["result"], "다 했어요")
        self.assertIn("▶ 시작 (모델: test-model)", d["log"])
        self.assertEqual((d["model"], missions.last_model()), ("test-model", "test-model"))
        self.assertIn("🔧 Agent writer", d["log"])

    def test_activity_names_latest_agent(self):
        self.agent()
        m = missions.create("x")
        self.assertEqual(missions.activity()["agent"], "")
        d = missions.load(m["id"])
        d["status"] = "running"
        missions._write(d)
        (self.tmp / "data" / "missions" / m["id"] / "log.txt").write_text(
            "🔧 Agent researcher\n  ↳ 🔧 WebSearch x\n🔧 Agent writer\n🔧 Write a.md\n", encoding="utf-8")
        self.assertEqual(missions.activity(), {"mission": m["id"], "goal": "x", "agent": "writer"})

    def test_failed_exit_code(self):
        self.agent()
        self.fake_claude([{"type": "result", "result": ""}], code=2)
        m = missions.create("x")
        missions.RUNNER.run(missions.load(m["id"]))
        self.assertEqual(missions.load(m["id"])["status"], "failed")

    def test_missing_claude_fails_cleanly(self):
        self.agent()
        os.environ["CREW29_CLAUDE"] = ""
        missions.save_settings({"claude_cmd": ""})
        m = missions.create("x")
        orig = missions.shutil.which
        missions.shutil.which = lambda name: None
        try:
            missions.RUNNER.run(missions.load(m["id"]))
        finally:
            missions.shutil.which = orig
        d = missions.detail(m["id"])
        self.assertEqual(d["status"], "failed")
        self.assertIn("claude 명령을 찾지 못했어요", d["log"])

    def test_stop_queued(self):
        self.agent()
        m = missions.create("x")
        self.assertEqual(missions.RUNNER.stop(m["id"])["status"], "stopped")


class VideoTest(Sandbox):
    def test_normalize_rejects_empty(self):
        with self.assertRaises(video.VideoError):
            video.normalize({"cards": []})
        with self.assertRaises(video.VideoError):
            video.normalize({"cards": [{"narration": "only"}]})

    def test_card_html_escapes_text(self):
        p = video.normalize({"title": "<b>", "cards": [{"title": "<script>x</script>", "body": "a\nb"}]})
        html = video.card_html(p, 0)
        self.assertNotIn("<script>x", html)
        self.assertIn("a<br>b", html)

    def test_chunks_split_and_time_proportionally(self):
        groups = video.chunks("자동 편집이 잘 되는지 확인하는 문장입니다", 10.0, 2.0, max_chars=12)
        self.assertEqual([g["text"] for g in groups], ["자동 편집이 잘 되는지", "확인하는 문장입니다"])
        self.assertAlmostEqual(groups[0]["start"], 10.0)
        self.assertAlmostEqual(groups[-1]["end"], 12.0)
        self.assertEqual(len(groups[0]["words"]), 4)

    def test_chunks_use_exact_timings(self):
        text = "안녕 하세요"
        timings = [(ch, k * 0.5, k * 0.5 + 0.4) for k, ch in enumerate(text)]
        g = video.chunks(text, 1.0, 9.0, timings)[0]
        self.assertAlmostEqual(g["words"][1]["start"], 1.0 + 1.5)
        self.assertAlmostEqual(g["end"], 1.0 + 2.9)

    def test_subtitles_do_not_overlap(self):
        p = video.normalize({"cards": [{"title": "a"}], "accent": "#112233"})
        groups = video.chunks("하나 둘 셋 넷 다섯 여섯 일곱 여덟", 0, 4, max_chars=6)
        srt = video.build_srt(groups)
        ass = video.build_ass(groups, p)
        self.assertIn("&H00332211", ass)
        self.assertIn("{\\k", ass)
        ends = [g["end"] for g in groups]
        for k in range(len(groups) - 1):
            self.assertLessEqual(video._show_until(groups, k), groups[k + 1]["start"])
        self.assertIn("-->", srt)
        self.assertTrue(ends)

    def test_ass_escapes_braces(self):
        p = video.normalize({"cards": [{"title": "a"}]})
        ass = video.build_ass(video.chunks("{위험} \\글자", 0, 1), p)
        self.assertIn("(위험)", ass)

    def test_formats_and_carousel_limit(self):
        p = video.normalize({"format": "youtube", "cards": [{"title": "a"}]})
        self.assertEqual(video.size_of(p), (1920, 1080))
        self.assertIn("width:1920px", video.card_html(p, 0))
        with self.assertRaises(video.VideoError):
            video.normalize({"format": "carousel", "cards": [{"title": str(i)} for i in range(11)]})
        self.assertIn("rgba(0,0,0,.38)", video.card_html(p, 0, transparent=True))

    @unittest.skipUnless(all(video.check()[k] for k in ("ffmpeg", "browser")), "ffmpeg 또는 브라우저 없음")
    def test_render_with_command_voice(self):
        ff, _ = video.find_ffmpeg()
        project = {"title": "테스트", "voice": {"engine": "command",
                   "command": f"{ff} -y -f lavfi -i sine=frequency=440:duration=1 {{out}}"},
                   "cards": [{"title": "하나", "narration": "첫 문장"}, {"title": "둘", "duration": 1.5}]}
        out = self.tmp / "out"
        m = video.render(project, out)
        self.assertTrue((out / "video.mp4").stat().st_size > 1000)
        self.assertEqual([t["voice"] is not None for t in m["timeline"]], [True, False])
        self.assertAlmostEqual(m["timeline"][1]["end"] - m["timeline"][1]["start"], 1.5)
        self.assertTrue((out / "cards" / "card02.png").is_file())
        self.assertFalse((out / "work").exists())
        self.assertTrue(m["captions"])

    @unittest.skipUnless(all(video.check()[k] for k in ("ffmpeg", "browser")), "ffmpeg 또는 브라우저 없음")
    def test_render_with_every_edit_option(self):
        ff, _ = video.find_ffmpeg()
        run = lambda *a: __import__("subprocess").run([ff, "-y", "-v", "error", *a], check=True)  # noqa: E731
        run("-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30", "-f", "lavfi", "-i", "sine=f=200",
            "-t", "1.5", "-pix_fmt", "yuv420p", str(self.tmp / "clip.mp4"))
        run("-f", "lavfi", "-i", "sine=f=100:duration=10", str(self.tmp / "bgm.mp3"))
        run("-f", "lavfi", "-i", "color=c=red:s=200x80", "-frames:v", "1", str(self.tmp / "logo.png"))
        project = {"title": "편집", "format": "square", "bgm": str(self.tmp / "bgm.mp3"),
                   "voice": {"engine": "command", "command": f"{ff} -y -f lavfi -i sine=duration=1 {{out}}"},
                   "edit": {"subtitles": True, "motion": True, "logo": str(self.tmp / "logo.png"),
                            "intro": str(self.tmp / "logo.png"), "intro_duration": 1, "outro": str(self.tmp / "clip.mp4")},
                   "cards": [{"title": "하나", "narration": "첫 번째 문장"},
                             {"title": "둘", "narration": "배경 영상", "background": {"type": "video", "path": str(self.tmp / "clip.mp4")}}]}
        out = self.tmp / "out"
        m = video.render(project, out)
        self.assertEqual(m["size"], [1080, 1080])
        self.assertAlmostEqual(m["timeline"][0]["start"], 1.0)
        self.assertGreater(m["duration"], 1 + 2.5 + 2.5 + 1.4)
        self.assertTrue((out / "subtitles.ass").is_file())
        self.assertEqual(m["timeline"][1]["clip"], str(self.tmp / "clip.mp4"))  # 내 영상은 원래 경로 그대로

    @unittest.skipUnless(all(video.check()[k] for k in ("ffmpeg", "browser")), "ffmpeg 또는 브라우저 없음")
    def test_carousel_makes_jpegs(self):
        m = video.render({"format": "carousel", "cards": [{"title": "하나"}, {"title": "둘"}]}, self.tmp / "c")
        self.assertEqual(m["images"], ["cards/card01.jpg", "cards/card02.jpg"])
        self.assertTrue((self.tmp / "c" / "cards" / "card01.jpg").read_bytes().startswith(b"\xff\xd8"))


class WebTest(Sandbox):
    def setUp(self):
        super().setUp()
        web.Handler.token = None
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), web.Handler)
        self.base = f"http://127.0.0.1:{self.httpd.server_address[1]}"
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        web.Handler.token = None
        super().tearDown()

    def call(self, path, body=None, method=None, headers=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method or ("POST" if data else "GET"),
                                     headers={"Content-Type": "application/json", **(headers or {})})
        try:
            with urllib.request.urlopen(req) as r:
                raw = r.read()
                return r.status, json.loads(raw) if "json" in r.headers.get("Content-Type", "") else raw.decode()
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def test_state_and_agent_crud(self):
        code, s = self.call("/api/state")
        self.assertEqual((code, s["agents"]), (200, []))
        code, _ = self.call("/api/skills", {"name": "blog", "description": "규칙", "body": "내용"})
        self.assertEqual(code, 200)
        code, a = self.call("/api/agents", {"name": "writer", "description": "글", "role": "작가", "skills": ["blog"]})
        self.assertEqual((code, a["skills"]), (200, ["blog"]))
        code, r = self.call("/api/skills/blog", method="DELETE")
        self.assertEqual(r["detached_from"], ["writer"])
        code, err = self.call("/api/agents", {"name": "x y", "description": "d", "role": "r"})
        self.assertEqual(code, 400)
        self.assertIn("이름은", err["error"])

    def test_index_and_static(self):
        code, html = self.call("/")
        self.assertIn("29 Crew", html)
        code, _ = self.call("/static/app.js")
        self.assertEqual(code, 200)
        code, _ = self.call("/static/../web.py")
        self.assertEqual(code, 404)

    def test_files_cannot_escape(self):
        (self.tmp / "data" / "videos" / "v1").mkdir(parents=True)
        code, _ = self.call("/files/videos/v1/..%2F..%2F..%2Fsecret")
        self.assertEqual(code, 404)

    def test_preview_returns_html(self):
        code, html = self.call("/api/videos/preview", {"project": {"cards": [{"title": "안녕"}]}, "index": 0})
        self.assertEqual(code, 200)
        self.assertIn("안녕", html)

    def test_lan_mode_needs_token(self):
        web.Handler.token = "secret"
        self.assertEqual(self.call("/api/state")[0], 401)
        self.assertEqual(self.call("/api/state", headers={"X-Crew-Token": "secret"})[0], 200)
        self.assertEqual(self.call("/api/state?token=secret")[0], 200)

    def test_mission_api(self):
        self.call("/api/agents", {"name": "writer", "description": "글", "role": "작가"})
        code, m = self.call("/api/missions", {"goal": "글 써 줘"})
        self.assertEqual((code, m["status"]), (200, "queued"))
        code, d = self.call(f"/api/missions/{m['id']}")
        self.assertEqual(d["goal"], "글 써 줘")
        code, s = self.call(f"/api/missions/{m['id']}/stop", {})
        self.assertEqual(s["status"], "stopped")
        code, _ = self.call(f"/api/missions/{m['id']}", method="DELETE")
        self.assertEqual(code, 200)


if __name__ == "__main__":
    unittest.main()
