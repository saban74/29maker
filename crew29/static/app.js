"use strict";
/* 29 Crew 대시보드. 화면 그리기는 h()로만 해서 사용자 글이 HTML로 해석되지 않게 한다. */

const S = { data: null, timer: null };
const $ = (sel) => document.querySelector(sel);
const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
const COLOR = { blue: "#4f7cff", green: "#33b07a", purple: "#9b6bff", orange: "#ff8a3d", red: "#ef5f5f",
  yellow: "#d9a520", pink: "#e8649b", cyan: "#22aecc" };
const STATUS = { queued: "대기 중", running: "진행 중", stopping: "멈추는 중", done: "완료", failed: "실패",
  stopped: "멈춤", interrupted: "중단됨" };
/* 메뉴: [주소, 아이콘, 이름, 휴대폰 아래 메뉴에 보일지]. 휴대폰 아래 메뉴는 5개까지만 둔다. */
const NAV = [
  ["home", "home", "홈", true], ["missions", "target", "미션", true], ["team", "users", "팀", false],
  ["skills", "book", "스킬", false], ["studio", "film", "영상", true], ["publish", "upload", "게시", true],
  ["settings", "sliders", "설정", false],
];
const MORE = ["team", "skills", "settings"];
/* 선 아이콘 (Lucide 모양). 글자 옆에 붙는 장식이라 화면 읽기 프로그램에는 숨긴다. */
const ICONS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 12h.01",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  film: "M3 5h18v14H3z M7 5v14 M17 5v14 M3 9.5h4 M17 9.5h4 M3 14.5h4 M17 14.5h4",
  upload: "M12 15V3 M7 8l5-5 5 5 M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4",
  sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
};
/* 켜고 끄는 칩: 키보드로도 누를 수 있고, 켜졌는지 화면 읽기 프로그램에 알려 준다. */
function toggleChip(c, isOn, onToggle) {
  c.tabIndex = 0;
  c.setAttribute("role", "button");
  c.setAttribute("aria-pressed", String(isOn()));
  c.onclick = () => { onToggle(); c.setAttribute("aria-pressed", String(isOn())); };
  c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.click(); } };
  return c;
}

function icon(name) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor",
    "stroke-width": name === "more" ? 3 : 1.8, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: "ico" })) svg.setAttribute(k, v);
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", ICONS[name]);
  svg.append(path);
  return svg;
}

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "value") el.value = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  // 버튼이 아닌 요소를 누를 수 있게 만들었으면 키보드(Tab, Enter, Space)로도 쓸 수 있게 한다.
  if (attrs && attrs.onclick && !["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "LABEL"].includes(el.tagName) && !attrs["aria-hidden"]) {
    el.tabIndex = 0;
    if (!el.getAttribute("role")) el.setAttribute("role", "button");
    el.addEventListener("keydown", (e) => {
      if (e.target === el && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); el.click(); }
    });
  }
  // 칸 이름이 따로 없는 입력칸은 안내 글을 이름으로 쓴다 (화면 읽기 프로그램용).
  if (["INPUT", "TEXTAREA"].includes(el.tagName) && attrs && attrs.placeholder && !attrs["aria-label"]) el.setAttribute("aria-label", attrs.placeholder);
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
  const t = h("div", { class: "toast" + (bad ? " bad" : ""), role: bad ? "alert" : "status", "aria-live": bad ? "assertive" : "polite" }, msg);
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
  const cm = document.getElementById("count-missions");
  if (cm) cm.textContent = S.data.missions.filter(m => ["running", "queued"].includes(m.status)).length || "";
  const cp = document.getElementById("count-publish");
  if (cp) cp.textContent = S.data.publish.filter(p => p.status === "pending").length || "";
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
  const [path, qs] = (location.hash.slice(2) || "home").split("?");
  const [page, arg] = path.split("/");
  const query = new URLSearchParams(qs || "");
  clearInterval(S.timer);
  const on = (id) => page === id || (page === "mission" && id === "missions");
  fill($("#nav"), ...NAV.map(([id, ico, label, mobile]) => h("a", { href: "#/" + id, class: (on(id) ? "on" : "") + (mobile ? "" : " desk-only"),
    "aria-current": on(id) ? "page" : null },
    icon(ico), label,
    id === "missions" && S.data ? h("span", { class: "count", id: "count-missions" }, S.data.missions.filter(m => ["running", "queued"].includes(m.status)).length || "") : null,
    id === "publish" && S.data ? h("span", { class: "count", id: "count-publish" }, S.data.publish.filter(p => p.status === "pending").length || "") : null)),
    h("a", { href: "#/more", class: "mobile-only" + (page === "more" || MORE.includes(page) ? " on" : ""), "aria-current": page === "more" ? "page" : null },
      icon("more"), "더보기"));
  fill($("#actions"));
  $("#subtitle").textContent = "";
  const pages = { home, missions: missionsPage, mission: missionPage, team, skills: skillsPage, studio, publish: publishPage, settings, more: morePage };
  (pages[page] || home)(arg, query);
}

function head(title, sub, ...actions) {
  $("#title").textContent = title;
  $("#subtitle").textContent = sub || "";
  fill($("#actions"), ...actions);
}
const page = (...kids) => fill($("#page"), ...kids);

