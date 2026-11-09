"""미션: 목표를 받아 Claude Code(`claude -p`)를 총감독으로 실행하고, 진행 기록을 남긴다.

한 번에 미션 하나만 돌리고, 나머지는 대기열에서 순서를 기다린다.
"""
import json
import os
import random
import shutil
import signal
import subprocess
import threading
import time
from datetime import datetime

from . import agents, paths

DEFAULT_TOOLS = [
    "Read", "Write", "Edit", "Glob", "Grep", "WebSearch", "WebFetch", "Agent", "Task", "Skill",
    "Bash(python -m crew29 *)", "Bash(python3 -m crew29 *)", "Bash(py -m crew29 *)",
    "Bash(ffmpeg *)", "Bash(ffprobe *)",
]
DEFAULT_SETTINGS = {"claude_cmd": "", "allowed_tools": DEFAULT_TOOLS, "max_turns": 80}
MODES = ("team", "one")


class MissionError(ValueError):
    pass


def settings() -> dict:
    f = paths.data_dir() / "settings.json"
    s = dict(DEFAULT_SETTINGS)
    if f.is_file():
        try:
            s.update(json.loads(f.read_text(encoding="utf-8")))
        except ValueError:
            pass
    return s


def save_settings(data: dict) -> dict:
    s = settings()
    if "claude_cmd" in data:
        s["claude_cmd"] = str(data["claude_cmd"]).strip()
    if "allowed_tools" in data:
        tools = data["allowed_tools"]
        if isinstance(tools, str):
            tools = tools.splitlines()
        s["allowed_tools"] = [t.strip() for t in tools if t.strip()]
    if "max_turns" in data:
        s["max_turns"] = max(5, min(300, int(data["max_turns"])))
    (paths.data_dir() / "settings.json").write_text(
        json.dumps(s, ensure_ascii=False, indent=2), encoding="utf-8")
    return s


def claude_cmd() -> str | None:
    s = settings()
    return os.environ.get("CREW29_CLAUDE") or s["claude_cmd"] or shutil.which("claude")


def is_reviewer(name: str) -> bool:
    return name.endswith("reviewer")


# ---------- 기록 ----------

def _dir(mid: str):
    if not mid.replace("-", "").isalnum():
        raise MissionError("미션 번호가 올바르지 않아요.")
    return paths.missions_dir() / mid


def load(mid: str) -> dict:
    f = _dir(mid) / "mission.json"
    if not f.is_file():
        raise MissionError("그런 미션이 없어요.")
    return json.loads(f.read_text(encoding="utf-8"))


def _write(m: dict) -> None:
    d = _dir(m["id"])
    d.mkdir(parents=True, exist_ok=True)
    tmp = d / "mission.json.tmp"
    tmp.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, d / "mission.json")


def list_missions() -> list[dict]:
    out = []
    for d in sorted(paths.missions_dir().iterdir(), reverse=True):
        if (d / "mission.json").is_file():
            try:
                out.append(load(d.name))
            except (ValueError, MissionError):
                continue
    return out


def detail(mid: str) -> dict:
    m = load(mid)
    d = _dir(mid)
    log = d / "log.txt"
    m["log"] = log.read_text(encoding="utf-8", errors="replace")[-60000:] if log.is_file() else ""
    res = d / "result.md"
    m["result"] = res.read_text(encoding="utf-8", errors="replace") if res.is_file() else ""
    out = d / "output"
    m["files"] = sorted(str(p.relative_to(out)).replace("\\", "/")
                        for p in out.rglob("*") if p.is_file()) if out.is_dir() else []
    return m


def activity() -> dict:
    """지금 돌고 있는 미션과, 그 미션에서 마지막으로 일을 맡은 에이전트."""
    for m in list_missions():
        if m["status"] in ("running", "stopping"):
            log = _dir(m["id"]) / "log.txt"
            agent = ""
            if log.is_file():
                for line in reversed(log.read_text(encoding="utf-8", errors="replace").splitlines()[-200:]):
                    line = line.strip()
                    if line.startswith("🔧 Agent "):
                        agent = line[len("🔧 Agent "):].split()[0] if line[len("🔧 Agent "):].strip() else ""
                        break
            return {"mission": m["id"], "goal": m["goal"], "agent": agent}
    return {"mission": "", "goal": "", "agent": ""}


