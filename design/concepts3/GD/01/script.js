// 큰 문장이 화면 가운데에 오면 천천히 밝아진다. 한 곳만의 움직임.
(function(){
  var els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('on')});return}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){e.target.classList.toggle('on',e.isIntersecting)});
  },{rootMargin:'-30% 0px -30% 0px'});
  els.forEach(function(e){io.observe(e)});
})();
