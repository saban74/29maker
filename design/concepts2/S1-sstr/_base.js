/* S1-sstr 공통 스크립트: 점 차트 그리기, 숫자 올라가기, 화면에 들어오면 켜기 */
(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  var NS='http://www.w3.org/2000/svg';

  function dotplot(el){
    var rows=+el.dataset.rows||22,pitch=10,pts=[],maxx=0;
    function add(x,y,c){pts.push([x,y,c]);if(x>maxx)maxx=x;}
    function wave(str,c){
      var v=str.split(',').map(Number);
      v.forEach(function(f,i){
        var y=Math.round(f*(rows-1)),p=i?Math.round(v[i-1]*(rows-1)):y;
        for(var k=Math.min(y,p);k<=Math.max(y,p);k++)add(i,k,c);
      });
    }
    if(el.dataset.base)wave(el.dataset.base,'m');
    if(el.dataset.wave)wave(el.dataset.wave,'o');
    if(el.dataset.cols){
      var bw=+el.dataset.bw||8,gap=+el.dataset.gap||3,x=0;
      el.dataset.cols.split(',').forEach(function(it){
        var a=it.split(':'),hh=Math.round(+a[0]*rows);
        for(var i=0;i<bw;i++)for(var k=0;k<hh;k++)add(x+i,k,a[1]);
        x+=bw+gap;
      });
    }
    var svg=document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox','0 0 '+((maxx+1)*pitch)+' '+(rows*pitch));
    svg.setAttribute('aria-hidden','true');
    pts.forEach(function(p){
      var c=document.createElementNS(NS,'circle');
      c.setAttribute('cx',p[0]*pitch+pitch/2);
      c.setAttribute('cy',(rows-1-p[1])*pitch+pitch/2);
      c.setAttribute('r',2.5);
      if(p[2]==='o'||p[2]==='m')c.setAttribute('class',p[2]);
      c.style.transitionDelay=(p[0]*14+p[1]*3)+'ms';
      svg.appendChild(c);
    });
    el.insertBefore(svg,el.firstChild);
  }

  function count(el){
    var to=+el.dataset.count,t0=null,d=1400;
    if(reduce){return;}
    function step(t){
      if(!t0)t0=t;
      var k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,4);
      el.textContent=Math.round(to*e);
      if(k<1)requestAnimationFrame(step);else el.textContent=to;
    }
    el.textContent=0;requestAnimationFrame(step);
  }

  document.querySelectorAll('.dotplot').forEach(dotplot);

  var targets=[].slice.call(document.querySelectorAll('.dotplot,[data-count],[data-on]'));
  function fire(el){
    el.classList.add('on');
    if(el.hasAttribute('data-count'))count(el);
  }
  if(reduce||!('IntersectionObserver' in window)){
    targets.forEach(function(el){el.classList.add('on');});
  }else{
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){fire(e.target);io.unobserve(e.target);}});
    },{threshold:.35});
    targets.forEach(function(el){io.observe(el);});
  }
})();
