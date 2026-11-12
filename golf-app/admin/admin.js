// PC용 골프장 관리 프로그램
// 지도에서 홀마다 그린 앞/중앙/뒤를 찍고 JSON 파일로 저장합니다.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const POINTS = [["front", "앞"], ["center", "중앙"], ["back", "뒤"]];
const DRAFT = "golf.admin.draft";

const blankCourse = (name) => ({ name, holes: Array.from({ length: 9 }, (_, i) => ({ no: i + 1, par: 4, green: {} })) });
const blankClub = () => ({ id: "", name: "", address: "", source: "", courses: [blankCourse("A 코스"), blankCourse("B 코스")] });

let club = load() || blankClub();
let cur = 0;          // 선택된 코스
let picking = null;   // { hole, point } 지도 클릭 대기 중
let layerGroup;

function load() { try { return JSON.parse(localStorage.getItem(DRAFT)); } catch { return null; } }
function save() { try { localStorage.setItem(DRAFT, JSON.stringify(club)); } catch {} }
function status(msg, ms = 2500) {
  const s = $("#status"); s.textContent = msg; s.hidden = false;
  clearTimeout(status.t); if (ms) status.t = setTimeout(() => (s.hidden = true), ms);
}

// ---------- 지도 ----------
const map = L.map("map").setView([36.5, 127.8], 7);
const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: "© OpenStreetMap contributors",
}).addTo(map);
let vworld = null;
function useLayer(kind) {
  const key = localStorage.getItem("golf.admin.vwkey") || "";
  $("#vw-row").hidden = kind !== "vworld";
  if (kind === "vworld") {
    if (!key) return status("브이월드 API 키를 넣어주세요 (vworld.kr 에서 무료 발급)");
    if (vworld) map.removeLayer(vworld);
    vworld = L.tileLayer(`https://api.vworld.kr/req/wmts/1.0.0/${encodeURIComponent(key)}/Satellite/{z}/{y}/{x}.jpeg`, {
      maxZoom: 19, attribution: "© 국토교통부 브이월드",
    }).addTo(map);
    map.removeLayer(osm);
  } else {
    if (vworld) map.removeLayer(vworld);
    osm.addTo(map);
  }
}
$("#layer").onchange = (e) => useLayer(e.target.value);
$("#vwkey").value = localStorage.getItem("golf.admin.vwkey") || "";
$("#vwsave").onclick = () => { localStorage.setItem("golf.admin.vwkey", $("#vwkey").value.trim()); useLayer("vworld"); };

map.on("click", (e) => {
  if (!picking) return;
  const hole = club.courses[cur].holes[picking.hole];
  hole.green[picking.point] = [round6(e.latlng.lat), round6(e.latlng.lng)];
  // 중앙 → 앞 → 뒤 순서로 자동으로 다음 점 대기
  const order = ["center", "front", "back"];
  const nextPoint = order.find((p) => !hole.green[p]);
  picking = nextPoint ? { hole: picking.hole, point: nextPoint } : null;
  save(); render();
  status(picking ? `${hole.no}번 홀 그린 ${label(picking.point)}을 클릭하세요` : `${hole.no}번 홀 완료`);
});
const round6 = (v) => Math.round(v * 1e6) / 1e6;
const label = (p) => POINTS.find((x) => x[0] === p)[1];

