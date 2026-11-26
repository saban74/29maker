// =============================================================
//  함께 만드는 세상 - 화면(브라우저) 쪽 코드
//  서버와 실시간으로 연결되어 세상을 그리고, 내가 한 행동을 서버에 보냅니다.
// =============================================================
const TILE = 32;
const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");

let ws = null;
let myId = null;
let world = null;
let items = {};
let players = new Map();
let selected = null; // 지금 고른 아이템 id
let mouse = { x: -1, y: -1 };
let cam = { x: 0, y: 0 };

// ---------- 화면 크기 ----------
function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
addEventListener("resize", resize);
resize();

// ---------- 접속 ----------
document.getElementById("joinForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  document.getElementById("join").style.display = "none";
  connect(name);
});

function connect(name) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}`);
  ws.onopen = () => { setStatus("접속됨"); ws.send(JSON.stringify({ t: "join", name })); };
  ws.onclose = () => setStatus("연결이 끊어졌습니다 — 새로고침 해 주세요");
  ws.onmessage = (ev) => handle(JSON.parse(ev.data));
}
const send = (m) => ws && ws.readyState === 1 && ws.send(JSON.stringify(m));
const setStatus = (s) => (document.getElementById("status").textContent = s);

function handle(m) {
  if (m.t === "welcome") {
    myId = m.id;
    world = m.world;
    players = new Map(m.players.map((p) => [p.id, p]));
    setItems(m.items);
    updateStatus();
  } else if (m.t === "items") {
    setItems(m.items);
    addChat("알림", "아이템 목록이 새로 바뀌었습니다");
  } else if (m.t === "tile") {
    const i = m.y * world.w + m.x;
    world.ground[i] = m.ground;
    world.objects[i] = m.object;
  } else if (m.t === "player") {
    players.set(m.p.id, m.p);
    updateStatus();
  } else if (m.t === "leave") {
    players.delete(m.id);
    updateStatus();
  } else if (m.t === "chat") {
    addChat(m.name, m.text);
  }
}
const updateStatus = () => setStatus(`접속자 ${players.size}명`);

// ---------- 아이템 칸(hotbar) ----------
function setItems(next) {
  items = next;
  if (!items[selected]) selected = Object.keys(items)[0];
  const bar = document.getElementById("hotbar");
  bar.innerHTML = "";
  Object.values(items).forEach((it, n) => {
    const d = document.createElement("div");
    d.className = "slot" + (it.id === selected ? " on" : "");
    d.title = `${it.name}${it.author ? " (만든 사람: " + it.author + ")" : ""}`;
    d.innerHTML = `<span class="sw"></span><span></span>`;
    const sw = d.firstChild;
    sw.style.background = it.color;
    sw.textContent = it.emoji || "";
    d.lastChild.textContent = it.name;
    d.onclick = () => select(it.id);
    if (n < 9) d.dataset.key = n + 1;
    bar.appendChild(d);
  });
}
function select(id) {
  selected = id;
  [...document.querySelectorAll(".slot")].forEach((el, n) => el.classList.toggle("on", Object.keys(items)[n] === id));
}

// ---------- 채팅 ----------
function addChat(name, text) {
  const log = document.getElementById("log");
  const d = document.createElement("div");
  const b = document.createElement("b");
  b.textContent = name + ": ";
  if (name === "알림") b.style.color = "#ffe082";
  d.append(b, document.createTextNode(text));
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}
const say = document.getElementById("say");
say.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    send({ t: "chat", text: say.value });
    say.value = "";
    say.blur();
  }
  e.stopPropagation();
});

// ---------- 키보드: 이동 / 숫자키 ----------
const DIRS = { w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0], arrowup: [0, -1], arrowleft: [-1, 0], arrowdown: [0, 1], arrowright: [1, 0] };
addEventListener("keydown", (e) => {
  if (!world) return;
  const k = e.key.toLowerCase();
  if (k === "enter") { say.focus(); e.preventDefault(); return; }
  if (/^[1-9]$/.test(k)) { const id = Object.keys(items)[Number(k) - 1]; if (id) select(id); return; }
  const dir = DIRS[k];
  if (!dir) return;
  e.preventDefault();
  const me = players.get(myId);
  if (me) send({ t: "move", x: me.x + dir[0], y: me.y + dir[1] });
});

// ---------- 마우스: 놓기 / 지우기 ----------
function tileAt(ev) {
  return { x: Math.floor((ev.clientX + cam.x) / TILE), y: Math.floor((ev.clientY + cam.y) / TILE) };
}
canvas.addEventListener("mousemove", (ev) => (mouse = tileAt(ev)));
canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
let painting = null;
canvas.addEventListener("mousedown", (ev) => { painting = ev.button === 2 ? null : selected; paint(ev); canvas.onmousemove = paint; });
addEventListener("mouseup", () => (canvas.onmousemove = null));
let lastPaint = "";
function paint(ev) {
  if (!world) return;
  const t = tileAt(ev);
  const key = `${t.x},${t.y},${painting}`;
  if (key === lastPaint) return;
  lastPaint = key;
  send({ t: "set", x: t.x, y: t.y, item: painting });
}

// ---------- 그리기 ----------
function draw() {
  requestAnimationFrame(draw);
  const W = innerWidth, H = innerHeight;
  ctx.fillStyle = "#1b2a1b";
  ctx.fillRect(0, 0, W, H);
  if (!world) return;

  const me = players.get(myId);
  if (me) {
    // 카메라가 부드럽게 나를 따라옴
    cam.x += (me.x * TILE + TILE / 2 - W / 2 - cam.x) * 0.2;
    cam.y += (me.y * TILE + TILE / 2 - H / 2 - cam.y) * 0.2;
  }
  const x0 = Math.max(0, Math.floor(cam.x / TILE)), y0 = Math.max(0, Math.floor(cam.y / TILE));
  const x1 = Math.min(world.w, Math.ceil((cam.x + W) / TILE)), y1 = Math.min(world.h, Math.ceil((cam.y + H) / TILE));

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * world.w + x;
      const sx = x * TILE - cam.x, sy = y * TILE - cam.y;
      const g = items[world.ground[i]];
      ctx.fillStyle = g ? g.color : "#555";
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.strokeStyle = "rgba(0,0,0,.06)";
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
      const o = world.objects[i] && items[world.objects[i]];
      if (o) {
        if (o.emoji) {
          ctx.font = `${TILE - 6}px serif`;
          ctx.fillText(o.emoji, sx + TILE / 2, sy + TILE / 2 + 1);
        } else {
          ctx.fillStyle = o.color;
          ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
          ctx.fillStyle = "rgba(0,0,0,.18)";
          ctx.fillRect(sx + 2, sy + TILE - 8, TILE - 4, 6);
        }
      } else if (world.objects[i]) {
        // 아이템 파일이 지워진 물건은 물음표로 표시
        ctx.fillStyle = "#000"; ctx.font = "16px sans-serif"; ctx.fillText("?", sx + TILE / 2, sy + TILE / 2);
      }
    }
  }

  // 세상 테두리
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.strokeRect(-cam.x, -cam.y, world.w * TILE, world.h * TILE);
  ctx.lineWidth = 1;

  // 마우스가 가리키는 칸
  if (mouse.x >= 0) {
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(mouse.x * TILE - cam.x + 1, mouse.y * TILE - cam.y + 1, TILE - 2, TILE - 2);
  }

  // 사람들
  for (const p of players.values()) {
    const sx = p.x * TILE - cam.x + TILE / 2, sy = p.y * TILE - cam.y + TILE / 2;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(sx, sy, TILE * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = p.id === myId ? "#fff" : "rgba(0,0,0,.5)";
    ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "#000"; ctx.fillText(p.name, sx + 1, sy - TILE * 0.62 + 1);
    ctx.fillStyle = "#fff"; ctx.fillText(p.name, sx, sy - TILE * 0.62);
  }
}
draw();
