# 3차 시안용 디자인 레퍼런스 21개 (Awwwards 7 · Godly/Recent 7 · siteinspire 7)

작성일: 2026-11-03 · 대상: 제이에스 엔지니어링(J&S ENGINEERING) 메인 페이지 리디자인
사용자 요청: "awwwards, godly, siteinspire 를 보고 좋은 디자인을 선별해서 각 7개씩 시안"

## 먼저 읽어 주세요: 어떻게 조사했나

| 갤러리 | 이 세션에서의 접속 | 대신 쓴 방법 |
|---|---|---|
| awwwards.com | 연결 끊김(차단) | Taste Skill 연구 자료 `.claude/skills/design-taste-frontend/library/sites.json`의 "Awwwards Site of the Day" 항목(97개) 중에서 고름. 이 자료에는 실제 사이트를 열어 측정한 첫 화면·글꼴·색·움직임 설명이 들어 있음 |
| godly.website → recent.design | `godly.website`는 `http://recent.design/?ref=godly`로 301 이동. `curl https://recent.design/` → 프록시가 403으로 거부(허용 목록에 없음). Playwright 시도 안 함 | WebSearch(`allowed_domains: godly.website, recent.design`)로 갤러리 항목 페이지가 실제로 있는지 확인하고, 검색 요약에 나온 태그·설명만 사용 |
| siteinspire.com | 보안 확인(Vercel) 때문에 막힘. WebFetch도 호스트를 찾지 못함. **우회하지 않음** | WebSearch(`allowed_domains: siteinspire.com`)로 게재 페이지 주소와 분류·스타일 태그를 확인 |

- 각 사이트 원본(예: seasats.com, q-industrial.com)도 이 세션의 프록시에서 막혀 **직접 열어 본 사이트는 하나도 없습니다.**
- 확실도 표시:
  - **연구 자료**: Taste Skill sites.json에 사이트를 직접 분석한 상세 기록이 있음(가장 자세함).
  - **검색 근거**: 갤러리 게재는 검색으로 확인됨. 디자인 설명은 검색 요약(갤러리 태그, 제작사 포트폴리오 문구)만 바탕으로 함. 모르는 부분은 `[미확인]`으로 적음.
- 1차에 쓴 Awwwards 사이트(SSTR, CoffeeTech®, longbow, Alethia, Sharplink)는 제외했습니다.
- Godly 쪽은 검색 색인에 잡히는 산업·기술 항목이 매우 적었습니다. 그래서 7개 중 일부는 분야가 J&S와 멀고 "형식(레이아웃·타이포)만 빌릴 것"으로 표시했습니다. 갤러리 게재가 확인되지 않은 사이트는 넣지 않았습니다.
- ⚠️ 시안을 만들 때 원칙: 이 사이트들은 **"원리"만 빌립니다.** 로고·문구·이미지·레이아웃을 그대로 베끼지 않고, J&S 자료(1981년, 45년, ESPEC 한국 단독 총대리점, 카탈로그 사진)만으로 새로 씁니다. 원본에 있는 3D·영상 효과는 우리 사진 자산(회색 스튜디오 배경 카탈로그 사진)으로 바꿔 생각합니다.

---

## A. Awwwards 7개

### A1. Seasats — 자율 운항 선박
- 주소: https://www.seasats.com/
- 출처: Awwwards Site of the Day — Taste Skill `sites.json` id `aww-seasats` (source: "Awwwards Site of the Day")
- 분야: 해양 하드웨어(자율 무인 보트)
- 디자인 핵심:
  - 첫 화면: 화면 둘레 10px 흰 테두리 안에 둥근 모서리 큰 사진 패널(왼쪽 84%), 오른쪽 14%는 **사진에서 뽑은 단색 블록을 세로로 쌓은 메뉴 기둥**(분홍·세이지·짙어지는 올리브).
  - 색: 해 질 녘 바다의 슬레이트 블루·라일락 회색, 메뉴는 세이지·올리브, 푸터만 번트 오렌지로 온도 반전. 글자는 흰색.
  - 글꼴: 가벼운 세리프·산세리프 혼합체 124px 큰 제목 + 16px 본문 + 9~12px 대문자 모노(버튼·태그).
  - 사진: 수평선이 낮은 좌우대칭 장면, 하늘 넓게. 작은 사각 인셋 사진에 모노 태그를 달아 띄움.
  - 움직임: 로고 글자가 50ms 간격으로 올라옴, 고정 장면 위로 문장 목록의 강조가 스크롤 따라 한 줄씩 이동.
