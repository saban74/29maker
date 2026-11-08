"use strict";
/* 29 Crew 대시보드. 화면 그리기는 h()로만 해서 사용자 글이 HTML로 해석되지 않게 한다. */

const S = { data: null, timer: null };
const $ = (sel) => document.querySelector(sel);
const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
const COLOR = { blue: "#4f7cff", green: "#33b07a", purple: "#9b6bff", orange: "#ff8a3d", red: "#ef5f5f",
  yellow: "#d9a520", pink: "#e8649b", cyan: "#22aecc" };
const STATUS = { queued: "대기 중", running: "진행 중", stopping: "멈추는 중", done: "완료", failed: "실패",
  stopped: "멈춤", interrupted: "중단됨" };
const NAV = [
  ["home", "⌂", "홈"], ["missions", "◎", "미션"], ["team", "👥", "팀"],
  ["skills", "🧰", "스킬"], ["studio", "🎬", "영상"], ["settings", "⚙", "설정"],
];

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "value") el.value = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
  return el;
}

async function api(path, opts = {}) {
  const res = await fetch("/api/" + path, {
    method: opts.method || (opts.body ? "POST" : "GET"),
    headers: opts.body ? { "Content-Type": "application/json" } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const type = res.headers.get("Content-Type") || "";
  const data = type.includes("json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error((data && data.error) || "요청이 실패했어요.");
  return data;
}

function toast(msg, bad) {
  const t = h("div", { class: "toast" + (bad ? " bad" : "") }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), bad ? 5000 : 2500);
}

async function run(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (e) { toast(e.message, true); return null; }
}

const ago = (t) => {
  if (!t) return "";
  const s = Math.floor(Date.now() / 1000 - t);
  if (s < 60) return "방금";
  if (s < 3600) return Math.floor(s / 60) + "분 전";
  if (s < 86400) return Math.floor(s / 3600) + "시간 전";
  return Math.floor(s / 86400) + "일 전";
};
const isReviewer = (name) => name.endsWith("reviewer");
const status = (st) => h("span", { class: "row st-" + st, style: "gap:6px" }, h("span", { class: "dot" }), STATUS[st] || st);
const ava = (a) => h("div", { class: "ava", style: `background:${COLOR[a.color] || "#555a66"}` }, a.name.slice(0, 1).toUpperCase());

async function load() {
  S.data = await api("state");
  const c = document.querySelector(".nav .count");
  if (c) c.textContent = S.data.missions.filter(m => ["running", "queued"].includes(m.status)).length || "";
  return S.data;
}

/* 최종 보고의 **굵게**, # 제목만 간단히 보여 준다 (HTML로 해석하지 않음). */
function md(text) {
  return h("div", { class: "card result" }, text.split(/\n{2,}/).map(block => {
    const heading = block.match(/^#{1,4}\s+(.*)$/);
    const inline = (s) => s.split(/(\*\*[^*]+\*\*)/).map(part => part.startsWith("**") && part.endsWith("**") ? h("b", {}, part.slice(2, -2)) : part);
    return heading ? h("h4", {}, inline(heading[1])) : h("p", {}, inline(block));
  }));
}

/* ---------- 라우터 ---------- */
function route() {
  const [page, arg] = (location.hash.slice(2) || "home").split("/");
  clearInterval(S.timer);
  fill($("#nav"), ...NAV.map(([id, ico, label]) => h("a", { href: "#/" + id, class: page === id || (page === "mission" && id === "missions") ? "on" : "" },
    h("span", { class: "ico" }, ico), label,
    id === "missions" && S.data ? h("span", { class: "count" }, S.data.missions.filter(m => ["running", "queued"].includes(m.status)).length || "") : null)));
  fill($("#actions"));
  $("#subtitle").textContent = "";
  const pages = { home, missions: missionsPage, mission: missionPage, team, skills: skillsPage, studio, settings };
  (pages[page] || home)(arg);
}

function head(title, sub, ...actions) {
  $("#title").textContent = title;
  $("#subtitle").textContent = sub || "";
  fill($("#actions"), ...actions);
}
const page = (...kids) => fill($("#page"), ...kids);

/* ---------- 홈 ---------- */
function home() {
  const d = S.data;
  head("홈", "오늘의 팀 현황", h("a", { class: "btn primary", href: "#/missions" }, "+ 새 미션"));
  const running = d.missions.filter(m => ["running", "queued", "stopping"].includes(m.status));
  const missing = Object.entries(d.checks).filter(([k, ok]) => !ok && k !== "edge_tts");
  page(
    missing.length ? h("div", { class: "card", style: "border-color:rgba(242,177,76,.5)" },
      h("b", {}, "⚠️ 설치가 필요한 도구가 있어요"), " ",
      h("span", { class: "muted" }, missing.map(([k]) => k).join(", ")), " ",
      h("a", { href: "#/settings", class: "tag accent" }, "설정에서 확인")) : null,
    h("div", { class: "grid g4 stats mt" },
      stat("에이전트", d.agents.length, "#/team"), stat("스킬", d.skills.length, "#/skills"),
      stat("미션", d.missions.length, "#/missions"), stat("영상", d.videos.length, "#/studio")),
    h("h2", {}, "진행 중"),
    running.length ? missionList(running) : h("div", { class: "list" }, h("div", { class: "empty" }, "지금 돌고 있는 미션이 없어요.")),
    h("h2", {}, "최근 결과"),
    missionList(d.missions.filter(m => !running.includes(m)).slice(0, 6)),
  );
  S.timer = setInterval(async () => { await load(); if (location.hash.startsWith("#/home") || !location.hash) home(); }, 4000);
}
const stat = (label, n, href) => h("a", { class: "card stat", href }, h("span", { class: "muted small" }, label), h("b", {}, n));

function missionList(list) {
  if (!list.length) return h("div", { class: "list" }, h("div", { class: "empty" }, "아직 없어요."));
  return h("div", { class: "list" }, list.map(m => h("a", { class: "item", href: "#/mission/" + m.id },
    status(m.status),
    h("div", { class: "grow ellipsis" }, m.goal),
    m.mode === "one" ? h("span", { class: "tag" }, "🙋 " + m.agent) : h("span", { class: "tag" }, "👥 팀"),
    h("span", { class: "muted small" }, ago(m.created_at)))));
}

/* ---------- 미션 ---------- */
function missionsPage() {
  const d = S.data;
  head("미션", "팀에게 일 맡기기");
  const workers = d.agents.filter(a => !isReviewer(a.name));
  const f = { mode: "team", agent: workers[0]?.name || "", review: true };
  const goal = h("textarea", { placeholder: "예) 초보자를 위한 가을 캠핑 준비물 블로그 글 써 줘", rows: 3 });
  const agentSel = h("select", {}, workers.map(a => h("option", { value: a.name }, `${a.name} — ${a.description.slice(0, 40)}`)));
  const agentRow = h("label", { class: "f", style: "display:none" }, h("span", {}, "맡길 에이전트"), agentSel);
  const seg = h("div", { class: "seg" },
    h("button", { class: "on", onclick: (e) => setMode(e, "team") }, "👥 팀으로"),
    h("button", { onclick: (e) => setMode(e, "one") }, "🙋 한 명에게"));
  function setMode(e, mode) {
    f.mode = mode;
    [...seg.children].forEach(b => b.classList.toggle("on", b === e.target));
    agentRow.style.display = mode === "one" ? "" : "none";
  }
  const review = h("input", { type: "checkbox", checked: true });
  page(
    h("div", { class: "card" },
      h("h3", {}, "새 미션"),
      h("label", { class: "f" }, h("span", {}, "맡길 일"), goal),
      h("div", { class: "row mt-s" }, seg,
        h("label", { class: "row muted", style: "margin-left:8px" }, review, "끝나면 검수 받기")),
      agentRow,
      h("div", { class: "spread mt" },
        h("span", { class: "muted small" }, d.checks.claude ? "Claude Code로 실행돼요. Max 요금제 사용량이 쓰여요." : "⚠️ claude 명령을 찾지 못했어요. 설정을 확인해 주세요."),
        h("button", { class: "btn primary", onclick: async () => {
          const m = await run(() => api("missions", { body: { goal: goal.value, mode: f.mode, agent: agentSel.value, review: review.checked } }), "미션을 맡겼어요.");
          if (m) { await load(); location.hash = "#/mission/" + m.id; }
        } }, "맡기기"))),
    h("h2", {}, "전체 미션"),
    h("div", { id: "mlist" }, missionList(d.missions)),
  );
  S.timer = setInterval(async () => { await load(); const el = $("#mlist"); if (el) fill(el, missionList(S.data.missions)); }, 4000);
}

async function missionPage(id) {
  head("미션", "");
  const box = h("div", {});
  page(box);
  let prevLog = null;
  async function draw() {
    const m = await run(() => api("missions/" + id));
    if (!m) return;
    const live = ["running", "queued", "stopping"].includes(m.status);
    head("미션", m.id,
      live ? h("button", { class: "btn danger", onclick: () => run(() => api(`missions/${id}/stop`, { body: {} }), "멈추라고 했어요.").then(draw) }, "■ 멈추기") : null,
      !live ? h("button", { class: "btn", onclick: async () => {
        const n = await run(() => api("missions", { body: { goal: m.goal, mode: m.mode, agent: m.agent, review: m.review } }), "같은 미션을 다시 맡겼어요.");
        if (n) location.hash = "#/mission/" + n.id;
      } }, "↻ 다시 하기") : null,
      !live ? h("button", { class: "btn danger ghost", onclick: async () => {
        if (!confirm("이 미션 기록과 결과물을 지울까요?")) return;
        if (await run(() => api("missions/" + id, { method: "DELETE" }), "지웠어요.")) { await load(); location.hash = "#/missions"; }
      } }, "지우기") : null);
    const logEl = h("pre", { class: "log" }, m.log || (m.status === "queued" ? "차례를 기다리는 중이에요…" : "아직 기록이 없어요."));
    fill(box, 
      h("div", { class: "card" },
        h("div", { class: "row" }, status(m.status), m.mode === "one" ? h("span", { class: "tag" }, "🙋 " + m.agent) : h("span", { class: "tag" }, "👥 팀"),
          m.review ? h("span", { class: "tag" }, "✅ 검수") : null, h("span", { class: "muted small" }, ago(m.created_at))),
        h("div", { class: "mt-s", style: "font-size:15px" }, m.goal)),
      m.result ? h("div", {}, h("h2", {}, "최종 보고"), md(m.result)) : null,
      m.files.length ? h("div", {}, h("h2", {}, "결과물 파일"), h("div", { class: "list" }, m.files.map(f =>
        h("a", { class: "item", href: `/files/missions/${m.id}/${f}`, target: "_blank" }, "📄", h("span", { class: "grow ellipsis" }, f))))) : null,
      h("h2", {}, "진행 기록"), logEl);
    if (m.log !== prevLog) logEl.scrollTop = logEl.scrollHeight;
    prevLog = m.log;
    if (!live) clearInterval(S.timer);
  }
  await draw();
  S.timer = setInterval(draw, 2500);
}

/* ---------- 팀 ---------- */
function team() {
  const d = S.data;
  head("팀", `에이전트 ${d.agents.length}명`, h("button", { class: "btn primary", onclick: () => agentEditor() }, "+ 에이전트"));
  const workers = d.agents.filter(a => !isReviewer(a.name));
  const reviewers = d.agents.filter(a => isReviewer(a.name));
  page(
    h("div", { class: "card" },
      h("div", { class: "spread" },
        h("div", { class: "row" }, h("div", { class: "ava", style: "background:linear-gradient(135deg,#7c83ff,#c66bff)" }, "👑"),
          h("div", {}, h("h3", {}, "총감독"), h("div", { class: "muted small" }, "팀 미션에서 계획을 세우고 일을 나눠 주는 리더예요."))),
        h("button", { class: "btn sm", onclick: directorEditor }, "지시문 고치기"))),
    h("h2", {}, `🛠 일꾼 (${workers.length})`), agentGrid(workers),
    h("h2", {}, `✅ 검수 담당 (${reviewers.length})`),
    h("div", { class: "muted small", style: "margin:-4px 0 10px" }, "이름이 reviewer로 끝나면 검수 담당이 돼요. 혼자 미션을 맡지 않고 결과물을 점검해요."),
    agentGrid(reviewers),
  );
}

function agentGrid(list) {
  if (!list.length) return h("div", { class: "list" }, h("div", { class: "empty" }, "아직 없어요."));
  return h("div", { class: "grid g3" }, list.map(a => h("div", { class: "card", style: "cursor:pointer", onclick: () => agentEditor(a) },
    h("div", { class: "row" }, ava(a), h("div", { class: "grow", style: "min-width:0" }, h("h3", { class: "ellipsis" }, a.name),
      h("div", { class: "muted small" }, a.model))),
    h("div", { class: "muted small mt-s", style: "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden" }, a.description),
    h("div", { class: "chips mt-s" }, a.skills.length ? a.skills.map(s => h("span", { class: "tag accent" }, "🧰 " + s)) : h("span", { class: "muted small" }, "스킬 없음")))));
}

function drawer(title, body, actions) {
  const close = () => fill($("#layer"));
  fill($("#layer"), 
    h("div", { class: "drawer-bg", onclick: close }),
    h("div", { class: "drawer" }, h("div", { class: "head" }, h("h3", {}, title), h("button", { class: "btn ghost sm", style: "margin-left:auto", onclick: close }, "✕")),
      h("div", { class: "body" }, body), h("div", { class: "foot" }, actions(close))));
}

function agentEditor(a) {
  const d = S.data;
  const isNew = !a;
  a = a || { name: "", description: "", model: "sonnet", color: "blue", tools: ["Read", "Glob", "Grep"], skills: [], role: "" };
  const v = { tools: new Set(a.tools), skills: new Set(a.skills) };
  const name = h("input", { type: "text", value: a.name, placeholder: "예: travel-planner", disabled: !isNew });
  const desc = h("textarea", { rows: 3, value: a.description, placeholder: "언제 이 에이전트를 쓰는지 적어요. 예) 여행 일정과 준비물을 짜 주는 여행 담당." });
  const model = h("select", {}, d.options.models.map(m => h("option", { value: m, selected: m === a.model }, m)));
  const color = h("select", {}, d.options.colors.map(c => h("option", { value: c, selected: c === a.color }, c)));
  const role = h("textarea", { rows: 12, class: "code", value: a.role, placeholder: "당신은 ...입니다.\n\n## 역할\n- ...\n\n## 하지 말 것\n- ..." });
  const chipSet = (all, set, max) => h("div", { class: "chips" }, all.map(x => {
    const c = h("span", { class: "chip" + (set.has(x) ? " on" : "") }, x);
    c.onclick = () => {
      if (set.has(x)) set.delete(x);
      else if (max && set.size >= max) return toast(`스킬은 ${max}개까지 달 수 있어요.`, true);
      else set.add(x);
      c.classList.toggle("on", set.has(x));
    };
    return c;
  }));
  drawer(isNew ? "새 에이전트" : a.name, h("div", {},
    h("label", { class: "f" }, h("span", {}, "이름 (영어 소문자·숫자·하이픈)"), name),
    h("label", { class: "f" }, h("span", {}, "설명"), desc),
    h("div", { class: "grid g2" }, h("label", { class: "f" }, h("span", {}, "모델"), model), h("label", { class: "f" }, h("span", {}, "색"), color)),
    h("label", { class: "f" }, h("span", {}, "쓸 수 있는 도구"), chipSet(d.options.tools, v.tools)),
    h("label", { class: "f" }, h("span", {}, `스킬 (최대 ${d.options.max_skills}개) — 스킬 화면에서 추가·교체할 수 있어요`),
      d.skills.length ? chipSet(d.skills.map(s => s.name), v.skills, d.options.max_skills) : h("div", { class: "muted small" }, "아직 스킬이 없어요.")),
    h("label", { class: "f" }, h("span", {}, "역할 설명 (지시문)"), role)),
  (close) => [
    !isNew ? h("button", { class: "btn danger ghost", style: "margin-right:auto", onclick: async () => {
      if (!confirm(`${a.name} 에이전트를 지울까요?`)) return;
      if (await run(() => api("agents/" + a.name, { method: "DELETE" }), "지웠어요.")) { close(); await load(); team(); }
    } }, "지우기") : null,
    h("button", { class: "btn", onclick: close }, "취소"),
    h("button", { class: "btn primary", onclick: async () => {
      const body = { name: name.value.trim(), description: desc.value, model: model.value, color: color.value,
        tools: [...v.tools], skills: [...v.skills], role: role.value };
      if (await run(() => api("agents", { body }), "저장했어요.")) { close(); await load(); team(); }
    } }, "저장")]);
}

function directorEditor() {
  const text = h("textarea", { rows: 18, class: "code", value: S.data.director });
  drawer("👑 총감독 지시문", h("div", {}, h("p", { class: "muted small" }, "팀 미션을 시작할 때 Claude에게 덧붙는 지시문이에요. 일 나누는 방식, 보고 형식 등을 정해요."), text),
    (close) => [h("button", { class: "btn", onclick: close }, "취소"),
      h("button", { class: "btn primary", onclick: async () => {
        if (await run(() => api("director", { body: { text: text.value } }), "저장했어요.")) { close(); await load(); }
      } }, "저장")]);
}

/* ---------- 스킬 ---------- */
function skillsPage() {
  const d = S.data;
  head("스킬", `${d.skills.length}개`,
    h("button", { class: "btn", onclick: importDialog }, "⬇ GitHub에서 가져오기"),
    h("button", { class: "btn primary", onclick: () => skillEditor() }, "+ 직접 만들기"));
  const usedBy = (s) => d.agents.filter(a => a.skills.includes(s)).map(a => a.name);
  page(
    h("div", { class: "muted small", style: "margin-bottom:12px" }, "스킬은 에이전트가 일할 때 펼쳐 보는 '업무 설명서'예요. 같은 이름으로 가져오면 새 내용으로 교체돼요."),
    d.skills.length ? h("div", { class: "list" }, d.skills.map(s => h("div", { class: "item", style: "cursor:pointer", onclick: () => skillEditor(s.name) },
      h("span", {}, "🧰"),
      h("div", { class: "grow", style: "min-width:0" }, h("div", { class: "row" }, h("b", {}, s.name), s.source ? h("span", { class: "tag" }, "GitHub") : h("span", { class: "tag" }, "직접 만듦"),
        s.extra_files.length ? h("span", { class: "tag", title: s.extra_files.join(", ") }, `+ 파일 ${s.extra_files.length}개`) : null),
        h("div", { class: "muted small ellipsis" }, s.description)),
      h("span", { class: "muted small" }, usedBy(s.name).length ? "👥 " + usedBy(s.name).join(", ") : "아무도 안 씀"))))
      : h("div", { class: "list" }, h("div", { class: "empty" }, "아직 스킬이 없어요.")),
  );
}

async function skillEditor(nameArg) {
  const s = nameArg ? await run(() => api("skills/" + nameArg)) : { name: "", description: "", body: "", source: "" };
  if (!s) return;
  const name = h("input", { type: "text", value: s.name, placeholder: "예: blog-style", disabled: !!nameArg });
  const desc = h("textarea", { rows: 2, value: s.description, placeholder: "언제 쓰는 스킬인지. 예) 블로그 글을 쓸 때 말투와 구성 규칙" });
  const body = h("textarea", { rows: 18, class: "code", value: s.body, placeholder: "# 블로그 글 규칙\n\n- 제목은 20자 이내\n- ..." });
  drawer(nameArg ? "🧰 " + s.name : "새 스킬", h("div", {},
    s.source ? h("p", { class: "muted small" }, "가져온 곳: ", h("a", { href: s.source, target: "_blank", class: "tag" }, s.source)) : null,
    h("label", { class: "f" }, h("span", {}, "이름"), name), h("label", { class: "f" }, h("span", {}, "설명"), desc),
    h("label", { class: "f" }, h("span", {}, "내용 (SKILL.md)"), body)),
  (close) => [
    nameArg ? h("button", { class: "btn danger ghost", style: "margin-right:auto", onclick: async () => {
      if (!confirm(`${s.name} 스킬을 지울까요? 이 스킬을 단 에이전트에서도 떼어 내요.`)) return;
      const r = await run(() => api("skills/" + s.name, { method: "DELETE" }));
      if (r) { toast(r.detached_from.length ? `지웠어요. (${r.detached_from.join(", ")}에서 떼어 냄)` : "지웠어요."); close(); await load(); skillsPage(); }
    } }, "지우기") : null,
    h("button", { class: "btn", onclick: close }, "취소"),
    h("button", { class: "btn primary", onclick: async () => {
      if (await run(() => api("skills", { body: { name: name.value.trim(), description: desc.value, body: body.value, source: s.source } }), "저장했어요.")) { close(); await load(); skillsPage(); }
    } }, "저장")]);
}

function importDialog() {
  const url = h("input", { type: "url", placeholder: "https://github.com/사용자/저장소/tree/main/skills/스킬이름" });
  const name = h("input", { type: "text", placeholder: "저장할 이름 (비워 두면 자동)" });
  const prev = h("div", {});
  let p = null;
  drawer("⬇ GitHub에서 스킬 가져오기", h("div", {},
    h("p", { class: "muted small" }, "스킬 폴더나 SKILL.md 파일 주소를 넣고 먼저 미리보기를 하세요. 같은 이름의 스킬이 있으면 새 내용으로 교체돼요."),
    h("label", { class: "f" }, h("span", {}, "GitHub 주소"), url),
    h("div", { class: "row mt-s" }, h("button", { class: "btn", onclick: async () => {
      p = await run(() => api("skills/import/preview", { body: { url: url.value } }));
      if (!p) return;
      name.value = p.name;
      fill(prev, 
        p.exists ? h("div", { class: "tag", style: "color:var(--warn);margin-top:12px" }, "⚠️ 같은 이름이 있어요. 저장하면 교체돼요.") : null,
        h("label", { class: "f" }, h("span", {}, "이름"), name),
        h("p", { class: "muted small" }, p.description || "(설명 없음)"),
        h("pre", { class: "log" }, p.body.slice(0, 6000)));
    } }, "미리보기")),
    prev),
  (close) => [h("button", { class: "btn", onclick: close }, "취소"),
    h("button", { class: "btn primary", onclick: async () => {
      if (!p) return toast("먼저 미리보기를 해 주세요.", true);
      if (await run(() => api("skills/import/save", { body: { url: url.value, sha: p.sha, name: name.value.trim() } }), "가져왔어요.")) { close(); await load(); skillsPage(); }
    } }, "저장")]);
}

/* ---------- 영상 스튜디오 ---------- */
const DRAFT_KEY = "crew29.studio";
function defaultProject() {
  return { title: "새 릴스", theme: "dark", accent: "", show_page: true, bgm: "", bgm_volume: 0.15,
    voice: { engine: "none", name: "ko-KR-SunHiNeural", rate: "+0%", command: "" },
    cards: [{ emoji: "✨", title: "첫 장 제목", body: "눈길을 끄는 한 줄", narration: "", duration: "" }] };
}

function studio() {
  const d = S.data;
  let proj;
  try { proj = JSON.parse(localStorage.getItem(DRAFT_KEY)) || defaultProject(); } catch { proj = defaultProject(); }
  let cur = 0;
  const save = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(proj)); } catch { /* 저장 못 해도 동작 */ } };
  head("영상 스튜디오", "릴스 카드영상 만들기",
    h("button", { class: "btn", onclick: aiDialog }, "🤖 AI에게 맡기기"),
    h("button", { class: "btn", onclick: jsonDialog }, "{ } JSON"),
    h("button", { class: "btn primary", onclick: async () => {
      const j = await run(() => api("videos", { body: proj }), "영상을 만들기 시작했어요.");
      if (j) { await load(); drawJobs(); }
    } }, "▶ 영상 만들기"));

  const frame = h("iframe", { title: "미리보기" });
  let pending = null;
  async function preview() {
    clearTimeout(pending);
    pending = setTimeout(async () => {
      try {
        const html = await api("videos/preview", { body: { project: proj, index: cur } });
        frame.srcdoc = html;
      } catch (e) { /* 입력 중에는 조용히 */ }
    }, 250);
  }
  const bind = (obj, key, el, after) => { el.addEventListener("input", () => { obj[key] = el.value; save(); preview(); after && after(); }); return el; };
  const scenes = h("div", {});
  function drawScenes() {
    fill(scenes, ...proj.cards.map((c, i) => {
      const box = h("div", { class: "scene" + (i === cur ? " on" : ""), onclick: () => { if (cur !== i) { cur = i; drawScenes(); preview(); } } },
        h("div", { class: "spread" }, h("div", { class: "row" }, h("span", { class: "n" }, i + 1), h("b", {}, c.title || "(제목 없음)")),
          h("div", { class: "row" },
            h("button", { class: "btn ghost sm", title: "위로", onclick: (e) => { e.stopPropagation(); move(i, -1); } }, "↑"),
            h("button", { class: "btn ghost sm", title: "아래로", onclick: (e) => { e.stopPropagation(); move(i, 1); } }, "↓"),
            h("button", { class: "btn ghost sm danger", title: "지우기", onclick: (e) => {
              e.stopPropagation();
              if (proj.cards.length === 1) return toast("카드는 한 장 이상 있어야 해요.", true);
              proj.cards.splice(i, 1); cur = Math.min(cur, proj.cards.length - 1); save(); drawScenes(); preview();
            } }, "✕"))));
      if (i === cur) box.append(
        h("div", { class: "grid", style: "grid-template-columns:80px 1fr;gap:8px;margin-top:8px" },
          bind(c, "emoji", h("input", { type: "text", value: c.emoji, placeholder: "이모지" })),
          bind(c, "title", h("input", { type: "text", value: c.title, placeholder: "제목" }), () => box.querySelector("b").textContent = c.title || "(제목 없음)")),
        bind(c, "body", h("textarea", { rows: 3, value: c.body, placeholder: "내용 (줄바꿈 가능)", style: "margin-top:8px" })),
        h("div", { class: "grid", style: "grid-template-columns:1fr 110px;gap:8px;margin-top:8px" },
          bind(c, "narration", h("input", { type: "text", value: c.narration, placeholder: "🔊 읽어 줄 문장 (목소리·자막)" })),
          bind(c, "duration", h("input", { type: "number", min: "1", step: "0.5", value: c.duration ?? "", placeholder: "초 (자동)" }))));
      return box;
    }));
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= proj.cards.length) return;
    [proj.cards[i], proj.cards[j]] = [proj.cards[j], proj.cards[i]];
    cur = j; save(); drawScenes(); preview();
  }
  const themeSel = bind(proj, "theme", h("select", {}, d.options.themes.map(t => h("option", { value: t, selected: t === proj.theme }, { dark: "어둡게", light: "밝게", pop: "화려하게" }[t] || t))));
  const engine = h("select", {}, [["none", "목소리 없음"], ["edge", "무료 목소리 (edge-tts)"], ["command", "외부 프로그램 연결"]].map(([v, l]) => h("option", { value: v, selected: proj.voice.engine === v }, l)));
  const voiceSel = bind(proj.voice, "name", h("select", {}, d.options.voices.map(v => h("option", { value: v.id, selected: v.id === proj.voice.name }, v.label))));
  const rate = bind(proj.voice, "rate", h("select", {}, ["-20%", "-10%", "+0%", "+10%", "+20%", "+30%"].map(r => h("option", { value: r, selected: r === proj.voice.rate }, "속도 " + r))));
  const cmd = bind(proj.voice, "command", h("input", { type: "text", value: proj.voice.command, placeholder: "예) python my_tts.py --text {text} --out {out} --voice {voice}" }));
  const voiceBox = h("div", {});
  const drawVoice = () => fill(voiceBox, 
    proj.voice.engine === "edge" ? h("div", { class: "grid g2 mt-s" }, voiceSel, rate) : null,
    proj.voice.engine === "edge" && !d.checks.edge_tts ? h("div", { class: "muted small mt-s" }, "⚠️ edge-tts가 없어요. PowerShell에서 pip install edge-tts 를 실행해 주세요.") : null,
    proj.voice.engine === "command" ? h("div", { class: "mt-s" }, cmd, h("div", { class: "muted small mt-s" }, "{text}=읽을 문장, {out}=저장할 파일, {voice}=목소리 이름. ElevenLabs 같은 유료 음성도 스크립트로 연결할 수 있어요.")) : null);
  engine.addEventListener("change", () => { proj.voice.engine = engine.value; save(); drawVoice(); });
  drawVoice();

  page(h("div", { class: "studio" },
    h("div", {},
      h("div", { class: "card" },
        h("div", { class: "grid g2" },
          h("label", { class: "f", style: "margin-top:0" }, h("span", {}, "영상 제목 (카드 위쪽에 표시)"), bind(proj, "title", h("input", { type: "text", value: proj.title }))),
          h("label", { class: "f", style: "margin-top:0" }, h("span", {}, "분위기"), themeSel)),
        h("div", { class: "grid g2" },
          h("label", { class: "f" }, h("span", {}, "강조 색 (비우면 기본)"), bind(proj, "accent", h("input", { type: "text", value: proj.accent, placeholder: "#ffcc00" }))),
          h("label", { class: "f" }, h("span", {}, "배경음악 파일 경로 (선택)"), bind(proj, "bgm", h("input", { type: "text", value: proj.bgm, placeholder: "C:\\음악\\bgm.mp3" })))),
        h("label", { class: "f" }, h("span", {}, "🔊 목소리"), engine), voiceBox),
      h("div", { class: "spread mt" }, h("h3", {}, `카드 ${proj.cards.length}장`),
        h("button", { class: "btn sm", onclick: () => {
          proj.cards.push({ emoji: "", title: "새 카드", body: "", narration: "", duration: "" });
          cur = proj.cards.length - 1; save(); drawScenes(); preview();
        } }, "+ 카드 추가")),
      scenes,
      h("h2", {}, "만든 영상"), h("div", { id: "jobs" })),
    h("div", {}, h("div", { class: "phone" }, frame), h("div", { class: "muted small mt-s", style: "text-align:center" }, "미리보기 (선택한 카드)"))));
  drawScenes(); preview(); drawJobs();
  S.timer = setInterval(async () => {
    if (S.data.videos.some(v => v.status === "running")) { await load(); drawJobs(); }
  }, 2000);

  function jsonDialog() {
    const ta = h("textarea", { rows: 22, class: "code", value: JSON.stringify(proj, null, 2) });
    drawer("{ } 프로젝트 JSON", h("div", {}, h("p", { class: "muted small" }, "Claude나 다른 프로그램이 만든 JSON을 붙여 넣으면 그대로 불러와요. 같은 JSON으로 명령어 `python -m crew29 video render 파일.json`도 쓸 수 있어요."), ta),
      (close) => [h("button", { class: "btn", onclick: () => { navigator.clipboard?.writeText(ta.value); toast("복사했어요."); } }, "복사"),
        h("button", { class: "btn primary", onclick: () => {
          try { const p = JSON.parse(ta.value); if (!Array.isArray(p.cards) || !p.cards.length) throw new Error("cards가 필요해요.");
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...defaultProject(), ...p, voice: { ...defaultProject().voice, ...(p.voice || {}) } }));
            close(); studio(); toast("불러왔어요.");
          } catch (e) { toast("JSON을 읽지 못했어요: " + e.message, true); }
        } }, "불러오기")]);
  }

  function aiDialog() {
    const topic = h("textarea", { rows: 3, placeholder: "예) 초보자를 위한 Claude 활용 팁 5가지, 밝은 분위기, 여성 목소리" });
    const hasProducer = d.agents.some(a => a.name === "reels-producer");
    drawer("🤖 AI에게 릴스 맡기기", h("div", {},
      h("p", { class: "muted small" }, "reels-producer 에이전트가 기획 → 대본 → 카드 문구 → 영상 만들기까지 해요. 결과는 미션 화면과 아래 '만든 영상' 폴더(data/videos)에 생겨요."),
      !hasProducer ? h("p", { style: "color:var(--warn)" }, "⚠️ reels-producer 에이전트가 없어요. 팀 화면에서 먼저 만들어 주세요.") : null,
      h("label", { class: "f" }, h("span", {}, "주제와 원하는 느낌"), topic)),
    (close) => [h("button", { class: "btn", onclick: close }, "취소"),
      h("button", { class: "btn primary", disabled: !hasProducer, onclick: async () => {
        const m = await run(() => api("missions", { body: { goal: "릴스 카드영상 만들기: " + topic.value, mode: "one", agent: "reels-producer", review: true } }), "맡겼어요.");
        if (m) { close(); await load(); location.hash = "#/mission/" + m.id; }
      } }, "맡기기")]);
  }
}

