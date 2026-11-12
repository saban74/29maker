// 화면 담당: 처음 화면 → 라운드 만들기/참여 → 스코어·거리·정산
import { DEFAULT_RULES, roundResult, settle, won } from "./betting.js";
import { distanceM, watchMyPosition } from "./geo.js";
import * as sync from "./sync.js";
import { DEFAULT_CLUBS, recommendClub, canSpeak } from "./clubs.js";
import { announce, koreanVoices, listPacks } from "./voicepack.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const view = $("#view");

const state = { courses: [], round: null, me: null, tab: "score", hole: 0, stopGps: null, unsub: null, pos: null };

// ---------- 작은 도우미 ----------
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2200);
}
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
function remember(code, setup) {
  const list = store.get("golf.recent", []).filter((r) => r.code !== code);
  list.unshift({ code, name: setup.courseName, date: setup.createdAt, players: setup.players.join(", ") });
  store.set("golf.recent", list.slice(0, 10));
}
function setHeader(title, showBack) {
  $("#title").textContent = title;
  $("#back").hidden = !showBack;
  $("#mode").textContent = sync.isShared ? "4명 공유" : "혼자 모드";
}
function stopRoundListeners() {
  state.stopGps && state.stopGps(); state.stopGps = null;
  state.unsub && state.unsub(); state.unsub = null;
}

// ---------- 처음 화면 ----------
function showHome() {
  stopRoundListeners();
  history.replaceState(null, "", location.pathname);
  state.round = null;
  setHeader("골프 내기 정산", false);
  $("#tabs").hidden = true;
  const recent = store.get("golf.recent", []);
  view.innerHTML = `
    <div class="card">
      <h2>새 라운드</h2>
      <p class="muted">골프장·사람·내기 규칙을 정하면 참여 코드가 나와요. 코드를 동반자에게 보내면 같이 입력하고 볼 수 있어요.</p>
      <button class="btn" id="new">라운드 만들기</button>
    </div>
    <div class="card">
      <h2>코드로 참여하기</h2>
      <div class="row"><input id="code" placeholder="예) K7PQ2M" maxlength="6" autocapitalize="characters" style="text-transform:uppercase"></div>
      <button class="btn ghost" id="join">참여</button>
    </div>
    ${recent.length ? `<div class="card"><h2>최근 라운드</h2><ul class="recent">
      ${recent.map((r) => `<li><a href="?r=${esc(r.code)}" data-code="${esc(r.code)}">${esc(r.name)}<br><span class="muted">${esc(r.players)}</span></a>
      <span class="muted">${esc((r.date || "").slice(5, 10).replace("-", "/"))}</span></li>`).join("")}
    </ul></div>` : ""}
    <div class="card">
      <h2>내 클럽 거리</h2>
      <p class="muted">클럽별로 평소 보내는 거리를 넣어두면 거리 화면에서 추천 클럽을 알려줘요.</p>
      <button class="btn ghost" id="clubs">클럽 거리 입력</button>
    </div>
    <div class="card">
      <h2>음성 안내</h2>
      <p class="muted">목소리와 빠르기를 고르거나, 음성팩(내가 만든 목소리 파일)을 쓸 수 있어요.</p>
      <button class="btn ghost" id="voice">음성 설정</button>
    </div>
    <div class="card">
      <h2>골프장 파일</h2>
      <p class="muted">PC 관리 프로그램에서 만든 골프장 파일(.json)을 이 폰에 넣거나, 현장에서 찍은 그린 위치를 파일로 내보내 PC에서 다듬을 수 있어요.</p>
      <label class="btn ghost file-btn">골프장 파일 불러오기<input type="file" id="course-file" accept=".json,application/json" hidden></label>
      <button class="btn ghost" id="course-export">현장에서 찍은 그린 위치 내보내기</button>
    </div>
    ${sync.isShared ? "" : `<p class="muted">지금은 <b>혼자 모드</b>예요. 기록이 이 폰에만 저장돼요. 4명이 함께 보려면 README의 "4명 공유 켜기"를 해주세요.</p>`}
  `;
  $("#new").onclick = showSetup;
  $("#join").onclick = () => openRound($("#code").value);
  view.querySelectorAll(".recent a").forEach((a) => (a.onclick = (e) => { e.preventDefault(); openRound(a.dataset.code); }));
  $("#course-file").onchange = importCourse;
  $("#clubs").onclick = showClubs;
  $("#voice").onclick = showVoice;
  $("#course-export").onclick = exportMyGreens;
}

