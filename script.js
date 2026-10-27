// 모바일 메뉴 열기/닫기
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

toggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', isOpen);
});

// 메뉴를 누르면 모바일 메뉴 닫기
nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  });
});

// 바닥글 연도 자동 표시
document.getElementById('year').textContent = new Date().getFullYear();

// 문의 폼 (현재는 화면에 안내 문구만 표시합니다. 실제 전송은 아직 연결되지 않았습니다.)
const form = document.getElementById('contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.querySelector('.form-result').textContent = '문의가 접수되었습니다. 곧 연락드리겠습니다!';
  form.reset();
});
