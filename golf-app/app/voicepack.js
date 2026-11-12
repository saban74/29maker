// 음성 안내: 휴대폰 기본 음성 또는 "음성팩"(짧은 녹음 조각을 이어 붙이기)
// 음성팩 폴더: app/voices/<이름>/pack.json + 조각 파일들
// pack.json 모양: { "name": "표시 이름", "source": "만든 곳·라이선스", "files": { "hole1": "hole1.mp3", ... } }

// 클럽 이름 ↔ 조각 파일 이름
export const CLUB_KEYS_LIST = [
  ["c_driver", "드라이버"], ["c_3w", "3번 우드"], ["c_5w", "5번 우드"], ["c_ut", "유틸리티"],
  ["c_4i", "4번 아이언"], ["c_5i", "5번 아이언"], ["c_6i", "6번 아이언"], ["c_7i", "7번 아이언"],
  ["c_8i", "8번 아이언"], ["c_9i", "9번 아이언"], ["c_pw", "피칭 웨지"], ["c_aw", "어프로치 웨지"],
  ["c_sw", "샌드 웨지"], ["c_lw", "로브 웨지"], ["c_putter", "퍼터"],
];

// 음성팩에 들어갈 조각 목록 (파일 이름 → 읽을 문장)
export const PHRASES = (() => {
  const p = {};
  const ko = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  for (let i = 1; i <= 18; i++) p["hole" + i] = `${i}번 홀`;
  p.par3 = "파 쓰리"; p.par4 = "파 포"; p.par5 = "파 파이브"; p.par6 = "파 식스";
  p.to_center = "그린 중앙까지"; p.to_front = "그린 앞까지"; p.to_back = "그린 뒤까지";
  p.front = "앞"; p.back = "뒤";
  for (let i = 1; i <= 4; i++) p["h" + i] = (i === 1 ? "" : ko[i]) + "백";   // 백, 이백, 삼백, 사백
  for (let i = 1; i <= 9; i++) p["t" + i] = (i === 1 ? "" : ko[i]) + "십";   // 십, 이십 … 구십
  for (let i = 1; i <= 9; i++) p["o" + i] = ko[i];                            // 일 … 구
  p.meter = "미터";
  p.club = "추천 클럽";
  CLUB_KEYS_LIST.forEach(([key, name]) => (p[key] = name));
  return p;
})();


// 1~499 숫자를 조각 이름으로: 153 → ["h1","t5","o3"] (백 오십 삼)
export function numberKeys(n) {
  n = Math.round(n);
  if (n < 1 || n > 499) return null;
  const out = [];
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
  if (h) out.push("h" + h);
  if (t) out.push("t" + t);
  if (o) out.push("o" + o);
  return out;
}

// 안내 내용 → 읽을 문장(기본 음성용)과 조각 목록(음성팩용)
// info: { holeNo, par, target: "center"|"front"|"back", dist, front, back, club }
export function buildAnnouncement(info) {
  const tKo = { center: "중앙", front: "앞", back: "뒤" }[info.target];
  const text = [`${info.holeNo}번 홀, 파${info.par}.`, `그린 ${tKo}까지 ${info.dist}미터.`];
  const keys = ["hole" + info.holeNo, "par" + info.par, "to_" + info.target, ...(numberKeys(info.dist) || []), "meter"];
  if (info.front != null && info.back != null) {
    text.push(`앞 ${info.front}, 뒤 ${info.back}.`);
    keys.push("front", ...(numberKeys(info.front) || []), "back", ...(numberKeys(info.back) || []));
  }
  if (info.club) {
    text.push(`추천 클럽, ${info.club}.`);
    const ck = CLUB_KEYS_LIST.find(([, name]) => name === info.club);
    if (ck) keys.push("club", ck[0]);
  }
  return { text: text.join(" "), keys };
}

// ---------- 재생 ----------
const packCache = {};
export async function loadPack(id) {
  if (!packCache[id]) {
    packCache[id] = fetch(`voices/${id}/pack.json`).then((r) => {
      if (!r.ok) throw new Error("음성팩을 찾지 못했어요");
      return r.json();
    });
  }
  return packCache[id];
}
export async function listPacks() {
  try { return await fetch("voices/index.json").then((r) => r.json()); } catch { return []; }
}

let playing = null;
// 조각들을 순서대로 재생. 하나라도 없으면 false (→ 기본 음성으로 대신 읽기)
export async function playPack(id, keys) {
  const pack = await loadPack(id);
  if (!keys.every((k) => pack.files[k])) return false;
  if (playing) playing.stop = true;
  const me = { stop: false };
  playing = me;
  const audios = keys.map((k) => { const a = new Audio(`voices/${id}/${pack.files[k]}`); a.preload = "auto"; return a; });
  for (const a of audios) {
    if (me.stop) break;
    await new Promise((res) => { a.onended = res; a.onerror = res; a.play().catch(res); });
  }
  return true;
}

// 휴대폰 기본 음성
export function koreanVoices() {
  if (!("speechSynthesis" in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang && v.lang.replace("_", "-").startsWith("ko"));
}
export function speakText(text, { voiceName, rate = 1 } = {}) {
  if (!("speechSynthesis" in window)) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = rate;
  const v = koreanVoices().find((x) => x.name === voiceName) || koreanVoices()[0];
  if (v) u.voice = v;
  speechSynthesis.speak(u);
  return true;
}

// 설정에 따라 안내 (설정: { type: "system"|"pack", voiceName, rate, pack })
export async function announce(info, settings = {}) {
  const { text, keys } = buildAnnouncement(info);
  if (settings.type === "pack" && settings.pack) {
    try { if (await playPack(settings.pack, keys)) return "pack"; } catch {}
  }
  speakText(text, settings);
  return "system";
}