def create(goal: str, mode: str = "team", agent: str = "", review: bool = True) -> dict:
    goal = goal.strip()
    if not goal:
        raise MissionError("맡길 일을 적어 주세요.")
    if mode not in MODES:
        raise MissionError("방식은 team(팀으로) 또는 one(한 명에게) 중 하나예요.")
    names = [a["name"] for a in agents.list_agents()]
    if mode == "one":
        if agent not in names:
            raise MissionError("맡길 에이전트를 골라 주세요.")
        if is_reviewer(agent):
            raise MissionError("검수 에이전트에게는 일을 혼자 맡길 수 없어요. 일꾼 에이전트를 골라 주세요.")
    mid = datetime.now().strftime("%Y%m%d-%H%M%S") + f"-{random.randint(0, 0xfff):03x}"
    m = {
        "id": mid, "goal": goal, "mode": mode, "agent": agent if mode == "one" else "",
        "review": bool(review), "status": "queued",
        "created_at": time.time(), "started_at": None, "finished_at": None, "exit_code": None,
    }
    _write(m)
    (_dir(mid) / "output").mkdir(exist_ok=True)
    RUNNER.wake()
    return m


def build_prompt(m: dict) -> str:
    team = agents.list_agents()
    workers = [f"- {a['name']}: {a['description']}" for a in team if not is_reviewer(a["name"])]
    reviewers = [a["name"] for a in team if is_reviewer(a["name"])]
    out = f"data/missions/{m['id']}/output/"
    lines = [f"[미션 {m['id']}]", f"목표: {m['goal']}", ""]
    if m["mode"] == "one":
        lines += [f"이 목표를 '{m['agent']}' 에이전트에게 Agent 도구로 그대로 맡기세요.",
                  "다른 일꾼에게는 나누지 마세요."]
    else:
        lines += ["진행 방법:",
                  "1. 목표를 이해하고 2~6단계의 짧은 계획을 세웁니다.",
                  "2. 각 단계를 아래 일꾼 중 알맞은 에이전트에게 Agent 도구로 맡깁니다.",
                  "", "쓸 수 있는 일꾼:", *workers]
    lines += ["", f"결과물 파일은 모두 `{out}` 폴더에 저장하게 하세요."]
    if m["review"] and reviewers:
        lines += [f"끝나면 검수 에이전트({', '.join(reviewers)}) 중 결과물 종류에 맞는 쪽에게 검수를 맡기고,",
                  "🔴 꼭 고치기 문제는 고친 뒤 마무리하세요."]
    lines += ["", "마지막 답변은 쉬운 한국어로 된 최종 보고입니다: 한 일, 결과물 위치, 사람이 확인할 점."]
    return "\n".join(lines)


def command(m: dict) -> list[str]:
    exe = claude_cmd()
    if not exe:
        raise MissionError("claude 명령을 찾지 못했어요. Claude Code가 설치되어 있는지 확인해 주세요.")
    s = settings()
    # 미션 내용은 표준 입력으로 보낸다 (윈도우 .cmd 실행 파일은 여러 줄 인자를 자를 수 있다)
    cmd = [exe, "-p", "--output-format", "stream-json", "--verbose",
           "--permission-mode", "acceptEdits", "--max-turns", str(s["max_turns"])]
    if paths.director_file().is_file():
        cmd += ["--append-system-prompt-file", str(paths.director_file())]
    if s["allowed_tools"]:
        cmd += ["--allowedTools", *s["allowed_tools"]]
    return cmd


