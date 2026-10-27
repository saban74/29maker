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

// ===== 첫 화면: 챔버 온도가 바뀌는 연출 =====
const readout = document.getElementById('readout');
const rhEl = document.getElementById('rh');
const root = document.documentElement;
const MIN = -70, MAX = 180;
// 시험 시나리오: [온도, 습도]
const scenario = [[25, 50], [85, 85], [150, 10], [-40, 0], [-70, 0], [125, 20], [25, 50]];
let step = 0, current = 25;

function tempColor(t) {
  // 저온(파랑) → 상온(회색) → 고온(주황)
  const cold = [61, 139, 255], mid = [190, 190, 190], hot = [255, 90, 31];
  const r = (t - MIN) / (MAX - MIN);
  const [a, b, k] = r < 0.38 ? [cold, mid, r / 0.38] : [mid, hot, (r - 0.38) / 0.62];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
}

function animateTo(target, rh) {
  const start = current, t0 = performance.now(), dur = 1800;
  root.style.setProperty('--temp-color', tempColor(target));
  root.style.setProperty('--pin', ((target - MIN) / (MAX - MIN)) * 100 + '%');
  rhEl.textContent = rh;
  const tick = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    current = start + (target - start) * eased;
    readout.textContent = (current >= 0 ? '+' : '') + current.toFixed(1);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
animateTo(25, 50);
if (!reduceMotion) {
  setInterval(() => {
    step = (step + 1) % scenario.length;
    animateTo(...scenario[step]);
  }, 3200);
}

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

// ===== 스크롤하면 부드럽게 나타나기 =====
const revealTargets = document.querySelectorAll('.section-head, .product, .steps li, .facts div, .form, .service-cta');
revealTargets.forEach((el) => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
}), { threshold: 0.12 });
revealTargets.forEach((el) => io.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();