/* 휴대폰 '더보기': 아래 메뉴에 못 들어간 화면들 */
function morePage() {
  head("더보기", "");
  const d = S.data;
  const desc = { team: `에이전트 ${d.agents.length}명`, skills: `스킬 ${d.skills.length}개`, settings: "도구 점검 · 계정 연결" };
  page(h("div", { class: "list" }, NAV.filter(([id]) => MORE.includes(id)).map(([id, ico, label]) =>
    h("a", { class: "item", href: "#/" + id }, icon(ico), h("div", { class: "grow" }, h("b", {}, label), h("div", { class: "muted small" }, desc[id])), "›"))));
}

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
    teamMap(d),
    h("div", { class: "grid g4 stats mt" },
      stat("에이전트", d.agents.length, "#/team"), stat("스킬", d.skills.length, "#/skills"),
      stat("미션", d.missions.length, "#/missions"), stat("영상", d.videos.length, "#/studio")),
    h("h2", {}, "진행 중"),
    running.length ? missionList(running) : h("div", { class: "list" }, h("div", { class: "empty" }, "지금 돌고 있는 미션이 없어요.")),
    h("h2", {}, "최근 결과"),
    missionList(d.missions.filter(m => !running.includes(m)).slice(0, 6)),
  );
  requestAnimationFrame(() => document.querySelectorAll(".teammap").forEach(drawTeamLinks));
  S.timer = setInterval(async () => { await load(); if (location.hash.startsWith("#/home") || !location.hash) home(); }, 4000);
}
/* ---------- AI 팀 구조도 (029 Maker 홈과 같은 모양) ---------- */
const MODEL_LABEL = { opus: "opus", sonnet: "sonnet", haiku: "haiku", inherit: "기본 모델" };
const ROLES = [["lead", "TEAM LEAD", "팀장"], ["research", "RESEARCH", "조사"], ["maker", "MAKER", "제작"], ["review", "REVIEW", "검수"]];
/* 역할 나누기: 이름이 reviewer로 끝나면 검수, research가 들어가면 조사, 나머지는 제작 */
const roleOf = (a) => isReviewer(a.name) ? "review" : a.name.includes("research") ? "research" : "maker";
/* 'claude-opus-5-5' → 'opus-5-5' 처럼 짧게 */
const shortModel = (m) => (m || "").replace(/^claude-/, "");

function teamGroups(d) {
  // 모델마다 상자 하나. 팀장(총감독)은 Claude Code 기본 모델로 돈다.
  const nodes = {};
  const add = (model, role, name) => {
    const n = nodes[model] = nodes[model] || { model, roles: new Set(), agents: [] };
    n.roles.add(role);
    if (name) n.agents.push(name);
  };
  add("inherit", "lead", "");
  for (const a of d.agents) add(a.model || "inherit", roleOf(a), a.name);
  const order = ["inherit", "opus", "sonnet", "haiku"];
  return Object.values(nodes).sort((x, y) => order.indexOf(x.model) - order.indexOf(y.model));
}

function teamMap(d) {
  const nodes = teamGroups(d);
  const act = d.activity || {};
  const busyAgent = d.agents.find(a => a.name === act.agent);
  const busyModel = act.mission ? (busyAgent ? (busyAgent.model || "inherit") : "inherit") : null;
  const glyph = () => h("div", { class: "tm-glyph", "aria-hidden": "true" }, Array.from({ length: 12 }, () => h("i", {})));
  const busyRole = !act.mission ? "" : busyAgent ? roleOf(busyAgent) : "lead";
  const modelName = (m) => m === "inherit" && d.default_model ? shortModel(d.default_model) : (MODEL_LABEL[m] || m);
  const box = h("div", { class: "teammap", "data-busy-role": busyRole },
    h("div", { class: "tm-roles" }, ROLES.map(([key, en, ko]) =>
      h("div", { class: "tm-role", "data-role": key }, h("span", { class: "tm-ico", "aria-hidden": "true" }, "⌘"), h("b", {}, en), h("span", {}, ko)))),
    h("div", { class: "tm-nodes" }, nodes.map(n => {
      const busy = busyModel === n.model;
      const roles = ROLES.filter(([k]) => n.roles.has(k)).map(([, en]) => en).join(" · ");
      const names = n.agents.slice(0, 3).join(", ") + (n.agents.length > 3 ? ` 외 ${n.agents.length - 3}` : "");
      return h("a", { class: "tm-node" + (busy ? " busy" : ""), href: "#/team", "data-model": n.model, "data-roles": [...n.roles].join(" ") },
        h("div", { class: "tm-frame" }, h("div", { class: "tm-tile" }, glyph())),
        h("b", { class: "tm-name" }, n.model === "inherit" ? "기본 모델" : modelName(n.model)),
        h("span", { class: "tm-state" }, busy ? (busyAgent ? `${busyAgent.name} 일하는 중` : "지휘하는 중") : "쉬는 중"),
        h("span", { class: "tm-meta" }, roles + " · " + modelName(n.model)),
        names ? h("span", { class: "tm-agents" }, "+ " + names) : null);
    })),
    h("div", { class: "tm-report" }, h("span", {}, "REPORT"), " 결과 보고 · 검수"));
  return h("section", { class: "tm-wrap", "aria-label": "AI 팀 구조" },
    h("div", { class: "tm-head" }, h("h3", {}, "AI 팀"), h("span", { class: "muted" }, "팀장이 일을 나누고, 결과를 모아 검수합니다."),
      h("a", { class: "tm-link", href: "#/team" }, "팀 구성 바꾸기 →")),
    box);
}

