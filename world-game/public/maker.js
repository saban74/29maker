// =============================================================
//  도트 캐릭터 메이커 - 그리기 엔진
//  부품 데이터는 maker-parts.js 에 있습니다.
// =============================================================
const M = window.MAKER;
const N = M.size;
const OUTLINE = "#1b1726";
const $ = (id) => document.getElementById(id);

// ---------------- 상태 (지금 고른 부품과 색) ----------------
function defaultState() {
  const parts = {};
  for (const c of M.categories) parts[c.id] = 0;
  parts.hair = 1; parts.weapon = 1;
  const colors = {};
  for (const s of M.colorSlots) colors[s.key] = s.def;
  return { parts, colors };
}
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
// 코드나 저장값이 이상해도 안전하게 고쳐서 사용
function normalize(s) {
  if (!s || typeof s !== "object") return null;
  const d = defaultState();
  for (const c of M.categories) {
    const v = s.parts && s.parts[c.id];
    if (Number.isInteger(v) && v >= 0 && v < c.options.length) d.parts[c.id] = v;
  }
  for (const k of Object.keys(d.colors)) {
    const v = s.colors && s.colors[k];
    if (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)) d.colors[k] = v;
  }
  return d;
}

// ---------------- 색 계산 ----------------
function darken(hex, amt = 0.28) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * (1 - amt)));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function colorOf(ch, colors) {
  if (M.fixedColors[ch]) return M.fixedColors[ch];
  const low = ch.toLowerCase();
  const base = colors[low];
  if (!base) return null;
  return ch === low ? base : darken(base);
}

// ---------------- 부품을 칸(grid)에 그리기 ----------------
const emptyGrid = () => new Array(N * N).fill(null);
function stamp(grid, part, colors) {
  const [ox, oy] = part.at;
  part.map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "." || ch === " ") return;
      const px = ox + x, py = oy + y;
      if (px < 0 || py < 0 || px >= N || py >= N) return;
      const col = colorOf(ch, colors);
      if (col) grid[py * N + px] = col;
    });
  });
}

// 캐릭터를 "윗몸 / 왼다리 / 오른다리 / 무기" 네 장으로 나눠 그림 (움직임을 위해)
function buildLayers(st) {
  const upper = emptyGrid(), lower = emptyGrid(), weapon = emptyGrid();
  const target = { upper, lower, weapon };
  for (const b of M.base) stamp(target[b.layer], b, st.colors);
  for (const c of M.categories) stamp(target[c.layer], c.options[st.parts[c.id]], st.colors);
  const lowerL = emptyGrid(), lowerR = emptyGrid();
  lower.forEach((v, i) => { if (v) ((i % N) < N / 2 ? lowerL : lowerR)[i] = v; });
  return { upper, lowerL, lowerR, weapon };
}

function compose(layers, frame = {}, outline = true) {
  const out = emptyGrid();
  const all = [(frame.all || [0, 0])[0], (frame.all || [0, 0])[1] + 2]; // +2: 캐릭터를 2칸 아래로 (점프할 자리)
  const put = (grid, off = [0, 0]) => {
    const dx = off[0] + all[0], dy = off[1] + all[1];
    grid.forEach((v, i) => {
      if (!v) return;
      const x = (i % N) + dx, y = Math.floor(i / N) + dy;
      if (x >= 0 && y >= 0 && x < N && y < N) out[y * N + x] = v;
    });
  };
  put(layers.lowerL, frame.lL);
  put(layers.lowerR, frame.lR);
  put(layers.upper, frame.up);
  put(layers.weapon, frame.wp);
  if (!outline) return out;
  // 자동 외곽선: 빈칸인데 옆에 그림이 있으면 테두리 색
  const res = out.slice();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (out[y * N + x]) continue;
    const near = (x > 0 && out[y * N + x - 1]) || (x < N - 1 && out[y * N + x + 1]) || (y > 0 && out[(y - 1) * N + x]) || (y < N - 1 && out[(y + 1) * N + x]);
    if (near) res[y * N + x] = OUTLINE;
  }
  return res;
}

function drawGrid(ctx, grid, scale, ox = 0, oy = 0) {
  grid.forEach((v, i) => {
    if (!v) return;
    ctx.fillStyle = v;
    ctx.fillRect(ox + (i % N) * scale, oy + Math.floor(i / N) * scale, scale, scale);
  });
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

function encode(st) { return btoa(unescape(encodeURIComponent(JSON.stringify(st)))); }
function decode(code) { return normalize(JSON.parse(decodeURIComponent(escape(atob(code.trim()))))); }
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

// ---------------- 시작 ----------------
renderAnims();
renderTabs();
renderOptions();
renderSlots();
playAnim();
