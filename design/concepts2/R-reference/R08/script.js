/* R08 히어로 슬라이드
   - 이전/다음/일시정지 버튼, 화살표 키(왼쪽·오른쪽, Home, End)
   - 자동 넘김: 진행 막대 애니메이션이 끝나면 다음 장으로. 움직임 줄이기 설정이면 자동 넘김을 아예 켜지 않음.
   - 마우스를 올리거나 키보드 초점이 있으면 잠시 멈춤. */
(function () {
  var stage = document.getElementById("stage");
  var slidesBox = document.getElementById("slides");
  var controls = document.getElementById("controls");
  if (!stage || !slidesBox || !controls) return;

  var slides = Array.prototype.slice.call(slidesBox.querySelectorAll(".slide"));
  var ticks = Array.prototype.slice.call(controls.querySelectorAll(".tick"));
  var cur = document.getElementById("cur");
  var toggle = document.getElementById("toggle");
  var toggleText = document.getElementById("toggle-text");
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var idx = 0, userPaused = false, hold = false;

  controls.hidden = false;

  function render() {
    var reduced = mq.matches;
    var state = reduced ? "off" : (userPaused || hold ? "paused" : "on");
    stage.setAttribute("data-play", state);
    slidesBox.setAttribute("aria-live", state === "on" ? "off" : "polite");
    toggle.hidden = reduced; /* 움직임 줄이기: 자동 넘김 자체가 없으므로 버튼도 숨김 */
    var playing = !userPaused;
    toggleText.textContent = playing ? "일시정지" : "재생";
    toggle.setAttribute("aria-label", playing ? "자동 넘김 일시정지" : "자동 넘김 재생");
    toggle.setAttribute("aria-pressed", String(!playing));
  }

  function go(n) {
    idx = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      var on = i === idx;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
    });
    ticks.forEach(function (t, i) {
      var on = i === idx;
      t.classList.toggle("is-active", on);
      if (on) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current");
    });
    cur.textContent = String(idx + 1);
  }

  document.getElementById("prev").addEventListener("click", function () { go(idx - 1); });
  document.getElementById("next").addEventListener("click", function () { go(idx + 1); });
  toggle.addEventListener("click", function () { userPaused = !userPaused; render(); });
  ticks.forEach(function (t) { t.addEventListener("click", function () { go(Number(t.getAttribute("data-go"))); }); });

  /* 진행 막대가 끝나면 다음 장 */
  controls.addEventListener("animationend", function (e) {
    if (e.animationName === "fill") go(idx + 1);
  });

  stage.addEventListener("keydown", function (e) {
    if (e.target && e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") { go(idx - 1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { go(idx + 1); e.preventDefault(); }
    else if (e.key === "Home") { go(0); e.preventDefault(); }
    else if (e.key === "End") { go(slides.length - 1); e.preventDefault(); }
  });

  stage.addEventListener("mouseenter", function () { hold = true; render(); });
  stage.addEventListener("mouseleave", function () { hold = false; render(); });
  stage.addEventListener("focusin", function (e) {
    try { if (e.target.matches(":focus-visible")) { hold = true; render(); } } catch (err) {}
  });
  stage.addEventListener("focusout", function () { hold = false; render(); });

  if (mq.addEventListener) mq.addEventListener("change", render); else if (mq.addListener) mq.addListener(render);

  go(0);
  render();
})();
