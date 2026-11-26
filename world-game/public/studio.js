// =============================================================
//  월드 스튜디오
//  - 오른쪽 캐스트 목록에서 캐릭터를 골라 월드에 넣습니다.
//  - 캐릭터는 스스로 돌아다니고(자유 활동), 가까이 있으면 서로 말을 겁니다.
//  - 캐릭터를 누르고 명령(대화/이동/휴식/되돌리기)을 내릴 수 있습니다.
//  - [게시하기] 를 누르면 서버에 저장되고, 공개 링크가 생깁니다.
//  주소에 ?w=링크번호 가 붙어 있으면 "구경 모드" 입니다 (편집 버튼 숨김).
// =============================================================
const $ = (id) => document.getElementById(id);
const VIEW = new URLSearchParams(location.search).get("w");
const MAX_CAST = 12;
const SPEED = 2.4; // 1초에 몇 칸 걷는지

// 처음부터 들어 있는 예시 캐릭터 4명
const SAMPLE_CASTS = [
  { id: "s-lumi", name: "루미", job: "마법사", intro: "별을 보며 주문을 연구하는 견습 마법사.", tags: ["호기심", "다정함", "수다쟁이"], speech: "polite",
    state: { parts: { face: 1, hair: 2, lowerP: 2, boots: 1, top: 4, hat: 2, shield: 0, weapon: 2 }, colors: { s: "#ffe3c4", h: "#f2c14e", e: "#3f51b5", a: "#7e57c2", c: "#3f51b5", p: "#7e57c2", b: "#5b3a29", w: "#4fc3e8", l: "#b23a3a" } } },
  { id: "s-bau", name: "바우", job: "전사", intro: "마을 입구를 지키는 듬직한 전사.", tags: ["용감함", "단순함", "의리"], speech: "bold",
    state: { parts: { face: 4, hair: 3, lowerP: 0, boots: 0, top: 2, hat: 0, shield: 1, weapon: 1 }, colors: { s: "#e0ac69", h: "#e25b45", e: "#2b2b3a", a: "#8a94a6", c: "#8a94a6", p: "#4a4f63", b: "#5b3a29", w: "#c9d3dd", l: "#b23a3a" } } },
  { id: "s-toto", name: "토토", job: "상인", intro: "뭐든 싸게 판다는 소문의 떠돌이 상인.", tags: ["유머", "꼼꼼함", "장사꾼"], speech: "playful",
    state: { parts: { face: 2, hair: 4, lowerP: 1, boots: 1, top: 3, hat: 4, shield: 0, weapon: 0 }, colors: { s: "#f5cfa0", h: "#8d5a3b", e: "#2b2b3a", a: "#2fa39a", c: "#f59e3b", p: "#3f7fd6", b: "#e25b45", w: "#c9d3dd", l: "#b23a3a" } } },
  { id: "s-harang", name: "하랑", job: "정원사", intro: "연못가 꽃밭을 돌보는 조용한 정원사.", tags: ["느긋함", "조용함", "식물사랑"], speech: "shy",
    state: { parts: { face: 3, hair: 6, lowerP: 0, boots: 2, top: 1, hat: 5, shield: 0, weapon: 0 }, colors: { s: "#c68642", h: "#2b2b3a", e: "#2fa39a", a: "#2b2b3a", c: "#4caf50", p: "#8d5a3b", b: "#5b3a29", w: "#c9d3dd", l: "#b23a3a" } } },
].map(normalizeCast);

let world = { name: "나의 첫 마을", map: defaultMap() };
let agents = [];
let selected = null;
let logs = [];
let logFilter = "all";
let paintMode = false;
let brush = 1;
let movePicking = false;
let hoverTile = null;
let dirty = false;
let nextAgentId = 1;

