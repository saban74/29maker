// 라운드 저장·공유 담당
// - Supabase 설정이 있으면: 서버에 저장하고 4명 폰에 실시간으로 전달
// - 없으면: 이 폰(브라우저)에만 저장 (같은 폰의 다른 탭끼리는 동기화)
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const isShared = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// 참여 코드: 헷갈리는 글자(0,O,1,I) 제외한 6자리
export function newCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

let clientPromise = null;
function client() {
  if (!clientPromise) {
    clientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm").then((m) =>
      m.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    );
  }
  return clientPromise;
}

// ---------- 혼자 모드 (localStorage) ----------
const LS = {
  key: (code) => "golf.round." + code,
  read(code) {
    try { return JSON.parse(localStorage.getItem(this.key(code))); } catch { return null; }
  },
  write(code, v) {
    try { localStorage.setItem(this.key(code), JSON.stringify(v)); } catch {}
  },
};
const channel = "BroadcastChannel" in window ? new BroadcastChannel("golf-sync") : null;

// scores 모양: { "홀번호-사람번호": 타수 }  예) {"0-2": 5} = 1번 홀, 3번째 사람, 5타

export async function createRound(setup) {
  const code = newCode();
  if (isShared) {
    const sb = await client();
    const { error } = await sb.from("rounds").insert({ code, setup });
    if (error) throw new Error("라운드 만들기 실패: " + error.message);
  } else {
    LS.write(code, { setup, scores: {}, events: {} });
  }
  return code;
}

export async function loadRound(code) {
  code = code.trim().toUpperCase();
  if (isShared) {
    const sb = await client();
    const { data: round, error } = await sb.from("rounds").select("setup").eq("code", code).maybeSingle();
    if (error) throw new Error(error.message);
    if (!round) return null;
    const { data: rows } = await sb.from("scores").select("hole,player,strokes").eq("round_code", code);
    const scores = {};
    (rows || []).forEach((r) => (scores[r.hole + "-" + r.player] = r.strokes));
    const { data: evs } = await sb.from("events").select("hole,player,kind,count").eq("round_code", code);
    const events = {};
    (evs || []).forEach((r) => (events[`${r.hole}-${r.player}-${r.kind}`] = r.count));
    return { code, setup: round.setup, scores, events };
  }
  const v = LS.read(code);
  return v ? { code, events: {}, ...v } : null;
}

// 한 칸(한 사람의 한 홀 타수)만 저장 → 4명이 동시에 입력해도 서로 덮어쓰지 않음
export async function saveScore(code, hole, player, strokes) {
  if (isShared) {
    const sb = await client();
    if (strokes == null) {
      await sb.from("scores").delete().match({ round_code: code, hole, player });
    } else {
      const { error } = await sb
        .from("scores")
        .upsert({ round_code: code, hole, player, strokes, updated_at: new Date().toISOString() });
      if (error) throw new Error("저장 실패: " + error.message);
    }
    return;
  }
  const v = LS.read(code);
  if (strokes == null) delete v.scores[hole + "-" + player];
  else v.scores[hole + "-" + player] = strokes;
  LS.write(code, v);
  channel && channel.postMessage({ type: "score", code, hole, player, strokes });
}

// 벌금·보너스 (OB, 해저드, 니어리스트, 롱기스트) 한 칸 저장. count 0 이면 지움
export async function saveEvent(code, hole, player, kind, count) {
  if (isShared) {
    const sb = await client();
    const q = count
      ? sb.from("events").upsert({ round_code: code, hole, player, kind, count })
      : sb.from("events").delete().match({ round_code: code, hole, player, kind });
    const { error } = await q;
    if (error) throw new Error("저장 실패: " + error.message);
    return;
  }
  const v = LS.read(code);
  v.events = v.events || {};
  const k = `${hole}-${player}-${kind}`;
  if (count) v.events[k] = count; else delete v.events[k];
  LS.write(code, v);
  channel && channel.postMessage({ type: "event", code, hole, player, kind, count });
}

// 라운드 도중 설정 수정 (이름, 핸디, 내기 규칙)
export async function updateSetup(code, setup) {
  if (isShared) {
    const sb = await client();
    const { error } = await sb.from("rounds").update({ setup }).eq("code", code);
    if (error) throw new Error("수정 실패: " + error.message);
    return;
  }
  const v = LS.read(code);
  v.setup = setup;
  LS.write(code, v);
  channel && channel.postMessage({ type: "setup", code, setup });
}

// 다른 사람이 입력한 내용 받기. on = { score(h,p,s), event(h,p,kind,count), setup(setup) }
// 반환값을 호출하면 구독 해제.
export function subscribeRound(code, on) {
  if (isShared) {
    let ch;
    client().then((sb) => {
      const f = "round_code=eq." + code;
      // 추가·수정은 라운드 코드로 걸러 받고, 삭제는 Supabase가 거르기를 지원하지 않아 전부 받은 뒤 여기서 거름
      // (삭제 알림에는 기본 키만 오는데, 기본 키에 round_code 가 들어 있어 거를 수 있음)
      const mine = (row) => row && row.round_code === code;
      ch = sb
        .channel("round-" + code)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "scores", filter: f }, (p) => on.score(p.new.hole, p.new.player, p.new.strokes))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "scores", filter: f }, (p) => on.score(p.new.hole, p.new.player, p.new.strokes))
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "scores" }, (p) => mine(p.old) && on.score(p.old.hole, p.old.player, null))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "events", filter: f }, (p) => on.event(p.new.hole, p.new.player, p.new.kind, p.new.count))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events", filter: f }, (p) => on.event(p.new.hole, p.new.player, p.new.kind, p.new.count))
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "events" }, (p) => mine(p.old) && on.event(p.old.hole, p.old.player, p.old.kind, 0))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rounds", filter: "code=eq." + code }, (p) => on.setup(p.new.setup))
        .subscribe();
    });
    return () => ch && ch.unsubscribe();
  }
  if (!channel) return () => {};
  const h = ({ data: d }) => {
    if (d.code !== code) return;
    if (d.type === "score") on.score(d.hole, d.player, d.strokes);
    else if (d.type === "event") on.event(d.hole, d.player, d.kind, d.count);
    else if (d.type === "setup") on.setup(d.setup);
  };
  channel.addEventListener("message", h);
  return () => channel.removeEventListener("message", h);
}

// 골프장 목록: 앱에 같이 들어있는 courses/ 폴더 + (공유 모드면) 서버의 courses 표
export async function loadCourses() {
  const list = [];
  try {
    const idx = await fetch("courses/index.json").then((r) => r.json());
    for (const file of idx) {
      try { list.push(await fetch("courses/" + file).then((r) => r.json())); } catch {}
    }
  } catch {}
  if (isShared) {
    try {
      const sb = await client();
      const { data } = await sb.from("courses").select("data");
      (data || []).forEach((r) => { if (!list.some((c) => c.id === r.data.id)) list.push(r.data); });
    } catch {}
  }
  return list;
}
