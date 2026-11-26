// =============================================================
//  도트 캐릭터 메이커 - 화면
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
  try { return normalize(JSON.parse(localStorage.getItem("dotMaker"))); } catch { return null; }
}
function save() {
  try { localStorage.setItem("dotMaker", JSON.stringify(state)); } catch { /* 저장 못 해도 괜찮음 */ }
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

// ---------------- 캐스트로 저장 (월드 스튜디오에서 사용) ----------------
for (const sp of SPEECH_STYLES) {
  const o = document.createElement("option");
  o.value = sp.id; o.textContent = "말투: " + sp.name;
  $("cSpeech").appendChild(o);
}
$("saveCast").onclick = () => {
  const name = $("cName").value.trim();
  if (!name) { toast("이름을 넣어 주세요"); $("cName").focus(); return; }
  const cast = {
    id: "c" + Date.now().toString(36),
    name,
    job: $("cJob").value.trim() || "모험가",
    intro: $("cIntro").value.trim(),
    tags: $("cTags").value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3),
    speech: $("cSpeech").value,
    state: JSON.parse(JSON.stringify(state)),
  };
  const list = loadCasts();
  list.unshift(cast);
  saveCasts(list);
  toast(`"${name}" 저장! 스튜디오의 캐스트 목록에 나타나요`);
};

// ---------------- 시작 ----------------
renderAnims();
renderTabs();
renderOptions();
renderSlots();
playAnim();