// ---------------- 캐릭터 그림 미리 만들기 ----------------
function flip(cv) {
  const f = document.createElement("canvas");
  f.width = cv.width; f.height = cv.height;
  const c = f.getContext("2d");
  c.translate(cv.width, 0); c.scale(-1, 1); c.drawImage(cv, 0, 0);
  return f;
}
function makeSprites(st) {
  const out = {};
  for (const id of ["idle", "walk"]) {
    const a = M.animations.find((x) => x.id === id);
    const right = a.frames.map((f) => spriteCanvas(st, f, DOT));
    out[id] = { right, left: right.map(flip), speed: a.speed };
  }
  return out;
}

// ---------------- 지도와 길찾기 ----------------
const tileAt = (x, y) => world.map.tiles[y * world.map.w + x];
const walkable = (x, y) => x >= 0 && y >= 0 && x < world.map.w && y < world.map.h && TILES[tileAt(x, y)].walk;

// 가장 짧은 길 찾기 (너비 우선 탐색): 출발 → 도착까지 칸 목록
function findPath(sx, sy, tx, ty) {
  if (!walkable(tx, ty)) return null;
  const W = world.map.w, prev = new Map([[sy * W + sx, -1]]);
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === tx && y === ty) {
      const path = [];
      for (let k = y * W + x; k !== sy * W + sx; k = prev.get(k)) path.unshift({ x: k % W, y: Math.floor(k / W) });
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * W + nx;
      if (!prev.has(k) && walkable(nx, ny)) { prev.set(k, y * W + x); queue.push([nx, ny]); }
    }
  }
  return null;
}
function nearestFreeTile(x, y) {
  const taken = new Set(agents.map((a) => `${Math.round(a.x)},${Math.round(a.y)}`));
  for (let r = 0; r < 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const nx = x + dx, ny = y + dy;
    if (walkable(nx, ny) && !taken.has(`${nx},${ny}`)) return { x: nx, y: ny };
  }
  return null;
}

// ---------------- 캐릭터(에이전트) ----------------
function addAgent(cast, x, y, quiet) {
  if (agents.length >= MAX_CAST) { toast(`한 월드에는 ${MAX_CAST}명까지 넣을 수 있어요`); return null; }
  const spot = x === undefined ? nearestFreeTile(11, 8) : { x, y };
  if (!spot) { toast("빈 자리가 없어요"); return null; }
  const a = {
    id: nextAgentId++, cast, x: spot.x, y: spot.y, path: [], mode: "free", after: null,
    left: Math.random() < 0.5, wait: 800 + Math.random() * 2000, bubble: null, history: [],
    sprites: makeSprites(cast.state), born: performance.now(),
  };
  agents.push(a);
  if (!quiet) { log("sys", `${cast.name} 투입됨`); a.bubble = { text: "안녕!", until: performance.now() + 2000 }; }
  changed();
  return a;
}
function removeAgent(a) {
  agents = agents.filter((x) => x !== a);
  if (selected === a) selected = null;
  log("sys", `${a.cast.name} 퇴장`);
  changed();
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function fill(line, a, other) {
  return line.replace("{other}", other ? other.cast.name : "").replace("{tag}", pick(a.cast.tags.length ? a.cast.tags : ["평범함"])).replace("{job}", a.cast.job);
}
function say(a, text, ms = 3200) {
  a.bubble = { text, until: performance.now() + ms };
  log("talk", text, a.cast.name);
}
function nearest(a, maxDist) {
  let best = null, bd = maxDist;
  for (const b of agents) {
    if (b === a) continue;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= bd) { bd = d; best = b; }
  }
  return best;
}
// 말 걸기: 근처에 누가 있으면 인사하고 상대가 대답함
function talk(a) {
  const sp = speechOf(a.cast.speech);
  const other = nearest(a, 4);
  if (!other) return say(a, fill(pick(sp.alone), a));
  a.left = other.x < a.x;
  say(a, fill(pick(sp.hello), a, other));
  setTimeout(() => {
    if (!agents.includes(other)) return;
    if (other.mode === "rest") return say(other, "...쿨쿨 (자는 중)", 2200);
    other.left = a.x < other.x;
    say(other, fill(pick(speechOf(other.cast.speech).reply), other, a));
  }, 1600);
}