/* 상자 사이 연결선: 화면 크기에 맞춰 다시 그린다. */
function drawTeamLinks(box) {
  box.querySelector("svg.tm-lines")?.remove();
  if (getComputedStyle(box).display === "none" || window.innerWidth <= 860) return;
  const NS = "http://www.w3.org/2000/svg";
  const r0 = box.getBoundingClientRect();
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "tm-lines");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", r0.width);
  svg.setAttribute("height", r0.height);
  svg.innerHTML = `<defs><marker id="tm-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="currentColor"/></marker></defs>`;
  const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - r0.left, y: r.top - r0.top, w: r.width, h: r.height }; };
  const path = (d, cls) => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("class", cls); svg.append(p); return p; };
  const dot = (x, y) => { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 2.5); c.setAttribute("class", "tm-dot"); svg.append(c); };
  const rolesBox = rel(box.querySelector(".tm-roles"));
  const nodes = [...box.querySelectorAll(".tm-node")];
  box.querySelectorAll(".tm-role").forEach((roleEl, i) => {
    const r = rel(roleEl);
    const sx = rolesBox.x + rolesBox.w + 10, sy = r.y + r.h / 2;
    const targets = nodes.filter(n => n.dataset.roles.split(" ").includes(roleEl.dataset.role));
    if (targets.length) dot(sx, sy);
    targets.forEach(n => {
      const f = rel(n.querySelector(".tm-frame"));
      const tx = f.x + f.w / 2 + (i - 1.5) * 5, ty = f.y - 4, rad = 12;
      path(`M${sx} ${sy} H${tx - rad} Q${tx} ${sy} ${tx} ${sy + rad} V${ty}`, "tm-line" + (n.classList.contains("busy") && box.dataset.busyRole === roleEl.dataset.role ? " busy" : "")).setAttribute("marker-end", "url(#tm-arrow)");
    });
  });
  // 결과 보고: 각 모델에서 아래로 모여 팀장에게 돌아간다.
  const rep = rel(box.querySelector(".tm-report"));
  const ry = rep.y + rep.h / 2;
  const back = rolesBox.x + 140;
  nodes.forEach(n => {
    const nb = rel(n);
    const x = nb.x + nb.w / 2;
    dot(x, nb.y + nb.h + 8);
    path(`M${x} ${nb.y + nb.h + 8} V${ry}`, "tm-line dashed");
  });
  const last = nodes.length ? rel(nodes[nodes.length - 1]) : { x: back, w: 0 };
  path(`M${last.x + last.w / 2} ${ry} H${rep.x + rep.w + 8}`, "tm-line dashed");
  path(`M${rep.x - 8} ${ry} H${back + 12} Q${back} ${ry} ${back} ${ry - 12} V${rolesBox.y + rolesBox.h + 26}`, "tm-line dashed").setAttribute("marker-end", "url(#tm-arrow)");
  box.prepend(svg);
}
window.addEventListener("resize", () => document.querySelectorAll(".teammap").forEach(drawTeamLinks));

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
  const before = document.activeElement;
  const onKey = (e) => { if (e.key === "Escape") close(); };
  const close = () => {
    document.removeEventListener("keydown", onKey);
    fill($("#layer"));
    if (before && before.isConnected) before.focus();
  };
  const panel = h("div", { class: "drawer", role: "dialog", "aria-modal": "true", "aria-labelledby": "drawer-title" },
    h("div", { class: "head" }, h("h3", { id: "drawer-title" }, title),
      h("button", { class: "btn ghost sm", style: "margin-left:auto", onclick: close, "aria-label": "닫기" }, "✕")),
    h("div", { class: "body" }, body), h("div", { class: "foot" }, actions(close)));
  fill($("#layer"), h("div", { class: "drawer-bg", onclick: close, "aria-hidden": "true" }), panel);
  document.addEventListener("keydown", onKey);
  const first = panel.querySelector(".body input:not([disabled]), .body textarea, .body select, .body button") || panel.querySelector("button");
  if (first) first.focus();
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
    return toggleChip(c, () => set.has(x), () => {
      if (set.has(x)) set.delete(x);
      else if (max && set.size >= max) return toast(`스킬은 ${max}개까지 달 수 있어요.`, true);
      else set.add(x);
      c.classList.toggle("on", set.has(x));
    });
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
const ENGINE_LABEL = { none: "목소리 없음", edge: "무료 목소리 (edge-tts)", elevenlabs: "ElevenLabs (유료)",
  typecast: "타입캐스트 (유료)", command: "외부 프로그램 연결" };
const SIZES = { reels: [1080, 1920], shorts: [1080, 1920], tiktok: [1080, 1920], youtube: [1920, 1080], square: [1080, 1080], carousel: [1080, 1350] };
const EDIT_DEFAULTS = { subtitles: true, subtitle_style: "box", subtitle_position: "bottom", motion: true, duck: true,
  logo: "", logo_position: "top-right", intro: "", outro: "", intro_duration: 2 };

function defaultProject() {
  return { title: "새 릴스", format: "reels", theme: "dark", accent: "", show_page: true, bgm: "", bgm_volume: 0.15,
    voice: { engine: "none", name: "ko-KR-SunHiNeural", rate: "+0%", command: "" }, edit: { ...EDIT_DEFAULTS },
    cards: [{ emoji: "✨", title: "첫 장 제목", body: "눈길을 끄는 한 줄", narration: "", duration: "" }] };
}
function loadDraft() {
  const base = defaultProject();
  try {
    const p = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (p && Array.isArray(p.cards) && p.cards.length) return { ...base, ...p, voice: { ...base.voice, ...(p.voice || {}) }, edit: { ...base.edit, ...(p.edit || {}) } };
  } catch { /* 저장된 게 없거나 깨짐 */ }
  return base;
}

