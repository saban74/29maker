# 홈페이지 인터넷에 올리기 (Netlify 무료) — 처음 한 번만

이 문서를 순서대로 따라 하면 홈페이지가 인터넷에 올라가고, `/admin/` 관리자 화면에 GitHub 계정으로 로그인할 수 있게 됩니다.
**메뉴·버튼 이름은 Netlify·GitHub 화면이 바뀌면서 달라질 수 있습니다.** 비슷한 이름을 찾으세요.

준비물: GitHub 계정 `saban74`, 저장소 `saban74/29maker`

---

## 0. 먼저: 작업 내용을 main 브랜치에 합치기

관리자 화면(`site/admin/config.yml`)은 **main 브랜치**에 저장하도록 되어 있고, Netlify 도 main 을 올립니다.
지금 작업은 `claude/...` 브랜치에 있으므로, GitHub 에서 Pull Request 를 만들어 **main 에 합친(Merge)** 뒤 진행하세요.

## 1. Netlify 계정 만들기

1. `https://www.netlify.com` → **Sign up**
2. **GitHub 으로 가입(Sign up with GitHub)** 을 고릅니다. (GitHub 계정과 바로 연결되어 편합니다.)
3. 무료(Free / Starter) 요금제를 고릅니다.

## 2. GitHub 저장소 연결

1. Netlify 첫 화면 → **Add new site**(또는 Add new project) → **Import an existing project**
2. **GitHub** 선택 → 권한 허락 → 저장소 목록에서 **29maker** 선택
   - 목록에 없으면 "Configure the Netlify app on GitHub" 를 눌러 29maker 저장소 접근을 허락합니다.

## 3. 빌드 설정

저장소에 `netlify.toml` 이 있어서 보통 **자동으로 채워집니다.** 아래와 같은지만 확인하세요.

| 칸 | 값 |
|---|---|
| Branch to deploy (올릴 브랜치) | `main` |
| Build command (빌드 명령) | `npm run build` |
| Publish directory (올릴 폴더) | `_site` |
| Node 버전 | 22 (netlify.toml 에 적혀 있음) |

**Deploy** 를 누르고 1~3분 기다리면 `https://(임의 이름).netlify.app` 주소가 생깁니다.
- 이름 바꾸기: Site configuration → **Change site name** (예: `js-engineering` → `https://js-engineering.netlify.app`)
- 회사 도메인 연결: 아래 **7장 (www.espec.co.kr, 가비아)** 을 보세요. 먼저 이 임시 주소로 모든 것이 잘 되는지 확인한 뒤에 연결합니다.

이 주소를 아래 4장에서 씁니다.

## 4. GitHub OAuth 앱 만들기 (관리자 로그인용 열쇠)

1. GitHub 오른쪽 위 프로필 → **Settings** → 왼쪽 맨 아래 **Developer settings** → **OAuth Apps** → **New OAuth App**
2. 칸 채우기

| 칸 | 값 |
|---|---|
| Application name | `제이에스 엔지니어링 홈페이지 관리자` (아무 이름) |
| Homepage URL | 3장에서 생긴 주소. 예) `https://js-engineering.netlify.app` |
| Authorization callback URL | **`https://api.netlify.com/auth/done`** (그대로) |

3. **Register application** → 다음 화면의 **Client ID** 를 복사해 둡니다.
4. **Generate a new client secret** → 나온 **Client secret** 을 복사해 둡니다. (이 값은 다시 볼 수 없고, 남에게 보여 주면 안 됩니다. 저장소 파일에도 넣지 마세요.)

## 5. Netlify 에 OAuth 등록

1. Netlify → 내 사이트 → **Site configuration**(사이트 설정) → **Access & security**(또는 Access control) → **OAuth**
2. **Authentication providers** → **Install provider** → **GitHub**
3. 4장의 **Client ID** 와 **Client secret** 을 붙여 넣고 **Install**

## 6. `/admin` 로그인 확인

