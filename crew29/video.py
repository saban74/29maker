"""숏폼 영상·카드 이미지 만들기.

카드(HTML) → 이미지 → 목소리 → 장면 → 이어 붙이기 → 최종 편집(자막 입히기, 로고, 배경음악) → MP4.
인스타 카드형(carousel)은 영상 대신 카드 JPEG 이미지 묶음을 만든다.

결과 폴더에는 캡컷·프리미어 같은 외부 편집 프로그램에서 바로 쓸 수 있게
카드 이미지, 목소리 파일, 자막(SRT·ASS), 타임라인(manifest.json)을 함께 남긴다.
"""
import glob
import html
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

from . import higgsfield, paths, share, tts

FORMATS = {
    "reels": {"label": "인스타 릴스 (세로 9:16)", "size": (1080, 1920)},
    "shorts": {"label": "유튜브 쇼츠 (세로 9:16)", "size": (1080, 1920)},
    "tiktok": {"label": "틱톡 (세로 9:16)", "size": (1080, 1920)},
    "youtube": {"label": "유튜브 가로 영상 (16:9)", "size": (1920, 1080)},
    "square": {"label": "정사각 영상 (1:1)", "size": (1080, 1080)},
    "carousel": {"label": "인스타 카드형 (이미지 4:5)", "size": (1080, 1350), "images": True},
}
THEMES = {
    "light": {"bg": "#ffffff", "fg": "#16181d", "muted": "#6b7280", "accent": "#4f46e5"},
    "dark": {"bg": "#0f1115", "fg": "#f3f4f6", "muted": "#9ca3af", "accent": "#8b9cff"},
    "pop": {"bg": "linear-gradient(160deg,#ff7a59 0%,#ff3d81 45%,#7b5cff 100%)",
            "fg": "#ffffff", "muted": "rgba(255,255,255,.8)", "accent": "#fff35c"},
}
EDIT_DEFAULTS = {
    "subtitles": False, "subtitle_style": "box", "subtitle_position": "bottom",
    "motion": False, "duck": True, "logo": "", "logo_position": "top-right",
    "intro": "", "outro": "", "intro_duration": 2.0,
}
LOGO_POS = {"top-right": "main_w-overlay_w-{m}:{m}", "top-left": "{m}:{m}",
            "bottom-right": "main_w-overlay_w-{m}:main_h-overlay_h-{m}", "bottom-left": "{m}:main_h-overlay_h-{m}"}
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp")
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


def subtitle_font() -> str:
    if os.name == "nt":
        return "Malgun Gothic"
    if sys.platform == "darwin":
        return "Apple SD Gothic Neo"
    try:
        out = subprocess.run(["fc-list", ":lang=ko", "family"], capture_output=True, text=True).stdout
    except OSError:
        out = ""
    for fam in ("Noto Sans CJK KR", "Noto Sans KR", "NanumGothic", "WenQuanYi Zen Hei"):
        if fam in out:
            return fam
    return "Sans"


# ---------- 프로젝트 ----------

