"""유료 서비스·계정 연결 정보(API 키 등)를 data/connections.json 에 보관한다.

- data/ 폴더는 git에 올라가지 않는다.
- 비밀 값은 화면에 끝 4자리만 보여 준다.
- 같은 이름의 환경 변수가 있으면 그 값을 먼저 쓴다.
"""
import json
import os

from . import paths

# 이름: (비밀인가, 환경 변수, 기본값)
FIELDS = {
    "elevenlabs_key": (True, "ELEVENLABS_API_KEY", ""),
    "elevenlabs_model": (False, "", "eleven_multilingual_v2"),
    "typecast_key": (True, "TYPECAST_API_KEY", ""),
    "typecast_model": (False, "", "ssfm-v21"),
    "higgsfield_key_id": (True, "HIGGSFIELD_KEY_ID", ""),
    "higgsfield_key_secret": (True, "HIGGSFIELD_KEY_SECRET", ""),
    "higgsfield_base": (False, "", "https://platform.higgsfield.ai"),
    "higgsfield_model": (False, "", "higgsfield-ai/dop/standard"),
    "higgsfield_extra": (False, "", '{"duration": 5}'),
    "youtube_client_id": (False, "", ""),
    "youtube_client_secret": (True, "YOUTUBE_CLIENT_SECRET", ""),
    "youtube_refresh_token": (True, "", ""),
    "youtube_channel": (False, "", ""),
    "instagram_user_id": (False, "", ""),
    "instagram_token": (True, "INSTAGRAM_TOKEN", ""),
    "instagram_api": (False, "", "https://graph.instagram.com/v23.0"),
    "public_base_url": (False, "", ""),
    "public_port": (False, "", "8130"),
}


def _file():
    return paths.data_dir() / "connections.json"


def _load() -> dict:
    f = _file()
    if f.is_file():
        try:
            return json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            return {}
    return {}


def get(name: str) -> str:
    secret, env, default = FIELDS[name]
    if env and os.environ.get(env):
        return os.environ[env]
    return str(_load().get(name) or default)


def has(name: str) -> bool:
    return bool(get(name))


def update(values: dict) -> dict:
    """빈 값은 그대로 두고, "__clear__" 는 지운다. 모르는 이름은 무시한다."""
    data = _load()
    for k, v in values.items():
        if k not in FIELDS or v is None:
            continue
        v = str(v).strip()
        if v == "__clear__":
            data.pop(k, None)
        elif v:
            data[k] = v
    f = _file()
    f.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    if os.name != "nt":
        os.chmod(f, 0o600)
    return view()


def view() -> dict:
    """화면에 보여 줄 값. 비밀 값은 가린다."""
    out = {}
    for k, (secret, env, default) in FIELDS.items():
        v = get(k)
        out[k] = ("••••" + v[-4:] if len(v) > 4 else "••••") if (secret and v) else v
    return out