function studio() {
  const d = S.data;
  const proj = loadDraft();
  let cur = 0;
  const save = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(proj)); } catch { /* 저장 못 해도 동작 */ } };
  const isImages = () => d.options.image_formats.includes(proj.format);
  head("영상 스튜디오", "숏폼 영상 · 카드형 이미지 만들기",
    h("button", { class: "btn", onclick: aiDialog }, "🤖 AI에게 맡기기"),
    h("button", { class: "btn", onclick: jsonDialog }, "{ } JSON"),
    h("button", { class: "btn primary", onclick: async () => {
      const j = await run(() => api("videos", { body: proj }), "만들기 시작했어요.");
      if (j) { await load(); drawJobs(); }
    } }, "▶ 만들기"));

  const frame = h("iframe", { title: "미리보기" });
  const phone = h("div", { class: "phone" }, frame);
  function sizePhone() {
    const [w, hh] = SIZES[proj.format] || SIZES.reels;
    const boxW = w > hh ? 320 : 270;
    phone.style.width = boxW + "px";
    phone.style.height = Math.round(boxW * hh / w) + "px";
    frame.style.width = w + "px";
    frame.style.height = hh + "px";
    frame.style.transform = `scale(${boxW / w})`;
  }
  let pending = null;
  function preview() {
    clearTimeout(pending);
    pending = setTimeout(async () => {
      try { frame.srcdoc = await api("videos/preview", { body: { project: proj, index: cur } }); } catch { /* 입력 중에는 조용히 */ }
    }, 250);
  }
  const changed = () => { save(); preview(); };
  const bind = (obj, key, el, after) => {
    const ev = el.type === "checkbox" ? "change" : "input";
    el.addEventListener(ev, () => { obj[key] = el.type === "checkbox" ? el.checked : el.value; changed(); after && after(); });
    return el;
  };
  const sel = (obj, key, pairs) => bind(obj, key, h("select", {}, pairs.map(([v, l]) => h("option", { value: v, selected: String(obj[key]) === String(v) }, l))));
  const check = (obj, key, label) => h("label", { class: "row" }, bind(obj, key, h("input", { type: "checkbox", checked: !!obj[key] })), label);
  const field = (label, el, style) => h("label", { class: "f", style }, h("span", {}, label), el);

  /* 카드 목록 */
  const scenes = h("div", {});
  function drawScenes() {
    fill(scenes, ...proj.cards.map((c, i) => {
      c.background = c.background || { type: "none", path: "", prompt: "", use_card_image: false };
      const box = h("div", { class: "scene" + (i === cur ? " on" : ""), onclick: () => { if (cur !== i) { cur = i; drawScenes(); preview(); } } },
        h("div", { class: "spread" }, h("div", { class: "row" }, h("span", { class: "n" }, i + 1), h("b", {}, c.title || "(제목 없음)"),
          c.background.type !== "none" ? h("span", { class: "tag accent" }, c.background.type === "higgsfield" ? "🎥 AI 클립" : "🎞 내 영상") : null),
          h("div", { class: "row" },
            h("button", { class: "btn ghost sm", title: "위로", "aria-label": `${i + 1}번 카드 위로`, onclick: (e) => { e.stopPropagation(); move(i, -1); } }, "↑"),
            h("button", { class: "btn ghost sm", title: "아래로", "aria-label": `${i + 1}번 카드 아래로`, onclick: (e) => { e.stopPropagation(); move(i, 1); } }, "↓"),
            h("button", { class: "btn ghost sm danger", title: "지우기", "aria-label": `${i + 1}번 카드 지우기`, onclick: (e) => {
              e.stopPropagation();
              if (proj.cards.length === 1) return toast("카드는 한 장 이상 있어야 해요.", true);
              proj.cards.splice(i, 1); cur = Math.min(cur, proj.cards.length - 1); save(); drawScenes(); preview();
            } }, "✕"))));
      if (i === cur) {
        const bg = c.background;
        const bgBox = h("div", {});
        const drawBg = () => fill(bgBox,
          bg.type === "video" ? bind(bg, "path", h("input", { type: "text", value: bg.path, placeholder: "C:\\영상\\배경.mp4", style: "margin-top:8px" })) : null,
          bg.type === "higgsfield" ? h("div", {},
            bind(bg, "prompt", h("textarea", { rows: 2, value: bg.prompt, placeholder: "AI 클립 설명 (영어가 더 잘 돼요) 예) slow drone shot over autumn camping site at sunset", style: "margin-top:8px" })),
            h("div", { class: "row mt-s" }, check(bg, "use_card_image", "카드 이미지를 바탕으로 움직이기 (공개 주소 필요)")),
            !d.linked.higgsfield ? h("div", { class: "muted small mt-s" }, "⚠️ 힉스필드 API 키가 없어요. ", h("a", { href: "#/settings", class: "tag accent" }, "설정 → 연결")) : null) : null);
        const bgSel = sel(bg, "type", [["none", "배경: 기본 (카드 색)"], ["video", "배경: 내 영상 파일"], ["higgsfield", "배경: AI 클립 (힉스필드)"]]);
        bgSel.addEventListener("change", () => { drawBg(); drawScenes(); });
        drawBg();
        box.append(
          h("div", { class: "grid", style: "grid-template-columns:80px 1fr;gap:8px;margin-top:8px" },
            bind(c, "emoji", h("input", { type: "text", value: c.emoji, placeholder: "이모지" })),
            bind(c, "title", h("input", { type: "text", value: c.title, placeholder: "제목" }), () => box.querySelector("b").textContent = c.title || "(제목 없음)")),
          bind(c, "body", h("textarea", { rows: 3, value: c.body, placeholder: "내용 (줄바꿈 가능)", style: "margin-top:8px" })),
          isImages() ? null : h("div", { class: "grid", style: "grid-template-columns:1fr 110px;gap:8px;margin-top:8px" },
            bind(c, "narration", h("input", { type: "text", value: c.narration, placeholder: "🔊 읽어 줄 문장 (목소리·자막)" })),
            bind(c, "duration", h("input", { type: "number", min: "1", step: "0.5", value: c.duration ?? "", placeholder: "초 (자동)" }))),
          isImages() ? null : h("div", { style: "margin-top:8px", onclick: (e) => e.stopPropagation() }, bgSel, bgBox));
      }
      return box;
    }));
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= proj.cards.length) return;
    [proj.cards[i], proj.cards[j]] = [proj.cards[j], proj.cards[i]];
    cur = j; save(); drawScenes(); preview();
  }

  /* 목소리 */
  const voiceBox = h("div", {});
  const engine = h("select", {}, d.options.engines.map(v => h("option", { value: v, selected: proj.voice.engine === v }, ENGINE_LABEL[v] || v)));
  async function voicePicker(kind) {
    const list = h("select", {}, h("option", { value: proj.voice.name }, proj.voice.name ? "현재: " + proj.voice.name : "목소리를 불러와 주세요"));
    list.addEventListener("change", () => { proj.voice.name = list.value; save(); });
    const manual = bind(proj.voice, "name", h("input", { type: "text", value: proj.voice.name, placeholder: "목소리 ID 직접 입력" }));
    const loadBtn = h("button", { class: "btn sm", onclick: async () => {
      const vs = await run(() => api("voices/" + kind));
      if (vs) { fill(list, ...vs.map(v => h("option", { value: v.id, selected: v.id === proj.voice.name }, v.label))); if (!proj.voice.name && vs[0]) { proj.voice.name = vs[0].id; manual.value = vs[0].id; save(); } toast(`목소리 ${vs.length}개를 불러왔어요.`); }
    } }, "목소리 불러오기");
    return h("div", {}, h("div", { class: "row mt-s" }, list, loadBtn), h("div", { class: "mt-s" }, manual),
      !d.linked[kind] ? h("div", { class: "muted small mt-s" }, "⚠️ API 키가 없어요. ", h("a", { href: "#/settings", class: "tag accent" }, "설정 → 연결")) : null,
      kind === "elevenlabs" ? h("div", { class: "muted small mt-s" }, "ElevenLabs는 글자별 시간 정보를 줘서 자막이 목소리에 딱 맞아요.") : null);
  }
  async function drawVoice() {
    const v = proj.voice.engine;
    if (v === "edge") {
      if (!d.options.voices.some(x => x.id === proj.voice.name)) proj.voice.name = d.options.voices[0].id;
      fill(voiceBox, h("div", { class: "grid g2 mt-s" },
        sel(proj.voice, "name", d.options.voices.map(x => [x.id, x.label])),
        sel(proj.voice, "rate", ["-20%", "-10%", "+0%", "+10%", "+20%", "+30%"].map(r => [r, "속도 " + r]))),
        !d.checks.edge_tts ? h("div", { class: "muted small mt-s" }, "⚠️ edge-tts가 없어요. PowerShell에서 pip install edge-tts") : null);
    } else if (v === "elevenlabs" || v === "typecast") {
      if (d.options.voices.some(x => x.id === proj.voice.name)) proj.voice.name = "";
      fill(voiceBox, await voicePicker(v));
    } else if (v === "command") {
      fill(voiceBox, h("div", { class: "mt-s" }, bind(proj.voice, "command", h("input", { type: "text", value: proj.voice.command, placeholder: "예) python my_tts.py --text {text} --out {out} --voice {voice}" })),
        h("div", { class: "muted small mt-s" }, "{text}=읽을 문장, {out}=저장할 파일, {voice}=목소리 이름")));
    } else fill(voiceBox);
  }
  engine.addEventListener("change", () => { proj.voice.engine = engine.value; save(); drawVoice(); });

  /* 자동 편집 */
  const e = proj.edit;
  const editBox = h("div", {});
  const drawEdit = () => fill(editBox, isImages()
    ? h("div", { class: "muted small" }, "인스타 카드형은 이미지(JPEG) 묶음이라 목소리·자동 편집 없이 카드만 만들어요. 1~10장.")
    : h("div", {},
      h("div", { class: "grid g2" },
        h("div", {}, check(e, "subtitles", "자막을 영상에 입히기 (말하는 단어 강조)"),
          h("div", { class: "grid g2 mt-s" }, sel(e, "subtitle_style", [["box", "검은 상자"], ["outline", "테두리 글씨"]]),
            sel(e, "subtitle_position", [["bottom", "아래쪽"], ["middle", "가운데"]]))),
        h("div", {}, check(e, "motion", "카드가 천천히 확대되는 움직임"), h("div", { class: "mt-s" }, check(e, "duck", "목소리 나올 때 배경음악 자동으로 줄이기")))),
      h("div", { class: "grid g2" },
        field("로고 이미지 경로 (선택)", bind(e, "logo", h("input", { type: "text", value: e.logo, placeholder: "C:\\로고\\logo.png" }))),
        field("로고 위치", sel(e, "logo_position", [["top-right", "오른쪽 위"], ["top-left", "왼쪽 위"], ["bottom-right", "오른쪽 아래"], ["bottom-left", "왼쪽 아래"]]))),
      h("div", { class: "grid g3" },
        field("인트로 (이미지·영상, 선택)", bind(e, "intro", h("input", { type: "text", value: e.intro, placeholder: "C:\\영상\\intro.mp4" }))),
        field("아웃트로 (선택)", bind(e, "outro", h("input", { type: "text", value: e.outro, placeholder: "C:\\영상\\outro.png" }))),
        field("이미지 인트로·아웃트로 길이(초)", bind(e, "intro_duration", h("input", { type: "number", min: "0.5", step: "0.5", value: e.intro_duration })))),
      h("div", { class: "grid g2" },
        field("배경음악 파일 경로 (선택)", bind(proj, "bgm", h("input", { type: "text", value: proj.bgm, placeholder: "C:\\음악\\bgm.mp3" }))),
        field("배경음악 크기", sel(proj, "bgm_volume", [["0.08", "작게"], ["0.15", "보통"], ["0.25", "크게"]])))));

  const voiceCard = h("div", { class: "card mt" }, h("h3", {}, "🔊 목소리"), h("div", { class: "mt-s" }, engine), voiceBox);
  const formatSel = sel(proj, "format", Object.entries(d.options.formats));
  formatSel.addEventListener("change", () => { sizePhone(); drawEdit(); drawScenes(); voiceCard.style.display = isImages() ? "none" : ""; });
  voiceCard.style.display = isImages() ? "none" : "";

  page(h("div", { class: "studio" },
    h("div", {},
      h("div", { class: "card" },
        h("div", { class: "grid g2" },
          field("만들 형식", formatSel, "margin-top:0"),
          field("영상 제목 (카드 위쪽에 표시)", bind(proj, "title", h("input", { type: "text", value: proj.title })), "margin-top:0")),
        h("div", { class: "grid g2" },
          field("분위기", sel(proj, "theme", d.options.themes.map(t => [t, { dark: "어둡게", light: "밝게", pop: "화려하게" }[t] || t]))),
          field("강조 색 (비우면 기본)", bind(proj, "accent", h("input", { type: "text", value: proj.accent, placeholder: "#ffcc00" }))))),
      voiceCard,
      h("div", { class: "card mt" }, h("h3", {}, "✂️ 자동 편집"), h("div", { class: "mt-s" }, editBox)),
      h("div", { class: "spread mt" }, h("h3", {}, "카드"),
        h("button", { class: "btn sm", onclick: () => {
          if (isImages() && proj.cards.length >= 10) return toast("카드형은 10장까지예요.", true);
          proj.cards.push({ emoji: "", title: "새 카드", body: "", narration: "", duration: "" });
          cur = proj.cards.length - 1; save(); drawScenes(); preview();
        } }, "+ 카드 추가")),
      scenes,
      h("h2", {}, "만든 결과물"), h("div", { id: "jobs" })),
    h("div", {}, phone, h("div", { class: "muted small mt-s", style: "text-align:center" }, "미리보기 (선택한 카드)"))));
  sizePhone(); drawEdit(); drawVoice(); drawScenes(); preview(); drawJobs();
  S.timer = setInterval(async () => {
    if (S.data.videos.some(v => v.status === "running")) { await load(); drawJobs(); }
  }, 2000);

  function jsonDialog() {
    const ta = h("textarea", { rows: 22, class: "code", value: JSON.stringify(proj, null, 2) });
    drawer("{ } 프로젝트 JSON", h("div", {}, h("p", { class: "muted small" }, "Claude나 다른 프로그램이 만든 JSON을 붙여 넣으면 그대로 불러와요. 같은 JSON으로 명령어 python -m crew29 video render 파일.json 도 쓸 수 있어요."), ta),
      (close) => [h("button", { class: "btn", onclick: () => { navigator.clipboard?.writeText(ta.value); toast("복사했어요."); } }, "복사"),
        h("button", { class: "btn primary", onclick: () => {
          try {
            const p = JSON.parse(ta.value);
            if (!Array.isArray(p.cards) || !p.cards.length) throw new Error("cards가 필요해요.");
            localStorage.setItem(DRAFT_KEY, JSON.stringify(p));
            close(); studio(); toast("불러왔어요.");
          } catch (err) { toast("JSON을 읽지 못했어요: " + err.message, true); }
        } }, "불러오기")]);
  }

  function aiDialog() {
    const topic = h("textarea", { rows: 3, placeholder: "예) 초보자를 위한 Claude 활용 팁 5가지, 밝은 분위기, 여성 목소리" });
    const fmt = h("select", {}, Object.entries(d.options.formats).map(([k, l]) => h("option", { value: k, selected: k === proj.format }, l)));
    const draft = h("input", { type: "checkbox", checked: true });
    const hasProducer = d.agents.some(a => a.name === "reels-producer");
    drawer("🤖 AI에게 맡기기", h("div", {},
      h("p", { class: "muted small" }, "reels-producer가 기획 → 대본 → 카드 문구 → 만들기까지 해요. 게시는 초안까지만 만들고, 올리기는 게시 화면에서 직접 승인해요."),
      !hasProducer ? h("p", { style: "color:var(--warn)" }, "⚠️ reels-producer 에이전트가 없어요. 팀 화면에서 먼저 만들어 주세요.") : null,
      field("주제와 원하는 느낌", topic), field("형식", fmt),
      h("label", { class: "row mt" }, draft, "끝나면 게시 초안까지 만들기 (승인 대기)")),
    (close) => [h("button", { class: "btn", onclick: close }, "취소"),
      h("button", { class: "btn primary", disabled: !hasProducer, onclick: async () => {
        const goal = `${d.options.formats[fmt.value]} (format: ${fmt.value}) 만들기: ${topic.value}` +
          (draft.checked ? "\n완성되면 게시 초안도 만들어 주세요 (승인은 사람이 해요)." : "");
        const m = await run(() => api("missions", { body: { goal, mode: "one", agent: "reels-producer", review: true } }), "맡겼어요.");
        if (m) { close(); await load(); location.hash = "#/mission/" + m.id; }
      } }, "맡기기")]);
  }
}