def normalize(project: dict) -> dict:
    cards = project.get("cards") or []
    if not isinstance(cards, list) or not cards:
        raise VideoError("카드가 한 장 이상 있어야 해요.")
    fmt = project.get("format") if project.get("format") in FORMATS else "reels"
    if FORMATS[fmt].get("images") and len(cards) > 10:
        raise VideoError("인스타 카드형은 10장까지 만들 수 있어요.")
    if len(cards) > 30:
        raise VideoError("카드는 30장까지 만들 수 있어요.")
    theme = project.get("theme") if project.get("theme") in THEMES else "dark"
    voice = project.get("voice") or {}
    if voice.get("engine", "none") not in tts.ENGINES:
        raise VideoError(f"목소리 엔진은 {', '.join(tts.ENGINES)} 중 하나예요.")
    edit = {**EDIT_DEFAULTS, **(project.get("edit") or {})}
    edit["subtitles"] = bool(edit["subtitles"])
    edit["motion"] = bool(edit["motion"])
    edit["duck"] = edit["duck"] is not False
    edit["intro_duration"] = float(edit.get("intro_duration") or 2.0)
    if edit["subtitle_style"] not in ("box", "outline"):
        edit["subtitle_style"] = "box"
    if edit["subtitle_position"] not in ("bottom", "middle"):
        edit["subtitle_position"] = "bottom"
    if edit["logo_position"] not in LOGO_POS:
        edit["logo_position"] = "top-right"
    clean = []
    for i, c in enumerate(cards, 1):
        if not isinstance(c, dict) or not (c.get("title") or c.get("body")):
            raise VideoError(f"{i}번째 카드에 제목이나 내용이 없어요.")
        d = c.get("duration")
        bg = c.get("background") or {}
        bg_type = bg.get("type") if bg.get("type") in ("video", "higgsfield") else "none"
        clean.append({
            "title": str(c.get("title", "")), "body": str(c.get("body", "")),
            "emoji": str(c.get("emoji", ""))[:8], "narration": str(c.get("narration", "")),
            "duration": float(d) if d not in (None, "") else None,
            "background": {"type": bg_type, "path": str(bg.get("path", "")), "prompt": str(bg.get("prompt", "")),
                           "use_card_image": bool(bg.get("use_card_image"))},
        })
    return {
        "title": str(project.get("title") or "제목 없는 영상"),
        "format": fmt, "theme": theme, "accent": str(project.get("accent") or ""),
        "voice": {"engine": voice.get("engine", "none"), "name": voice.get("name", ""),
                  "rate": voice.get("rate", "+0%"), "command": voice.get("command", "")},
        "bgm": str(project.get("bgm") or ""), "bgm_volume": float(project.get("bgm_volume") or 0.15),
        "show_page": project.get("show_page", True) is not False,
        "edit": edit, "cards": clean,
    }


def size_of(p: dict) -> tuple[int, int]:
    return FORMATS[p["format"]]["size"]


def colors(p: dict) -> dict:
    t = dict(THEMES[p["theme"]])
    if re.fullmatch(r"#[0-9a-fA-F]{6}", p["accent"] or ""):
        t["accent"] = p["accent"]
    return t


def card_html(p: dict, i: int, transparent: bool = False) -> str:
    """카드 한 장의 HTML. transparent면 배경을 비워서 AI 클립 위에 얹는다."""
    c = p["cards"][i]
    t = colors(p)
    w, h = size_of(p)
    u = min(w, h) / 1080
    portrait = h > w
    bottom = (420 if portrait and h >= 1900 else 170) * u
    side = (110 if w <= h else 170) * u
    esc = lambda s: html.escape(s).replace("\n", "<br>")  # noqa: E731
    page = f"<div class='page'>{i + 1} / {len(p['cards'])}</div>" if p["show_page"] else ""
    emoji = f"<div class='emoji'>{html.escape(c['emoji'])}</div>" if c["emoji"] else ""
    n = len(c["title"])
    title = (110 if n <= 14 else 88 if n <= 28 else 72) * u * (1.1 if not portrait else 1)
    bg = "rgba(0,0,0,.38)" if transparent else t["bg"]
    shadow = "text-shadow:0 4px 24px rgba(0,0,0,.55);" if transparent else ""
    fg = "#ffffff" if transparent else t["fg"]
    body = f"<div class='bar'></div><p>{esc(c['body'])}</p>" if c["body"] else ""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{w}px;height:{h}px;overflow:hidden;background:transparent}}
