/* 04 고정 장면: 스크롤 진행도(p)로 곡선, 온도 숫자, 단계 글, 마디를 함께 움직인다 */
(function(){
  var scene=document.querySelector('[data-scene]');
  if(!scene)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return; /* 움직임 줄이기: 정지 화면(CSS가 전체를 펼쳐 보여 줌) */
  scene.classList.add('live');
  var p1=scene.querySelector('.p1'),t=document.getElementById('t'),
      stages=[].slice.call(scene.querySelectorAll('.stage')),
      nodes=[].slice.call(scene.querySelectorAll('.node')),ticking=false;

  function temp(p){
    if(p<.30)return 200;
    if(p<.38)return 200-270*((p-.30)/.08);
    if(p<.64)return -70;
    if(p<.72)return -70+270*((p-.64)/.08);
    return 200;
  }
  function fmt(v){v=Math.round(v);return (v>0?'+':v<0?'−':'')+Math.abs(v);}
  function update(){
    ticking=false;
    var r=scene.getBoundingClientRect(),span=r.height-innerHeight;
    var p=span>0?Math.min(1,Math.max(0,-r.top/span)):0;
    p1.style.strokeDashoffset=(1-p).toFixed(4);
    t.textContent=fmt(temp(p));
    var s=p<.34?0:p<.67?1:2;
    stages.forEach(function(el,i){el.classList.toggle('act',i===s);});
    nodes.forEach(function(n){n.classList.toggle('lit',p>=parseFloat(n.dataset.at));});
    scene.classList.toggle('cold',s===1);
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',req);
  update();
})();
