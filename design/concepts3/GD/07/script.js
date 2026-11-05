// 목록 줄에 마우스를 올리거나 키보드로 이동하면 오른쪽 사진이 바뀐다.
(function () {
  var pv = document.getElementById('pv');
  var cap = document.getElementById('pvcap');
  var links = document.querySelectorAll('#rows a');
  var base = '../../../concepts2/assets/web/';
  function show(a) {
    links.forEach(function (l) { l.classList.remove('on'); });
    a.classList.add('on');
    pv.src = base + a.getAttribute('data-img');
    cap.textContent = a.getAttribute('data-alt');
  }
  links.forEach(function (a) {
    a.addEventListener('mouseenter', function () { show(a); });
    a.addEventListener('focus', function () { show(a); });
  });
})();