1. `https://(내 사이트 주소)/admin/` 을 엽니다.
2. **GitHub 으로 로그인** → 처음 한 번 **Authorize** (허락)
3. 왼쪽에 **제품 / 뉴스·공지 / 카탈로그 자료 / 산업 솔루션 추천 장비** 가 보이면 성공입니다.
4. 시험: 뉴스·공지에서 예시 공지를 열어 글자 하나를 바꾸고 "게시" → GitHub 저장소에 "관리자 화면: ... 고침" 기록이 생기고 → 2~3분 뒤 Netlify Deploys 에 새 배포가 성공(Published)하는지 확인. 확인 뒤 원래대로 되돌리세요.

로그인할 수 있는 사람은 **29maker 저장소에 쓰기 권한이 있는 GitHub 계정**뿐입니다. 다른 직원도 쓰게 하려면 GitHub 저장소 → Settings → Collaborators 에서 그 사람의 GitHub 계정을 초대하세요.

## 7. 도메인 연결: www.espec.co.kr (가비아)

대표 주소는 **https://www.espec.co.kr** 입니다(사이트 설정 `site/_data/site.js` 에 이미 적혀 있음). 도메인은 가비아에서 사용자 명의로 관리합니다.
가비아·Netlify 화면의 메뉴 이름과 위치는 바뀔 수 있습니다. 비슷한 이름을 찾으세요.

### 7-1. 시작 전에 꼭 확인 (메일)
- 가비아 **DNS 관리** 화면에서 지금 있는 기록을 **캡처해 두세요**(되돌릴 때 필요).
- **MX** 라고 적힌 줄(회사 메일)과 **TXT** 줄은 **절대 지우거나 바꾸지 않습니다.** 이번에 바꾸는 것은 홈페이지용 줄(호스트 `www` 와 `@`)뿐입니다.
- 네임서버를 Netlify 로 옮기는 방법(Netlify DNS)은 쓰지 않습니다. 메일 설정까지 옮겨야 해서 실수 위험이 큽니다.

### 7-2. Netlify 에 도메인 등록
1. Netlify 사이트 → **Domain management** → **Add a domain** → `www.espec.co.kr` 입력 → 확인.
2. "espec.co.kr 도 함께 추가할까요?" 같은 안내가 나오면 추가합니다. Netlify 가 `espec.co.kr` 로 들어온 사람을 `www.espec.co.kr` 로 보내 줍니다.
3. 화면에 "DNS 설정이 필요합니다(Awaiting External DNS)" 같은 안내가 보이면 정상입니다. 이제 가비아에서 설정합니다.

### 7-3. 가비아 DNS 설정
1. 가비아 로그인 → **My가비아** → **도메인 관리**(또는 DNS 관리툴) → `espec.co.kr` → **DNS 설정** / **레코드 수정**.
2. 아래 두 줄을 **추가하거나, 같은 호스트의 기존 줄이 있으면 값만 바꿉니다.**

| 타입 | 호스트 | 값 | 뜻 |
|---|---|---|---|
| CNAME | `www` | `(내 사이트 이름).netlify.app` (끝에 점이 필요하다고 나오면 `.` 붙임) | www.espec.co.kr → 새 홈페이지 |
| A | `@` | Netlify 화면이 알려 주는 IP (Netlify 문서 기준 `75.2.60.5`) | espec.co.kr(앞에 www 없이) → 새 홈페이지 |

3. 저장. 가비아 기본 TTL(보통 3600초)이면 **보통 몇 분~몇 시간**, 길면 하루까지 걸립니다.
4. Netlify **Domain management** 에서 도메인 옆 표시가 확인 완료로 바뀌면, **HTTPS** 칸에서 인증서가 자동 발급됩니다(무료, 자동 갱신). 안 되면 **Verify DNS configuration** / **Provision certificate** 를 누릅니다.
5. `https://www.espec.co.kr` 와 `https://espec.co.kr` 둘 다 새 홈페이지로 열리면 끝입니다.