function drawJobs() {
  const el = $("#jobs");
  if (!el) return;
  const jobs = S.data.videos;
  fill(el, jobs.length ? h("div", { class: "grid g2" }, jobs.map(j => h("div", { class: "card" },
    h("div", { class: "spread" }, h("b", { class: "ellipsis" }, j.title), status(j.status)),
    h("div", { class: "muted small mt-s" }, j.status === "running" ? j.message : j.status === "failed" ? j.error : `${j.cards}장 · ${j.duration}초 · ${ago(j.created_at)}`),
    j.status === "done" ? h("div", { class: "mt-s" }, h("video", { src: `/files/videos/${j.id}/video.mp4`, controls: true, preload: "metadata" }),
      h("div", { class: "row mt-s" },
        h("a", { class: "btn sm", href: `/files/videos/${j.id}/video.mp4`, download: j.slug + ".mp4" }, "⬇ MP4"),
        h("a", { class: "btn sm", href: `/files/videos/${j.id}/subtitles.srt`, download: j.slug + ".srt" }, "자막"),
        h("a", { class: "btn sm", href: `/files/videos/${j.id}/manifest.json`, target: "_blank" }, "타임라인"),
        h("span", { class: "muted small" }, "폴더: data/videos/" + j.id))) : null,
    j.status !== "running" ? h("button", { class: "btn ghost sm danger mt-s", onclick: async () => {
      if (!confirm("이 영상을 지울까요?")) return;
      if (await run(() => api("videos/" + j.id, { method: "DELETE" }), "지웠어요.")) { await load(); drawJobs(); }
    } }, "지우기") : null)))
    : h("div", { class: "list" }, h("div", { class: "empty" }, "아직 만든 영상이 없어요.")));
}

