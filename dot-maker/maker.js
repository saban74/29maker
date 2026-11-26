// =============================================================
//  도트 캐릭터 메이커 (혼자 쓰는 버전) - 화면
//  그리기 엔진은 dot-engine.js, 부품 데이터는 maker-parts.js 에 있습니다.
// =============================================================
const $ = (id) => document.getElementById(id);

// ---------------- 지금 만들고 있는 캐릭터 ----------------
let state = loadSaved() || defaultState();
let tab = M.categories[0].id;
let slot = "e";
let anim = M.animations[0];
let frameNo = 0;

function loadSaved() {
  try { return normalize(JSON.parse(localStorage.getItem("dotMakerSolo"))); } catch { return null; }
}
function save() {
  try { localStorage.setItem("dotMakerSolo", JSON.stringify(state)); } catch { /* 저장 못 해도 괜찮음 */ }
}
// ---------------- 큰 미리보기 ----------------
const stage = $("stage");
const sctx = stage.getContext("2d");
let layers = buildLayers(state);

function drawStage() {
  const S = stage.width / N;
  const bg = $("bgSel").value;
  if (bg === "check") {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      sctx.fillStyle = (x + y) % 2 ? "#36314f" : "#2f2a46";
      sctx.fillRect(x * S, y * S, S, S);
    }
  } else {
    sctx.fillStyle = bg;
    sctx.fillRect(0, 0, stage.width, stage.height);
  }
  drawGrid(sctx, compose(layers, anim.frames[frameNo % anim.frames.length], $("outline").checked), S);
  if ($("grid").checked) {
    sctx.strokeStyle = "rgba(255,255,255,.12)";
    for (let i = 1; i < N; i++) {
      sctx.beginPath(); sctx.moveTo(i * S + 0.5, 0); sctx.lineTo(i * S + 0.5, stage.height); sctx.stroke();
      sctx.beginPath(); sctx.moveTo(0, i * S + 0.5); sctx.lineTo(stage.width, i * S + 0.5); sctx.stroke();
    }
  }
}
let timer = null;
function playAnim() {
  clearTimeout(timer);
  drawStage();
  timer = setTimeout(() => { frameNo++; playAnim(); }, anim.speed);
}

// ---------------- 화면 만들기 ----------------
function renderAnims() {
  const box = $("anims");
  box.innerHTML = "";
  for (const a of M.animations) {
    const b = document.createElement("button");
    b.textContent = a.name;
    b.className = a === anim ? "on" : "";
    b.onclick = () => { anim = a; frameNo = 0; renderAnims(); playAnim(); };
    box.appendChild(b);
  }
}

const TAB_SLOT = { face: "e", hair: "h", hat: "a", top: "c", lowerP: "p", boots: "b", weapon: "w", shield: "l" };
function renderTabs() {
  const box = $("tabs");
  box.innerHTML = "";
  for (const c of M.categories) {
    const b = document.createElement("button");
    b.textContent = c.name;
    b.className = c.id === tab ? "on" : "";
    b.onclick = () => { tab = c.id; if (TAB_SLOT[tab]) slot = TAB_SLOT[tab]; renderTabs(); renderOptions(); renderSlots(); };
    box.appendChild(b);
  }
}

// 부품 고르기 칸: 각 칸에 "그 부품을 입은 내 캐릭터" 를 작게 보여 줌
function renderOptions() {
  const box = $("options");
  box.innerHTML = "";
  const cat = M.categories.find((c) => c.id === tab);
  cat.options.forEach((opt, n) => {
    const d = document.createElement("div");
    d.className = "opt" + (state.parts[tab] === n ? " on" : "");
    const cv = document.createElement("canvas");
    cv.width = cv.height = N * 2;
    const trial = { parts: { ...state.parts, [tab]: n }, colors: state.colors };
    drawGrid(cv.getContext("2d"), compose(buildLayers(trial), {}, true), 2);
    d.append(cv, document.createTextNode(opt.name));
    d.onclick = () => { state.parts[tab] = n; changed(); };
    box.appendChild(d);
  });
}