function jobPreview(j) {
  if (j.kind === "images") return h("div", { class: "thumbs" }, j.images.map(src => h("a", { href: `/files/videos/${j.id}/${src}`, target: "_blank" }, h("img", { src: `/files/videos/${j.id}/${src}`, loading: "lazy" }))));
  return h("video", { src: `/files/videos/${j.id}/video.mp4`, controls: true, preload: "metadata" });
}

function drawJobs() {
  const el = $("#jobs");
  if (!el) return;
  const jobs = S.data.videos;
  fill(el, jobs.length ? h("div", { class: "grid g2" }, jobs.map(j => h("div", { class: "card" },
    h("div", { class: "spread" }, h("b", { class: "ellipsis" }, j.title), status(j.status)),
    h("div", { class: "muted small mt-s" }, (S.data.options.formats[j.format] || "") + " · ",
      j.status === "running" ? j.message : j.status === "failed" ? j.error : j.kind === "images" ? `${j.cards}장 · ${ago(j.created_at)}` : `${j.cards}장 · ${j.duration}초 · ${ago(j.created_at)}`),
    j.status === "done" ? h("div", { class: "mt-s" }, jobPreview(j),
      h("div", { class: "row mt-s" },
        h("button", { class: "btn sm primary", onclick: () => publishDialog(j) }, "📤 게시 준비"),
        j.kind === "video" ? h("a", { class: "btn sm", href: `/files/videos/${j.id}/video.mp4`, download: j.slug + ".mp4" }, "⬇ MP4") : null,
        j.kind === "video" ? h("a", { class: "btn sm", href: `/files/videos/${j.id}/subtitles.srt`, download: j.slug + ".srt" }, "자막") : null,
        h("a", { class: "btn sm", href: `/files/videos/${j.id}/manifest.json`, target: "_blank" }, "타임라인")),
      h("div", { class: "muted small mt-s" }, "폴더: data/videos/" + j.id)) : null,
    j.status !== "running" ? h("button", { class: "btn ghost sm danger mt-s", onclick: async () => {
      if (!confirm("이 결과물을 지울까요?")) return;
      if (await run(() => api("videos/" + j.id, { method: "DELETE" }), "지웠어요.")) { await load(); drawJobs(); }
    } }, "지우기") : null)))
    : h("div", { class: "list" }, h("div", { class: "empty" }, "아직 만든 결과물이 없어요.")));
}

