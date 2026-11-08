"""명령어 사용법.

    python -m crew29 dashboard [--port 8129] [--lan]   대시보드 켜기
    python -m crew29 video render 프로젝트.json [--out 폴더]   릴스 영상 만들기
    python -m crew29 mission "할 일" [--agent 이름] [--no-review]   미션 바로 실행
    python -m crew29 check   필요한 도구가 설치됐는지 점검
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from . import missions, paths, video


def main(argv=None) -> int:
    for stream in (sys.stdout, sys.stderr):  # 윈도우 콘솔에서 한글·이모지가 깨지지 않게
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(prog="crew29", description="29 Crew: Claude Code 에이전트 팀 대시보드")
    sub = ap.add_subparsers(dest="cmd", required=True)

    d = sub.add_parser("dashboard", help="대시보드 켜기")
    d.add_argument("--port", type=int, default=8129)
    d.add_argument("--lan", action="store_true", help="같은 와이파이의 다른 기기에서도 열기 (열쇠 필요)")

    v = sub.add_parser("video", help="릴스 영상")
    vs = v.add_subparsers(dest="vcmd", required=True)
    r = vs.add_parser("render", help="프로젝트 JSON으로 영상 만들기")
    r.add_argument("project")
    r.add_argument("--out", help="결과 폴더 (기본: data/videos/날짜시간)")

    m = sub.add_parser("mission", help="미션 바로 실행 (대시보드 없이)")
    m.add_argument("goal")
    m.add_argument("--agent", default="", help="이 에이전트 한 명에게만 맡기기")
    m.add_argument("--no-review", action="store_true")

    sub.add_parser("check", help="필요한 도구 점검")

    a = ap.parse_args(argv)
    try:
        if a.cmd == "dashboard":
            from .web import serve
            serve(a.port, a.lan)
        elif a.cmd == "video":
            project = json.loads(Path(a.project).read_text(encoding="utf-8"))
            out = Path(a.out) if a.out else paths.videos_dir() / datetime.now().strftime("%Y%m%d-%H%M%S")
            manifest = video.render(project, out, lambda msg: print("·", msg))
            print(f"완성: {out / manifest['video']} ({manifest['duration']}초)")
        elif a.cmd == "mission":
            mode = "one" if a.agent else "team"
            mi = missions.create(a.goal, mode, a.agent, not a.no_review)
            print(f"미션 {mi['id']} 시작. 기록: data/missions/{mi['id']}/log.txt")
            missions.RUNNER.run(missions.load(mi["id"]))
            mi = missions.detail(mi["id"])
            print(mi["result"] or mi["log"][-2000:])
            return 0 if mi["status"] == "done" else 1
        elif a.cmd == "check":
            c = {"claude": bool(missions.claude_cmd()), **video.check()}
            labels = {"claude": "Claude Code (미션 실행)", "ffmpeg": "ffmpeg (영상 만들기)",
                      "browser": "Edge/Chrome (카드 그리기)", "edge_tts": "edge-tts (무료 목소리, 선택)"}
            for k, ok in c.items():
                print(("✅ " if ok else "❌ ") + labels[k])
    except (video.VideoError, missions.MissionError, OSError, ValueError) as e:
        print(f"❌ {e}", file=sys.stderr)
        return 1
    return 0
