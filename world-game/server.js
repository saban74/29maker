// =============================================================
//  함께 만드는 세상 - 서버
//  - 모든 접속자가 같은 "세상(world)"을 봅니다.
//  - 누군가 땅에 무언가를 놓으면, 서버가 모두에게 알려 줍니다.
//  - 세상은 data/world.json 에 자동 저장되어, 서버를 껐다 켜도 남습니다.
//  - 아이템은 items/ 폴더의 JSON 파일 하나 = 아이템 하나 입니다.
//    파일을 추가/수정하면 서버를 끄지 않아도 바로 게임에 반영됩니다.
// =============================================================
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DEV_KEY = process.env.DEV_KEY || ""; // 비어 있으면 누구나 아이템 편집기 사용 가능
const WORLD_W = 80;
const WORLD_H = 80;
const ITEMS_DIR = path.join(ROOT, "items");
const WORLD_FILE = path.join(ROOT, "data", "world.json");
const PUBLIC_DIR = path.join(ROOT, "public");

// ---------------- 아이템 ----------------
let items = {};

function validateItem(it) {
  if (!it || typeof it !== "object") return "아이템 정보가 없습니다";
  if (!/^[a-z0-9_-]{1,30}$/.test(it.id || "")) return "id 는 영어 소문자/숫자/-/_ 로 1~30자";
  if (typeof it.name !== "string" || !it.name.trim() || it.name.length > 20) return "name 은 1~20자";
  if (!/^#[0-9a-fA-F]{6}$/.test(it.color || "")) return "color 는 #RRGGBB 형식";
  if (it.emoji !== undefined && (typeof it.emoji !== "string" || [...it.emoji].length > 4)) return "emoji 는 4글자 이하";
  if (!["ground", "object"].includes(it.layer)) return "layer 는 ground 또는 object";
  if (typeof it.solid !== "boolean") return "solid 는 true 또는 false";
  return null;
}

function cleanItem(it) {
  const out = {
    id: it.id,
    name: it.name.trim(),
    color: it.color,
    layer: it.layer,
    solid: it.solid,
    author: typeof it.author === "string" ? it.author.slice(0, 20) : "",
  };
  if (it.emoji) out.emoji = it.emoji;
  return out;
}

function loadItems() {
  const next = {};
  // 바닥 종류가 먼저, 그 다음 물건이 오도록 정렬
  const files = fs.readdirSync(ITEMS_DIR).sort();
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const it = JSON.parse(fs.readFileSync(path.join(ITEMS_DIR, file), "utf8"));
      const err = validateItem(it);
      if (err) { console.warn(`[아이템] ${file} 건너뜀: ${err}`); continue; }
      next[it.id] = cleanItem(it);
    } catch (e) {
      console.warn(`[아이템] ${file} 읽기 실패: ${e.message}`);
    }
  }
  if (!next.grass) next.grass = { id: "grass", name: "풀밭", color: "#7cbf5a", layer: "ground", solid: false, author: "기본" };
  const sorted = Object.values(next).sort((a, b) => (a.layer === b.layer ? 0 : a.layer === "ground" ? -1 : 1));
  items = Object.fromEntries(sorted.map((it) => [it.id, it]));
  console.log(`[아이템] ${Object.keys(items).length}개 불러옴`);
}

// ---------------- 세상(world) ----------------
// ground: 바닥 (풀, 흙, 물...)  /  objects: 바닥 위에 놓인 것 (벽, 나무, 집...)
let world = {
  w: WORLD_W,
  h: WORLD_H,
  ground: new Array(WORLD_W * WORLD_H).fill("grass"),
  objects: new Array(WORLD_W * WORLD_H).fill(null),
};
let dirty = false;

function loadWorld() {
  try {
    const saved = JSON.parse(fs.readFileSync(WORLD_FILE, "utf8"));
    if (saved.w === WORLD_W && saved.h === WORLD_H) {
      world = saved;
      console.log("[세상] 저장된 세상을 불러왔습니다");
      return;
    }
  } catch { /* 처음 시작: 빈 땅 */ }
  console.log("[세상] 새로운 빈 땅을 만들었습니다");
}

function saveWorld() {
  if (!dirty) return;
  fs.mkdirSync(path.dirname(WORLD_FILE), { recursive: true });
  fs.writeFileSync(WORLD_FILE + ".tmp", JSON.stringify(world));
  fs.renameSync(WORLD_FILE + ".tmp", WORLD_FILE);
  dirty = false;
}

const idx = (x, y) => y * WORLD_W + x;
const inBounds = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H;
function isBlocked(x, y) {
  const i = idx(x, y);
  const g = items[world.ground[i]];
  const o = world.objects[i] && items[world.objects[i]];
  return (g && g.solid) || (o && o.solid);
}

// ---------------- 웹 서버 (화면 파일 + 아이템 편집 API) ----------------
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };

