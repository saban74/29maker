// 사진이 칸에 들어올 때 한 번만 천천히 내려앉음
(function(){
  var ps=document.querySelectorAll('.panel');
  if(!('IntersectionObserver' in window)){ps.forEach(function(p){p.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.25});
  ps.forEach(function(p){io.observe(p)});
})();