function renderSlots() {
  const box = $("slots");
  box.innerHTML = "";
  for (const s of M.colorSlots) {
    const b = document.createElement("button");
    b.className = "slot" + (s.key === slot ? " on" : "");
    const i = document.createElement("i");
    i.style.background = state.colors[s.key];
    b.append(i, document.createTextNode(s.name));
    b.onclick = () => { slot = s.key; renderSlots(); };
    box.appendChild(b);
  }
  const sw = $("swatches");
  sw.innerHTML = "";
  const list = slot === "s" ? M.skinPresets.concat(M.palette) : M.palette;
  for (const col of list) {
    const d = document.createElement("div");
    d.className = "sw" + (state.colors[slot].toLowerCase() === col.toLowerCase() ? " on" : "");
    d.style.background = col;
    d.title = col;
    d.onclick = () => { state.colors[slot] = col; changed(); };
    sw.appendChild(d);
  }
  const pick = document.createElement("input");
  pick.type = "color";
  pick.value = state.colors[slot];
  pick.title = "직접 고르기";
  pick.oninput = () => { state.colors[slot] = pick.value; layers = buildLayers(state); drawStage(); };
  pick.onchange = () => changed();
  sw.appendChild(pick);
}

function changed() {
  layers = buildLayers(state);
  save();
  drawStage();
  renderOptions();
  renderSlots();
}

// ---------------- 버튼들 ----------------
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
$("random").onclick = () => {
  for (const c of M.categories) state.parts[c.id] = Math.floor(Math.random() * c.options.length);
  for (const s of M.colorSlots) state.colors[s.key] = pickOne(s.key === "s" ? M.skinPresets : M.palette);
  state.colors.e = pickOne(["#2b2b3a", "#3f51b5", "#2fa39a", "#5b3a29", "#e25b45", "#a066d3"]);
  changed();
};
$("reset").onclick = () => { state = defaultState(); changed(); };
for (const id of ["outline", "grid", "bgSel"]) $(id).onchange = drawStage;

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.style.opacity = 1;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.style.opacity = 0), 1800);
}

function download(canvas, name) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = name;
  a.click();
}

// 한 장짜리 PNG (투명 배경)
$("dlPng").onclick = () => {
  const s = Number($("scale").value);
  const cv = document.createElement("canvas");
  cv.width = cv.height = N * s;
  drawGrid(cv.getContext("2d"), compose(layers, {}, $("outline").checked), s);
  download(cv, "character.png");
  toast("PNG 를 내려받았어요");
};

// 스프라이트 시트: 한 줄에 움직임 하나 (가만히 / 걷기 / 공격 / 점프)
$("dlSheet").onclick = () => {
  const s = Number($("scale").value);
  const cols = Math.max(...M.animations.map((a) => a.frames.length));
  const cv = document.createElement("canvas");
  cv.width = cols * N * s;
  cv.height = M.animations.length * N * s;
  const ctx = cv.getContext("2d");
  M.animations.forEach((a, row) => a.frames.forEach((f, col) => {
    drawGrid(ctx, compose(layers, f, $("outline").checked), s, col * N * s, row * N * s);
  }));
  download(cv, "character-sheet.png");
  toast(`스프라이트 시트: 한 칸 ${N * s}px, ${M.animations.map((a) => a.name).join(" / ")}`);
};

$("copyCode").onclick = async () => {
  const code = encode(state);
  $("codeBox").value = code;
  try { await navigator.clipboard.writeText(code); toast("코드를 복사했어요. 친구에게 보내 보세요!"); }
  catch { toast("아래 칸의 코드를 복사해 주세요"); }
};
$("loadCode").onclick = () => {
  try {
    const st = decode($("codeBox").value);
    if (!st) throw new Error();
    state = st;
    changed();
    toast("캐릭터를 불러왔어요");
  } catch { toast("코드가 올바르지 않아요"); }
};