/* ---------- 게시 ---------- */
const PUB_STATUS = { pending: "승인 대기", approved: "올릴 준비", scheduled: "예약됨", publishing: "올리는 중", done: "완료", failed: "실패", rejected: "보류" };
const PLATFORM = { youtube: "▶ 유튜브", instagram: "◎ 인스타그램" };

function publishDialog(j) {
  const d = S.data;
  const images = j.kind === "images";
  const pick = { youtube: !images && d.linked.youtube, instagram: d.linked.instagram || images };
  const title = h("input", { type: "text", value: j.title, maxlength: 100 });
  const caption = h("textarea", { rows: 5, placeholder: "설명 / 캡션" });
  const tags = h("input", { type: "text", placeholder: "#여행 #캠핑 (띄어쓰기로 구분)" });
  const privacy = h("select", {}, [["private", "비공개 (나만 보기)"], ["unlisted", "일부 공개 (링크 있는 사람)"], ["public", "공개"]].map(([v, l]) => h("option", { value: v }, l)));
  const when = h("input", { type: "datetime-local" });
  const chip = (k) => {
    const disabled = k === "youtube" && images;
    const c = h("span", { class: "chip" + (pick[k] ? " on" : ""), style: disabled ? "opacity:.4" : "" }, PLATFORM[k], d.linked[k] ? "" : " (연결 안 됨)");
    if (disabled) c.setAttribute("aria-disabled", "true");
    return toggleChip(c, () => pick[k], () => { if (disabled) return toast("카드형 이미지는 인스타그램에만 올릴 수 있어요.", true); pick[k] = !pick[k]; c.classList.toggle("on", pick[k]); });
  };
  drawer("📤 게시 준비", h("div", {},
    h("div", { style: "max-width:220px" }, jobPreview(j)),
    h("label", { class: "f" }, h("span", {}, "올릴 곳"), h("div", { class: "chips" }, chip("youtube"), chip("instagram"))),
    h("label", { class: "f" }, h("span", {}, "제목 (유튜브)"), title),
    h("label", { class: "f" }, h("span", {}, "설명 / 캡션"), caption),
    h("label", { class: "f" }, h("span", {}, "해시태그 (최대 30개)"), tags),
    h("div", { class: "grid g2" },
      h("label", { class: "f" }, h("span", {}, "유튜브 공개 범위"), privacy),
      h("label", { class: "f" }, h("span", {}, "예약 시간 (비우면 승인 즉시)"), when)),
    h("p", { class: "muted small mt" }, "여기서는 '승인 대기' 초안만 만들어요. 게시 화면에서 승인을 눌러야 실제로 올라가요.")),
  (close) => [h("button", { class: "btn", onclick: close }, "취소"),
    h("button", { class: "btn primary", onclick: async () => {
      const body = { video_id: j.id, platforms: Object.keys(pick).filter(k => pick[k]), title: title.value, caption: caption.value,
        hashtags: tags.value, privacy: privacy.value, schedule_at: when.value ? new Date(when.value).getTime() / 1000 : null };
      if (await run(() => api("publish", { body }), "승인 대기 목록에 올렸어요.")) { close(); await load(); location.hash = "#/publish"; }
    } }, "초안 만들기")]);
}