// ---------------- 명령 ----------------
const MODE_NAME = { free: "자유 활동", move: "이동 중", rest: "휴식" };
function remember(a) {
  a.history.push({ mode: a.mode, x: Math.round(a.x), y: Math.round(a.y) });
  if (a.history.length > 20) a.history.shift();
}
function cmdTalk() { if (selected) { remember(selected); talk(selected); } }
function cmdMove() {
  if (!selected) return;
  movePicking = !movePicking;
  setPaint(false);
  renderSelected();
  updateStatus();
}
function moveTo(a, tx, ty, after = "free") {
  const sx = Math.round(a.x), sy = Math.round(a.y);
  const path = findPath(sx, sy, tx, ty);
  if (!path) { log("move", `${a.cast.name}: 그곳엔 갈 수 없어요 (${tx}, ${ty})`); a.bubble = { text: "갈 수 없어요!", until: performance.now() + 1500 }; return false; }
  // 지금 걷던 칸 가운데로 먼저 돌아온 뒤 출발
  a.path = (a.x !== sx || a.y !== sy) ? [{ x: sx, y: sy }, ...path] : path;
  a.mode = "move";
  a.after = after;
  return true;
}
function cmdRest() {
  const a = selected;
  if (!a) return;
  remember(a);
  a.path = (a.x !== Math.round(a.x) || a.y !== Math.round(a.y)) ? [{ x: Math.round(a.x), y: Math.round(a.y) }] : [];
  a.mode = "rest";
  a.after = null;
  log("move", `${a.cast.name} 휴식 시작`);
  renderSelected();
}
function cmdUndo() {
  const a = selected;
  if (!a) return;
  const prev = a.history.pop();
  if (!prev) { toast("되돌릴 명령이 없어요"); return; }
  const back = prev.mode === "move" ? "free" : prev.mode;
  if (Math.round(a.x) === prev.x && Math.round(a.y) === prev.y) { a.path = []; a.mode = back; }
  else moveTo(a, prev.x, prev.y, back);
  log("move", `${a.cast.name} 되돌리기 → ${MODE_NAME[back]}`);
  renderSelected();
}

// ---------------- 움직임 계산 (1초에 60번) ----------------
function update(dt, now) {
  for (const a of agents) {
    if (a.bubble && a.bubble.until < now) a.bubble = null;

    if (a.path.length) {
      const t = a.path[0];
      const dx = t.x - a.x, dy = t.y - a.y, dist = Math.hypot(dx, dy), step = SPEED * dt / 1000;
      if (dx) a.left = dx < 0;
      if (dist <= step) {
        a.x = t.x; a.y = t.y; a.path.shift();
        if (!a.path.length && a.mode === "move") {
          a.mode = a.after || "free";
          if (a.mode === "free") { a.wait = 2500; log("move", `${a.cast.name} 도착 (${a.x}, ${a.y})`); }
          a.after = null;
          if (a === selected) renderSelected();
        }
      } else { a.x += dx / dist * step; a.y += dy / dist * step; }
      continue;
    }

    if (a.mode === "free") {
      a.wait -= dt;
      if (a.wait <= 0) {
        a.wait = 1500 + Math.random() * 3500;
        // 가끔은 근처 친구에게 말 걸기
        const friend = nearest(a, 2.5);
        if (friend && !a.bubble && !friend.bubble && Math.random() < 0.35) { talk(a); continue; }
        const tx = Math.round(a.x) + Math.floor(Math.random() * 9) - 4, ty = Math.round(a.y) + Math.floor(Math.random() * 7) - 3;
        const path = findPath(Math.round(a.x), Math.round(a.y), tx, ty);
        if (path && path.length <= 8) a.path = path;
      }
    }
  }
  agents.sort((p, q) => p.y - q.y); // 아래쪽에 있는 캐릭터가 앞에 보이도록
}

