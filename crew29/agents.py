"""에이전트(.claude/agents/*.md) 목록 보기, 만들기, 고치기, 지우기."""
import re

from . import frontmatter, paths

NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")
MODELS = ["sonnet", "opus", "haiku", "inherit"]
COLORS = ["blue", "green", "purple", "orange", "red", "yellow", "pink", "cyan"]
TOOLS = ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "WebSearch", "WebFetch"]
MAX_SKILLS = 5


class AgentError(ValueError):
    pass


def list_agents() -> list[dict]:
    d = paths.agents_dir()
    if not d.is_dir():
        return []
    return [load(p.stem) for p in sorted(d.glob("*.md"))]


def load(name: str) -> dict:
    p = _path(name)
    if not p.is_file():
        raise AgentError(f"'{name}' 에이전트가 없어요.")
    meta, body = frontmatter.parse(p.read_text(encoding="utf-8"))
    return {
        "name": meta.get("name") or name,
        "description": meta.get("description", ""),
        "tools": _as_list(meta.get("tools")),
        "model": meta.get("model", "inherit"),
        "color": meta.get("color", ""),
        "skills": _as_list(meta.get("skills")),
        "role": body.strip(),
    }


def save(data: dict, existing_skills: set[str]) -> dict:
    name = str(data.get("name", "")).strip()
    if not NAME_RE.match(name):
        raise AgentError("이름은 영어 소문자, 숫자, 하이픈(-)만 쓸 수 있어요. 예: video-maker")
    description = " ".join(str(data.get("description", "")).split())
    if not description:
        raise AgentError("설명을 적어 주세요. Claude가 언제 이 에이전트를 쓸지 판단하는 기준이에요.")
    model = data.get("model") or "inherit"
    if model not in MODELS:
        raise AgentError(f"모델은 {', '.join(MODELS)} 중에서 골라 주세요.")
    tools = [t for t in _as_list(data.get("tools")) if t in TOOLS]
    skills = _as_list(data.get("skills"))
    if len(skills) > MAX_SKILLS:
        raise AgentError(f"스킬은 에이전트마다 {MAX_SKILLS}개까지 달 수 있어요.")
    missing = [s for s in skills if s not in existing_skills]
    if missing:
        raise AgentError(f"없는 스킬이에요: {', '.join(missing)}")
    color = data.get("color") if data.get("color") in COLORS else ""
    role = str(data.get("role", "")).strip()
    if not role:
        raise AgentError("역할 설명(지시문)을 적어 주세요.")
    meta = {
        "name": name,
        "description": description,
        "tools": tools,
        "model": model,
        "color": color,
        "skills": skills,
    }
    paths.agents_dir().mkdir(parents=True, exist_ok=True)
    _path(name).write_text(frontmatter.dump(meta, role), encoding="utf-8")
    return load(name)


def delete(name: str) -> None:
    p = _path(name)
    if not p.is_file():
        raise AgentError(f"'{name}' 에이전트가 없어요.")
    p.unlink()


def remove_skill_everywhere(skill: str) -> list[str]:
    """지운 스킬을 달고 있던 에이전트에서 떼어 내고, 바뀐 에이전트 이름을 돌려준다."""
    changed = []
    for a in list_agents():
        if skill in a["skills"]:
            p = _path(a["name"])
            meta, body = frontmatter.parse(p.read_text(encoding="utf-8"))
            meta["skills"] = [s for s in a["skills"] if s != skill]
            p.write_text(frontmatter.dump(meta, body), encoding="utf-8")
            changed.append(a["name"])
    return changed


def _path(name: str):
    if not NAME_RE.match(name):
        raise AgentError("이름이 올바르지 않아요.")
    return paths.agents_dir() / f"{name}.md"


def _as_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    return [str(v).strip() for v in value if str(v).strip()]
