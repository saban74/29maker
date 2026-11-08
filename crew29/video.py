"""릴스 카드영상 만들기: 카드(HTML) → 이미지(PNG) → 목소리 → 영상(MP4) + 자막(SRT).

결과 폴더에는 캡컷·프리미어 같은 외부 편집 프로그램에서 바로 쓸 수 있게
카드 이미지, 목소리 파일, 자막, 타임라인(manifest.json)을 함께 남긴다.
"""
import glob
import html
import json
import os
import re
import shutil
import subprocess
import threading
import time
from datetime import datetime
from pathlib import Path

from . import paths, tts

THEMES = {
    "light": {"bg": "#ffffff", "fg": "#16181d", "muted": "#6b7280", "accent": "#4f46e5"},
    "dark": {"bg": "#0f1115", "fg": "#f3f4f6", "muted": "#9ca3af", "accent": "#8b9cff"},
    "pop": {"bg": "linear-gradient(160deg,#ff7a59 0%,#ff3d81 45%,#7b5cff 100%)",
            "fg": "#ffffff", "muted": "rgba(255,255,255,.8)", "accent": "#fff35c"},
}
FPS = 30
FADE = 0.25


class VideoError(RuntimeError):
    pass


# ---------- 도구 찾기 ----------

def find_ffmpeg() -> tuple[str | None, str | None]:
    ff = os.environ.get("CREW29_FFMPEG") or shutil.which("ffmpeg")
    probe = shutil.which("ffprobe")
    if ff and not probe:
        cand = Path(ff).with_name("ffprobe.exe" if os.name == "nt" else "ffprobe")
        probe = str(cand) if cand.is_file() else None
    return ff, probe


def find_browser() -> str | None:
    env = os.environ.get("CREW29_BROWSER")
    if env:
        return env
    cands = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        *sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome"), reverse=True),
    ]
    for c in cands:
        if c and os.path.isfile(c):
            return c
    for name in ("chromium", "chromium-browser", "google-chrome", "microsoft-edge"):
        if shutil.which(name):
            return shutil.which(name)
    return None


def check() -> dict:
    ff, probe = find_ffmpeg()
    return {"ffmpeg": bool(ff and probe), "browser": bool(find_browser()), "edge_tts": tts.edge_available()}


# ---------- 프로젝트 ----------

def normalize(project: dict) -> dict:
    cards = project.get("cards") or []
    if not isinstance(cards, list) or not cards:
        raise VideoError("카드가 한 장 이상 있어야 해요.")
    if len(cards) > 30:
        raise VideoError("카드는 30장까지 만들 수 있어요.")
    theme = project.get("theme") if project.get("theme") in THEMES else "dark"
    voice = project.get("voice") or {}
    if voice.get("engine", "none") not in tts.ENGINES:
        raise VideoError("목소리 엔진은 none, edge, command 중 하나예요.")
    clean = []
    for i, c in enumerate(cards, 1):
        if not isinstance(c, dict) or not (c.get("title") or c.get("body")):
            raise VideoError(f"{i}번째 카드에 제목이나 내용이 없어요.")
        d = c.get("duration")
        clean.append({
            "title": str(c.get("title", "")), "body": str(c.get("body", "")),
            "emoji": str(c.get("emoji", ""))[:8], "narration": str(c.get("narration", "")),
            "duration": float(d) if d not in (None, "") else None,
        })
    return {
        "title": str(project.get("title") or "제목 없는 영상"),
        "theme": theme,
        "accent": str(project.get("accent") or ""),
        "voice": {"engine": voice.get("engine", "none"), "name": voice.get("name", ""),
                  "rate": voice.get("rate", "+0%"), "command": voice.get("command", "")},
        "bgm": str(project.get("bgm") or ""),
        "bgm_volume": float(project.get("bgm_volume") or 0.15),
        "show_page": project.get("show_page", True) is not False,
        "cards": clean,
    }