// ---------------- 그리기 ----------------
const canvas = $("world");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function drawBubble(text, cx, by) {
  ctx.font = "bold 12px system-ui, sans-serif";
  const w = Math.min(220, ctx.measureText(text).width + 14), h = 22;
  const x = Math.max(2, Math.min(canvas.width - w - 2, cx - w / 2)), y = by - h;
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#1b1726"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 4, y + h - 1); ctx.lineTo(cx, y + h + 5); ctx.lineTo(cx + 4, y + h - 1); ctx.fill();
  ctx.fillStyle = "#1b1726"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  let t = text;
  while (ctx.measureText(t).width > w - 14 && t.length > 1) t = t.slice(0, -1);
  if (t !== text) t = t.slice(0, -1) + "…";
  ctx.fillText(t, x + 7, y + h / 2 + 1);
}

function draw(now) {
  const { w, h } = world.map;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) drawTile(ctx, tileAt(x, y), x, y, now);

  if ((paintMode || movePicking) && hoverTile) {
    ctx.strokeStyle = movePicking ? "#ffcf4a" : "#ffffff"; ctx.lineWidth = 2;
    ctx.strokeRect(hoverTile.x * TILE_PX + 1, hoverTile.y * TILE_PX + 1, TILE_PX - 2, TILE_PX - 2);
  }
  if (selected && selected.mode === "move" && selected.path.length) {
    const t = selected.path[selected.path.length - 1];
    ctx.fillStyle = "rgba(255,207,74,.35)";
    ctx.fillRect(t.x * TILE_PX, t.y * TILE_PX, TILE_PX, TILE_PX);
  }

  for (const a of agents) {
    const px = a.x * TILE_PX, py = a.y * TILE_PX;
    // 그림자 & 선택 표시
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath(); ctx.ellipse(px + 16, py + 28, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (a === selected) {
      ctx.strokeStyle = "#ffcf4a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(px + 16, py + 28, 14, 6, 0, 0, Math.PI * 2); ctx.stroke();
    }
    const set = a.path.length ? a.sprites.walk : a.sprites.idle;
    const frames = a.left ? set.left : set.right;
    const f = frames[Math.floor(Math.max(0, now - a.born) / set.speed) % frames.length];
    ctx.drawImage(f, Math.round(px - 16), Math.round(py - 32));
    // 이름표
    ctx.font = "bold 11px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#1b1726"; ctx.fillText(a.cast.name, px + 17, py - 30);
    ctx.fillStyle = a === selected ? "#ffcf4a" : "#ffffff"; ctx.fillText(a.cast.name, px + 16, py - 31);
    if (a.mode === "rest" && !a.path.length) {
      const bob = Math.sin(now / 400) * 3;
      ctx.font = "bold 13px system-ui"; ctx.fillStyle = "#ffffff"; ctx.fillText("z Z", px + 36, py - 14 + bob);
    }
  }
  // 말풍선은 맨 위에
  for (const a of agents) if (a.bubble) drawBubble(a.bubble.text, a.x * TILE_PX + 16, a.y * TILE_PX - 46);
}

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop); // 먼저 다음 장면을 예약 (한 장면에서 문제가 생겨도 멈추지 않도록)
  update(Math.max(0, Math.min(100, now - last)), now);
  last = now;
  draw(now);
  if (dirty && !VIEW) { dirty = false; saveLocal(); }
}