// ---------- 내 클럽 거리 ----------
const myClubs = () => store.get("golf.clubs", DEFAULT_CLUBS);
function showClubs() {
  setHeader("내 클럽 거리", true);
  view.innerHTML = `<div class="card"><p class="muted">평소 캐리 거리(미터)를 넣으세요. 안 쓰는 클럽은 비워두면 돼요.</p>
    ${myClubs().map((c, i) => `<div class="club-row"><span>${esc(c.name)}</span>
      <input type="number" inputmode="numeric" data-ci="${i}" value="${c.dist || ""}" placeholder="–"><span class="muted">m</span></div>`).join("")}
    </div><button class="btn" id="clubs-save">저장</button>`;
  $("#clubs-save").onclick = () => {
    const list = myClubs().map((c, i) => ({ ...c, dist: Math.max(0, parseInt(view.querySelector(`[data-ci="${i}"]`).value, 10) || 0) }));
    store.set("golf.clubs", list);
    toast("저장했어요");
    showHome();
  };
}

// ---------- 음성 설정 ----------
const voiceSettings = () => store.get("golf.voice", { type: "system", voiceName: "", rate: 1, pack: "" });
const SAMPLE = { holeNo: 3, par: 4, target: "center", dist: 152, front: 140, back: 165, club: "7번 아이언" };
async function showVoice() {
  setHeader("음성 설정", true);
  const v = voiceSettings();
  const packs = await listPacks();
  const render = () => {
    const voices = koreanVoices();
    view.innerHTML = `
      <div class="card">
        <label class="check"><input type="radio" name="vt" value="system" ${v.type !== "pack" ? "checked" : ""}> 휴대폰 기본 음성</label>
        <label>목소리</label>
        <select id="v-name">${voices.length ? voices.map((x) => `<option ${x.name === v.voiceName ? "selected" : ""}>${esc(x.name)}</option>`).join("")
          : `<option value="">기본 한국어 목소리</option>`}</select>
        <label>빠르기 <span id="v-rate-txt">${v.rate.toFixed(1)}배</span></label>
        <input id="v-rate" type="range" min="0.7" max="1.5" step="0.1" value="${v.rate}">
        <p class="muted">목소리 종류는 휴대폰마다 달라요. 휴대폰 설정 → 텍스트 음성 변환(TTS)에서 더 받을 수 있어요.</p>
      </div>
      <div class="card">
        <label class="check"><input type="radio" name="vt" value="pack" ${v.type === "pack" ? "checked" : ""} ${packs.length ? "" : "disabled"}> 음성팩</label>
        ${packs.length ? `<select id="v-pack">${packs.map((p) => `<option value="${esc(p.id)}" ${p.id === v.pack ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>`
          : `<p class="muted">아직 음성팩이 없어요. 만드는 법은 README의 "음성팩 만들기"를 보세요.</p>`}
      </div>
      <button class="btn ghost" id="v-test">🔊 미리 듣기</button>
      <button class="btn" id="v-save">저장</button>`;
    const read = () => ({
      type: view.querySelector('[name="vt"]:checked').value,
      voiceName: $("#v-name").value,
      rate: +$("#v-rate").value,
      pack: $("#v-pack") ? $("#v-pack").value : "",
    });
    $("#v-rate").oninput = () => ($("#v-rate-txt").textContent = (+$("#v-rate").value).toFixed(1) + "배");
    $("#v-test").onclick = () => announce(SAMPLE, read());
    $("#v-save").onclick = () => { store.set("golf.voice", read()); toast("저장했어요"); showHome(); };
  };
  render();
  // 목소리 목록은 늦게 도착하는 경우가 있어 한 번 더 그림
  if ("speechSynthesis" in window && !koreanVoices().length) speechSynthesis.onvoiceschanged = () => { if ($("#v-name")) render(); };
}

// ---------- 골프장 파일 ----------
function mergeLocalCourses() {
  store.get("golf.courses.local", []).forEach((c) => {
    const i = state.courses.findIndex((x) => x.id === c.id);
    if (i >= 0) state.courses[i] = c; else state.courses.push(c);
  });
}
async function importCourse(e) {
  const f = e.target.files[0]; if (!f) return;
  try {
    const club = JSON.parse(await f.text());
    if (!club.id || !club.name || !Array.isArray(club.courses)) throw 0;
    const list = store.get("golf.courses.local", []).filter((c) => c.id !== club.id);
    list.push(club);
    store.set("golf.courses.local", list);
    mergeLocalCourses();
    toast(`${club.name} 추가했어요`);
  } catch { toast("골프장 파일이 아니에요"); }
  e.target.value = "";
}
function exportMyGreens() {
  // 골프장 파일 + 이 폰에서 찍은 그린 위치를 합쳐서 내보냄 (PC 관리 프로그램에서 불러오기 가능)
  const done = state.courses.filter((club) => Object.keys(store.get(greenKey(club.id), {})).length);
  if (!done.length) return toast("아직 현장에서 찍은 그린 위치가 없어요");
  done.forEach((club) => {
    const mine = store.get(greenKey(club.id), {});
    const out = structuredClone(club);
    out.courses.forEach((c) => c.holes.forEach((h) => {
      const m = mine[`${c.name}|${h.no}`];
      if (m) h.green = { ...(h.green || {}), ...m };
    }));
    out.source = [out.source, "현장 GPS 측정"].filter(Boolean).join(", ");
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = club.id + ".json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

// ---------- 라운드 만들기 ----------
function showSetup() {
  setHeader("라운드 만들기", true);
  const r = DEFAULT_RULES;
  const courseOpts = state.courses.map((c, i) => `<option value="${i}">${esc(c.name)}</option>`).join("");
  view.innerHTML = `
    <div class="card">
      <h2>골프장</h2>
      <select id="club">${courseOpts || `<option value="">등록된 골프장이 없어요</option>`}</select>
      <div class="row">
        <div><label>전반 코스</label><select id="front"></select></div>
        <div><label>후반 코스</label><select id="back9"></select></div>
      </div>
    </div>
    <div class="card">
      <h2>함께 칠 사람</h2>
      ${[1, 2, 3, 4].map((n) => `<input class="pname" placeholder="${n}번 사람 이름${n > 2 ? " (비우면 빠짐)" : ""}" style="margin-bottom:8px">`).join("")}
    </div>
    <div class="card">
      <h2>내기 규칙</h2>
      <label>타당 금액 (1타 차이당)</label>
      <input id="unit" type="number" inputmode="numeric" step="500" value="${r.unit}">
      <div class="presets">${[[1000, "일장"], [2000, "이장"], [3000, "삼장"], [5000, "오장"], [10000, "만원"]]
        .map(([v, n]) => `<button type="button" data-unit="${v}">${n}<small>${v.toLocaleString("ko-KR")}</small></button>`).join("")}</div>
      <label class="check"><input type="checkbox" id="cap" ${r.capDoublePar ? "checked" : ""}> 양파(더블파) 이상은 더블파로 계산</label>
      <label>버디 보너스 (1명당, 이글은 2배, 0이면 없음)</label>
      <input id="birdie" type="number" inputmode="numeric" step="500" value="${r.birdieBonus}">
      <h2 style="margin-top:18px">배판 (다음 홀을 배로)</h2>
      <label class="check"><input type="checkbox" id="bp-birdie" ${r.baepan.onBirdie ? "checked" : ""}> 버디가 나오면</label>
      <label class="check"><input type="checkbox" id="bp-tie" ${r.baepan.onTie3 ? "checked" : ""}> 3명 이상 동타면</label>
      <label class="check"><input type="checkbox" id="bp-triple" ${r.baepan.onTriple ? "checked" : ""}> 누가 트리플보기 이상이면</label>
      <label>몇 배</label>
      <select id="bp-mult"><option value="2">2배</option><option value="3">3배</option></select>
      <h2 style="margin-top:18px">스킨스 (선택)</h2>
      <label class="check"><input type="checkbox" id="sk-on"> 스킨스도 함께 하기</label>
      <label>스킨 금액 (1명당)</label>
      <input id="sk-amt" type="number" inputmode="numeric" step="500" value="${r.skins.amount}">
      <label class="check"><input type="checkbox" id="sk-carry" checked> 비기면 다음 홀로 이월</label>
    </div>
    <button class="btn" id="create">만들고 참여 코드 받기</button>
  `;
  const fillCourses = () => {
    const club = state.courses[$("#club").value];
    const opts = (club?.courses || []).map((c, i) => `<option value="${i}">${esc(c.name)} (${c.holes.length}홀)</option>`).join("");
    $("#front").innerHTML = opts; $("#back9").innerHTML = opts;
    if (club && club.courses.length > 1) $("#back9").value = "1";
  };
  $("#club").onchange = fillCourses; fillCourses();
  const markUnit = () => view.querySelectorAll("[data-unit]").forEach((b) => b.classList.toggle("on", +b.dataset.unit === +$("#unit").value));
  view.querySelectorAll("[data-unit]").forEach((b) => (b.onclick = () => { $("#unit").value = b.dataset.unit; markUnit(); }));
  $("#unit").oninput = markUnit; markUnit();

  $("#create").onclick = async () => {
    const club = state.courses[$("#club").value];
    if (!club) return toast("골프장을 먼저 등록해 주세요");
    const players = [...view.querySelectorAll(".pname")].map((i) => i.value.trim()).filter(Boolean);
    if (players.length < 2) return toast("2명 이상 이름을 넣어주세요");
    if (new Set(players).size !== players.length) return toast("이름이 겹치지 않게 해주세요");
    const f = club.courses[$("#front").value], b = club.courses[$("#back9").value];
    const mine = store.get(greenKey(club.id), {}); // 이 폰에서 현장에서 찍은 그린 위치도 같이 넣어 동반자와 공유
    const withMine = (h, label) => ({ ...h, label, green: { ...(h.green || {}), ...(mine[`${label}|${h.no}`] || {}) } });
    const holes = [...f.holes.map((h) => withMine(h, f.name)), ...b.holes.map((h) => withMine(h, b.name))];
    const num = (id) => Math.max(0, parseInt($(id).value, 10) || 0);
    const setup = {
      courseId: club.id, courseName: club.name, holes, players,
      createdAt: new Date().toISOString(),
      rules: {
        unit: num("#unit"), capDoublePar: $("#cap").checked, birdieBonus: num("#birdie"),
        baepan: { onBirdie: $("#bp-birdie").checked, onTie3: $("#bp-tie").checked, onTriple: $("#bp-triple").checked, mult: +$("#bp-mult").value },
        skins: { on: $("#sk-on").checked, amount: num("#sk-amt"), carry: $("#sk-carry").checked },
      },
    };
    try {
      const code = await sync.createRound(setup);
      store.set("golf.me." + code, 0);
      openRound(code);
    } catch (e) { toast(e.message); }
  };
}

// ---------- 라운드 열기 ----------
async function openRound(code) {
  code = (code || "").trim().toUpperCase();
  if (code.length !== 6) return toast("6자리 코드를 넣어주세요");
  let round;
  try { round = await sync.loadRound(code); } catch (e) { return toast(e.message); }
  if (!round) return toast("그 코드의 라운드를 찾지 못했어요");
  stopRoundListeners();
  state.round = round;
  state.tab = "score"; state.shotStart = null;
  history.replaceState(null, "", "?r=" + code);
  remember(code, round.setup);
  state.hole = firstEmptyHole();
  state.unsub = sync.subscribeScores(code, (h, p, s) => {
    const k = h + "-" + p;
    if (s == null) delete state.round.scores[k]; else state.round.scores[k] = s;
    renderTab();
  });
  const me = store.get("golf.me." + code, null);
  if (me == null) return chooseMe();
  state.me = me;
  showRound();
}

function chooseMe() {
  const { setup } = state.round;
  setHeader(setup.courseName, true);
  $("#tabs").hidden = true;
  view.innerHTML = `<div class="card"><h2>누구세요?</h2><p class="muted">내 이름을 고르면 내 줄이 강조돼요. 다른 사람 타수도 입력할 수 있어요.</p>
    ${setup.players.map((p, i) => `<button class="btn ghost" data-i="${i}">${esc(p)}</button>`).join("")}</div>`;
  view.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => {
    state.me = +b.dataset.i; store.set("golf.me." + state.round.code, state.me); showRound();
  }));
}

function showRound() {
  setHeader(state.round.setup.courseName, true);
  $("#tabs").hidden = false;
  renderTab();
}

// ---------- 계산 도우미 ----------
function scoreGrid() {
  const { setup, scores } = state.round;
  return setup.holes.map((_, h) => setup.players.map((_, p) => scores[h + "-" + p]));
}
function calc() {
  const { setup } = state.round;
  return roundResult(setup.holes, setup.players.length, scoreGrid(), setup.rules);
}
function firstEmptyHole() {
  const g = scoreGrid();
  const i = g.findIndex((row) => row.some((s) => s == null));
  return i < 0 ? g.length - 1 : i;
}
function holeName(h) {
  const hole = state.round.setup.holes[h];
  return `${hole.label ? hole.label + " " : ""}${hole.no ?? h + 1}번`;
}

function holeBar(result) {
  const { holes } = state.round.setup;
  const h = state.hole, hole = holes[h];
  const mult = result.perHole[h].mult;
  const grid = scoreGrid();
  return `
    <div class="holebar">
      <button id="prev" ${h === 0 ? "disabled" : ""} aria-label="이전 홀">‹</button>
      <div class="now"><b>${h + 1}번 홀</b><span class="muted">${esc(holeName(h))} · 파${hole.par}</span>${mult > 1 ? `<span class="badge">배판 ×${mult}</span>` : ""}</div>
      <button id="next" ${h === holes.length - 1 ? "disabled" : ""} aria-label="다음 홀">›</button>
    </div>
    <div class="chips">${holes.map((_, i) => `<button data-h="${i}" class="${grid[i].every((s) => s != null) ? "done" : ""} ${i === h ? "cur" : ""}">${i + 1}</button>`).join("")}</div>`;
}
function bindHoleBar() {
  $("#prev").onclick = () => { state.hole--; renderTab(); };
  $("#next").onclick = () => { state.hole++; renderTab(); };
  view.querySelectorAll(".chips button").forEach((b) => (b.onclick = () => { state.hole = +b.dataset.h; renderTab(); }));
}

// ---------- 탭 ----------
function renderTab() {
  if (!state.round) return;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === state.tab));
  if (state.tab !== "distance" && state.stopGps) { state.stopGps(); state.stopGps = null; }
  if (state.tab === "score") renderScore();
  else if (state.tab === "distance") renderDistance();
  else renderMoney();
}

function scoreName(s, par) {
  const d = s - par;
  return { "-3": "알바트로스", "-2": "이글", "-1": "버디", 0: "파", 1: "보기", 2: "더블", 3: "트리플" }[d] ?? (d > 0 ? `+${d}` : `${d}`);
}

function renderScore() {
  const { setup, scores, code } = state.round;
  const res = calc();
  const h = state.hole, par = setup.holes[h].par;
  const hr = res.perHole[h];
  // 지금까지 누적(이 홀 포함)
  const upto = setup.players.map((_, p) => res.perHole.slice(0, h + 1).reduce((a, r) => a + r.money[p], 0));
  view.innerHTML = holeBar(res) + `
    <div class="card">
      ${setup.players.map((name, p) => {
        const s = scores[h + "-" + p];
        const m = hr.money[p];
        return `<div class="player ${p === state.me ? "me" : ""}">
          <div class="who"><b>${esc(name)}</b>
            <span class="${m > 0 ? "plus" : m < 0 ? "minus" : "muted"}">${hr.complete ? "이번 홀 " + won(m) : "입력 대기"}</span>
            <span class="muted"> · 누적 ${won(upto[p])}</span></div>
          <div class="stepper">
            <button data-p="${p}" data-d="-1" aria-label="${esc(name)} 한 타 빼기">−</button>
            <div class="val">${s ?? "–"}<small>${s ? scoreName(s, par) : ""}</small></div>
            <button data-p="${p}" data-d="1" aria-label="${esc(name)} 한 타 더하기">+</button>
          </div>
        </div>`;
      }).join("")}
      ${hr.complete && hr.triggers.length ? `<p class="muted">다음 홀 배판: ${hr.triggers.join(", ")}</p>` : ""}
      ${hr.complete && hr.carryOut ? `<p class="muted">스킨 이월: 1명당 ${won(hr.carryOut).replace("+", "")}</p>` : ""}
    </div>
    ${hr.complete && h < setup.holes.length - 1 ? `<button class="btn" id="go-next">다음 홀로 →</button>` : ""}
    <div class="card"><span class="muted">참여 코드</span> <span class="code">${code}</span>
      <button class="btn small ghost" id="share" style="float:right">코드 보내기</button></div>`;
  bindHoleBar();
  view.querySelectorAll(".stepper button").forEach((b) => (b.onclick = async () => {
    const p = +b.dataset.p, d = +b.dataset.d;
    const cur = scores[h + "-" + p];
    let next = cur == null ? par : cur + d; // 처음 누르면 파부터
    if (next < 1) next = null;
    if (next > 20) next = 20;
    if (next == null) delete scores[h + "-" + p]; else scores[h + "-" + p] = next;
    renderScore();
    try { await sync.saveScore(code, h, p, next); } catch (e) { toast(e.message); }
  }));
  const gn = $("#go-next"); if (gn) gn.onclick = () => { state.hole++; renderTab(); window.scrollTo(0, 0); };
  $("#share").onclick = () => shareText(`골프 라운드 참여 코드: ${code}\n${location.origin + location.pathname}?r=${code}`);
}

// ---------- 그린 위치 (골프장 파일 + 이 폰에서 현장에서 찍은 값) ----------
const greenKey = (courseId) => "golf.greens." + courseId;
const holeKey = (hole) => `${hole.label || ""}|${hole.no}`;
function greenFor(h) {
  const { setup } = state.round;
  const hole = setup.holes[h];
  const mine = store.get(greenKey(setup.courseId), {})[holeKey(hole)];
  return { ...(hole.green || {}), ...(mine || {}) };
}
function saveGreenPoint(h, point, latlng) {
  const { setup } = state.round;
  const all = store.get(greenKey(setup.courseId), {});
  const k = holeKey(setup.holes[h]);
  all[k] = { ...(all[k] || {}), [point]: latlng.map((v) => Math.round(v * 1e6) / 1e6) };
  store.set(greenKey(setup.courseId), all);
}
const POINT_KO = { front: "앞", center: "중앙", back: "뒤" };

function renderDistance() {
  const res = calc();
  const h = state.hole;
  const g = greenFor(h);
  const hasGreen = g.center || g.front || g.back;
  const me = state.pos;
  const acc = me ? Math.round(me.accuracy) : null;
  const d = (pt) => (me && pt ? Math.round(distanceM(me.latlng, pt)) : null);
  const shot = state.shotStart;
  const main = d(g.center || g.front || g.back);
  const club = recommendClub(main, myClubs());
  view.innerHTML = holeBar(res) + (hasGreen ? `
    <div class="card dist">
      <span class="muted">그린 ${g.center ? "중앙" : g.front ? "앞" : "뒤"}까지</span>
      <div class="big">${main ?? "…"}<small>m</small></div>
      ${club ? `<div class="club">추천 <b>${esc(club.name)}</b></div>` : ""}
      <div class="three">
        <div><span class="muted">앞</span><b>${d(g.front) ?? "–"}</b></div>
        <div><span class="muted">뒤</span><b>${d(g.back) ?? "–"}</b></div>
      </div>
      ${canSpeak() ? `<button class="btn" id="say" ${main == null ? "disabled" : ""}>🔊 음성으로 듣기</button>` : ""}
      <p class="muted">${me ? `GPS 오차 약 ±${acc}m` : "위치를 찾는 중…"}<br>핀 위치는 매일 바뀌므로 그린 기준 대략 거리예요. 높낮이는 반영 안 돼요.</p>
    </div>` : `
    <div class="card"><h2>그린 위치 없음</h2><p class="muted">그린 위에 올라가서 아래 <b>그린 위치 저장</b>을 누르면 다음부터 이 홀 거리가 나와요. PC 관리 프로그램에서 미리 등록해도 돼요.</p></div>`) + `
    <div class="card">
      <h2>샷 거리 재기</h2>
      ${shot ? `<div class="dist"><div class="big">${me ? Math.round(distanceM(shot, me.latlng)) : "…"}<small>m</small></div>
          <p class="muted">친 자리에서 지금 위치까지</p></div>
        <button class="btn ghost" id="shot-reset">다시 재기</button>`
      : `<p class="muted">공을 친 자리에서 누르고, 공이 있는 곳까지 걸어가면 거리가 나와요.</p>
        <button class="btn ghost" id="shot-start" ${me ? "" : "disabled"}>여기서 쳤어요</button>`}
    </div>
    <div class="card">
      <h2>그린 위치 저장 (현장)</h2>
      <p class="muted">그린 위 해당 자리에 서서 누르세요. ${acc != null ? `지금 GPS 오차 약 ±${acc}m${acc > 15 ? " — 오차가 커요. 잠시 기다렸다 누르세요." : ""}` : "위치를 찾는 중…"}</p>
      <div class="row3">${Object.entries(POINT_KO).map(([p, ko]) => `<button data-gp="${p}" ${me ? "" : "disabled"} class="${g[p] ? "set" : ""}">${g[p] ? "✓ " : ""}${ko}</button>`).join("")}</div>
    </div>`;
  bindHoleBar();
  const say = $("#say");
  if (say) say.onclick = () => {
    const hole = state.round.setup.holes[h];
    const full = g.center && g.front && g.back;
    announce({
      holeNo: h + 1, par: hole.par,
      target: g.center ? "center" : g.front ? "front" : "back", dist: main,
      front: full ? d(g.front) : null, back: full ? d(g.back) : null,
      club: club ? club.name : null,
    }, voiceSettings());
  };
  const ss = $("#shot-start"); if (ss) ss.onclick = () => { state.shotStart = me.latlng; renderDistance(); };
  const sr = $("#shot-reset"); if (sr) sr.onclick = () => { state.shotStart = null; renderDistance(); };
  view.querySelectorAll("[data-gp]").forEach((b) => (b.onclick = () => {
    const p = b.dataset.gp;
    if (!confirm(`지금 서 있는 곳을 ${h + 1}번 홀 그린 ${POINT_KO[p]}으로 저장할까요?`)) return;
    saveGreenPoint(h, p, state.pos.latlng);
    toast(`${h + 1}번 홀 그린 ${POINT_KO[p]} 저장했어요`);
    renderDistance();
  }));
  if (!state.stopGps) {
    state.stopGps = watchMyPosition(
      (p) => { state.pos = p; if (state.tab === "distance") renderDistance(); },
      (msg) => toast(msg)
    );
  }
}

function renderMoney() {
  const { setup, scores } = state.round;
  const res = calc();
  const names = setup.players;
  const strokes = (from, to) => names.map((_, p) => {
    let t = 0;
    for (let h = from; h < to; h++) t += scores[h + "-" + p] || 0;
    return t;
  });
  const half = Math.min(9, setup.holes.length);
  const sf = strokes(0, half), sb = strokes(half, setup.holes.length);
  const doneCount = res.perHole.filter((r) => r.complete).length;
  const transfers = settle(res.total, names);
  const frontT = settle(res.front, names);
  const cls = (v) => (v > 0 ? "plus" : v < 0 ? "minus" : "");
  view.innerHTML = `
    <div class="card">
      <h2>내기 합계 <span class="muted">(${doneCount}/${setup.holes.length}홀 완료)</span></h2>
      <table>
        <tr><th>이름</th><th>전반</th><th>후반</th><th>합계</th></tr>
        ${names.map((n, p) => `<tr><td>${esc(n)}</td>
          <td class="${cls(res.front[p])}">${won(res.front[p])}</td>
          <td class="${cls(res.back[p])}">${won(res.back[p])}</td>
          <td class="${cls(res.total[p])}"><b>${won(res.total[p])}</b></td></tr>`).join("")}
      </table>
    </div>
    <div class="card">
      <h2>스코어카드 <span class="muted">총타수 ${names.map((n, p) => `${esc(n)} ${sf[p] + sb[p] || "–"}`).join(" · ")}</span></h2>
      ${scorecard(0, half)}
      ${setup.holes.length > half ? scorecard(half, setup.holes.length) : ""}
      <p class="muted">○ 버디 이하 · □ 보기 · ■ 더블 이상 · 칸을 누르면 그 홀로 이동</p>
    </div>
    <div class="card">
      <h2>누가 누구에게 (최종)</h2>
      ${transfers.length ? transfers.map((t) => `<div class="transfer"><span>${esc(t.from)} → ${esc(t.to)}</span><b>${t.amount.toLocaleString("ko-KR")}원</b></div>`).join("") : `<p class="muted">아직 주고받을 돈이 없어요.</p>`}
      <button class="btn" id="share-money">카톡 등으로 결과 보내기</button>
    </div>
    ${frontT.length ? `<div class="card"><h2>전반만 정산한다면</h2>${frontT.map((t) => `<div class="transfer"><span>${esc(t.from)} → ${esc(t.to)}</span><b>${t.amount.toLocaleString("ko-KR")}원</b></div>`).join("")}</div>` : ""}
  `;
  view.querySelectorAll("[data-goto]").forEach((c) => (c.onclick = () => {
    state.hole = +c.dataset.goto; state.tab = "score"; renderTab(); window.scrollTo(0, 0);
  }));
  $("#share-money").onclick = () => {
    const lines = [
      `⛳ ${setup.courseName} (${doneCount}/${setup.holes.length}홀)`,
      ...names.map((n, p) => `${n}: ${sf[p] + sb[p]}타 / ${won(res.total[p])}`),
      "",
      "[정산]",
      ...(transfers.length ? transfers.map((t) => `${t.from} → ${t.to} ${t.amount.toLocaleString("ko-KR")}원`) : ["없음"]),
    ];
    shareText(lines.join("\n"));
  };
}

// 9홀씩 스코어카드 표
function scorecard(from, to) {
  const { setup, scores } = state.round;
  const holes = setup.holes.slice(from, to);
  const mark = (s, par) => {
    if (s == null) return "";
    const d = s - par;
    return d <= -1 ? "under" : d === 1 ? "bogey" : d >= 2 ? "double" : "";
  };
  return `<table class="sc">
    <tr><th>홀</th>${holes.map((_, i) => `<th data-goto="${from + i}">${from + i + 1}</th>`).join("")}<th>계</th></tr>
    <tr class="par"><td>파</td>${holes.map((h) => `<td>${h.par}</td>`).join("")}<td>${holes.reduce((a, h) => a + h.par, 0)}</td></tr>
    ${setup.players.map((n, p) => {
      let t = 0;
      const cells = holes.map((h, i) => {
        const s = scores[from + i + "-" + p];
        if (s) t += s;
        return `<td data-goto="${from + i}"><span class="${mark(s, h.par)}">${s ?? ""}</span></td>`;
      }).join("");
      return `<tr><td>${esc(n.slice(0, 3))}</td>${cells}<td><b>${t || ""}</b></td></tr>`;
    }).join("")}
  </table>`;
}

async function shareText(text) {
  if (navigator.share) { try { await navigator.share({ text }); return; } catch { return; } }
  try { await navigator.clipboard.writeText(text); toast("복사했어요. 카톡에 붙여넣기 하세요"); }
  catch { prompt("아래 내용을 복사하세요", text); }
}

// ---------- 시작 ----------
$("#back").onclick = showHome;
document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => { state.tab = b.dataset.tab; renderTab(); window.scrollTo(0, 0); }));
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js");

(async function start() {
  state.courses = await sync.loadCourses();
  mergeLocalCourses();
  const code = new URLSearchParams(location.search).get("r");
  showHome();
  if (code) openRound(code);
})();
