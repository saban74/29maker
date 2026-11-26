// =============================================================
//  도트 캐릭터 그리기 엔진 
//  부품 데이터는 maker-parts.js 에 있습니다.
// =============================================================
const M = window.MAKER;
const N = M.size;
const OUTLINE = "#1b1726";

// ---------------- 캐릭터 정보 (부품 번호 + 색) ----------------
function defaultState() {
  const parts = {};
  for (const c of M.categories) parts[c.id] = 0;
  parts.hair = 1; parts.weapon = 1;
  const colors = {};
  for (const s of M.colorSlots) colors[s.key] = s.def;
  return { parts, colors };
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

// 캐릭터 코드 (글자로 바꿔서 주고받기)
function encode(st) { return btoa(unescape(encodeURIComponent(JSON.stringify(st)))); }
function decode(code) { return normalize(JSON.parse(decodeURIComponent(escape(atob(code.trim()))))); }

// 캐릭터 한 장면을 작은 캔버스로 만들어 줌 (썸네일, 월드 속 캐릭터에 사용)
function spriteCanvas(st, frame = {}, scale = 1, outline = true) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = N * scale;
  drawGrid(cv.getContext("2d"), compose(buildLayers(st), frame, outline), scale);
  return cv;
}