- J&S에 빌릴 원리:
  1. 메뉴(회사소개/제품소개/솔루션…)를 **장비 사진의 회색·흑연 톤에서 뽑은 단색 블록**으로 쌓아, 선이나 아이콘 없이 색으로 구분.
  2. 장비 한 대를 고정해 두고, "온도 / 습도 / 열충격 / 신뢰성" 같은 짧은 주장 목록을 흐리게 다 보여 준 뒤 스크롤 따라 한 줄씩 밝히기.
  3. 푸터만 따뜻한 색 온도로 바꿔 "끝"을 알리기(예: 흑연 → 따뜻한 회갈색).
- 확실도: 연구 자료

### A2. USAvionix — 자율 제트 드론
- 주소: https://www.usavionix.com/
- 출처: Awwwards Site of the Day — `sites.json` id `aww-usavionix`
- 분야: 항공·방위 하드웨어
- 디자인 핵심:
  - 첫 화면: 사실적인 숲·산악 지형을 위에서 본 전체 화면 3D 장면, 가운데 검은 비행체. 왼쪽 위 3줄 큰 제목(80px, Geist 600, 자간 -0.04em), 오른쪽 아래 29px 설명.
  - 색: 검정 바탕 + 흰 글자, 상태색 3개(호박 #ffcb47 관측, 산호 #ff6666 위협, 시안 #7aebff 확보)를 **각각 한 가지 뜻에만**, 글자의 5% 미만으로.
  - 글꼴: Geist(제목) + Geist Mono(11~12px 대문자 원격측정 숫자).
  - 레이아웃: 화면 네 귀퉁이에 글을 붙이고 가운데 60%는 장면에 양보. 1px 선 오버레이(경계 상자, ID 태그, 점선).
  - 움직임: 하나의 고정 장면을 장(chapter)별로 약 4,500px씩 스크롤, 글은 투명도로만 바뀜.
- J&S에 빌릴 원리:
  1. **색에 일을 맡기기**: 강조색을 "저온(파랑) / 고온(주황)"처럼 시험 조건 하나에 하나씩만 배정하고 메뉴·버튼에는 쓰지 않기.
  2. 장비 사진 위에 1px 선과 작은 숫자 라벨(예: 온도 범위·습도 범위, research 근거 값만)을 붙여 "측정 화면"처럼 보이게.
  3. 차갑고 어두운 이야기 뒤에 밝은 사진 카드 3장(하나 넓게, 둘 좁게)으로 마무리.
- 확실도: 연구 자료

### A3. United Carriers — 물류·운송
- 주소: https://unitedcarriers.com/
- 출처: Awwwards Site of the Day — `sites.json` id `aww-united-carriers`
- 분야: 산업 물류(트럭·컨테이너·리치스태커)
- 디자인 핵심:
  - 첫 화면: 거의 검은 별 배경, 오른쪽에 화면 높이 90%짜리 점(dot-matrix) 지구본, 테두리에만 주황·전기 파랑. 메뉴는 가로줄이 아니라 **왼쪽 29% 위치의 세로 모노 링크 6개**, 제목과 같은 세로선.
  - 색: #060503 검정 / #ffffff 흰색 / 파랑 #1e4bff / 주황 #f26a1b — 색은 언제나 "물체"에만.
  - 글꼴: 각진 테크노 대문자(BT Steinhart) 큰 제목·통계 숫자 + 모노 11px + Helvetica 본문. 강조는 굵기 대신 **회색 줄 vs 검은 줄**.
  - 레이아웃: 흰 구역은 2단 — 왼쪽 문장, 오른쪽 가는 선으로 나뉜 큰 통계 숫자.
  - 사진: 흰 바탕 위에 누끼 딴 중장비가 화면 아래 끝에 "서 있음".
- J&S에 빌릴 원리:
  1. 흰 배경 누끼 장비 사진(`assets/web/`)을 섹션 **아래 끝선에 세워** 다음 어두운 구역이 땅이 되게.
  2. 문장 강조를 굵게 하지 말고 앞 두 줄 회색, 뒤 두 줄 검정으로.
  3. 숫자 줄은 오른쪽 기둥에 가는 선으로 쌓기(1981 / 45년 / 연 3~4회 세미나 등 근거 있는 숫자만).
- 확실도: 연구 자료

### A4. CoMinVi — 광산 건설·중공업 시공사
- 주소: https://www.cominvi.com.mx/
- 출처: Awwwards Site of the Day — `sites.json` id `aww-cominvi`
- 분야: 중공업 B2B(광산 시공)
- 디자인 핵심:
  - 첫 화면: 남색 CG 지하 동굴 장면과 전조등 켠 광산 트럭. 왼쪽 정렬 굵은 흰 그로테스크 2줄. 트럭에 **작은 2줄 모노 주석이 핀으로 꽂혀** 있음. 오른쪽 아래 바로가기 이미지 카드 2장(흰 라벨 띠 + 검은 삼각형).
  - 색: 남색 히어로 뒤로 흰색과 옅은 세이지 회색(#ebf0ed)이 번갈아. 색은 사진 속 주황 작업복·파란 조명에서만.
  - 글꼴: Helvetica Now Display + PP Supply Mono(9~11px 대문자 라벨).
  - 레이아웃: 각 구역이 폭 70%짜리 큰 문장 단락으로 시작, 앞에 작은 2줄 모노 태그(번호/구역명). 그 아래 사진 + 숫자 격자(2열×3행, 위에 가는 선).
  - 움직임: 긴 문장이 스크롤에 따라 회색 → 검정으로 글자 단위 물듦.
- J&S에 빌릴 원리:
  1. 장비 사진 위 특정 부위(문, 조작 패널)에 **작은 모노 주석**을 핀처럼 달기 — "측량 도면" 느낌.
  2. 첫 화면 오른쪽 아래에 "제품소개 / 기술자료" 바로가기 카드 2장(라벨 띠 안쪽).
  3. 흰색 ↔ 옅은 회색 배경 교대로 긴 페이지에 리듬 주기(장비 사진 회색과 맞추기).
- 확실도: 연구 자료

### A5. The Watch (60fps) — 정밀 기계 제품
- 주소: https://thewatch.60fps.fr/
- 출처: Awwwards Site of the Day — `sites.json` id `aww-the-watch`
- 분야: 정밀 제품(크로노그래프 시계) 3D 쇼케이스
- 디자인 핵심:
  - 첫 화면: 연회색 바탕 가운데 강철 시계 한 개(화면 높이 80%). 뒤에 제품명이 화면 폭 24vw로 깔리고 **시계가 가운데 글자를 가려** 양 끝 글자만 보임. 메뉴·버튼·본문 없음.
  - 색: 완전 무채색(#e8e8e8 → #0a0a0a), 따뜻함은 황동 톱니바퀴에서만.
  - 글꼴: 넓고 각진 기하 산세리프 초대형(최대 25vw) + Inter 12px 본문 — 중간 크기가 없음(약 30배 차이).
  - 레이아웃: 물체가 가운데를 지키고 글자가 그 주위를 돎. 130px 좁은 설명 기둥.
  - 움직임: 하나의 고정 타임라인에서 시계가 돌고, 마지막에 부품이 가로 한 줄로 분해(exploded view).
- J&S에 빌릴 원리:
  1. 회색 스튜디오 배경 장비 사진(예: `platinous-j-single-a.jpg`)을 **같은 회색 바탕**에 놓고, 뒤에 "PLATINOUS" 같은 제품명을 초대형으로 깔아 장비가 글자 일부를 가리게.
  2. 큰 글자와 아주 작은 본문만 쓰고 중간 크기를 없애기(브리프의 "고급지게" 기준과 일치).
  3. 사양표 대신 장비 단면/부분 사진(`tsa-cutaway-dark.jpg` 등)을 가로 한 줄로 늘어놓고 세로 작은 라벨.
- 확실도: 연구 자료

### A6. Kononenko Architectural Bureau — 건축 설계
- 주소: https://kononenkogroup.com
- 출처: Awwwards Site of the Day — `sites.json` id `aww-kononenko-architectural-bureau`
- 분야: 건축
- 디자인 핵심:
  - 첫 화면: 건축 렌더 한 장이 화면 전체. 하늘 위 45%는 비워 둠. 왼쪽 아래 회사명 60px — **앞 두 단어는 그로테스크, 마지막 단어는 같은 크기의 세리프**. 버튼·덧칠 없음.
  - 색: 흰 페이지 + 검정 글자, 색은 렌더의 흐린 회색·초록·목재색에서만. 푸터는 검정 반전.
  - 글꼴: 촘촘한 네오 그로테스크(-0.03em) + 부드러운 고대비 세리프. 섹션 문장이 "가운데 산세리프 ↔ 왼쪽 세리프(첫 줄 들여쓰기)"로 번갈아.
  - 레이아웃: 24px 바깥 여백, 전체 폭 사진 띠와 글자만 있는 흰 화면을 교대. 작은 데이터는 "세리프 라벨 + 산세리프 값" 좁은 기둥.
  - 움직임: 제목이 줄 단위로 마스크에서 올라옴, 스케치가 선 단위로 그려짐.
- J&S에 빌릴 원리:
  1. "J&S ENGINEERING" 중 한 단어만 세리프(Noto Serif KR 또는 영문 세리프)로 바꿔 장식 없이 서명 느낌 내기.
  2. 회사 개요(설립 1981 / ESPEC 한국 단독 총대리점 / 대표이사 등)를 "작은 세리프 라벨 + 산세리프 값" 좁은 기둥으로.
  3. 푸터를 검정으로 뒤집고 "J&S"를 양 끝에 닿을 만큼 크게.
- 확실도: 연구 자료

### A7. LPAS — 건축·인테리어 사무소
- 주소: https://lpas.com/
- 출처: Awwwards Site of the Day — `sites.json` id `aww-lpas`
- 분야: 건축(시장 분야별 조직)
- 디자인 핵심:
  - 첫 화면: 밝기 50%로 어둡게 한 스튜디오 영상 전체 화면, 왼쪽 아래 75px 3줄 제목, 오른쪽 끝에 첫 "분야 카드"가 200px만 살짝 보여 다음으로 이끎.
  - 색: 흰색 + 숯색(#262626) + **분야별 흙빛 저채도 바탕 5개**(토프·녹·옅은 청회·세이지·피치), 각각 밝은 틴트로 호버.
  - 글꼴: Aeonik 한 가지, 거의 400 굵기, 문장형 대소문자. 75 / 56 / 38 / 16 / 12px의 짧은 크기 단계.
  - 레이아웃: 50px 여백, 20열 격자. 분야 카드 5장이 가로 레일로 흘러감(위 68% 사진 + 아래 32% 단색 패널에 분야명).
  - 사진: 사각 모서리, 비율 하나(8:5), 로고에서 따온 45도 모서리 컷을 일부 사진 한 모서리에만.
- J&S에 빌릴 원리:
  1. **산업별 솔루션(반도체·자동차·배터리·전자부품 등)마다 같은 명도의 저채도 바탕색 하나씩** — 장식이 아니라 체계로 보이게.
  2. 첫 화면 오른쪽 끝에 다음 카드가 살짝 보이는 가로 레일.
  3. 로고(J&S)에서 모양 하나를 따와 사진 모서리 1곳에만 아껴 쓰기.
- 확실도: 연구 자료

---

## B. Godly(현재 이름 Recent) 7개

> godly.website는 같은 팀이 만든 **Recent(recent.design)** 로 옮겨졌고, 예전 Godly 항목 일부(예: 4년 전 등록된 Heart Aerospace)도 Recent 주소로 이어져 있습니다. 두 곳 모두 이 세션에서 열 수 없어 **설명은 전부 검색 요약(갤러리의 태그·한 줄 설명)** 에 기댑니다. 첫 화면 수치·글꼴명처럼 요약에 없는 것은 쓰지 않았습니다.
> 검색 색인에 잡힌 Godly/Recent 항목 중 산업·기술 분야는 Heart Aerospace 정도뿐이어서, 나머지는 "형식만 빌릴" 항목입니다.

### B1. Heart Aerospace — 전기 지역 여객기
- 주소: https://heartaerospace.com
- 출처: Recent(옛 Godly) — https://recent.design/i/0lp1j2z-heart-aerospace (등록 약 4년 전, 즉 Godly 시절 항목)
- 분야: 항공기 제조(하드웨어)
- 디자인 핵심(검색 요약 기반):
  - ES-19 전기 여객기를 **영화 같은 렌더 이미지와 굵은 타이포 스크롤**로 보여 줌, 무배출(zero emissions) 목표를 강조.
  - 스타일 태그: Minimal, Clean, 3D, 차분한(muted) 색.
  - 글꼴 이름, 첫 화면 배치, 정확한 색값: [미확인].
- J&S에 빌릴 원리:
  1. 제품 하나(예: 워크인 챔버 `walk-in-tbe-dark.jpg`)를 영화 장면처럼 크게, 그 위를 굵은 문장이 스크롤로 지나가게.
  2. 색은 장비 사진의 차분한 회색 계열로 낮추고, 메시지 하나(예: Platinous J ECO 에너지 절감, research 근거)를 페이지 전체의 주제로.
- 확실도: 검색 근거

### B2. Augen — 웨어러블 헬스 기기
- 주소: https://augen.pro
- 출처: Recent — https://recent.design/i/erz4438-augen
- 분야: 의료·헬스 하드웨어(이탈리아 스타트업)
- 디자인 핵심(검색 요약 기반):
  - 스타일 태그: Minimal, Clean, **큰 배경 이미지, 큰 글자, 긴 스크롤**, 스크롤 애니메이션.
  - 기술: Vue.js/Nuxt.js, Vercel.
  - 색·글꼴·사진 처리 세부: [미확인].
- J&S에 빌릴 원리:
  1. 큰 배경 사진 + 큰 글자 + 긴 스크롤의 단순한 3요소로만 구성(아이콘 카드 줄 없이).
  2. 기술 기업이라도 "깨끗함"을 첫 인상으로 — 흰/연회색 바탕에 장비 한 대.
- 확실도: 검색 근거

### B3. Los Feliz Engineering — 엔지니어링 회사
- 주소: [미확인 — 갤러리 페이지에서 원본 주소를 확인하지 못함]
- 출처: Godly Feature 911 — https://godly.website/website/911-los-feliz-engineering (또는 /website/los-feliz-engineering-911)
- 분야: 기술·개발(Technology, Development 분류)
- 디자인 핵심(검색 요약 기반):
  - 스타일 태그: Light, Minimal, **Black & White**, Typographic, Illustrative, Single Page, Unusual Layout, Interactive.
  - 글꼴·배치 세부: [미확인].
- J&S에 빌릴 원리:
  1. 흑백 + 한 페이지: 색 없이 글자와 선 그림만으로 "엔지니어링 회사"의 단정함을 만들기.
  2. 장비 도면풍 선 일러스트(직접 그린 단순 선, 지어낸 사양 없이)를 사진 대신 쓰는 구역 하나.
- 확실도: 검색 근거 (이름이 "Engineering"이지만 실제 업종이 하드웨어인지는 미확인)

### B4. BynarIO Website — 사이버보안
- 주소: [미확인]
- 출처: Recent — https://recent.design/i/w9nr5j4-bynario-website
- 분야: 보안 기술(B2B)
- 디자인 핵심(검색 요약 기반):
  - **짙은 남색 바탕 + 굵은 흰 글자**, 움직이는 3D 입자 지구본, 스크롤 애니메이션.
  - 글꼴·레이아웃 세부: [미확인].
- J&S에 빌릴 원리:
  1. 짙은 남색 한 가지 바탕 + 흰 굵은 글자로 신뢰감(1차 R02 남색 히어로의 고급화 방향과 연결).
  2. 지구본 대신 "한국 전역 서비스" 같은 주장은 근거 있을 때만 — 없으면 이 장치는 쓰지 않음.
- 확실도: 검색 근거 (분야가 J&S와 멀어 색·대비 원리만 참고)

### B5. Increase — 은행 인프라
- 주소: https://increase.com
- 출처: Recent(약 5년 전 등록, 옛 Godly 항목) — https://recent.design/i/gum9nh3-increase
- 분야: 금융 인프라(개발자 대상 B2B)
- 디자인 핵심(검색 요약 기반):
  - **굵은 검정 타이포**, 라임·청록 기하학적 3D 로고 마크, **깨끗한 연회색 레이아웃**.
  - 세부: [미확인].
- J&S에 빌릴 원리:
  1. 연회색 바탕 + 굵은 검정 글자 + 아주 작은 면적의 선명한 강조색 1개 — 회색 스튜디오 장비 사진과 잘 맞는 조합.
  2. "인프라 회사"답게 꾸밈보다 정보 위계(제목 → 한 줄 → 링크)를 또렷하게.
- 확실도: 검색 근거 (형식만 빌림)

### B6. Shopify Editions Spring '26 — 제품 발표 사이트
- 주소: [미확인 — shopify.com/editions 계열로 추정되나 확인 안 함]
- 출처: Recent — https://recent.design/i/r4jmjhc-shopify-editions-spring-26
- 분야: 소프트웨어 제품 발표(형식 참고용)
- 디자인 핵심(검색 요약 기반):
  - **영화 같은 시각, 어두운 장면, 추상 3D 이미지, 기능별 이야기 흐름**, 긴 스크롤(Long Scrolling).
  - 세부: [미확인].
- J&S에 빌릴 원리:
  1. "올해의 신제품/라인업"을 장(chapter)별로 한 장면씩 보여 주는 발표회형 흐름(1차 A10 키노트형의 고급화).
  2. 어두운 장면에서 장비 사진만 밝게 — `walk-in-tbe-dark.jpg`처럼 검은 배경 사진에 적합.
- 확실도: 검색 근거 (형식만 빌림)

### B7. Harry Atkins — 개인 포트폴리오
- 주소: [미확인]
- 출처: Recent — https://recent.design/i/9b18jw0-harry-atkins
- 분야: 디자이너 포트폴리오(형식 참고용)
- 디자인 핵심(검색 요약 기반):
  - **흑백의 성긴 화면, 큰 글자, 프로젝트 목록(index)**, 담담한 자기소개.
  - 세부: [미확인].
- J&S에 빌릴 원리:
  1. 제품소개를 카드 격자 대신 **목록형 인덱스**(번호 · 제품군 · 대표 모델 · 시험 종류)로 — 카탈로그처럼 빠르게 훑기.
  2. 흑백 + 큰 글자로 정보가 많은 B2B 사이트를 조용하게.
- 확실도: 검색 근거 (형식만 빌림)

---

## C. siteinspire 7개

> siteinspire 페이지는 보안 확인으로 막혀 있어, **게재 여부와 분류·스타일 태그는 검색으로 확인**했고 디자인 설명은 그 태그와 제작사 포트폴리오 검색 요약에만 기댑니다. 대부분 "Industry & Energy" 분류입니다.

### C1. Q-Industrial — 산업용 도료
- 주소: https://q-industrial.com
- 출처: siteinspire — https://www.siteinspire.com/website/12681-q-industrial (Industry & Energy, 2024-11-12, 디자이너 Artemii Lebedev). 참고로 Awwwards SOTD(2024-06-02)·Development Award도 받음 — https://www.awwwards.com/sites/q-industrial
- 분야: 제조(금속·플라스틱용 산업 코팅, 1995년부터, 5개국)
- 디자인 핵심(검색 요약 기반):
  - 색: Awwwards 기록상 **연회색 #E6E6E6 + 빨강 #CA0000** 두 색.
  - 3D: Cinema 4D·Redshift로 만든 **글자 "Q" 렌더**가 시각 상징.
  - 목적: 도료 개발 방식 소개 + **직관적인 카탈로그로 제품 선택을 쉽게**. Webflow 제작.
  - 글꼴·배치 세부: [미확인].
- J&S에 빌릴 원리:
  1. **연회색 + 강조색 하나**의 2색 체계 — J&S도 회색 장비 사진 바탕 + 강조 1색(예: ESPEC 계열과 겹치지 않는 J&S 자체 색)으로.
  2. 회사 이니셜(J&S의 "&" 같은 글자)을 입체적으로 다룬 상징 하나(단, 3D 렌더 대신 타이포로).
  3. 메인의 핵심 목적을 "제품 고르기 쉽게"로 — 시험 종류별 카탈로그 진입.
- 확실도: 검색 근거 (분야 적합도 높음)

### C2. Industrial Facility — 산업 디자인 스튜디오
- 주소: https://industrialfacility.co.uk
- 출처: siteinspire — https://www.siteinspire.com/websites/2951-industrial-facility (스타일 Typographic, 유형 Agencies & Consultancies, 주제 Product Design)
- 분야: 제품·산업 디자인(런던)
- 디자인 핵심(검색 요약 기반):
  - 스타일 태그: **Typographic** — 글자가 주인공인 구성.
  - 첫 화면·색·사진 처리: [미확인].
- J&S에 빌릴 원리:
  1. 제품 디자인 회사처럼 "장비 = 잘 만든 물건"으로 다루기: 꾸밈 없이 글자 위계와 제품 사진만.
  2. 타이포 중심 — 회사소개 구역을 큰 문장 하나와 작은 사실 몇 줄로.
- 확실도: 검색 근거

### C3. Peak Energy — 나트륨이온 배터리 에너지저장장치
- 주소: https://www.peakenergy.com
- 출처: siteinspire — https://www.siteinspire.com/websites/11972-peak-energy (Industry & Energy, 2024-02-13, 스타일 Minimal · Monochrome · Pattern · Retro & Vintage · Typographic · Big Type)
- 분야: 에너지 저장 하드웨어(계통용 ESS 제조)
- 디자인 핵심(검색 요약 기반):
  - **단색(Monochrome) + 큰 글자(Big Type) + 패턴 + 레트로 느낌**의 미니멀 구성.
  - 비슷한 사이트로 Kov, B-Metal이 연결됨(같은 결의 산업 사이트).
  - 실제 색·글꼴·패턴 모양: [미확인].
- J&S에 빌릴 원리:
  1. 한 가지 색의 명암만으로 페이지 전체를 — 흑연/회색 단색 체계.
  2. 장식 대신 **반복 패턴**(예: 챔버 통풍구·격자 같은 기하 패턴, 직접 만든 단순 도형)을 배경 질감으로 한 곳에만.
  3. 45년 역사 → 레트로 감각을 아주 살짝(연도 표기, 오래된 카탈로그 같은 활자 배치).
- 확실도: 검색 근거

### C4. Daylight — 에너지/기술 스타트업
- 주소: [미확인 — 어느 "Daylight" 회사인지 검색으로 확정하지 못함]
- 출처: siteinspire — https://www.siteinspire.com/website/13457-daylight (Big Type · Minimal · Industry & Energy · Technology · Tech Start-ups, 제작 Numbered)
- 분야: 에너지·기술
- 디자인 핵심(검색 요약 기반):
  - **큰 글자 + 미니멀**. 그 외 세부 [미확인].
- J&S에 빌릴 원리:
  1. 첫 화면을 문장 하나로 — 예: "1981년부터, 한국의 환경시험." (근거 있는 사실만으로 쓴 큰 문장)
  2. 큰 글자와 넉넉한 여백만으로 고급스러움을 만드는 절제.
- 확실도: 검색 근거 (원본 주소 미확인이라 참고 비중 낮게)

### C5. Air Company — AIRMADE™ System
- 주소: https://airmade.aircompany.com/
- 출처: siteinspire — https://www.siteinspire.com/website/12641-air-company-airmade-system (Industry & Energy, 2024-08 게재)
- 분야: 기후 기술 하드웨어(이산화탄소를 원료로 바꾸는 시스템)
- 디자인 핵심(검색 요약 기반):
  - 하나의 **시스템(설비)을 독립 마이크로사이트**로 소개.
  - Sanctuary Computer가 Air Company의 콘텐츠 전략·아트 디렉션·캠페인 이미지·웹 디자인을 맡았다고 포트폴리오에 적혀 있으나, 이 마이크로사이트와 같은 작업인지는 [미확인].
  - 색·글꼴·배치: [미확인].
- J&S에 빌릴 원리:
  1. 대표 장비 하나(예: Platinous J 시리즈)를 **독립 마이크로사이트처럼** 깊게 다루는 구역 — 시스템 설명 → 원리 → 활용 분야 순.
  2. 설비를 "기술 시스템"으로 설명하는 말투(과장 없이 원리 중심).
- 확실도: 검색 근거

### C6. Flex-N-Gate — 자동차 부품 제조
- 주소: https://flexngate-europe.com
- 출처: siteinspire — https://www.siteinspire.com/website/11792-flex-n-gate (Industry & Energy · Corporate, 2023-10-12)
- 분야: 자동차 부품 제조(대기업 B2B)
- 디자인 핵심(검색 요약 기반):
  - 분류상 **기업(Corporate) + 산업** 사이트. 디자인 세부 [미확인].
- J&S에 빌릴 원리:
  1. 고객사(자동차·부품 업계)가 보는 "대기업 제조사 사이트"의 격을 기준선으로 — 회사소개·사업 분야·연락처가 첫 화면에서 바로 보이는 구조.
  2. 화려함보다 신뢰: 장식 줄이고 정보 구조를 또렷하게.
- 확실도: 검색 근거 (디자인 세부를 모르므로 시안 작성 전 사용자가 직접 한 번 보기를 권함)

### C7. Quaise Energy — 심부 지열 굴착
- 주소: https://www.quaise.com
- 출처: siteinspire — https://www.siteinspire.com/website/10775-quaise-energy (Industry & Energy, 비슷한 사이트로 Airloom 연결)
- 분야: 에너지 하드웨어(밀리미터파 굴착 시스템)
- 디자인 핵심(검색 요약 기반):
  - 분류만 확인됨. 디자인 세부 [미확인].
- J&S에 빌릴 원리:
  1. "어려운 기술을 쉽게" — 시험 원리(온도·습도·열충격)를 단계별 짧은 설명으로 풀어 주는 구역.
  2. 깊이·온도 같은 물리 수치를 큰 숫자로 보여 주는 방식(J&S는 research에 근거한 사양 값만).
- 확실도: 검색 근거 (디자인 세부를 모르므로 참고 비중 낮게)

---

## 요약: 시안 만들 때 가장 쓸모 있는 순서

| 순위 | 레퍼런스 | 이유 |
|---|---|---|
| 1 | A5 The Watch, A7 LPAS, A4 CoMinVi, A1 Seasats | 연구 자료가 자세하고, 회색 장비 사진·산업 B2B와 바로 연결됨 |
| 2 | A2 USAvionix, A3 United Carriers, A6 Kononenko, C1 Q-Industrial | 색·글자 체계 원리가 분명함 |
| 3 | B1 Heart Aerospace, C3 Peak Energy, C2 Industrial Facility, B5 Increase | 태그 수준이지만 방향이 잘 맞음 |
| 4 | 나머지(B2~B4, B6, B7, C4~C7) | 디자인 세부 미확인 → 원리만 가볍게 참고 |

## 확인 근거 주소 모음
- Awwwards 7개: `/home/user/29maker/.claude/skills/design-taste-frontend/library/sites.json` (source "Awwwards Site of the Day")
- Q-Industrial Awwwards: https://www.awwwards.com/sites/q-industrial · 제작 기록: https://artemiilebedev.com/work/q-industrial
- Godly/Recent: https://recent.design/i/0lp1j2z-heart-aerospace · https://recent.design/i/erz4438-augen · https://godly.website/website/911-los-feliz-engineering · https://recent.design/i/w9nr5j4-bynario-website · https://recent.design/i/gum9nh3-increase · https://recent.design/i/r4jmjhc-shopify-editions-spring-26 · https://recent.design/i/9b18jw0-harry-atkins
- siteinspire: https://www.siteinspire.com/website/12681-q-industrial · https://www.siteinspire.com/websites/2951-industrial-facility · https://www.siteinspire.com/websites/11972-peak-energy · https://www.siteinspire.com/website/13457-daylight · https://www.siteinspire.com/website/12641-air-company-airmade-system · https://www.siteinspire.com/website/11792-flex-n-gate · https://www.siteinspire.com/website/10775-quaise-energy
- Air Company 제작사 추정: https://www.sanctuary.computer/work/air-company