// ---------------- 마우스 ----------------
function eventTile(ev) {
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) * canvas.width / r.width, y = (ev.clientY - r.top) * canvas.height / r.height;
  return { px: x, py: y, x: Math.floor(x / TILE_PX), y: Math.floor(y / TILE_PX) };
}
let painting = false;
canvas.addEventListener("pointermove", (ev) => {
  const t = eventTile(ev);
  hoverTile = t;
  if (painting) paintAt(t);
  canvas.style.cursor = paintMode || movePicking ? "crosshair" : agentAt(t) ? "pointer" : "default";
});
canvas.addEventListener("pointerleave", () => (hoverTile = null));
addEventListener("pointerup", () => (painting = false));
canvas.addEventListener("pointerdown", (ev) => {
  const t = eventTile(ev);
  hoverTile = t;
  if (paintMode) { painting = true; paintAt(t); return; }
  if (movePicking && selected) {
    remember(selected);
    if (moveTo(selected, t.x, t.y)) log("move", `${selected.cast.name} → (${t.x}, ${t.y}) 로 이동 명령`);
    else selected.history.pop();
    movePicking = false;
    renderSelected();
    return;
  }
  select(agentAt(t));
});
function agentAt(t) {
  for (let i = agents.length - 1; i >= 0; i--) {
    const a = agents[i], cx = a.x * TILE_PX + 16, top = a.y * TILE_PX - 22;
    if (Math.abs(t.px - cx) < 14 && t.py > top && t.py < a.y * TILE_PX + 32) return a;
  }
  return null;
}
function paintAt(t) {
  if (t.x < 0 || t.y < 0 || t.x >= world.map.w || t.y >= world.map.h) return;
  const i = t.y * world.map.w + t.x;
  if (world.map.tiles[i] === brush) return;
  world.map.tiles[i] = brush;
  changed();
}

// ---------------- 화면 (패널) ----------------
function select(a) {
  selected = a;
  movePicking = false;
  renderSelected();
}
let selTimer = null;
function renderSelected() {
  const a = selected;
  $("selEmpty").hidden = !!a;
  $("selBody").hidden = !a;
  clearInterval(selTimer);
  updateStatus();
  if (!a) return;
  $("selName").textContent = a.cast.name;
  $("selJob").textContent = `${a.cast.job} · ${MODE_NAME[a.mode]}`;
  $("selIntro").textContent = a.cast.intro || "(소개가 없어요)";
  $("selSpeech").textContent = "말투: " + speechOf(a.cast.speech).name;
  const tags = $("selTags");
  tags.innerHTML = "";
  for (const t of a.cast.tags) { const s = document.createElement("span"); s.className = "tag"; s.textContent = t; tags.appendChild(s); }
  $("cmdMove").classList.toggle("on", movePicking);
  $("cmdRest").classList.toggle("on", a.mode === "rest");
  $("cmdUndo").disabled = !a.history.length;
  const sc = $("selSprite").getContext("2d");
  sc.imageSmoothingEnabled = false;
  let n = 0;
  const tick = () => {
    sc.clearRect(0, 0, 128, 128);
    const fr = a.sprites.idle.right;
    sc.drawImage(fr[n++ % fr.length], 0, 0, 128, 128);
  };
  tick();
  selTimer = setInterval(tick, 500);
}

function updateStatus() {
  $("castCount").textContent = `${agents.length}명 활동 중`;
  let cmd = selected ? `${selected.cast.name} · ${MODE_NAME[selected.mode]}` : "자유 활동";
  if (movePicking) cmd = "👉 지도에서 갈 곳을 누르세요";
  if (paintMode) cmd = `🖌 땅 그리기: ${TILES[brush].name} (누른 채 끌면 여러 칸)`;
  $("statusLine").textContent = `월드: ${world.name}  ·  명령: ${cmd}  ·  ${agents.length}명`;
}

