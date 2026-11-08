"""폴더 위치. 환경 변수 CREW29_ROOT로 저장소 위치를 바꿀 수 있다(테스트용)."""
import os
from pathlib import Path


def root() -> Path:
    env = os.environ.get("CREW29_ROOT")
    return Path(env) if env else Path(__file__).resolve().parent.parent


def agents_dir() -> Path:
    return root() / ".claude" / "agents"


def skills_dir() -> Path:
    return root() / ".claude" / "skills"


def director_file() -> Path:
    return root() / ".claude" / "crew" / "director.md"


def data_dir() -> Path:
    d = root() / "data"
    d.mkdir(exist_ok=True)
    return d


def missions_dir() -> Path:
    d = data_dir() / "missions"
    d.mkdir(exist_ok=True)
    return d


def videos_dir() -> Path:
    d = data_dir() / "videos"
    d.mkdir(exist_ok=True)
    return d
