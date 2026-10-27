// ===== 상단 메뉴: 스크롤하면 배경 생기기 =====
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== 모바일 메뉴 =====
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('nav');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  if (open) header.classList.add('is-solid');
});
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', false);
}));

// ===== 제품 필터 =====
const chips = document.querySelectorAll('.chip');
const products = document.querySelectorAll('.product');
chips.forEach((chip) => chip.addEventListener('click', () => {
  chips.forEach((c) => c.classList.toggle('is-active', c === chip));
  const f = chip.dataset.filter;
  products.forEach((p) => {
    const cats = p.dataset.cat.split(' ');
    const show = f === 'all' || cats.includes(f) || cats.includes('custom'); // 맞춤 상담 카드는 항상 표시
    p.classList.toggle('is-hidden', !show);
  });
}));

// ===== "이 제품 문의" → 문의 폼으로 이동하며 제품명 자동 입력 =====
const productField = document.getElementById('product-field');
document.querySelectorAll('.product-ask').forEach((btn) => btn.addEventListener('click', () => {
  productField.value = btn.dataset.product;
  setType('sales');
  document.getElementById('contact').scrollIntoView();
  setTimeout(() => productField.focus({ preventScroll: true }), 600);
}));

// ===== 문의 종류에 따라 안내 문구 바꾸기 =====
const form = document.getElementById('contact-form');
const textarea = form.querySelector('textarea');
const hints = {
  sales: '시험 규격, 시편 크기, 온도 범위 등을 적어주시면 더 정확히 안내드립니다.',
  service: '장비 모델명, 시리얼 번호, 증상(알람 코드 등)을 적어주세요.',
  tech: '궁금하신 시험 방법이나 규격을 자유롭게 적어주세요.',
};
function setType(type) {
  form.querySelector(`input[value="${type}"]`).checked = true;
  textarea.placeholder = hints[type];
}
form.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', () => setType(r.value)));
document.querySelector('[data-type="service"]').addEventListener('click', () => setType('service'));

// 문의 보내기 (지금은 화면 안내만 합니다. 실제 메일 전송은 아직 연결 전입니다.)
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.querySelector('.form-result').textContent = '문의가 접수되었습니다. 담당자가 곧 연락드리겠습니다.';
  form.reset();
  setType('sales');
});

// ===== 첫 화면: 장비 쇼룸 =====
// 장비 정보 목록 - 이름·사양·문구를 바꾸려면 여기만 고치면 됩니다.
// temps: 정보창에서 번갈아 보여줄 시험 온도
const machines = {
  sh:        { series: 'SH series · SH-642', name: '벤치탑 항온항습기', spec: ['-40 ~ +150°C', 'W540 × H720 mm', '책상 위 설치'], desc: '책상 위에 올려 쓰는 소형 챔버. 부품·모듈 단위 시험을 빠르게.', temps: [-40, 85, 150] },
  platinous: { series: 'PLATINOUS J · PL-2J', name: '항온항습챔버', spec: ['-40 ~ +100°C', '20 ~ 98% RH', 'W910 × H1590 mm'], desc: '가장 많이 쓰이는 신뢰성 시험장비. 정밀한 온습도 제어.', temps: [85, -40, 60, 25], page: 'platinous.html' },
  ar:        { series: 'AR series · ARGF-0400', name: '대용량 환경시험챔버', spec: ['W800 × D2242 × H1783 mm', '관찰창 180 × 260'], desc: '넓고 깊은 시험공간. 큰 시편이나 많은 수량을 한 번에.', temps: [-40, 120, 25] },
  tcc:       { series: 'TCC series · TCC-151W', name: '온도 사이클 챔버', spec: ['수냉식', 'W1000 × H1828 mm'], desc: '온도 상승·하강을 반복해 열 피로 내구성을 평가.', temps: [-55, 125] },
  tsa:       { series: 'TSA series · TSA-73ES-W', name: '열충격시험기', spec: ['고온 ↔ 저온', 'W1310 × H1800 mm'], desc: '고온과 저온을 반복해 접합부·솔더의 내구성을 검증.', temps: [150, -65] },
  walkin:    { series: 'Walk-in · EBU', name: '워크인 챔버', spec: ['-30 ~ +80°C', 'W3150 × H2305 mm', '출입문 850 × 1800'], desc: '사람이 들어가 작업하는 방 크기 시험실. 완성차 부품·대형 장비까지.', temps: [-30, 80, 25] },
};

const stage = document.getElementById('stage');
const stageWrap = stage.parentElement;
const units = [...stage.querySelectorAll('.unit')];
const panel = document.querySelector('.panel');
const readout = document.getElementById('readout');
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MIN = -75, MAX = 180;