def log_line(event: dict) -> str | None:
    """stream-json 한 줄을 사람이 읽을 기록 한 줄로 바꾼다."""
    kind = event.get("type")
    if kind == "assistant":
        parts = []
        for b in event.get("message", {}).get("content", []):
            if b.get("type") == "text" and b.get("text", "").strip():
                parts.append(b["text"].strip())
            elif b.get("type") == "tool_use":
                inp = b.get("input", {})
                who = inp.get("subagent_type") or inp.get("description") or inp.get("file_path") \
                    or inp.get("command") or inp.get("query") or inp.get("url") or ""
                parts.append(f"🔧 {b.get('name')} {str(who)[:120]}".rstrip())
        prefix = "  ↳ " if event.get("parent_tool_use_id") else ""
        return "\n".join(prefix + p for p in parts) or None
    if kind == "result":
        return f"✅ 끝 ({event.get('num_turns', '?')}턴, {round(event.get('duration_ms', 0) / 1000)}초)"
    if kind == "system" and event.get("subtype") == "init":
        return f"▶ 시작 (모델: {event.get('model', '?')})"
    return None


# ---------- 실행기 ----------

class Runner:
    def __init__(self):
        self._lock = threading.Lock()
        self._event = threading.Event()
        self._proc: subprocess.Popen | None = None
        self._current: str | None = None
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        for m in list_missions():  # 대시보드가 꺼졌을 때 돌던 미션
            if m["status"] == "running":
                m.update(status="interrupted", finished_at=time.time())
                _write(m)
        if not self._thread:
            self._thread = threading.Thread(target=self._loop, daemon=True)
            self._thread.start()

    def wake(self) -> None:
        self._event.set()

    def stop(self, mid: str) -> dict:
        m = load(mid)
        if m["status"] == "queued":
            m.update(status="stopped", finished_at=time.time())
            _write(m)
        elif m["status"] == "running" and self._current == mid and self._proc:
            m["status"] = "stopping"
            _write(m)
            _kill(self._proc)
        return load(mid)

    def _loop(self) -> None:
        while True:
            self._event.wait(2)
            self._event.clear()
            queued = [m for m in list_missions() if m["status"] == "queued"]
            for m in sorted(queued, key=lambda x: x["created_at"]):
                self.run(m)

    def run(self, m: dict) -> None:
        d = _dir(m["id"])
        log = (d / "log.txt").open("a", encoding="utf-8")
        try:
            cmd = command(m)
        except MissionError as e:
            log.write(f"❌ {e}\n")
            log.close()
            m.update(status="failed", finished_at=time.time())
            _write(m)
            return
        m.update(status="running", started_at=time.time())
        _write(m)
        result = ""
        try:
            kw = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt" \
                else {"start_new_session": True}
            self._proc = subprocess.Popen(
                cmd, cwd=paths.root(), stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE, text=True, encoding="utf-8", errors="replace", **kw)
            self._current = m["id"]
            try:
                self._proc.stdin.write(build_prompt(m))
                self._proc.stdin.close()
            except OSError:
                pass
            for raw in self._proc.stdout:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    ev = json.loads(raw)
                except ValueError:
                    log.write(raw + "\n")
                    log.flush()
                    continue
                if ev.get("type") == "result":
                    result = ev.get("result") or ""
                line = log_line(ev)
                if line:
                    log.write(line + "\n")
                    log.flush()
            code = self._proc.wait()
        except OSError as e:
            log.write(f"❌ 실행하지 못했어요: {e}\n")
            code = -1
        finally:
            log.close()
            if self._proc and self._proc.stdout:
                self._proc.stdout.close()
            self._proc, self._current = None, None
        if result:
            (d / "result.md").write_text(result, encoding="utf-8")
        m = load(m["id"])
        status = "stopped" if m["status"] == "stopping" else ("done" if code == 0 else "failed")
        m.update(status=status, finished_at=time.time(), exit_code=code)
        _write(m)


def _kill(proc: subprocess.Popen) -> None:
    if os.name == "nt":
        subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], capture_output=True)
    else:
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass


RUNNER = Runner()