// ---------------- 내 캐릭터 보관함 ----------------
const LIB_KEY = "dotMakerLibrary";
function loadLib() {
  try {
    const list = JSON.parse(localStorage.getItem(LIB_KEY) || "[]");
    return Array.isArray(list) ? list.map(cleanLibItem).filter(Boolean) : [];
  } catch { return []; }
}
function cleanLibItem(it) {
  if (!it || typeof it.name !== "string" || !it.name.trim()) return null;
  const st = normalize(it.state);
  return st ? { name: it.name.trim().slice(0, 20), state: st, saved: typeof it.saved === "string" ? it.saved : "" } : null;
}
function saveLib(list) {
  try { localStorage.setItem(LIB_KEY, JSON.stringify(list)); return true; }
  catch { toast("저장하지 못했어요. 백업 파일을 받아 두세요"); return false; }
}
function renderLib() {
  const list = loadLib();
  const box = $("lib");
  box.innerHTML = "";
  $("libCount").textContent = list.length ? `(${list.length})` : "";
  if (!list.length) { box.innerHTML = '<div class="empty">아직 저장한 캐릭터가 없어요.</div>'; return; }
  list.forEach((it, n) => {
    const d = document.createElement("div");
    d.className = "item";
    d.title = `${it.name} 불러오기`;
    const name = document.createElement("span");
    name.textContent = it.name;
    const del = document.createElement("button");
    del.className = "del"; del.textContent = "✕"; del.title = "지우기";
    del.onclick = (ev) => {
      ev.stopPropagation();
      if (!confirm(`"${it.name}" 을(를) 보관함에서 지울까요?`)) return;
      list.splice(n, 1);
      if (saveLib(list)) renderLib();
    };
    d.append(spriteCanvas(it.state, {}, 2), name, del);
    d.onclick = () => {
      state = JSON.parse(JSON.stringify(it.state));
      $("libName").value = it.name;
      changed();
      toast(`"${it.name}" 을(를) 불러왔어요`);
    };
    box.appendChild(d);
  });
}
$("libSave").onclick = () => {
  const name = $("libName").value.trim();
  if (!name) { toast("이름을 넣어 주세요"); $("libName").focus(); return; }
  const list = loadLib();
  const same = list.findIndex((it) => it.name === name);
  if (same >= 0) {
    if (!confirm(`"${name}" 이(가) 이미 있어요. 지금 모습으로 바꿀까요?`)) return;
    list.splice(same, 1);
  }
  list.unshift({ name, state: JSON.parse(JSON.stringify(state)), saved: new Date().toISOString() });
  if (saveLib(list)) { renderLib(); toast(`"${name}" 저장했어요`); }
};
$("libName").addEventListener("keydown", (e) => { if (e.key === "Enter") $("libSave").click(); });
$("libExport").onclick = () => {
  const list = loadLib();
  if (!list.length) { toast("보관함이 비어 있어요"); return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(list, null, 1)], { type: "application/json" }));
  a.download = "dot-maker-backup.json";
  a.click();
  toast(`${list.length}명을 백업 파일로 받았어요`);
};
$("libImport").onclick = () => $("libFile").click();
$("libFile").onchange = async () => {
  const file = $("libFile").files[0];
  $("libFile").value = "";
  if (!file) return;
  try {
    const items = JSON.parse(await file.text());
    if (!Array.isArray(items)) throw new Error();
    const add = items.map(cleanLibItem).filter(Boolean);
    if (!add.length) throw new Error();
    const list = loadLib();
    const names = new Set(list.map((it) => it.name));
    let added = 0;
    for (const it of add) if (!names.has(it.name)) { list.push(it); names.add(it.name); added++; }
    if (saveLib(list)) {
      renderLib();
      toast(`${added}명을 가져왔어요${add.length > added ? ` (이름이 같은 ${add.length - added}명은 건너뜀)` : ""}`);
    }
  } catch { toast("백업 파일을 읽을 수 없어요"); }
};

// ---------------- 시작 ----------------
renderAnims();
renderTabs();
renderOptions();
renderSlots();
renderLib();
playAnim();