function drawMarkers() {
  if (layerGroup) layerGroup.remove();
  layerGroup = L.layerGroup().addTo(map);
  club.courses[cur].holes.forEach((h, hi) => {
    POINTS.forEach(([p, ko]) => {
      const pt = h.green[p];
      if (!pt) return;
      const m = L.marker(pt, {
        draggable: true,
        icon: L.divIcon({ className: "", html: `<div class="pin ${p}">${h.no}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
        title: `${h.no}번 홀 그린 ${ko}`,
      }).addTo(layerGroup);
      m.on("dragend", () => { const ll = m.getLatLng(); h.green[p] = [round6(ll.lat), round6(ll.lng)]; save(); });
    });
    if (h.green.front && h.green.back) L.polyline([h.green.front, h.green.back], { color: "#fff", weight: 1, dashArray: "3" }).addTo(layerGroup);
  });
}

// ---------- 화면 ----------
function render() {
  $("#name").value = club.name; $("#addr").value = club.address; $("#src").value = club.source;
  $("#course-tabs").innerHTML = club.courses.map((c, i) => `<button data-c="${i}" class="${i === cur ? "on" : ""}">${esc(c.name)}</button>`).join("");
  document.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { cur = +b.dataset.c; picking = null; render(); fitCourse(); }));
  const course = club.courses[cur];
  $("#holes").innerHTML = `<tr><th>홀</th><th>파</th><th>그린 앞</th><th>중앙</th><th>뒤</th><th>그린 깊이</th></tr>` +
    (course ? course.holes.map((h, hi) => `<tr class="${picking && picking.hole === hi ? "cur" : ""}">
      <td><b>${h.no}</b></td>
      <td><select data-par="${hi}">${[3, 4, 5, 6].map((p) => `<option ${p === h.par ? "selected" : ""}>${p}</option>`).join("")}</select></td>
      ${POINTS.map(([p, ko]) => `<td><button data-pick="${hi}:${p}" class="${h.green[p] ? "set" : ""}">${h.green[p] ? "✓ " : ""}${ko}</button></td>`).join("")}
      <td>${h.green.front && h.green.back ? Math.round(dist(h.green.front, h.green.back)) + "m" : "–"}</td>
    </tr>`).join("") : "");
  document.querySelectorAll("[data-par]").forEach((s) => (s.onchange = () => { course.holes[+s.dataset.par].par = +s.value; save(); }));
  document.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => {
    const [hi, p] = b.dataset.pick.split(":");
    picking = { hole: +hi, point: p };
    render();
    status(`${course.holes[hi].no}번 홀 그린 ${label(p)}을 지도에서 클릭하세요`, 0);
  }));
  drawMarkers();
}
function dist(a, b) {
  const R = 6371000, r = (d) => (d * Math.PI) / 180;
  const s = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function fitCourse() {
  const pts = (club.courses[cur]?.holes || []).flatMap((h) => Object.values(h.green));
  if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 17 });
}

["name", "addr", "src"].forEach((id) => ($("#" + id).oninput = () => {
  club.name = $("#name").value; club.address = $("#addr").value; club.source = $("#src").value; save();
}));
$("#add-course").onclick = () => {
  const name = prompt("코스 이름 (예: 레이크, 마운틴, OUT, IN)", `${String.fromCharCode(65 + club.courses.length)} 코스`);
  if (!name) return;
  club.courses.push(blankCourse(name)); cur = club.courses.length - 1; save(); render();
};
$("#rename-course").onclick = () => {
  const c = club.courses[cur]; if (!c) return;
  const name = prompt("새 이름", c.name); if (name) { c.name = name; save(); render(); }
};
$("#del-course").onclick = () => {
  if (club.courses.length <= 1) return status("코스는 1개 이상 있어야 해요");
  if (!confirm(`${club.courses[cur].name}을(를) 삭제할까요?`)) return;
  club.courses.splice(cur, 1); cur = 0; save(); render();
};

// ---------- 검색 (OpenStreetMap Nominatim) ----------
$("#search").onclick = async () => {
  const q = $("#q").value.trim(); if (!q) return;
  status("검색 중…");
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=8&accept-language=ko&q=${encodeURIComponent(q)}`).then((r) => r.json());
    $("#results").innerHTML = r.length ? r.map((x, i) => `<div data-i="${i}">${esc(x.display_name)}</div>`).join("") : `<p class="hint">결과가 없어요. 이름을 짧게 하거나 지도를 직접 옮겨 보세요.</p>`;
    document.querySelectorAll("#results [data-i]").forEach((d) => (d.onclick = () => {
      const x = r[+d.dataset.i];
      map.setView([+x.lat, +x.lon], 16);
      if (!club.name) { club.name = x.name || q; club.address = x.display_name; save(); render(); }
    }));
    status(`${r.length}건 찾음`);
  } catch { status("검색에 실패했어요"); }
};
$("#q").onkeydown = (e) => e.key === "Enter" && $("#search").click();

// ---------- OpenStreetMap에서 홀·그린 불러오기 ----------
$("#osm").onclick = async () => {
  if (map.getZoom() < 14) return status("골프장이 화면에 꽉 차게 확대한 뒤 눌러주세요");
  const b = map.getBounds();
  const bbox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].join(",");
  const query = `[out:json][timeout:25];(way["golf"="hole"](${bbox});way["golf"="green"](${bbox}););out geom;`;
  status("OpenStreetMap에서 불러오는 중…", 0);
  let data;
  try {
    data = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(query) }).then((r) => r.json());
  } catch { return status("불러오기 실패 (잠시 후 다시 시도)"); }
  const holes = data.elements.filter((e) => e.tags?.golf === "hole" && e.geometry?.length >= 2);
  const greens = data.elements.filter((e) => e.tags?.golf === "green" && e.geometry?.length >= 3).map((g) => g.geometry.map((p) => [p.lat, p.lon]));
  if (!holes.length) return status("이 범위에는 OpenStreetMap에 그려진 홀이 없어요. 직접 찍어주세요.");

  let filled = 0;
  holes.forEach((h) => {
    const ref = parseInt(h.tags.ref, 10);
    if (!ref) return;
    // 홀 번호 1~9 → 지금 코스, 10~18 → 다음 코스 … (27홀 골프장도 9홀씩 나눔)
    const ci = ref <= 9 ? cur : Math.floor((ref - 1) / 9);
    const course = club.courses[ci]; if (!course) return;
    const target = course.holes[(ref - 1) % 9]; if (!target) return;
    const line = h.geometry.map((p) => [p.lat, p.lon]);
    const end = line[line.length - 1], before = line[line.length - 2];
    if (h.tags.par) target.par = parseInt(h.tags.par, 10) || target.par;
    // 홀 끝점에서 가장 가까운 그린 찾기
    let best = null, bestD = 80; // 80m 이내
    greens.forEach((poly) => { const c = centroid(poly); const d = dist(c, end); if (d < bestD) { bestD = d; best = poly; } });
    if (best) {
      const c = centroid(best);
      // 홀 진행 방향으로 가장 가까운/먼 그린 가장자리 = 앞/뒤
      const dir = [end[0] - before[0], end[1] - before[1]];
      const proj = (p) => (p[0] - c[0]) * dir[0] + (p[1] - c[1]) * dir[1];
      const sorted = [...best].sort((a, b) => proj(a) - proj(b));
      target.green = { front: sorted[0].map(round6), center: c.map(round6), back: sorted[sorted.length - 1].map(round6) };
    } else {
      target.green = { center: end.map(round6) };
    }
    filled++;
  });
  if (!club.source.includes("OpenStreetMap")) club.source = (club.source ? club.source + ", " : "") + "OpenStreetMap(© OpenStreetMap contributors, ODbL)";
  save(); render(); fitCourse();
  status(`${filled}개 홀을 채웠어요. 반드시 위성사진·현장과 비교해서 확인해 주세요.`, 5000);
};
function centroid(poly) {
  const n = poly.length;
  return [poly.reduce((a, p) => a + p[0], 0) / n, poly.reduce((a, p) => a + p[1], 0) / n];
}

// ---------- 저장 / 불러오기 ----------
function slug(s) { return (s || "course").trim().replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "").toLowerCase(); }
$("#export").onclick = () => {
  if (!club.name) return status("골프장 이름을 넣어주세요");
  club.id = club.id || slug(club.name);
  club.updatedAt = new Date().toISOString().slice(0, 10);
  save();
  const blob = new Blob([JSON.stringify(club, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = club.id + ".json"; a.click();
  URL.revokeObjectURL(a.href);
};
$("#import").onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!Array.isArray(d.courses)) throw 0;
    d.courses.forEach((c) => c.holes.forEach((h) => (h.green = h.green || {})));
    club = d; cur = 0; save(); render(); fitCourse(); status("불러왔어요");
  } catch { status("골프장 JSON 파일이 아니에요"); }
  e.target.value = "";
};
$("#reset").onclick = () => { if (confirm("지금 작업을 지우고 새로 시작할까요? (저장 안 한 내용은 사라져요)")) { club = blankClub(); cur = 0; save(); render(); } };

render(); fitCourse();
