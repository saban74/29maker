// 도면의 부분을 누르면(또는 Tab + Enter) 설명이 바뀐다
(function(){
  var info={
    door:['시험실 문','문을 닫아 시험실 안의 온도와 습도를 지킵니다.'],
    window:['관찰창','문을 열지 않고 시험품이 어떤 상태인지 확인합니다.'],
    panel:['조작 패널','온도와 습도를 정하고 운전 상태를 확인하는 곳입니다.'],
    inside:['시험실 내부','시험품을 선반에 올려 두는 공간입니다. 이 안에서 조건이 만들어집니다.']
  };
  var btns=document.querySelectorAll('.parts button');
  var parts=document.querySelectorAll('.part');
  var name=document.getElementById('part-name'),desc=document.getElementById('part-desc');
  function pick(k){
    name.textContent=info[k][0];desc.textContent=info[k][1];
    btns.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.part===k)});
    parts.forEach(function(p){p.classList.toggle('on',p.dataset.part===k)});
  }
  btns.forEach(function(b){b.addEventListener('click',function(){pick(b.dataset.part)})});
  parts.forEach(function(p){p.addEventListener('click',function(){pick(p.dataset.part)})});
  pick('door');
})();
