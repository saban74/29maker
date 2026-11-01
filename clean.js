// ===== 깔끔한 버전 =====

// 모바일 메뉴
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('nav');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', false);
}));

// 문의 종류에 따라 안내 문구 바꾸기
const form = document.getElementById('c-form');
const message = document.getElementById('c-message');
const productField = document.getElementById('c-product');
const hints = {
  sales: '시험 규격, 시편 크기, 필요한 온·습도 범위 등을 적어주시면 정확한 견적을 드립니다.',
  service: '장비 모델명, 시리얼 번호, 증상(알람 코드 등)을 적어주세요.',
  catalog: '필요한 제품 카탈로그와 받으실 주소(또는 이메일)를 적어주세요.',
};
function setType(type) {
  form.querySelector(`input[value="${type}"]`).checked = true;
  message.placeholder = hints[type];
}
form.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', () => setType(r.value)));
setType('sales');

// 페이지 곳곳의 버튼 → 문의 종류·제품명 자동 입력
document.querySelectorAll('[data-type]').forEach((el) => el.addEventListener('click', () => setType(el.dataset.type)));
document.querySelectorAll('[data-product]').forEach((el) => el.addEventListener('click', () => {
  productField.value = el.dataset.product;
  setType('sales');
}));

// 보내기 (지금은 화면 안내만 합니다. 실제 메일 전송은 아직 연결 전입니다.)
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.querySelector('.form-result').textContent = '문의가 접수되었습니다. 담당자가 곧 연락드리겠습니다.';
  form.reset();
  setType('sales');
});

document.getElementById('year').textContent = new Date().getFullYear();
