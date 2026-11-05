/*
  6. industry-lens : 산업 탭. 내용(장비, 사양, 문구)은 모두 index.html 에 들어 있고,
  출처는 index.html 위쪽 주석에 적어 두었습니다(research/espec/products/*.md).
  이 파일은 보이기/숨기기와 키보드 조작만 합니다. 스크립트가 꺼져 있으면 여섯 산업이 위에서 아래로 모두 보입니다.
*/
(function () {
  var tabs = [].slice.call(document.querySelectorAll("#picker a"));
  var panels = [].slice.call(document.querySelectorAll(".panel"));
  var ask = document.getElementById("ask");
  var askLine = document.getElementById("ask-line");
  var picker = document.getElementById("picker");
  var names = {};
  tabs.forEach(function (t) { names[t.dataset.key] = t.firstChild.textContent; });

  picker.setAttribute("role", "tablist");
  picker.setAttribute("aria-orientation", window.matchMedia("(max-width:1100px)").matches ? "horizontal" : "vertical");
  tabs.forEach(function (t) {
    t.setAttribute("role", "tab");
    t.setAttribute("aria-controls", "p-" + t.dataset.key);
    t.id = "tab-" + t.dataset.key;
  });
  panels.forEach(function (p) { p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "tab-" + p.dataset.key); });

  function show(key, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.key === key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) { p.hidden = p.dataset.key !== key; });
    ask.className = "block ask f-" + key;
    askLine.textContent = names[key] + " 분야 시험 조건을 알려 주시면 맞는 모델과 옵션을 정리해 드립니다.";
    document.getElementById("ask-btn").textContent = names[key] + " 견적문의";
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function (e) { e.preventDefault(); show(t.dataset.key, false); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % tabs.length;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); show(tabs[n].dataset.key, true); }
      if (e.key === " ") { e.preventDefault(); show(t.dataset.key, false); }
    });
  });

  var start = (location.hash || "").replace("#p-", "");
  show(names[start] ? start : "semicon", false);
})();
