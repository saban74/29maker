/* 스크롤 등장: JS가 꺼져 있으면 모든 내용이 처음부터 보인다 */
(function(){
  document.documentElement.classList.add('js');
  var els=document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return;}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.15});
  els.forEach(function(e,i){e.style.transitionDelay=(i%3)*70+'ms';io.observe(e);});
})();