function publishPage() {
  head("게시", "승인하면 올라가요");
  const box = h("div", {});
  page(box);
  const draw = () => {
    const all = S.data.publish;
    const group = (title, list, empty) => [h("h2", {}, `${title} (${list.length})`),
      list.length ? h("div", { class: "grid g2" }, list.map(pubCard)) : h("div", { class: "list" }, h("div", { class: "empty" }, empty))];
    fill(box,
      !S.data.linked.youtube && !S.data.linked.instagram ? h("div", { class: "card", style: "border-color:rgba(242,177,76,.5)" },
        "⚠️ 아직 연결된 계정이 없어요. ", h("a", { href: "#/settings", class: "tag accent" }, "설정 → 연결")) : null,
      group("✋ 승인 대기", all.filter(x => x.status === "pending"), "승인할 게시가 없어요. 영상 화면에서 '📤 게시 준비'를 눌러 보세요."),
      group("⏰ 예약 · 올리는 중", all.filter(x => ["approved", "scheduled", "publishing"].includes(x.status)), "없어요."),
      group("📁 끝난 것", all.filter(x => ["done", "failed", "rejected"].includes(x.status)), "없어요."));
  };
  draw();
  S.timer = setInterval(async () => { await load(); if (location.hash.startsWith("#/publish")) draw(); }, 4000);
}

function pubCard(p) {
  const job = S.data.videos.find(v => v.id === p.video_id);
  const act = (label, path, cls, msg) => h("button", { class: "btn sm " + (cls || ""), onclick: async () => {
    if (await run(() => api(`publish/${p.id}/${path}`, { body: {} }), msg)) { await load(); route(); }
  } }, label);
  return h("div", { class: "card" },
    h("div", { class: "spread" }, h("b", { class: "ellipsis" }, p.title), h("span", { class: "row st-" + p.status, style: "gap:6px" }, h("span", { class: "dot" }), PUB_STATUS[p.status] || p.status)),
    h("div", { class: "muted small mt-s" }, (S.data.options.formats[p.format] || ""), p.schedule_at ? " · ⏰ " + new Date(p.schedule_at * 1000).toLocaleString("ko-KR") : ""),
    job && job.status === "done" ? h("div", { class: "mt-s", style: "max-width:200px" }, jobPreview(job)) : null,
    p.caption || p.hashtags.length ? h("div", { class: "small mt-s", style: "white-space:pre-wrap" }, [p.caption, p.hashtags.join(" ")].filter(Boolean).join("\n")) : null,
    h("div", { class: "list mt-s" }, p.platforms.map(k => {
      const r = p.results[k];
      return h("div", { class: "item" }, h("span", {}, PLATFORM[k]),
        h("span", { class: "grow muted small" }, { waiting: "대기", uploading: "올리는 중…", done: "완료", failed: "실패: " + r.error }[r.status] || r.status),
        r.url ? h("a", { class: "tag accent", href: r.url, target: "_blank" }, "열기") : null,
        k === "youtube" ? h("span", { class: "tag" }, { private: "비공개", unlisted: "일부 공개", public: "공개" }[p.privacy]) : null);
    })),
    h("div", { class: "row mt-s" },
      p.status === "pending" ? act("✅ 승인", "approve", "primary", p.schedule_at ? "예약했어요." : "승인했어요. 곧 올라가요.") : null,
      ["pending", "scheduled", "approved"].includes(p.status) ? act("보류", "reject", "", "보류했어요.") : null,
      p.status === "rejected" ? act("다시 승인", "approve", "", "승인했어요.") : null,
      p.status === "failed" ? act("↻ 실패한 곳만 다시", "retry", "primary", "다시 올려요.") : null,
      p.status !== "publishing" ? h("button", { class: "btn ghost sm danger", onclick: async () => {
        if (!confirm("이 게시 기록을 지울까요? (이미 올라간 게시물은 지워지지 않아요)")) return;
        if (await run(() => api("publish/" + p.id, { method: "DELETE" }), "지웠어요.")) { await load(); route(); }
      } }, "지우기") : null));
}