### 7-4. 도메인 연결 뒤 한 번만 할 일
- **Primary domain(대표 도메인)** 을 `www.espec.co.kr` 로 지정(Domain management).
- 관리자 주소는 `https://www.espec.co.kr/admin/` 이 됩니다. 4장의 GitHub OAuth 앱 **Homepage URL** 을 이 주소(`https://www.espec.co.kr`)로 바꿔도 됩니다(콜백 주소 `https://api.netlify.com/auth/done` 은 그대로).
- 검색 노출: 구글 서치 콘솔·네이버 서치어드바이저에 사이트를 등록하고 `https://www.espec.co.kr/sitemap.xml` 을 제출합니다(사이트맵은 자동 생성됨).

### 7-5. 나중에: jsec.co.kr 도 같은 홈페이지로 (완성 후)
1. Netlify → Domain management → **Add a domain alias** → `www.jsec.co.kr` (그리고 `jsec.co.kr`).
2. jsec.co.kr 을 관리하는 업체의 DNS 에서 7-3 과 같은 방식으로 CNAME(`www`)·A(`@`) 를 설정합니다. 이때도 **MX(메일) 줄은 그대로.**
3. 대표 주소는 www.espec.co.kr 로 두고, jsec.co.kr 로 들어오면 www.espec.co.kr 로 보내려면 `netlify.toml` 맨 아래에 아래를 추가합니다(메인 감독자/Claude 에게 부탁해도 됩니다).
```
[[redirects]]
  from = "https://www.jsec.co.kr/*"
  to = "https://www.espec.co.kr/:splat"
  status = 301
  force = true
[[redirects]]
  from = "https://jsec.co.kr/*"
  to = "https://www.espec.co.kr/:splat"
  status = 301
  force = true
```
4. 기존 jsec.co.kr 서버(옛 홈페이지)는 이 연결이 끝나고 새 주소가 잘 열리는 것을 확인한 뒤 정리합니다.

## 문제가 생기면

| 증상 | 확인할 것 |
|---|---|
| 로그인 창이 "Not Found" 또는 오류 | 5장(OAuth 등록)을 했는지, 4장의 callback URL 이 정확히 `https://api.netlify.com/auth/done` 인지 |
| 로그인은 되는데 저장이 안 됨 | 그 GitHub 계정이 저장소에 쓰기 권한이 있는지, `config.yml` 의 `repo: saban74/29maker`, `branch: main` 이 맞는지 |
| 저장했는데 홈페이지가 안 바뀜 | Netlify → Deploys 에서 빌드가 진행 중인지 / 실패(Failed)했는지 |
| 관리자 화면이 하얗게 빈 화면 | 회사 방화벽이 `unpkg.com`(관리자 화면 프로그램을 받는 곳)을 막는지 |

## 참고: GitHub Pages 로 올리는 경우

홈페이지 자체는 GitHub Pages 에도 올릴 수 있습니다(주소가 상대 주소라 `/29maker/` 하위 경로에서도 동작). 다만 **관리자 화면의 GitHub 로그인(OAuth)** 은 GitHub Pages 만으로는 처리할 수 없어서, **OAuth 중계 서버를 따로** 만들어야 합니다(예: 작은 서버리스 함수). 그래서 이 프로젝트는 그 일을 대신해 주는 Netlify 를 기본으로 정했습니다.

## 내 컴퓨터에서 미리 해 보기 (인터넷에 올리지 않고)

```
npm install
npm start          # 창 1: http://localhost:8080/ 미리보기
npm run cms        # 창 2: 관리자 화면 로컬 저장 서버 (npx decap-server)
```
`http://localhost:8080/admin/` → 로그인 버튼 → 저장하면 내 컴퓨터의 `content/` 파일이 바로 바뀝니다(GitHub 에는 올라가지 않음, 직접 커밋해야 함).
