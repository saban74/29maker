// 눈싸움 동네 평정기 — 온라인 크루 서버 (Cloudflare Pages Functions + D1)
// 데이터베이스 바인딩 이름: DB

const KIDS = ['jihun', 'sumin', 'minjae', 'doyun', 'harin', 'taeho', 'seoyeon', 'junho', 'yerin', 'kangmin', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
const FLAGS = ['red', 'blue', 'green', 'yellow', 'purple', 'black', 'pink', 'sky'];
const BAD = ['시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '좆', '개새', '새끼', '미친', 'fuck', 'shit', 'bitch', '섹스', 'sex'];
const HOUR = 3600e3;

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS crews (id TEXT PRIMARY KEY, token TEXT NOT NULL, name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      flag TEXT NOT NULL, members TEXT NOT NULL, power INTEGER NOT NULL DEFAULT 0, score INTEGER NOT NULL DEFAULT 1000,
      wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS battles (id INTEGER PRIMARY KEY AUTOINCREMENT, attacker TEXT NOT NULL, defender TEXT NOT NULL,
      winner TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 0, delta INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL)`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_crews_score ON crews(score DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_battles_att ON battles(attacker, created)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_battles_def ON battles(defender, created)'),
  ]);
  schemaReady = true;
}

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const fail = (msg, status = 400) => json({ error: msg }, status);

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function newToken() {
  const a = new Uint8Array(24); crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

function checkName(name) {
  if (typeof name !== 'string') return '크루 이름을 적어 주세요';
  const n = name.trim().replace(/\s+/g, ' ');
  if (n.length < 2 || n.length > 12) return '크루 이름은 2~12글자로 지어 주세요';
  if (!/^[가-힣a-zA-Z0-9 ]+$/.test(n)) return '크루 이름에는 한글, 영어, 숫자만 쓸 수 있어요';
  const low = n.toLowerCase().replace(/\s/g, '');
  if (BAD.some(w => low.includes(w))) return '쓸 수 없는 말이 들어 있어요';
  return null;
}

function checkMembers(m) {
  if (!Array.isArray(m) || m.length !== 5) return '멤버 5명이 필요해요';
  const seen = new Set();
  for (const x of m) {
    if (!x || typeof x !== 'object' || !KIDS.includes(x.k) || seen.has(x.k)) return '멤버 정보가 올바르지 않아요';
    seen.add(x.k);
    if (!int(x.lv, 1, 10) || !int(x.glove, 0, 4)) return '멤버 레벨이나 장갑 정보가 올바르지 않아요';
    if (!Array.isArray(x.g) || x.g.length !== 6 || !x.g.every(v => int(v, 0, 20))) return '능력치 정보가 올바르지 않아요';
    if (x.g.reduce((a, b) => a + b, 0) > (x.lv - 1) * 2) return '능력치가 레벨보다 높아요';
    const gr = x.gear || {};
    for (const s of ['hat', 'outer', 'shoe', 'scarf']) if (!int(gr[s], 0, 4)) return '장비 정보가 올바르지 않아요';
  }
  return null;
}
const clean = m => m.map(x => ({ k: x.k, lv: x.lv, g: x.g, glove: x.glove,
  gear: { hat: x.gear.hat, outer: x.gear.outer, shoe: x.gear.shoe, scarf: x.gear.scarf } }));
const powerOf = m => m.reduce((a, x) => a + x.lv * 10 + x.glove * 20 + (x.gear.hat + x.gear.outer + x.gear.shoe + x.gear.scarf) * 12, 0);

function pub(r) {
  return { id: r.id, name: r.name, flag: r.flag, members: JSON.parse(r.members), power: r.power,
    score: r.score, wins: r.wins, losses: r.losses };
}

async function auth(db, id, token) {
  if (typeof id !== 'string' || typeof token !== 'string') return null;
  const row = await db.prepare('SELECT * FROM crews WHERE id = ?').bind(id).first();
  if (!row || row.token !== await sha256(token)) return null;
  return row;
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > 8000) throw new Error('보낸 내용이 너무 커요');
  try { return JSON.parse(text || '{}'); } catch { throw new Error('보낸 내용을 읽을 수 없어요'); }
}

export async function onRequest({ request, env, params }) {
  if (!env.DB) return fail('서버에 데이터베이스(DB)가 연결되지 않았어요', 503);
  const db = env.DB;
  const path = (params.path || []).join('/');
  const method = request.method;
  try {
    await ensureSchema(db);

    if (path === 'ping') return json({ ok: true });

    // 크루 목록 / 순위
    if (path === 'crews' && method === 'GET') {
      const { results } = await db.prepare(
        'SELECT * FROM crews ORDER BY score DESC, wins DESC, created ASC LIMIT 50').all();
      return json({ crews: results.map((r, i) => ({ ...pub(r), rank: i + 1 })) });
    }

    // 크루 하나
    if (path.startsWith('crew/') && method === 'GET') {
      const id = path.slice(5);
      const r = await db.prepare('SELECT * FROM crews WHERE id = ?').bind(id).first();
      if (!r) return fail('크루를 찾을 수 없어요', 404);
      const { n } = await db.prepare('SELECT COUNT(*) AS n FROM crews WHERE score > ?').bind(r.score).first();
      return json({ crew: { ...pub(r), rank: n + 1 } });
    }

    // 크루 만들기 / 고치기
    if (path === 'crew' && method === 'POST') {
      const b = await readBody(request);
      const nameErr = checkName(b.name); if (nameErr) return fail(nameErr);
      if (!FLAGS.includes(b.flag)) return fail('깃발 색을 골라 주세요');
      const memErr = checkMembers(b.members); if (memErr) return fail(memErr);
      const name = b.name.trim().replace(/\s+/g, ' '), members = clean(b.members), power = powerOf(members), now = Date.now();
      if (b.id) {
        const me = await auth(db, b.id, b.token); if (!me) return fail('내 크루 확인에 실패했어요', 403);
        try {
          await db.prepare('UPDATE crews SET name = ?, flag = ?, members = ?, power = ?, updated = ? WHERE id = ?')
            .bind(name, b.flag, JSON.stringify(members), power, now, me.id).run();
        } catch (e) { return fail('이미 있는 크루 이름이에요', 409); }
        return json({ id: me.id });
      }
      const id = crypto.randomUUID(), token = newToken();
      try {
        await db.prepare('INSERT INTO crews (id, token, name, flag, members, power, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, await sha256(token), name, b.flag, JSON.stringify(members), power, now, now).run();
      } catch (e) { return fail('이미 있는 크루 이름이에요', 409); }
      return json({ id, token });
    }

    // 결투 결과
    if (path === 'battle' && method === 'POST') {
      const b = await readBody(request);
      const me = await auth(db, b.id, b.token); if (!me) return fail('내 크루 확인에 실패했어요', 403);
      if (typeof b.defender !== 'string' || b.defender === me.id) return fail('상대 크루가 올바르지 않아요');
      if (typeof b.win !== 'boolean' || !int(b.hits, 0, 999)) return fail('결과 정보가 올바르지 않아요');
      const def = await db.prepare('SELECT * FROM crews WHERE id = ?').bind(b.defender).first();
      if (!def) return fail('상대 크루를 찾을 수 없어요', 404);
      const now = Date.now();
      const recent = await db.prepare('SELECT COUNT(*) AS n FROM battles WHERE attacker = ? AND created > ?').bind(me.id, now - HOUR).first();
      if (recent.n >= 40) return fail('한 시간에 40번까지만 결투할 수 있어요. 잠시 쉬었다 와요!', 429);
      const same = await db.prepare('SELECT COUNT(*) AS n FROM battles WHERE attacker = ? AND defender = ? AND created > ?')
        .bind(me.id, def.id, now - 3 * 60e3).first();
      if (same.n > 0) return fail('같은 크루와는 3분 뒤에 다시 결투할 수 있어요', 429);
      const exp = 1 / (1 + Math.pow(10, (def.score - me.score) / 400));
      const delta = Math.round(32 * ((b.win ? 1 : 0) - exp));
      const myScore = Math.max(0, me.score + delta), defScore = Math.max(0, def.score - delta);
      await db.batch([
        db.prepare('UPDATE crews SET score = ?, wins = wins + ?, losses = losses + ? WHERE id = ?')
          .bind(myScore, b.win ? 1 : 0, b.win ? 0 : 1, me.id),
        db.prepare('UPDATE crews SET score = ?, wins = wins + ?, losses = losses + ? WHERE id = ?')
          .bind(defScore, b.win ? 0 : 1, b.win ? 1 : 0, def.id),
        db.prepare('INSERT INTO battles (attacker, defender, winner, hits, delta, created) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(me.id, def.id, b.win ? me.id : def.id, b.hits, delta, now),
      ]);
      return json({ delta, score: myScore, before: me.score, defScore });
    }

    // 결투 기록
    if (path.startsWith('log/') && method === 'GET') {
      const id = path.slice(4);
      const { results } = await db.prepare(
        `SELECT b.attacker, b.defender, b.winner, b.delta, b.created, a.name AS aname, a.flag AS aflag, d.name AS dname, d.flag AS dflag
         FROM battles b LEFT JOIN crews a ON a.id = b.attacker LEFT JOIN crews d ON d.id = b.defender
         WHERE b.attacker = ? OR b.defender = ? ORDER BY b.created DESC LIMIT 20`).bind(id, id).all();
      return json({ log: results });
    }

    return fail('없는 주소예요', 404);
  } catch (e) {
    return fail(e.message || '서버 오류', 500);
  }
}