function swatchDots(st) {
  const d = document.createElement("div");
  d.className = "dots";
  for (const k of ["s", "h", "c", "p", "a"]) { const i = document.createElement("i"); i.style.background = st.colors[k]; d.appendChild(i); }
  return d;
}
function castRow(cast, button) {
  const row = document.createElement("div");
  row.className = "cast";
  const cv = spriteCanvas(cast.state, {}, 2);
  const info = document.createElement("div");
  info.className = "info";
  const nm = document.createElement("div"); nm.className = "nm"; nm.textContent = cast.name;
  const job = document.createElement("div"); job.className = "muted small"; job.textContent = `${cast.job} · ${cast.tags.join(", ") || "성격 미정"}`;
  info.append(nm, job, swatchDots(cast.state));
  row.append(cv, info);
  if (button) row.appendChild(button);
  return row;
}
function renderCastList() {
  const box = $("castList");
  box.innerHTML = "";
  if (VIEW) {
    $("castTitle").textContent = "이 월드의 캐릭터";
    for (const a of agents) {
      const row = castRow(a.cast);
      row.style.cursor = "pointer";
      row.onclick = () => select(a);
      box.appendChild(row);
    }
    return;
  }
  const mine = loadCasts();
  const all = [...mine, ...SAMPLE_CASTS];
  for (const cast of all) {
    const active = agents.find((a) => a.cast.id === cast.id);
    const b = document.createElement("button");
    b.textContent = active ? "활동 중" : "월드에 넣기";
    b.disabled = !!active;
    b.onclick = () => { const a = addAgent(cast); if (a) select(a); };
    const row = castRow(cast, b);
    if (active) row.querySelector("canvas").onclick = () => select(active);
    if (mine.includes(cast)) row.querySelector(".nm").insertAdjacentHTML("beforeend", '<span class="badge">내 캐릭터</span>');
    box.appendChild(row);
  }
}

// ---------------- 기록 ----------------
function log(type, text, who) {
  logs.unshift({ type, text, who, time: new Date() });
  if (logs.length > 200) logs.pop();
  renderLog();
}
function renderLog() {
  const ol = $("log");
  ol.innerHTML = "";
  for (const l of logs.filter((x) => logFilter === "all" || x.type === logFilter).slice(0, 80)) {
    const li = document.createElement("li");
    li.className = l.type;
    const t = document.createElement("time");
    t.textContent = l.time.toTimeString().slice(0, 8);
    li.appendChild(t);
    if (l.who) { const b = document.createElement("b"); b.textContent = l.who + ": "; li.appendChild(b); }
    li.appendChild(document.createTextNode(l.text));
    ol.appendChild(li);
  }
}
$("logFilter").onclick = (ev) => {
  const f = ev.target.dataset.f;
  if (!f) return;
  logFilter = f;
  for (const b of $("logFilter").children) b.classList.toggle("on", b.dataset.f === f);
  renderLog();
};

// ---------------- 저장 / 불러오기 / 게시 ----------------
function snapshot() {
  return {
    name: world.name, map: world.map,
    casts: agents.map((a) => ({ ...a.cast, x: Math.round(a.x), y: Math.round(a.y) })),
  };
}
function loadWorld(data, source) {
  if (!data || !data.map || !Array.isArray(data.map.tiles) || data.map.tiles.length !== 24 * 16) throw new Error("지도 정보가 없어요");
  world = { name: String(data.name || "이름 없는 월드").slice(0, 30), map: { w: 24, h: 16, tiles: data.map.tiles.map((t) => (TILES[t] ? t : 0)) } };
  agents = []; selected = null;
  for (const c of (data.casts || []).slice(0, MAX_CAST)) {
    const cast = normalizeCast(c);
    if (!cast) continue;
    const ok = Number.isInteger(c.x) && Number.isInteger(c.y) && walkable(c.x, c.y);
    const spot = ok ? { x: c.x, y: c.y } : nearestFreeTile(11, 8);
    if (spot) addAgent(cast, spot.x, spot.y, true);
  }
  $("worldName").value = world.name;
  log("sys", `${source}: ${world.name} (${agents.length}명)`);
  changed();
  renderSelected();
}
function changed() {
  dirty = true;
  renderCastList();
  updateStatus();
}
function saveLocal() {
  try { localStorage.setItem("dotStudio", JSON.stringify(snapshot())); } catch { /* 무시 */ }
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.style.opacity = 1;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.style.opacity = 0), 2000);
}

function setPaint(on) {
  paintMode = on;
  if (on) movePicking = false;
  $("paintBtn").classList.toggle("on", on);
  $("brushes").hidden = !on;
  updateStatus();
}
function renderBrushes() {
  const box = $("brushes");
  box.innerHTML = "";
  for (const t of TILES) {
    const b = document.createElement("button");
    b.className = t.id === brush ? "on" : "";
    const i = document.createElement("i"); i.style.background = t.mini;
    b.append(i, document.createTextNode(t.name + (t.walk ? "" : " (막힘)")));
    b.onclick = () => { brush = t.id; renderBrushes(); updateStatus(); };
    box.appendChild(b);
  }
}