function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": MIME[".json"] });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/items" && req.method === "GET") return sendJson(res, 200, items);

  // 아이템 편집기에서 새 아이템 저장 → items/<id>.json 파일로 만들어짐
  if (url.pathname === "/api/items" && req.method === "POST") {
    if (DEV_KEY && req.headers["x-dev-key"] !== DEV_KEY) return sendJson(res, 403, { error: "개발자 키가 맞지 않습니다" });
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 10_000) req.destroy(); });
    req.on("end", () => {
      let it;
      try { it = JSON.parse(body); } catch { return sendJson(res, 400, { error: "JSON 형식이 아닙니다" }); }
      const err = validateItem(it);
      if (err) return sendJson(res, 400, { error: err });
      const clean = cleanItem(it);
      fs.writeFileSync(path.join(ITEMS_DIR, clean.id + ".json"), JSON.stringify(clean, null, 2) + "\n");
      reloadItemsAndBroadcast();
      sendJson(res, 200, { ok: true, item: clean });
    });
    return;
  }

  // 정적 파일 (public/ 폴더)
  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  const full = path.normalize(path.join(PUBLIC_DIR, file));
  if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream" });
    res.end(data);
  });
});

// ---------------- 실시간 접속 (WebSocket) ----------------
const wss = new WebSocketServer({ server });
const players = new Map(); // ws -> player
let nextId = 1;
const COLORS = ["#e53935", "#8e24aa", "#3949ab", "#00897b", "#f4511e", "#6d4c41", "#d81b60", "#1e88e5"];

function broadcast(msg, except) {
  const s = JSON.stringify(msg);
  for (const c of wss.clients) if (c !== except && c.readyState === 1) c.send(s);
}
const publicPlayer = (p) => ({ id: p.id, name: p.name, color: p.color, x: p.x, y: p.y });

function reloadItemsAndBroadcast() {
  loadItems();
  broadcast({ t: "items", items });
}

wss.on("connection", (ws) => {
  let player = null;
  let lastAction = 0;

  ws.on("message", (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const now = Date.now();

    if (m.t === "join" && !player) {
      const name = String(m.name || "").trim().slice(0, 12) || `손님${nextId}`;
      player = { id: nextId++, name, color: COLORS[nextId % COLORS.length], x: WORLD_W >> 1, y: WORLD_H >> 1 };
      players.set(ws, player);
      ws.send(JSON.stringify({ t: "welcome", id: player.id, world, items, players: [...players.values()].map(publicPlayer) }));
      broadcast({ t: "player", p: publicPlayer(player) }, ws);
      broadcast({ t: "chat", name: "알림", text: `${name} 님이 들어왔습니다` });
      return;
    }
    if (!player) return;

    // 이동/놓기가 너무 빠르면 무시 (도배 방지). 채팅은 따로 처리.
    if (m.t === "move" || m.t === "set") {
      if (now - lastAction < 40) return;
      lastAction = now;
    }

    if (m.t === "move") {
      const { x, y } = m;
      if (!inBounds(x, y)) return;
      if (Math.abs(x - player.x) + Math.abs(y - player.y) !== 1) return; // 한 칸씩만
      if (isBlocked(x, y)) return;
      player.x = x; player.y = y;
      broadcast({ t: "player", p: publicPlayer(player) });
    }

    if (m.t === "set") {
      const { x, y, item } = m;
      if (!inBounds(x, y)) return;
      if (Math.abs(x - player.x) > 6 || Math.abs(y - player.y) > 6) return; // 내 주변만 만들 수 있음
      const i = idx(x, y);
      if (item === null) {
        // 지우기: 물건이 있으면 물건을, 없으면 바닥을 풀밭으로
        if (world.objects[i]) world.objects[i] = null;
        else world.ground[i] = "grass";
      } else {
        const it = items[item];
        if (!it) return;
        if (it.layer === "ground") world.ground[i] = it.id;
        else world.objects[i] = it.id;
      }
      dirty = true;
      broadcast({ t: "tile", x, y, ground: world.ground[i], object: world.objects[i] });
    }

    if (m.t === "chat") {
      const text = String(m.text || "").trim().slice(0, 200);
      if (text) broadcast({ t: "chat", name: player.name, text });
    }
  });

  ws.on("close", () => {
    if (!player) return;
    players.delete(ws);
    broadcast({ t: "leave", id: player.id });
    broadcast({ t: "chat", name: "알림", text: `${player.name} 님이 나갔습니다` });
  });
});

// ---------------- 시작 ----------------
loadItems();
loadWorld();

// items/ 폴더가 바뀌면 자동으로 다시 불러오기 (공동 개발자가 파일을 추가했을 때)
let reloadTimer = null;
fs.watch(ITEMS_DIR, () => {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(reloadItemsAndBroadcast, 300);
});

setInterval(saveWorld, 5000);
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => { saveWorld(); console.log("\n[세상] 저장하고 종료합니다"); process.exit(0); });
}

server.listen(PORT, () => {
  console.log(`\n  게임 주소:       http://localhost:${PORT}/`);
  console.log(`  아이템 편집기:   http://localhost:${PORT}/editor.html`);
  if (!DEV_KEY) console.log("  (DEV_KEY 가 없어서 누구나 아이템을 추가할 수 있습니다)\n");
});
