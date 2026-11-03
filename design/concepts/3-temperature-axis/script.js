/*
  3. temperature-axis : 온도/습도를 고르면 맞는 장비를 보여 줍니다.
  장비 데이터는 index.html 의 각 .row 의 data-* 속성에 있고, 줄마다 출처 문서를 주석으로 적어 두었습니다
  (research/espec/products/*.md). 이 파일에는 수치가 없습니다.
    data-segs  쓸 수 있는 온도 구간 "최저,최고;최저,최고"
    data-opt   옵션으로 늘어나는 최고 온도
    data-rh    습도 범위 "최저,최고" (없으면 습도 제어 불가)
    data-tiers 모델별 최저 온도 "하한:모델;..."
    data-shock 열충격식: 두 끝 온도가 각각 한 구간 안에 있으면 맞음
    data-ambient 하한이 설치 장소 주위온도에 따름
  스크립트가 꺼져 있으면 아무 것도 숨기지 않고 모든 장비가 그대로 보입니다.
*/
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var lo = $("#lo"), hi = $("#hi"), rh = $("#rh");
  var rows = [].slice.call(document.querySelectorAll(".row"));
  var cards = [].slice.call(document.querySelectorAll(".item[data-for]"));
  var MIN = -80, MAX = 300;
  $("#controls").hidden = false;
  $("#band").hidden = false;

  function fmt(t) { return (t > 0 ? "+" : "") + t + "°C"; }
  function parse(s) { return s.split(";").map(function (p) { var a = p.split(","); return [parseFloat(a[0]), parseFloat(a[1])]; }); }
  function inSeg(segs, t) { return segs.some(function (s) { return t >= s[0] && t <= s[1]; }); }

  function judge(row, a, b, needRh, r) {
    var segs = parse(row.dataset.segs);
    var optMax = row.dataset.opt ? parseFloat(row.dataset.opt) : null;
    var res = { state: "off", note: "" };
    var rhr = row.dataset.rh ? row.dataset.rh.split(",").map(parseFloat) : null;
    if (needRh && !(rhr && r >= rhr[0] && r <= rhr[1])) { res.note = rhr ? "습도 범위 밖" : "습도 조절 불가"; return res; }
    var ok;
    if (row.dataset.shock) { ok = inSeg(segs, a) && inSeg(segs, b); if (ok) res.note = "두 온도를 번갈아 노출"; }
    else { ok = a >= segs[0][0] && b <= segs[0][1]; }
    if (ok) {
      res.state = "match"; res.note = res.note || "맞음";
      if (row.dataset.tiers) {
        // 하한이 a 이하인(더 차갑게 내려가는) 모델만 해당
        var names =row.dataset.tiers.split(";").filter(function (t) { return parseFloat(t.split(":")[0]) <= a; }).map(function (t) { return t.split(":")[1]; });
        if (names.length) res.note = "맞는 모델: " + names.join("·");
      }
      if (row.dataset.ambient) res.note += " (하한은 설치 장소 주위온도+20°C)";
    } else if (optMax && a >= segs[0][0] && b <= optMax) {
      res.state = "opt"; res.note = "옵션·별도 모델로 가능 (최대 " + fmt(optMax) + ")";
    } else {
      res.note = "범위 밖";
    }
    return res;
  }

  function update() {
    var a = parseFloat(lo.value), b = parseFloat(hi.value);
    var needRh = document.querySelector('input[name="rh"]:checked').value === "on";
    var r = parseFloat(rh.value);
    $("#lo-out").textContent = fmt(a);
    $("#hi-out").textContent = fmt(b);
    $("#rh-out").textContent = r + "%rh";
    $("#rh-box").hidden = !needRh;
    var band = $("#band");
    band.style.setProperty("--lo", Math.max(0, (a - MIN) / (MAX - MIN)));
    band.style.setProperty("--hi", Math.min(1, (b - MIN) / (MAX - MIN)));

    var count = 0, optCount = 0, byId = {};
    rows.forEach(function (row) {
      var j = judge(row, a, b, needRh, r);
      byId[row.dataset.id] = j;
      row.classList.toggle("is-match", j.state === "match");
      row.classList.toggle("is-opt", j.state === "opt");
      row.classList.toggle("is-off", j.state === "off");
      row.querySelector(".status").textContent = j.note;
      if (j.state === "match") count++; else if (j.state === "opt") optCount++;
    });
    cards.forEach(function (c) {
      var j = byId[c.dataset.for], badge = c.querySelector(".badge");
      c.hidden = j.state === "off";
      badge.hidden = j.state === "off";
      badge.className = "badge" + (j.state === "opt" ? " opt" : "");
      badge.textContent = j.state === "opt" ? "옵션·별도 모델" : "조건에 맞음";
    });
    $("#empty").hidden = (count + optCount) > 0;
    var txt = fmt(a) + " ~ " + fmt(b) + (needRh ? ", 습도 " + r + "%rh" : "");
    $("#summary").innerHTML = "<strong>" + count + "종</strong>이 맞음" + (optCount ? " · 옵션 " + optCount + "종" : "");
    $("#cond-out").textContent = txt;
    [].forEach.call(document.querySelectorAll(".chip"), function (c) {
      c.setAttribute("aria-pressed", String(parseFloat(c.dataset.lo) === a && parseFloat(c.dataset.hi) === b));
    });
  }

  lo.addEventListener("input", function () { if (+lo.value > +hi.value) hi.value = lo.value; update(); });
  hi.addEventListener("input", function () { if (+hi.value < +lo.value) lo.value = hi.value; update(); });
  rh.addEventListener("input", update);
  [].forEach.call(document.querySelectorAll('input[name="rh"]'), function (e) { e.addEventListener("change", update); });
  [].forEach.call(document.querySelectorAll(".chip"), function (c) {
    c.addEventListener("click", function () { lo.value = c.dataset.lo; hi.value = c.dataset.hi; update(); });
  });
  update();
})();