body{{background:{bg};color:{fg};font-family:"Pretendard","Malgun Gothic","Apple SD Gothic Neo",
"Noto Sans CJK KR","Noto Sans KR","WenQuanYi Zen Hei",sans-serif;word-break:keep-all;{shadow}}}
.wrap{{position:absolute;top:{220 * u}px;left:{side}px;right:{side}px;bottom:{bottom}px;
display:flex;flex-direction:column;justify-content:center}}
.top{{position:absolute;top:{110 * u}px;left:{side}px;right:{side}px;display:flex;justify-content:space-between;
font-size:{34 * u}px;color:{"rgba(255,255,255,.85)" if transparent else t['muted']};font-weight:600}}
.page{{color:{t['accent']}}}
.emoji{{font-size:{150 * u}px;line-height:1;margin-bottom:{50 * u}px}}
h1{{font-size:{title}px;line-height:1.25;font-weight:800;letter-spacing:-1px}}
.bar{{width:{120 * u}px;height:{12 * u}px;border-radius:{6 * u}px;background:{t['accent']};margin:{50 * u}px 0}}
p{{font-size:{54 * u}px;line-height:1.55;font-weight:500;opacity:.94}}
</style></head><body>
<div class="top"><div>{html.escape(p['title'])}</div>{page}</div>
<div class="wrap">{emoji}<h1>{esc(c['title'])}</h1>{body}</div>
</body></html>"""


# ---------- 자막 ----------

def chunks(text: str, start: float, length: float, timings=None, max_chars: int = 16) -> list[dict]:
    """읽어 줄 문장을 화면에 나눠 띄울 덩어리로 자른다. 덩어리마다 단어별 시간이 있다.

    timings가 있으면(ElevenLabs) 글자별 실제 시간을, 없으면 글자 수 비율로 나눈다.
    """
    text = " ".join(text.split())
    if not text or length <= 0:
        return []
    if timings and len(timings) == len(text):
        times = [(s, e) for _, s, e in timings]
    else:
        speak = [ch for ch in text if not ch.isspace()]
        per = length / max(len(speak), 1)
        times, k = [], 0
        for ch in text:
            times.append((k * per, (k + 1) * per) if not ch.isspace() else (k * per, k * per))
            k += 0 if ch.isspace() else 1
    words, pos = [], 0
    for word in text.split(" "):
        a, b = pos, pos + len(word) - 1
        words.append({"text": word, "start": start + times[a][0], "end": start + times[b][1]})
        pos += len(word) + 1
    out, cur = [], []
    for wd in words:
        if cur and len(" ".join(x["text"] for x in cur + [wd])) > max_chars:
            out.append(cur)
            cur = []
        cur.append(wd)
    if cur:
        out.append(cur)
    return [{"text": " ".join(x["text"] for x in g), "start": g[0]["start"], "end": g[-1]["end"], "words": g} for g in out]


def _show_until(groups: list[dict], k: int) -> float:
    """자막이 조금 더 머물게 하되, 다음 자막과 겹치지 않게 한다."""
    end = groups[k]["end"] + 0.15
    return min(end, groups[k + 1]["start"]) if k + 1 < len(groups) else end


def _ass_time(s: float) -> str:
    cs = int(round(max(s, 0) * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def _ass_color(hex_color: str, alpha: int = 0) -> str:
    r, g, b = hex_color[1:3], hex_color[3:5], hex_color[5:7]
    return f"&H{alpha:02X}{b}{g}{r}".upper()


def build_ass(groups: list[dict], p: dict) -> str:
    w, h = size_of(p)
    e = p["edit"]
    accent = colors(p)["accent"]
    accent = accent if re.fullmatch(r"#[0-9a-fA-F]{6}", accent) else "#ffe14d"
    fs = int(min(w, h) * 0.062)
    box = e["subtitle_style"] == "box"
    align = 2 if e["subtitle_position"] == "bottom" else 5
    margin_v = int(h * (0.2 if h > w else 0.08)) if align == 2 else 0
    style = (f"Style: Sub,{subtitle_font()},{fs},{_ass_color(accent)},&H00FFFFFF,"
             f"{'&H64000000' if box else '&H00000000'},&H64000000,1,0,0,0,100,100,0,0,"
             f"{3 if box else 1},{int(fs * 0.28) if box else 5},{0 if box else 2},{align},60,60,{margin_v},1")
    lines = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {w}", f"PlayResY: {h}", "WrapStyle: 0", "",
             "[V4+ Styles]",
             "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
             "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, "
             "MarginL, MarginR, MarginV, Encoding", style, "",
             "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    clean = lambda s: s.replace("\\", "＼").replace("{", "(").replace("}", ")")  # noqa: E731
    for gi, g in enumerate(groups):
        parts = []
        for k, wd in enumerate(g["words"]):
            nxt = g["words"][k + 1]["start"] if k + 1 < len(g["words"]) else g["end"]
            parts.append(f"{{\\k{max(int(round((nxt - wd['start']) * 100)), 1)}}}{clean(wd['text'])}")
        lines.append(f"Dialogue: 0,{_ass_time(g['start'])},{_ass_time(_show_until(groups, gi))},Sub,,0,0,0,,{' '.join(parts)}")
    return "\n".join(lines) + "\n"


def build_srt(groups: list[dict]) -> str:
    def ts(s: float) -> str:
        ms = int(round(s * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    return "\n".join(f"{k + 1}\n{ts(g['start'])} --> {ts(_show_until(groups, k))}\n{g['text']}\n"
                     for k, g in enumerate(groups))


# ---------- 만들기 ----------

def render(project: dict, out_dir: Path, progress=lambda msg: None) -> dict:
    p = normalize(project)
    w, h = size_of(p)
    ff, probe = find_ffmpeg()
    if not (ff and probe):
        raise VideoError("ffmpeg를 찾지 못했어요. PowerShell에서 `winget install ffmpeg` 실행 후 대시보드를 다시 켜 주세요.")
    browser = find_browser()
    if not browser:
        raise VideoError("카드를 그릴 브라우저(Edge 또는 Chrome)를 찾지 못했어요.")
    for sub in ("cards", "voice", "work", "clips"):
        (out_dir / sub).mkdir(parents=True, exist_ok=True)
    (out_dir / "project.json").write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf-8")
    work = out_dir / "work"
    n = len(p["cards"])

    if FORMATS[p["format"]].get("images"):
        images = []
        for i in range(n):
            progress(f"{i + 1}/{n} 카드 그리는 중")
            png = work / f"card{i + 1:02d}.png"
            _screenshot(browser, _write_html(work, p, i), png, w, h)
            jpg = out_dir / "cards" / f"card{i + 1:02d}.jpg"
            _ff([ff, "-y", "-i", str(png), "-q:v", "2", str(jpg)])
            images.append(f"cards/{jpg.name}")
        manifest = {"title": p["title"], "format": p["format"], "kind": "images", "size": [w, h], "images": images}
        _finish(out_dir, manifest)
        progress("완성")
        return manifest

    segments, timeline, groups = [], [], []
    t0 = 0.0
    if p["edit"]["intro"]:
        progress("인트로 붙이는 중")
        seg, d = _media_segment(ff, probe, Path(p["edit"]["intro"]), p, work / "intro.mp4")
        segments.append(seg)
        t0 += d
    for i, c in enumerate(p["cards"]):
        progress(f"{i + 1}/{n} 카드 그리는 중")
        clip = _background(p, i, out_dir, browser, progress)
        png = out_dir / "cards" / f"card{i + 1:02d}.png"
        _screenshot(browser, _write_html(work, p, i, transparent=bool(clip)), png, w, h, transparent=bool(clip))

        voice_file, speech = None, None
        if c["narration"] and p["voice"]["engine"] != "none":
            progress(f"{i + 1}/{n} 목소리 만드는 중")
            target = out_dir / "voice" / f"voice{i + 1:02d}.mp3"
            speech = tts.speak(c["narration"], str(target), p["voice"])
            voice_file = target if speech else None
        audio_len = _duration(probe, voice_file) if voice_file else 0.0
        dur = c["duration"] or max(audio_len + 0.6, 2.5 if voice_file else 3.0)
        dur = max(dur, audio_len + 0.2)
        if c["narration"]:
            spoken = audio_len if voice_file else max(dur - 0.5, 0.5)
            groups += chunks(c["narration"], t0 + 0.05, spoken, speech and speech.get("timings"),
                             max_chars=16 if h >= w else 28)
        timeline.append({"card": i + 1, "start": round(t0, 3), "end": round(t0 + dur, 3),
                         "image": f"cards/{png.name}", "voice": f"voice/{voice_file.name}" if voice_file else None,
                         "clip": _rel(clip, out_dir), "narration": c["narration"]})
        progress(f"{i + 1}/{n} 장면 만드는 중")
        seg = work / f"seg{i + 1:02d}.mp4"
        _segment(ff, png, voice_file, dur, seg, p, clip)
        segments.append(seg)
        t0 += dur
    if p["edit"]["outro"]:
        progress("아웃트로 붙이는 중")
        seg, d = _media_segment(ff, probe, Path(p["edit"]["outro"]), p, work / "outro.mp4")
        segments.append(seg)
        t0 += d

    progress("장면 이어 붙이는 중")
    lst = work / "list.txt"
    lst.write_text("".join(f"file '{s.name}'\n" for s in segments), encoding="utf-8")
    joined = work / "joined.mp4"
    _ff([ff, "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", str(joined)], cwd=work)

    (out_dir / "subtitles.srt").write_text(build_srt(groups), encoding="utf-8")
    ass = build_ass(groups, p)
    (out_dir / "subtitles.ass").write_text(ass, encoding="utf-8")
    _final(ff, p, joined, out_dir / "video.mp4", ass if p["edit"]["subtitles"] and groups else None, progress)

    manifest = {"title": p["title"], "format": p["format"], "kind": "video", "size": [w, h], "fps": FPS,
                "duration": round(t0, 3), "video": "video.mp4", "subtitles": "subtitles.srt",
                "subtitles_ass": "subtitles.ass", "timeline": timeline,
                "captions": [{"start": round(g["start"], 3), "end": round(g["end"], 3), "text": g["text"]} for g in groups]}
    _finish(out_dir, manifest)
    progress("완성")
    return manifest


def _rel(f: Path | None, out_dir: Path) -> str | None:
    """결과 폴더 안 파일은 상대 경로로, 밖의 파일(내 영상)은 원래 경로로 적는다."""
    if not f:
        return None
    try:
        return f.resolve().relative_to(out_dir.resolve()).as_posix()
    except ValueError:
        return str(f)


def _finish(out_dir: Path, manifest: dict) -> None:
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    shutil.rmtree(out_dir / "work", ignore_errors=True)
    clips = out_dir / "clips"
    if clips.is_dir() and not any(clips.iterdir()):
        clips.rmdir()


def _write_html(work: Path, p: dict, i: int, transparent: bool = False) -> Path:
    f = work / f"card{i + 1:02d}{'_t' if transparent else ''}.html"
    f.write_text(card_html(p, i, transparent), encoding="utf-8")
    return f


def _background(p: dict, i: int, out_dir: Path, browser: str, progress) -> Path | None:
    bg = p["cards"][i]["background"]
    if bg["type"] == "video":
        path = Path(bg["path"])
        if not path.is_file():
            raise VideoError(f"{i + 1}번째 카드의 배경 영상 파일이 없어요: {path}")
        return path
    if bg["type"] == "higgsfield":
        out = out_dir / "clips" / f"clip{i + 1:02d}.mp4"
        if out.is_file():
            return out
        if not bg["prompt"].strip():
            raise VideoError(f"{i + 1}번째 카드의 AI 클립 설명(프롬프트)을 적어 주세요.")
        image_url = None
        if bg["use_card_image"]:
            w, h = size_of(p)
            src = out_dir / "clips" / f"source{i + 1:02d}.png"
            _screenshot(browser, _write_html(out_dir / "work", p, i), src, w, h)
            image_url = share.public_url(src, hours=2)
            if not image_url:
                raise VideoError("카드 이미지로 AI 클립을 만들려면 설정 → 연결의 '공개 주소'가 필요해요.")
        progress(f"{i + 1}번째 카드 AI 클립 요청 중")
        try:
            return higgsfield.generate(bg["prompt"], out, image_url, progress)
        except higgsfield.HiggsfieldError as e:
            raise VideoError(str(e)) from e
    return None


def _screenshot(browser: str, html_file: Path, png: Path, w: int, h: int, transparent: bool = False) -> None:
    cmd = [browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
           "--force-device-scale-factor=1", f"--window-size={w},{h}", f"--screenshot={png}",
           html_file.resolve().as_uri()]
    if transparent:
        cmd.insert(1, "--default-background-color=00000000")
    if png.exists():
        png.unlink()
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


def _has_audio(probe: str, f: Path) -> bool:
    r = subprocess.run([probe, "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                        "-of", "csv=p=0", str(f)], capture_output=True, text=True)
    return bool(r.stdout.strip())


VENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", str(FPS), "-pix_fmt", "yuv420p"]
AENC = ["-c:a", "aac", "-ar", "44100", "-ac", "2"]
ENCODE = VENC + AENC


def _fades(dur: float) -> str:
    return f"fade=t=in:st=0:d={FADE},fade=t=out:st={max(dur - FADE, 0):.3f}:d={FADE}"


def _segment(ff: str, png: Path, voice: Path | None, dur: float, out: Path, p: dict, clip: Path | None) -> None:
    w, h = size_of(p)
    d = f"{dur:.3f}"
    audio = ["-i", str(voice)] if voice else ["-f", "lavfi", "-t", d, "-i", "anullsrc=r=44100:cl=stereo"]
    if clip:
        cmd = [ff, "-y", "-stream_loop", "-1", "-i", str(clip), "-loop", "1", "-framerate", str(FPS), "-t", d,
               "-i", str(png), *audio, "-filter_complex",
               f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={FPS},setsar=1[bg];"
               f"[bg][1:v]overlay=0:0,{_fades(dur)},format=yuv420p[v];[2:a]apad[a]",
               "-map", "[v]", "-map", "[a]"]
    elif p["edit"]["motion"]:
        frames = max(int(dur * FPS), 1)
        zoom = (f"scale={w * 2}:{h * 2},zoompan=z='min(zoom+{0.1 / frames:.6f},1.1)':"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={w}x{h}:fps={FPS}")
        cmd = [ff, "-y", "-i", str(png), *audio, "-filter_complex",
               f"[0:v]{zoom},{_fades(dur)},format=yuv420p[v];[1:a]apad[a]", "-map", "[v]", "-map", "[a]"]
    else:
        cmd = [ff, "-y", "-loop", "1", "-framerate", str(FPS), "-t", d, "-i", str(png), *audio, "-filter_complex",
               f"[0:v]scale={w}:{h},fps={FPS},{_fades(dur)},format=yuv420p[v];[1:a]apad[a]",
               "-map", "[v]", "-map", "[a]"]
    _ff([*cmd, "-t", d, *ENCODE, str(out)])


def _media_segment(ff: str, probe: str, src: Path, p: dict, out: Path) -> tuple[Path, float]:
    """인트로·아웃트로: 이미지면 정해진 시간만큼, 영상이면 그 길이 그대로."""
    if not src.is_file():
        raise VideoError(f"인트로/아웃트로 파일이 없어요: {src}")
    w, h = size_of(p)
    fit = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps={FPS}"
    if src.suffix.lower() in IMAGE_EXT:
        dur = p["edit"]["intro_duration"]
        d = f"{dur:.3f}"
        cmd = [ff, "-y", "-loop", "1", "-framerate", str(FPS), "-t", d, "-i", str(src),
               "-f", "lavfi", "-t", d, "-i", "anullsrc=r=44100:cl=stereo",
               "-filter_complex", f"[0:v]{fit},{_fades(dur)},format=yuv420p[v]", "-map", "[v]", "-map", "1:a", "-t", d]
    else:
        dur = _duration(probe, src)
        if dur <= 0:
            raise VideoError(f"인트로/아웃트로 영상 길이를 알 수 없어요: {src}")
        d = f"{dur:.3f}"
        audio = ["-map", "0:a"] if _has_audio(probe, src) else []
        silent = [] if audio else ["-f", "lavfi", "-t", d, "-i", "anullsrc=r=44100:cl=stereo"]
        cmd = [ff, "-y", "-i", str(src), *silent, "-filter_complex", f"[0:v]{fit},format=yuv420p[v]",
               "-map", "[v]", *(audio or ["-map", "1:a"]), "-t", d]
    _ff([*cmd, *ENCODE, str(out)])
    return out, dur


def _final(ff: str, p: dict, joined: Path, final: Path, ass: str | None, progress) -> None:
    """최종 편집: 자막 입히기, 로고, 배경음악(목소리 나올 때 자동으로 줄이기)."""
    e = p["edit"]
    w, _ = size_of(p)
    bgm = Path(p["bgm"]) if p["bgm"] else None
    logo = Path(e["logo"]) if e["logo"] else None
    for f, what in ((bgm, "배경음악"), (logo, "로고")):
        if f and not f.is_file():
            raise VideoError(f"{what} 파일이 없어요: {f}")
    if not (ass or bgm or logo):
        shutil.copyfile(joined, final)
        return
    progress("최종 편집 중 (자막·로고·배경음악)")
    work = joined.parent
    inputs, graph, idx = ["-i", str(joined)], [], 1
    vlabel = "0:v"
    if ass:
        (work / "subs.ass").write_text(ass, encoding="utf-8")
        graph.append(f"[{vlabel}]subtitles=subs.ass[vs]")
        vlabel = "vs"
    if logo:
        inputs += ["-i", str(logo)]
        m = int(w * 0.04)
        graph.append(f"[{idx}:v]scale={int(w * 0.18)}:-1[lg];[{vlabel}][lg]overlay={LOGO_POS[e['logo_position']].format(m=m)}[vl]")
        vlabel, idx = "vl", idx + 1
    alabel = "0:a"
    if bgm:
        inputs += ["-stream_loop", "-1", "-i", str(bgm)]
        vol = f"[{idx}:a]volume={p['bgm_volume']},aformat=sample_rates=44100:channel_layouts=stereo[b]"
        if e["duck"]:
            graph.append(f"{vol};[0:a]asplit=2[sc][main];"
                         f"[b][sc]sidechaincompress=threshold=0.02:ratio=12:attack=10:release=400[bd];"
                         f"[main][bd]amix=inputs=2:duration=first:normalize=0[am]")
        else:
            graph.append(f"{vol};[0:a][b]amix=inputs=2:duration=first:normalize=0[am]")
        alabel = "am"
    vmap = f"[{vlabel}]" if vlabel != "0:v" else "0:v"
    amap = f"[{alabel}]" if alabel != "0:a" else "0:a"
    vcodec = VENC if vmap != "0:v" else ["-c:v", "copy"]
    acodec = AENC if amap != "0:a" else ["-c:a", "copy"]
    _ff([ff, "-y", *inputs, "-filter_complex", ";".join(graph), "-map", vmap, "-map", amap,
         *vcodec, *acodec, "-shortest", str(final)], cwd=work)


def _ff(cmd: list[str], cwd: Path | None = None) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=cwd)
    if r.returncode != 0:
        raise VideoError("영상 도구(ffmpeg) 오류: " + (r.stderr.strip().splitlines() or ["?"])[-1])


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


def manifest(vid: str) -> dict:
    f = _job_dir(vid) / "manifest.json"
    if not f.is_file():
        raise VideoError("아직 완성되지 않은 작업이에요.")
    return json.loads(f.read_text(encoding="utf-8"))


def start_job(project: dict) -> dict:
    p = normalize(project)
    slug = re.sub(r"[^0-9A-Za-z가-힣]+", "-", p["title"]).strip("-")[:30] or "video"
    vid = datetime.now().strftime("%Y%m%d-%H%M%S")
    d = paths.videos_dir() / vid
    k = 1
    while d.exists():  # 같은 초에 두 번 눌렀을 때
        d = paths.videos_dir() / f"{vid}-{k}"
        k += 1
    d.mkdir(parents=True)
    kind = "images" if FORMATS[p["format"]].get("images") else "video"
    state = {"id": d.name, "title": p["title"], "slug": slug, "format": p["format"], "kind": kind,
             "status": "running", "message": "준비 중", "created_at": time.time(), "cards": len(p["cards"]),
             "duration": None, "images": [], "error": ""}
    _save_job(state)

    def work():
        def progress(msg):
            state["message"] = msg
            _save_job(state)
        try:
            m = render(p, d, progress)
            state.update(status="done", duration=m.get("duration"), images=m.get("images", []))
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
