// 입자 장면: 온도 슬라이더가 입자 속도와 색을 바꾼다(차가우면 느린 얼음색, 뜨거우면 빠른 주황빛)
(function(){
  var cv=document.getElementById('field'),ctx=cv.getContext('2d');
  var range=document.getElementById('temp'),out=document.getElementById('temp-out');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W,H,dpr,pts=[],temp=+range.value,raf;
  function size(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    var n=W<700?70:140;pts=[];
    for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,a:Math.random()*6.283,s:.4+Math.random()*.9});
    if(reduce)draw(0);
  }
  function mix(t){ // 0(-70°C) ~ 1(+180°C)
    var k=(t+70)/250;
    return {k:k,r:Math.round(156+(255-156)*k),g:Math.round(194+(179-194)*k),b:Math.round(255+(107-255)*k)};
  }
  function draw(step){
    var c=mix(temp),sp=.12+c.k*2.2;
    ctx.clearRect(0,0,W,H);
    var col=c.r+','+c.g+','+c.b;
    for(var i=0;i<pts.length;i++){
      var p=pts[i];
      if(step){
        p.a+=(Math.random()-.5)*.25*(.3+c.k);
        p.x+=Math.cos(p.a)*p.s*sp;p.y+=Math.sin(p.a)*p.s*sp;
        if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
      }
      for(var j=i+1;j<pts.length;j++){
        var q=pts[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;
        if(d<9000){ctx.strokeStyle='rgba('+col+','+(.22*(1-d/9000))+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}
      }
      ctx.fillStyle='rgba('+col+',.85)';ctx.beginPath();ctx.arc(p.x,p.y,1.8,0,6.283);ctx.fill();
    }
  }
  function loop(){draw(1);raf=requestAnimationFrame(loop)}
  function label(){out.textContent=(temp>0?'+':'')+temp+'°C'}
  range.addEventListener('input',function(){temp=+range.value;label();if(reduce)draw(0)});
  window.addEventListener('resize',size);
  label();size();
  if(!reduce){
    loop();
    document.addEventListener('visibilitychange',function(){if(document.hidden)cancelAnimationFrame(raf);else loop()});
  }
})();
