// 메인 첫 화면(쇼룸)에 나오는 대표 장비 5종의 "화면용 문구와 사진" 목록입니다. (2026-11-06 2차 디자인)
// - 수치(온도·습도 등)는 여기 쓰지 않고 content/products/<slug>.md 의 "핵심 수치(kpis)"에서 가져옵니다.
//   kpi: 몇 번째 핵심 수치를 보여 줄지 (0 = 첫째, 1 = 둘째, 2 = 셋째)
// - slug 는 content/products/ 의 주소용 이름과 같아야 합니다. 같은 이름의 제품이 없으면 그 장비는 화면에서 빠집니다.
// - img 는 site/assets/img/catalog/ 안의 큰 사진, mv 는 site/assets/img/web/ 안의 배경 없는 작은 사진입니다.
export default [
  {
    slug: "platinous-j", cls: "o-pj",
    name: "Platinous J", type: "항온항습기",
    desc: "온도와 습도를 함께 걸어 신뢰성을 확인하는 대표 시리즈. 2025 굿디자인상(ECO형).",
    kpi: 0,
    img: "assets/img/catalog/pj-lineup.jpg", alt: "Platinous J 항온항습기 네 대",
    mv: { src: "assets/img/web/platinous-j-mv.png", w: 655, h: 269, alt: "Platinous J 항온항습기", cap: "Platinous J 항온항습기" },
    g3Title: "Platinous J 항온항습기",
    g3Lead: "온도와 습도를 함께 걸어 신뢰성을 확인하는 대표 시리즈. 2025 굿디자인상(ECO형).",
    g4Desc: "항온항습기. 2025 굿디자인상(ECO형)",
  },
  {
    slug: "thermal-shock", cls: "o-tsa",
    name: "TSA 시리즈", type: "열충격 시험기",
    desc: "고온과 저온의 공기를 급격히 번갈아 가합니다. 시험품이 움직이지 않는 방식입니다.",
    kpi: 0,
    img: "assets/img/catalog/tsa-pair.jpg", alt: "열충격 시험기 TSA 두 대",
    mv: { src: "assets/img/web/tsa-thermal-shock-mv.png", w: 469, h: 304, alt: "열충격 시험기 TSA", cap: "열충격 시험기 TSA" },
    g3Title: "열충격 시험기 TSA",
    g3Lead: "고온과 저온의 공기를 급격히 번갈아 가해 급한 온도 변화를 견디는지 평가합니다.",
    g4Desc: "열충격 시험기. 시험품이 움직이지 않습니다",
  },
  {
    slug: "hast", cls: "o-hast",
    name: "EHS 시리즈", type: "HAST 가속수명 시험기",
    desc: "고온·고습·가압을 동시에 가해 전자부품의 수명을 짧은 시간에 평가합니다.",
    kpi: 2,
    img: "assets/img/catalog/ehs-lineup.jpg", alt: "HAST EHS 시리즈 세 대",
    mv: { src: "assets/img/web/hast-ehs-mv.png", w: 277, h: 294, alt: "HAST 가속수명 시험기 EHS", cap: "HAST EHS" },
    g3Title: "HAST 가속수명 시험기 EHS",
    g3Lead: "고온·고습·가압을 동시에 가해 전자부품의 수명과 고장 모드를 짧은 시간에 평가합니다.",
    g4Desc: "HAST 가속수명 시험기",
  },
  {
    slug: "ar-series", cls: "o-ar",
    name: "AR 시리즈", type: "급속 온도변화 시험기",
    desc: "온도를 빠르게 오르내려 온도 사이클과 습열 시험을 맡습니다. 2019 굿디자인상.",
    kpi: 1,
    img: "assets/img/catalog/ar-pair.jpg", alt: "AR 시리즈 두 대",
    mv: { src: "assets/img/web/ar-series-mv.png", w: 406, h: 262, alt: "AR 시리즈 급속 온도변화 시험기", cap: "AR 시리즈" },
    g3Title: "AR 시리즈 급속 온도변화",
    g3Lead: "온도를 빠르게 오르내려 전자부품, 차량 부품의 온도 사이클과 습열 시험을 맡습니다. 2019 굿디자인상.",
    g4Desc: "급속 온도변화 시험기",
  },
  {
    slug: "walk-in", cls: "o-wk",
    name: "워크인 챔버 E", type: "대형 항온항습 시험실",
    desc: "사람이 들어가는 방 크기의 시험 공간. 차량, 대형 장비, AI 서버 시험에 씁니다.",
    kpi: 2,
    img: "assets/img/catalog/walkin-white.jpg", alt: "워크인 챔버 E 시리즈",
    mv: { src: "assets/img/web/walk-in-chamber-tbe-mv.png", w: 460, h: 278, alt: "워크인 챔버 E 시리즈", cap: "워크인 챔버 E" },
    g3Title: "워크인 챔버 E 시리즈",
    g3Lead: "사람이 들어가는 방 크기의 시험 공간. 차량, 대형 장비, AI 서버 고발열 시험에 씁니다.",
    // 첫 화면 매거진형(G4)의 큰 칸
    big: { img: "assets/img/catalog/walkin-dark-1.jpg", alt: "어두운 배경의 워크인 챔버 E 시리즈", kpis: [0, 2] },
  },
];