function tempColor(t) {
  // 저온(파랑) → 상온(회색) → 고온(주황)
  const cold = [61, 139, 255], mid = [190, 190, 190], hot = [255, 90, 31];
  const r = Math.max(0, Math.min(1, (t - MIN) / (MAX - MIN)));
  const [a, b, k] = r < 0.39 ? [cold, mid, r / 0.39] : [mid, hot, (r - 0.39) / 0.61];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
}

// 각 장비 창문 색을 그 장비의 대표 온도 색으로
units.forEach((u) => u.style.setProperty('--glow', tempColor(machines[u.dataset.id].temps[0])));

let current = 25, frame, timer, activeId;
function animateTo(target) {
  cancelAnimationFrame(frame);
  const start = current, t0 = performance.now(), dur = reduceMotion ? 1 : 1600;
  const color = tempColor(target);
  root.style.setProperty('--temp-color', color);
  const active = stage.querySelector('.unit.is-active');
  if (active) active.style.setProperty('--glow', color);
  const tick = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    current = start + (target - start) * (1 - Math.pow(1 - p, 3));
    readout.textContent = (current >= 0 ? '+' : '') + current.toFixed(1);
    if (p < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

function select(id, { scroll = true } = {}) {
  const m = machines[id];
  activeId = id;
  units.forEach((u) => {
    const on = u.dataset.id === id;
    u.classList.toggle('is-active', on);
    u.setAttribute('aria-pressed', on);
  });
  stage.classList.add('has-active');

  // 정보창 채우기
  document.getElementById('p-series').textContent = m.series;
  document.getElementById('p-name').textContent = m.name;
  document.getElementById('p-desc').textContent = m.desc;
  document.getElementById('p-spec').innerHTML = m.spec.map((s) => `<li>${s}</li>`).join('');
  panel.classList.remove('is-swap'); void panel.offsetWidth; panel.classList.add('is-swap');

  // 조명 위치를 선택한 장비 쪽으로
  const unit = units.find((u) => u.dataset.id === id);
  const placeSpot = () => {
    const ur = unit.getBoundingClientRect(), wr = stageWrap.getBoundingClientRect();
    stageWrap.style.setProperty('--spot-x', ur.left + ur.width / 2 - wr.left + 'px');
  };
  // 모바일: 가로 스크롤을 선택한 장비가 가운데 오도록
  if (scroll && stage.scrollWidth > stage.clientWidth) {
    stage.scrollTo({ left: unit.offsetLeft + unit.offsetWidth / 2 - stage.clientWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(placeSpot, 450);
  }
  placeSpot();

  // 시험 온도 순환
  clearInterval(timer);
  let i = 0;
  animateTo(m.temps[0]);
  if (!reduceMotion && m.temps.length > 1) {
    timer = setInterval(() => { i = (i + 1) % m.temps.length; animateTo(m.temps[i]); }, 2600);
  }
}

units.forEach((u) => u.addEventListener('click', () => {
  select(u.dataset.id);
  document.getElementById('stage-hint').classList.add('is-gone');
}));

// 키보드 ← → 로 장비 이동
stage.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const i = units.findIndex((u) => u.dataset.id === activeId);
  const next = units[(i + (e.key === 'ArrowRight' ? 1 : units.length - 1)) % units.length];
  next.focus(); next.click(); e.preventDefault();
});

window.addEventListener('resize', () => activeId && select(activeId, { scroll: false }));
stage.addEventListener('scroll', () => {
  const unit = units.find((u) => u.dataset.id === activeId);
  if (!unit) return;
  const ur = unit.getBoundingClientRect(), wr = stageWrap.getBoundingClientRect();
  stageWrap.style.setProperty('--spot-x', ur.left + ur.width / 2 - wr.left + 'px');
}, { passive: true });

// 정보창 버튼: 제품 카드로 이동 / 문의 폼에 제품명 입력
document.getElementById('p-detail').addEventListener('click', (e) => {
  // 제품 상세 페이지가 있는 장비는 그 페이지로 이동
  if (machines[activeId].page) { e.preventDefault(); location.href = machines[activeId].page; return; }
  const card = document.querySelector(`.product[data-id="${activeId}"]`);
  if (!card) return;
  e.preventDefault();
  document.querySelector('.chip[data-filter="all"]').click();
  card.scrollIntoView({ block: 'center' });
  card.classList.remove('is-flash'); void card.offsetWidth; card.classList.add('is-flash');
});
document.getElementById('p-ask').addEventListener('click', () => {
  productField.value = machines[activeId].name + ' (' + machines[activeId].series + ')';
  setType('sales');
});

select('platinous', { scroll: false });

// ===== 스크롤하면 부드럽게 나타나기 =====
const revealTargets = document.querySelectorAll('.section-head, .product, .steps li, .facts div, .form, .service-cta');
revealTargets.forEach((el) => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
}), { threshold: 0.12 });
revealTargets.forEach((el) => io.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();