$("cmdTalk").onclick = cmdTalk;
$("cmdMove").onclick = cmdMove;
$("cmdRest").onclick = cmdRest;
$("cmdUndo").onclick = cmdUndo;
$("cmdRemove").onclick = () => selected && removeAgent(selected);
$("paintBtn").onclick = () => setPaint(!paintMode);
$("worldName").oninput = () => { world.name = $("worldName").value.trim() || "이름 없는 월드"; changed(); };
$("resetBtn").onclick = () => {
  if (!confirm("지도와 캐릭터를 모두 처음 상태로 되돌릴까요?")) return;
  world = { name: "나의 첫 마을", map: defaultMap() };
  agents = []; selected = null;
  $("worldName").value = world.name;
  log("sys", "초기화했습니다");
  changed(); renderSelected();
};
$("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(snapshot(), null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "world-snapshot.json";
  a.click();
  log("sys", "월드 스냅샷을 내보냈습니다");
};
$("importBtn").onclick = () => $("importFile").click();
$("importFile").onchange = async () => {
  const file = $("importFile").files[0];
  if (!file) return;
  try { loadWorld(JSON.parse(await file.text()), "불러오기"); toast("불러왔어요"); }
  catch (e) { toast("파일을 읽을 수 없어요: " + e.message); }
  $("importFile").value = "";
};

$("publishBtn").onclick = () => {
  if (!agents.length) { toast("캐릭터를 한 명 이상 넣어 주세요"); return; }
  $("pubName").value = world.name;
  $("pubResult").innerHTML = "";
  $("pubGo").disabled = false;
  $("modal").hidden = false;
};
$("pubCancel").onclick = () => ($("modal").hidden = true);
$("pubForm").onsubmit = async (ev) => {
  ev.preventDefault();
  $("pubGo").disabled = true;
  const body = { ...snapshot(), name: $("pubName").value.trim(), author: $("pubAuthor").value.trim(), desc: $("pubDesc").value.trim() };
  body.casts = body.casts.map(({ id, ...rest }) => rest);
  const box = $("pubResult");
  try {
    const res = await fetch("/api/worlds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error);
    const link = location.origin + out.url;
    box.innerHTML = '✅ 게시 완료! 공개 링크: <br><a target="_blank"></a> <button type="button">링크 복사</button>';
    box.querySelector("a").href = link;
    box.querySelector("a").textContent = link;
    box.querySelector("button").onclick = () => navigator.clipboard.writeText(link).then(() => toast("복사했어요"));
    log("sys", `게시됨: ${link}`);
  } catch (e) {
    box.textContent = "❌ 게시하지 못했어요: " + e.message;
    $("pubGo").disabled = false;
  }
};

// ---------------- 시작 ----------------
async function start() {
  if (VIEW) {
    document.body.classList.add("view");
    try {
      const res = await fetch(`/api/worlds/${encodeURIComponent(VIEW)}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      loadWorld(data, "게시된 월드");
      $("title").textContent = "🌍 " + data.name;
      $("byline").textContent = `만든 사람: ${data.author}${data.desc ? " · " + data.desc : ""}`;
      document.title = data.name;
    } catch (e) {
      $("title").textContent = "🌍 월드를 찾을 수 없어요";
      log("sys", e.message);
    }
  } else {
    renderBrushes();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("dotStudio")); } catch { /* 처음 */ }
    try { if (saved) loadWorld(saved, "이어서 하기"); } catch { saved = null; }
    if (!saved) {
      log("sys", "스튜디오 시작");
      for (const c of SAMPLE_CASTS.slice(0, 2)) addAgent(c);
    }
  }
  renderCastList();
  renderSelected();
  requestAnimationFrame(loop);
}
start();