/* ---------- 설정 ---------- */
function settings() {
  const d = S.data;
  head("설정", "도구 점검과 실행 설정");
  const items = [
    ["claude", "Claude Code", "미션 실행", "Claude Code를 설치하고 로그인해 주세요."],
    ["ffmpeg", "ffmpeg", "영상 만들기", "PowerShell에서: winget install ffmpeg"],
    ["browser", "Edge / Chrome", "카드 그리기", "윈도우에는 Edge가 기본으로 있어요."],
    ["edge_tts", "edge-tts", "무료 목소리 (선택)", "PowerShell에서: pip install edge-tts"],
  ];
  const cmd = h("input", { type: "text", value: d.settings.claude_cmd, placeholder: "비워 두면 자동으로 찾아요" });
  const tools = h("textarea", { rows: 10, class: "code", value: d.settings.allowed_tools.join("\n") });
  const turns = h("input", { type: "number", min: "5", max: "300", value: d.settings.max_turns });
  page(
    h("h2", {}, "도구 점검"),
    h("div", { class: "list" }, items.map(([k, name, use, fix]) => h("div", { class: "item" },
      h("span", {}, d.checks[k] ? "✅" : "❌"), h("div", { class: "grow" }, h("b", {}, name), " ", h("span", { class: "muted small" }, use)),
      d.checks[k] ? h("span", { class: "muted small" }, "준비됨") : h("code", { class: "small" }, fix)))),
    h("h2", {}, "미션 실행 설정"),
    h("div", { class: "card" },
      h("label", { class: "f", style: "margin-top:0" }, h("span", {}, "claude 명령 위치"), cmd),
      h("label", { class: "f" }, h("span", {}, "최대 턴 수 (미션이 너무 길어지지 않게)"), turns),
      h("label", { class: "f" }, h("span", {}, "허락 없이 쓸 수 있는 도구 (한 줄에 하나)"), tools),
      h("p", { class: "muted small" }, "여기에 없는 도구(예: 아무 명령이나 실행하는 Bash)는 미션 중에 쓰지 못해요. 안전을 위해 꼭 필요한 것만 넣으세요."),
      h("div", { class: "row mt" }, h("button", { class: "btn primary", onclick: async () => {
        if (await run(() => api("settings", { body: { claude_cmd: cmd.value, allowed_tools: tools.value, max_turns: turns.value } }), "저장했어요.")) await load();
      } }, "저장"))),
  );
}

/* ---------- 시작 ---------- */
window.addEventListener("hashchange", () => { fill($("#layer")); route(); });
load().then(route).catch(e => page(h("div", { class: "card" }, "대시보드를 불러오지 못했어요: " + e.message)));
