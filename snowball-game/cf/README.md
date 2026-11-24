# 눈싸움 동네 평정기 — Cloudflare 온라인 버전

게임 화면(`../dist/snowfight`)과 온라인 크루 서버(`functions/api/[[path]].js`)를 Cloudflare Pages 하나로 올립니다.

## 배포 주소
- Cloudflare Pages 프로젝트: `snowfight` → https://snowfight-37l.pages.dev (예정: game.029.kr)

## 구성
- **Pages**: 게임 화면 (빌드할 때 `../dist/snowfight` 를 `public/` 으로 복사)
- **Pages Functions**: `/api/...` 주소의 서버 (크루 만들기, 순위, 결투 결과, 기록)
- **D1**: 크루와 결투 기록을 저장하는 데이터베이스 (표는 서버가 처음 실행될 때 자동으로 만듦)

## Cloudflare 대시보드 설정 (처음 한 번)
1. Workers & Pages → Create → Pages → Connect to Git → `saban74/29maker`
2. Build settings
   - Production branch: `claude/zealous-carson-xo6q72`
   - Framework preset: None
   - Build command: `rm -rf public && cp -r ../dist/snowfight public`
   - Build output directory: `public`
   - Root directory: `snowball-game/cf`
3. Storage & Databases → D1 → Create → 이름 `snowfight-db`
4. 만든 Pages 프로젝트 → Settings → Bindings → Add → D1 database
   - Variable name: `DB` / Database: `snowfight-db` → 저장 후 **Deployments에서 Retry deployment**
5. Custom domains → `game.029.kr` 추가

## API
| 주소 | 하는 일 |
|---|---|
| `GET /api/ping` | 서버 확인 |
| `POST /api/crew` | 크루 만들기(열쇠 발급) / 고치기(id+token) |
| `GET /api/crews` | 점수 순위 50위까지 |
| `GET /api/crew/:id` | 크루 하나 + 순위 |
| `POST /api/battle` | 결투 결과 기록 (점수: Elo, K=32) |
| `GET /api/log/:id` | 최근 결투 20개 |

제한: 한 시간에 결투 40번, 같은 크루와는 3분 간격. 크루 이름 2~12글자, 욕설 차단.

## 로컬 시험
```
python3 ../build_dist.py
npx wrangler pages dev public --d1 DB=snowfight-db
```
