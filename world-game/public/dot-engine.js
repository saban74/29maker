// =============================================================
//  도트 캐릭터 그리기 엔진 (메이커와 월드 스튜디오가 함께 사용)
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

// ---------------- 말투 (월드에서 캐릭터가 하는 말) ----------------
// {other} = 상대 이름, {tag} = 내 성격 중 하나, {job} = 내 직업
const SPEECH_STYLES = [
  { id: "polite", name: "공손함",
    hello: ["안녕하세요, {other}님!", "{other}님, 반가워요.", "어머, {other}님 오셨네요."],
    alone: ["오늘 날씨가 참 좋네요.", "{job} 일은 늘 보람차요.", "저는 {tag} 편이라서요.", "산책하기 좋은 날이에요."],
    reply: ["네, 그렇네요!", "좋은 하루 보내세요.", "다음에 또 이야기해요."] },
  { id: "bold", name: "씩씩함",
    hello: ["{other}! 잘 지냈어?", "오, {other}! 한판 붙을래?", "{other}, 힘내자고!"],
    alone: ["오늘도 힘차게 간다!", "{job}의 길은 멀고도 험하지!", "{tag}, 그게 나야!", "배고프다! 밥 먹자!"],
    reply: ["좋았어!", "하하, 그렇지!", "가자, 가자!"] },
  { id: "shy", name: "수줍음",
    hello: ["아, {other}... 안녕...", "{other}... 혹시 나 불렀어?", "저기... {other}..."],
    alone: ["...조용한 게 좋아.", "꽃이 예쁘다...", "나는 {tag}... 그런가 봐.", "...음."],
    reply: ["으, 응...", "...고마워.", "나도... 그렇게 생각해."] },
  { id: "playful", name: "장난꾸러기",
    hello: ["{other}! 메롱~", "{other}, 잡아 봐라~!", "헤헤, {other} 왔다!"],
    alone: ["심심해~ 뭐 재밌는 거 없나?", "{job}? 그건 부업이고 장난이 본업!", "쉿, 비밀인데 나 {tag}이야.", "룰루랄라~"],
    reply: ["키키키!", "에이~ 농담이야!", "다음엔 내가 이긴다!"] },
  { id: "blunt", name: "무뚝뚝함",
    hello: ["{other}. 왔나.", "...{other}.", "어, {other}."],
    alone: ["...", "할 일이나 하자.", "{job}은 말보다 실력.", "흠."],
    reply: ["그래.", "...알았다.", "됐다."] },
];
const speechOf = (id) => SPEECH_STYLES.find((s) => s.id === id) || SPEECH_STYLES[0];

// 내가 만든 캐스트 목록 (이 브라우저에 저장)
function loadCasts() {
  try {
    const list = JSON.parse(localStorage.getItem("dotCasts") || "[]");
    return Array.isArray(list) ? list.map(normalizeCast).filter(Boolean) : [];
  } catch { return []; }
}
function saveCasts(list) {
  try { localStorage.setItem("dotCasts", JSON.stringify(list)); } catch { /* 무시 */ }
}
function normalizeCast(c) {
  if (!c || typeof c !== "object") return null;
  const str = (v, n, d = "") => (typeof v === "string" ? v.slice(0, n) : d);
  const state = normalize(c.state);
  if (!state) return null;
  return {
    id: str(c.id, 20) || "c" + Math.random().toString(36).slice(2, 8),
    name: str(c.name, 12) || "이름없음",
    job: str(c.job, 12, "모험가"),
    intro: str(c.intro, 60),
    tags: Array.isArray(c.tags) ? c.tags.filter((t) => typeof t === "string").map((t) => t.slice(0, 10)).slice(0, 3) : [],
    speech: speechOf(c.speech).id,
    state,
  };
}