def card_html(p: dict, i: int) -> str:
    c = p["cards"][i]
    t = dict(THEMES[p["theme"]])
    if re.fullmatch(r"#[0-9a-fA-F]{3,8}", p["accent"] or ""):
        t["accent"] = p["accent"]
    esc = lambda s: html.escape(s).replace("\n", "<br>")  # noqa: E731
    page = f"<div class='page'>{i + 1} / {len(p['cards'])}</div>" if p["show_page"] else ""
    emoji = f"<div class='emoji'>{html.escape(c['emoji'])}</div>" if c["emoji"] else ""
    title_size = 110 if len(c["title"]) <= 14 else 88 if len(c["title"]) <= 28 else 72
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1920px;overflow:hidden}}
body{{background:{t['bg']};color:{t['fg']};font-family:"Pretendard","Malgun Gothic","Apple SD Gothic Neo",
"Noto Sans CJK KR","Noto Sans KR","WenQuanYi Zen Hei",sans-serif;word-break:keep-all}}
.wrap{{position:absolute;inset:220px 110px 420px 110px;display:flex;flex-direction:column;justify-content:center}}
.top{{position:absolute;top:120px;left:110px;right:110px;display:flex;justify-content:space-between;
font-size:34px;color:{t['muted']};font-weight:600}}
.page{{color:{t['accent']}}}
.emoji{{font-size:150px;line-height:1;margin-bottom:56px}}
h1{{font-size:{title_size}px;line-height:1.25;font-weight:800;letter-spacing:-1px}}
.bar{{width:120px;height:12px;border-radius:6px;background:{t['accent']};margin:56px 0}}
p{{font-size:54px;line-height:1.55;font-weight:500;color:{t['fg']};opacity:.92}}
</style></head><body>
<div class="top"><div>{html.escape(p['title'])}</div>{page}</div>
<div class="wrap">{emoji}<h1>{esc(c['title'])}</h1>{"<div class='bar'></div><p>" + esc(c['body']) + "</p>" if c['body'] else ""}</div>
</body></html>"""


# ---------- 만들기 ----------

def render(project: dict, out_dir: Path, progress=lambda msg: None) -> dict:
    p = normalize(project)
    ff, probe = find_ffmpeg()
    if not (ff and probe):
        raise VideoError("ffmpeg를 찾지 못했어요. PowerShell에서 `winget install ffmpeg` 실행 후 대시보드를 다시 켜 주세요.")
    browser = find_browser()
    if not browser:
        raise VideoError("카드를 그릴 브라우저(Edge 또는 Chrome)를 찾지 못했어요.")
    for sub in ("cards", "voice", "work"):
        (out_dir / sub).mkdir(parents=True, exist_ok=True)
    (out_dir / "project.json").write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf-8")

    timeline, t0 = [], 0.0
    n = len(p["cards"])
    for i, c in enumerate(p["cards"]):
        progress(f"{i + 1}/{n} 카드 그리는 중")
        html_file = out_dir / "work" / f"card{i + 1:02d}.html"
        html_file.write_text(card_html(p, i), encoding="utf-8")
        png = out_dir / "cards" / f"card{i + 1:02d}.png"
        _screenshot(browser, html_file, png)

        voice_file = None
        if c["narration"] and p["voice"]["engine"] != "none":
            progress(f"{i + 1}/{n} 목소리 만드는 중")
            target = out_dir / "voice" / f"voice{i + 1:02d}.mp3"
            if tts.speak(c["narration"], str(target), p["voice"]):
                voice_file = target
        audio_len = _duration(probe, voice_file) if voice_file else 0.0
        dur = c["duration"] or max(audio_len + 0.6, 2.5 if voice_file else 3.0)
        dur = max(dur, audio_len + 0.2)
        timeline.append({"card": i + 1, "start": round(t0, 3), "end": round(t0 + dur, 3),
                         "image": f"cards/{png.name}", "voice": f"voice/{voice_file.name}" if voice_file else None,
                         "narration": c["narration"]})
        progress(f"{i + 1}/{n} 장면 만드는 중")
        _segment(ff, png, voice_file, dur, out_dir / "work" / f"seg{i + 1:02d}.mp4")
        t0 += dur

    progress("장면 이어 붙이는 중")
    lst = out_dir / "work" / "list.txt"
    lst.write_text("".join(f"file 'seg{i + 1:02d}.mp4'\n" for i in range(n)), encoding="utf-8")
    joined = out_dir / "work" / "joined.mp4"
    _ff([ff, "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(joined)])
    final = out_dir / "video.mp4"
    if p["bgm"]:
        bgm = Path(p["bgm"])
        if not bgm.is_file():
            raise VideoError(f"배경음악 파일이 없어요: {bgm}")
        progress("배경음악 넣는 중")
        _ff([ff, "-y", "-i", str(joined), "-stream_loop", "-1", "-i", str(bgm), "-filter_complex",
             f"[1:a]volume={p['bgm_volume']}[b];[0:a][b]amix=inputs=2:duration=first:normalize=0[a]",
             "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest", str(final)])
    else:
        shutil.copyfile(joined, final)

    (out_dir / "subtitles.srt").write_text(_srt(timeline), encoding="utf-8")
    manifest = {"title": p["title"], "size": [1080, 1920], "fps": FPS, "duration": round(t0, 3),
                "video": "video.mp4", "subtitles": "subtitles.srt", "timeline": timeline}
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    shutil.rmtree(out_dir / "work", ignore_errors=True)
    progress("완성")
    return manifest


def _screenshot(browser: str, html_file: Path, png: Path) -> None:
    cmd = [browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
           "--force-device-scale-factor=1", "--window-size=1080,1920", f"--screenshot={png}",
           html_file.resolve().as_uri()]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
    if not png.is_file():
        raise VideoError(f"카드 이미지를 만들지 못했어요: {(r.stderr or '').strip()[-300:]}")


def _duration(probe: str, f: Path) -> float:
    r = subprocess.run([probe, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                       capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


def _segment(ff: str, png: Path, voice: Path | None, dur: float, out: Path) -> None:
    d = f"{dur:.3f}"
    audio = ["-i", str(voice)] if voice else ["-f", "lavfi", "-t", d, "-i", "anullsrc=r=44100:cl=stereo"]
    vf = (f"scale=1080:1920,fps={FPS},fade=t=in:st=0:d={FADE},"
          f"fade=t=out:st={max(dur - FADE, 0):.3f}:d={FADE},format=yuv420p")
    _ff([ff, "-y", "-loop", "1", "-framerate", str(FPS), "-t", d, "-i", str(png), *audio,
         "-vf", vf, "-af", "apad", "-t", d, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
         "-c:a", "aac", "-ar", "44100", "-ac", "2", str(out)])


def _ff(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise VideoError("영상 도구(ffmpeg) 오류: " + (r.stderr.strip().splitlines() or ["?"])[-1])


def _srt(timeline: list[dict]) -> str:
    def ts(s: float) -> str:
        ms = int(round(s * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    blocks = [f"{k}\n{ts(t['start'])} --> {ts(t['end'])}\n{t['narration']}\n"
              for k, t in enumerate([t for t in timeline if t["narration"]], 1)]
    return "\n".join(blocks)


# ---------- 작업 기록 (대시보드용) ----------

def _job_dir(vid: str) -> Path:
    if not vid.replace("-", "").isalnum():
        raise VideoError("영상 번호가 올바르지 않아요.")
    return paths.videos_dir() / vid


def list_jobs() -> list[dict]:
    out = []
    for d in sorted(paths.videos_dir().iterdir(), reverse=True):
        f = d / "job.json"
        if f.is_file():
            out.append(json.loads(f.read_text(encoding="utf-8")))
    return out


def job(vid: str) -> dict:
    f = _job_dir(vid) / "job.json"
    if not f.is_file():
        raise VideoError("그런 영상 작업이 없어요.")
    return json.loads(f.read_text(encoding="utf-8"))


def start_job(project: dict) -> dict:
    p = normalize(project)
    slug = re.sub(r"[^0-9A-Za-z가-힣]+", "-", p["title"]).strip("-")[:30] or "video"
    vid = datetime.now().strftime("%Y%m%d-%H%M%S")
    d = paths.videos_dir() / vid
    d.mkdir(parents=True, exist_ok=False)
    state = {"id": vid, "title": p["title"], "slug": slug, "status": "running", "message": "준비 중",
             "created_at": time.time(), "cards": len(p["cards"]), "duration": None, "error": ""}
    _save_job(state)

    def work():
        def progress(msg):
            state["message"] = msg
            _save_job(state)
        try:
            m = render(p, d, progress)
            state.update(status="done", duration=m["duration"])
        except Exception as e:  # 실패 이유를 화면에 보여 준다
            state.update(status="failed", error=str(e))
        _save_job(state)

    threading.Thread(target=work, daemon=True).start()
    return state


def _save_job(state: dict) -> None:
    d = _job_dir(state["id"])
    tmp = d / "job.json.tmp"
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, d / "job.json")
