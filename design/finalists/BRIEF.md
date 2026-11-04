# 최종 후보 3종 확장 브리프 (2026-11-04)

사용자가 고른 최종 후보: **A07**(`design/concepts2/A-apple/A07`, apple.com 홈 구조), **R06**(`design/concepts2/R-reference/R06`, 모노크롬 실버), **AW05**(`design/concepts3/AW/05`, The Watch 영감, 거대한 "PLATINOUS" 글자 앞 장비).

목표: 세 후보가 메인 말고 하위 페이지에서도 성립하는지 비교할 수 있게, 후보마다 같은 3페이지를 만든다.

## 후보마다 만들 것 → `design/finalists/<A07|R06|AW05>/`
1. `index.html`: 원래 메인을 복사해 다듬은 판(메뉴 링크를 아래 두 페이지로 연결, 알려진 문제 수정).
2. `products/platinous-j.html`: **Platinous J 제품 상세**. `site/PLAN.md` 4-4 "제품 상세 공통 틀"의 섹션 구성(핵심 수치 3개 + 견적 버튼, 용도, 특징, 모델별 사양표, 규격·수상, 지원 흐름, 자료, 관련 제품, 견적 띠)을 그 후보의 디자인 언어로. 사양은 `research/espec/products/PlatinousJ.md` 값만.
3. `about.html`: **회사소개**. 대표 인사말(대표이사 정창현, 초안임을 표시), 45년 연혁(`research/company/company.md`에서 판독된 항목만), ESPEC 단독 총대리점·기술 협력, 거래처(글자로만), 오시는 길([확인 필요]).
4. `NOTE.md`: 원본 메인에서 이어받은 디자인 규칙(색, 글꼴, 간격, 컴포넌트)과 하위 페이지에 적용한 방법.

## 조건
- 후보의 **원래 디자인 언어를 그대로 유지**(색, 글꼴, 여백, 버튼, 사진 처리). 새 스타일을 섞지 않는다. 원본 메인의 CSS를 이 폴더로 복사해 공통 CSS(`style.css`)로 정리하고 세 페이지가 함께 쓴다. 원본 폴더(`design/concepts2`, `design/concepts3`)는 수정하지 않는다.
- 사진: `design/concepts2/assets/`(이 폴더 기준 상대 경로로). 원본 가로 1.2배 넘게 키우지 않기.
- 사실만, 모르는 값은 `[확인 필요]`. 순수 HTML/CSS/JS. 휴대폰 390px 넘침 없음, `word-break: keep-all`, 키보드 포커스, 움직임 줄이기 존중.
- 맨 아래 "장비 이미지 출처: ESPEC Corp. 공식 웹사이트 및 제품 카탈로그".
- 로고·글꼴은 아직 미확정: 로고는 지금처럼 글자 워드마크(J&S ENGINEERING / 제이에스 엔지니어링)로 둔다.
