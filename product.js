// ===== 제품 상세 페이지 =====

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

// "견적 문의 / 카탈로그 요청" 버튼 → 문의 제품 칸에 내용 채우기
const productField = document.getElementById('p-product');
document.querySelectorAll('[data-ask]').forEach((btn) => btn.addEventListener('click', () => {
  productField.value = 'PLATINOUS J · ' + btn.dataset.ask;
}));

// 문의 보내기 (지금은 화면 안내만 합니다. 실제 메일 전송은 아직 연결 전입니다.)
const form = document.getElementById('p-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.querySelector('.form-result').textContent = '문의가 접수되었습니다. 담당자가 곧 연락드리겠습니다.';
  form.reset();
});

document.getElementById('year').textContent = new Date().getFullYear();