/* ---------- 설정 ---------- */
function settings(arg, query) {
  const d = S.data;
  head("설정", "도구 점검 · 계정 연결 · 실행 설정");
  if (query.get("yt") === "ok") toast("유튜브 연결 완료: " + (query.get("channel") || ""));
  else if (query.get("yt")) toast("유튜브 연결 실패: " + (query.get("msg") || query.get("yt")), true);
  if (query.get("yt")) history.replaceState(null, "", "#/settings");
  const items = [
    ["claude", "Claude Code", "미션 실행", "Claude Code를 설치하고 로그인해 주세요."],
    ["ffmpeg", "ffmpeg", "영상 만들기", "PowerShell에서: winget install ffmpeg"],
    ["browser", "Edge / Chrome", "카드 그리기", "윈도우에는 Edge가 기본으로 있어요."],
    ["edge_tts", "edge-tts", "무료 목소리 (선택)", "PowerShell에서: pip install edge-tts"],
  ];
  const c = d.connections;
  const inputs = {};
  const inp = (key, label, opts = {}) => {
    const secret = c[key] && c[key].startsWith("••••");
    inputs[key] = h("input", { type: secret || opts.secret ? "password" : "text", value: secret ? "" : c[key],
      placeholder: secret ? `저장됨 (${c[key]}) — 바꿀 때만 입력` : (opts.placeholder || ""), autocomplete: "off" });
    return h("label", { class: "f" }, h("span", {}, label), inputs[key]);
  };
  const saveBtn = (keys) => h("button", { class: "btn primary sm", onclick: async () => {
    const body = {};
    keys.forEach(k => { if (inputs[k].value.trim()) body[k] = inputs[k].value.trim(); });
    if (await run(() => api("connections", { body }), "저장했어요.")) { await load(); route(); }
  } }, "저장");
  const linked = (ok, text) => h("span", { class: "tag" + (ok ? " accent" : "") }, ok ? "✅ " + (text || "연결됨") : "연결 안 됨");
  const svc = (title, ok, okText, desc, keys, fields, extra) => h("div", { class: "card" },
    h("div", { class: "spread" }, h("h3", {}, title), linked(ok, okText)),
    h("p", { class: "muted small", style: "margin:6px 0 0" }, desc), ...fields, h("div", { class: "row mt" }, saveBtn(keys), extra));

  const cmd = h("input", { type: "text", value: d.settings.claude_cmd, placeholder: "비워 두면 자동으로 찾아요" });
  const tools = h("textarea", { rows: 8, class: "code", value: d.settings.allowed_tools.join("\n") });
  const turns = h("input", { type: "number", min: "5", max: "300", value: d.settings.max_turns });
  page(
    h("h2", {}, "도구 점검"),
    h("div", { class: "list" }, items.map(([k, name, use, fix]) => h("div", { class: "item" },
      h("span", {}, d.checks[k] ? "✅" : "❌"), h("div", { class: "grow" }, h("b", {}, name), " ", h("span", { class: "muted small" }, use)),
      d.checks[k] ? h("span", { class: "muted small" }, "준비됨") : h("code", { class: "small" }, fix)))),

    h("h2", {}, "🔗 연결 (유료 서비스 · 계정)"),
    h("p", { class: "muted small", style: "margin-top:-4px" }, "열쇠(API 키)는 이 PC의 data 폴더에만 저장되고 git에 올라가지 않아요. 화면에는 끝 4자리만 보여요."),
    h("div", { class: "grid g2" },
      svc("🔊 ElevenLabs", d.linked.elevenlabs, "", "자연스러운 유료 목소리. 자막 시간이 목소리에 딱 맞아요.", ["elevenlabs_key", "elevenlabs_model"],
        [inp("elevenlabs_key", "API 키", { secret: true }), inp("elevenlabs_model", "모델")]),
      svc("🔊 타입캐스트", d.linked.typecast, "", "한국어 캐릭터 목소리가 많은 유료 서비스.", ["typecast_key", "typecast_model"],
        [inp("typecast_key", "API 키", { secret: true }), inp("typecast_model", "모델")]),
      svc("🎥 힉스필드", d.linked.higgsfield, "", "카드 배경에 넣을 AI 영상 클립. 모델 경로·옵션은 힉스필드 문서를 보고 맞춰 주세요.",
        ["higgsfield_key_id", "higgsfield_key_secret", "higgsfield_base", "higgsfield_model", "higgsfield_extra"],
        [inp("higgsfield_key_id", "Key ID", { secret: true }), inp("higgsfield_key_secret", "Key Secret", { secret: true }),
          inp("higgsfield_base", "API 주소"), inp("higgsfield_model", "모델 경로"), inp("higgsfield_extra", "추가 옵션 (JSON)")]),
      svc("▶ 유튜브", d.linked.youtube, c.youtube_channel, "구글 클라우드에서 'OAuth 클라이언트(데스크톱 앱)'를 만들고 ID·비밀번호를 넣은 뒤, 이 PC 브라우저에서 '유튜브 연결'을 누르세요.",
        ["youtube_client_id", "youtube_client_secret"],
        [inp("youtube_client_id", "OAuth 클라이언트 ID"), inp("youtube_client_secret", "클라이언트 보안 비밀번호", { secret: true })],
        h("a", { class: "btn sm", href: "/oauth/youtube/start" }, d.linked.youtube ? "다시 연결" : "유튜브 연결")),
      svc("◎ 인스타그램", d.linked.instagram, "", "비즈니스·크리에이터 계정이 필요해요. Meta 개발자 앱에서 받은 계정 ID와 액세스 토큰을 넣으세요. 업로드하려면 아래 '공개 주소'도 필요해요.",
        ["instagram_user_id", "instagram_token", "instagram_api"],
        [inp("instagram_user_id", "인스타그램 계정 ID (숫자)"), inp("instagram_token", "액세스 토큰", { secret: true }), inp("instagram_api", "API 주소 (버전)")],
        h("button", { class: "btn sm", onclick: () => run(() => api("connections/test/instagram", { body: {} })).then(r => r && toast(r.message)) }, "연결 확인")),
      svc("🌐 공개 주소", d.linked.public, c.public_base_url, "인스타그램·힉스필드는 파일을 인터넷 주소로 가져가요. 대시보드는 공개하지 않고, 파일 전용 서버(아래 포트)만 공개해요. 예) Tailscale: tailscale funnel 8130 → 나온 https 주소를 넣기. 바꾼 뒤에는 대시보드를 다시 켜 주세요.",
        ["public_base_url", "public_port"],
        [inp("public_base_url", "공개 주소", { placeholder: "https://내PC.이름.ts.net" }), inp("public_port", "파일 서버 포트")])),

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
