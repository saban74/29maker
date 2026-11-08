"""외부 서비스(API)와 주고받는 작은 도우미. 테스트에서는 request를 바꿔 끼운다."""
import json
import urllib.error
import urllib.parse
import urllib.request


class NetError(RuntimeError):
    def __init__(self, msg: str, status: int = 0):
        super().__init__(msg)
        self.status = status


class Response:
    def __init__(self, status: int, headers: dict, body: bytes):
        self.status, self.headers, self.body = status, headers, body

    def json(self):
        return json.loads(self.body.decode("utf-8") or "null")

    def header(self, name: str) -> str:
        for k, v in self.headers.items():
            if k.lower() == name.lower():
                return v
        return ""


def request(method: str, url: str, headers: dict | None = None, data: bytes | None = None,
            json_body=None, form: dict | None = None, timeout: int = 120) -> Response:
    headers = dict(headers or {})
    if json_body is not None:
        data = json.dumps(json_body, ensure_ascii=False).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
    elif form is not None:
        data = urllib.parse.urlencode(form).encode("utf-8")
        headers.setdefault("Content-Type", "application/x-www-form-urlencoded")
    headers.setdefault("User-Agent", "crew29")
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return Response(r.status, dict(r.headers), r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:500]
        raise NetError(f"{_host(url)} 응답 오류 {e.code}: {body}", e.code) from e
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise NetError(f"{_host(url)}에 연결하지 못했어요: {getattr(e, 'reason', e)}") from e


def _host(url: str) -> str:
    return urllib.parse.urlparse(url).netloc or url
