"""스킬(.claude/skills/<이름>/SKILL.md) 목록 보기, 만들기, 교체, 지우기, GitHub에서 가져오기."""
import hashlib
import re
import shutil
import urllib.parse
import urllib.request

from . import frontmatter, paths

NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
MAX_BYTES = 200_000


class SkillError(ValueError):
    pass


class SkillChanged(SkillError):
    """미리보기 이후 GitHub 쪽 파일이 바뀌었다."""


def list_skills() -> list[dict]:
    d = paths.skills_dir()
    if not d.is_dir():
        return []
    out = []
    for p in sorted(d.iterdir()):
        f = p / "SKILL.md"
        if f.is_file():
            meta, body = frontmatter.parse(f.read_text(encoding="utf-8"))
            extra = [x.name for x in p.iterdir() if x.name != "SKILL.md"]
            out.append({
                "name": p.name,
                "description": meta.get("description", ""),
                "source": meta.get("source", ""),
                "size": len(body),
                "extra_files": extra,
            })
    return out


def names() -> set[str]:
    return {s["name"] for s in list_skills()}


def load(name: str) -> dict:
    f = _dir(name) / "SKILL.md"
    if not f.is_file():
        raise SkillError(f"'{name}' 스킬이 없어요.")
    meta, body = frontmatter.parse(f.read_text(encoding="utf-8"))
    return {"name": name, "description": meta.get("description", ""),
            "source": meta.get("source", ""), "body": body.strip()}


def save(name: str, description: str, body: str, source: str = "") -> dict:
    name = name.strip()
    if not NAME_RE.match(name):
        raise SkillError("스킬 이름은 영어 소문자, 숫자, 하이픈(-)만 쓸 수 있어요. 예: reels-maker")
    description = " ".join(description.split())
    if not description:
        raise SkillError("스킬 설명을 적어 주세요. Claude가 언제 이 스킬을 쓸지 판단하는 기준이에요.")
    if not body.strip():
        raise SkillError("스킬 내용을 적어 주세요.")
    d = _dir(name)
    d.mkdir(parents=True, exist_ok=True)
    meta = {"name": name, "description": description, "source": source}
    (d / "SKILL.md").write_text(frontmatter.dump(meta, body), encoding="utf-8")
    return load(name)


def delete(name: str) -> None:
    d = _dir(name)
    if not (d / "SKILL.md").is_file():
        raise SkillError(f"'{name}' 스킬이 없어요.")
    shutil.rmtree(d)


def raw_url(url: str) -> str:
    """GitHub 주소(파일 또는 폴더)를 SKILL.md 원본 주소로 바꾼다."""
    u = urllib.parse.urlparse(url.strip())
    parts = [p for p in u.path.split("/") if p]
    if u.netloc == "raw.githubusercontent.com" and len(parts) >= 4:
        return url.strip() if parts[-1] == "SKILL.md" else url.strip().rstrip("/") + "/SKILL.md"
    if u.netloc in ("github.com", "www.github.com") and len(parts) >= 4 and parts[2] in ("blob", "tree"):
        owner, repo, _, ref, *rest = parts
        if not rest or rest[-1] != "SKILL.md":
            rest.append("SKILL.md")
        return f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{'/'.join(rest)}"
    raise SkillError("GitHub의 스킬 폴더나 SKILL.md 파일 주소를 넣어 주세요. "
                     "예: https://github.com/사용자/저장소/tree/main/skills/이름")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "crew29"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read(MAX_BYTES + 1)
    except Exception as e:  # 네트워크 오류는 사용자에게 그대로 알린다
        raise SkillError(f"파일을 가져오지 못했어요: {e}") from e
    if len(data) > MAX_BYTES:
        raise SkillError("스킬 파일이 너무 커요 (200KB까지).")
    return data


def preview(url: str, fetcher=fetch) -> dict:
    src = raw_url(url)
    data = fetcher(src)
    text = data.decode("utf-8", errors="replace")
    meta, body = frontmatter.parse(text)
    guess = meta.get("name") or src.rstrip("/").split("/")[-2]
    name = re.sub(r"[^a-z0-9-]", "-", guess.lower()).strip("-")[:64] or "imported-skill"
    return {
        "source": src,
        "name": name,
        "description": meta.get("description", ""),
        "body": body.strip(),
        "sha": hashlib.sha256(data).hexdigest(),
        "exists": name in names(),
    }


def import_save(url: str, sha: str, name: str = "", fetcher=fetch) -> dict:
    """미리보기 때 본 내용(sha)과 같을 때만 저장한다. 같은 이름이 있으면 교체한다."""
    if not sha:
        raise SkillError("먼저 미리보기를 해 주세요.")
    p = preview(url, fetcher)
    if p["sha"] != sha:
        raise SkillChanged("미리보기 뒤에 GitHub 파일이 바뀌었어요. 다시 미리보기를 해 주세요.")
    return save(name or p["name"], p["description"] or f"{p['name']} 스킬", p["body"], p["source"])


def _dir(name: str):
    if not NAME_RE.match(name):
        raise SkillError("스킬 이름이 올바르지 않아요.")
    return paths.skills_dir() / name
