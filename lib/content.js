// content/ 폴더의 정보 파일(관리자 화면에서 저장하는 파일)을 읽어 페이지 틀에 넘겨 준다.
// - 공개 여부(published)가 false 인 항목은 홈페이지에 나오지 않는다.
// - 순서: 제품은 order(정렬 순서), 뉴스는 고정 → 날짜 최신순, 카탈로그는 분류 → order.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { imageSize } from "image-size";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.join(REPO, "content");
const SITE = path.join(REPO, "site");

// 사진 너비·높이를 비워 두면 사진 파일에서 읽어 채운다 (사진 칸 { src, width, height, alt } 어디에나 적용)
function fillImageSizes(value, where) {
  if (Array.isArray(value)) { value.forEach((v) => fillImageSizes(v, where)); return value; }
  if (!value || typeof value !== "object") return value;
  if (typeof value.src === "string" && value.src && !/^https?:/.test(value.src) && (!value.width || !value.height)) {
    const file = path.join(SITE, value.src.replace(/^\//, ""));
    try {
      const size = imageSize(fs.readFileSync(file));
      if (!value.width) value.width = size.width;
      if (!value.height) value.height = size.height;
    } catch (e) {
      console.warn(`[content] 사진을 찾지 못했습니다 (${where}): ${value.src}`);
    }
  }
  for (const v of Object.values(value)) if (v && typeof v === "object") fillImageSizes(v, where);
  return value;
}

function readFolder(name) {
  const dir = path.join(ROOT, name);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const parsed = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      const data = fillImageSizes(parsed.data, `${name}/${f}`);
      return { ...data, body: parsed.content.trim(), fileSlug: f.replace(/\.md$/, "") };
    });
}

// 날짜는 "2026-10-26" 글자로 맞춘다 (YAML 이 날짜로 읽은 경우도 처리)
function ymd(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v || "").slice(0, 10);
}
const isPublic = (x) => x.published !== false;
const num = (v, d = 9999) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
const asList = (v) => (Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined && x !== "") : []);

export function loadProducts() {
  return readFolder("products")
    .filter(isPublic)
    .map((p) => ({
      ...p,
      slug: p.slug || p.fileSlug,
      industries: asList(p.industries),
      related: asList(p.related).map((r) => (typeof r === "string" ? { product: r } : r)),
      spec_tables: asList(p.spec_tables).map((t) => ({ ...t, rows: asList(t.rows) })),
    }))
    .sort((a, b) => num(a.order) - num(b.order) || String(a.name).localeCompare(String(b.name)));
}

export function loadNews() {
  const list = readFolder("news")
    .filter(isPublic)
    .map((n) => ({ ...n, date: ymd(n.date) }))
    .sort((a, b) => (b.pinned === true) - (a.pinned === true) || b.date.localeCompare(a.date) || a.fileSlug.localeCompare(b.fileSlug));
  // 페이지 안 주소(#n-20261026). 같은 날짜가 여러 개면 뒤에 -2, -3 을 붙인다.
  const seen = {};
  for (const n of [...list].sort((a, b) => b.date.localeCompare(a.date) || a.fileSlug.localeCompare(b.fileSlug))) {
    const base = "n-" + n.date.replace(/-/g, "");
    seen[base] = (seen[base] || 0) + 1;
    n.anchor = seen[base] === 1 ? base : `${base}-${seen[base]}`;
  }
  return list;
}

export function loadCatalogs() {
  return readFolder("catalogs")
    .filter(isPublic)
    .sort((a, b) => num(a.order) - num(b.order) || String(a.name).localeCompare(String(b.name)));
}

export function loadSolutions() {
  const file = path.join(ROOT, "solutions.yml");
  if (!fs.existsSync(file)) return {};
  const parsed = matter("---\n" + fs.readFileSync(file, "utf8") + "\n---\n");
  const out = {};
  for (const [k, v] of Object.entries(parsed.data || {})) out[k] = fillImageSizes(asList(v), "solutions.yml");
  return out;
}
