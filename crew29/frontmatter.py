"""에이전트·스킬 파일 맨 위의 `---` 설정 블록을 읽고 쓴다.

Claude Code 파일에 쓰이는 간단한 형태만 다룬다:
`키: 값`, `키: [a, b]`, 그리고 다음 줄에 `- a` 로 이어지는 목록.
"""

import json

LIST_KEYS = {"tools", "skills"}
SPECIAL_START = tuple("\"'[]{}#&*!|>%@`-?:,")


def parse(text: str) -> tuple[dict, str]:
    text = text.replace("\r\n", "\n")
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---", 4)
    if end == -1:
        return {}, text
    head, body = text[4:end], text[end + 4:].lstrip("\n")
    meta: dict = {}
    key = None
    for line in head.split("\n"):
        if not line.strip():
            continue
        if line.lstrip().startswith("- ") and key:
            if not isinstance(meta.get(key), list):
                meta[key] = []
            meta[key].append(_unquote(line.lstrip()[2:].strip()))
            continue
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        meta[key] = _value(key, value)
    return meta, body


def dump(meta: dict, body: str) -> str:
    lines = ["---"]
    for key, value in meta.items():
        if value is None or value == "" or value == []:
            continue
        if isinstance(value, list):
            value = ", ".join(str(v) for v in value)
        lines.append(f"{key}: {_safe(_one_line(str(value)))}")
    lines.append("---")
    return "\n".join(lines) + "\n\n" + body.strip() + "\n"


def _value(key: str, value: str):
    if value.startswith("[") and value.endswith("]"):
        return [_unquote(v.strip()) for v in value[1:-1].split(",") if v.strip()]
    if key in LIST_KEYS:
        return [v.strip() for v in value.split(",") if v.strip()] if value else []
    return _unquote(value)


def _unquote(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] == '"':
        try:
            return json.loads(value)
        except ValueError:
            return value[1:-1]
    if len(value) >= 2 and value[0] == value[-1] == "'":
        return value[1:-1].replace("''", "'")
    return value


def _safe(value: str) -> str:
    """YAML로 읽을 때 뜻이 바뀔 수 있는 값은 큰따옴표로 감싼다."""
    if value.startswith(SPECIAL_START) or ": " in value or " #" in value or value.endswith(":"):
        return json.dumps(value, ensure_ascii=False)
    return value


def _one_line(value: str) -> str:
    return " ".join(value.split())
