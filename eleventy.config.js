// Eleventy(11ty) 설정 파일
// - 입력: site/ (페이지 틀), content/ (관리자 화면에서 고치는 정보 파일)
// - 출력: _site/ (자동 생성, 저장소에 올리지 않음)
// 자세한 설명은 README.md 의 "홈페이지 만드는 구조" 참고.
import path from "node:path";
import MarkdownIt from "markdown-it";
import { loadProducts, loadNews, loadCatalogs, loadSolutions } from "./lib/content.js";

const md = new MarkdownIt({ html: true, breaks: false, linkify: false });

// [확인 필요 ...] 를 노란 표시(span.tbd)로 감싼다. 이미 감싼 것은 두 번 감싸지 않는다.
const TBD_RE = /(<span class="tbd">)?(\[확인 필요[^\]]*\])(<\/span>)?/g;
function wrapTbd(s) {
  return s.replace(TBD_RE, (m, open, inner, close) => (open && close ? m : `<span class="tbd">${inner}</span>`));
}

// 사람이 쓴 글(한 줄 글, 표 칸 등)을 HTML 로 바꾼다.
// - 글 안에 <br>, <a ...> 같은 HTML 을 그대로 쓸 수 있다.
// - 그냥 쓴 & 는 &amp; 로 바꾼다.
function inlineHtml(value) {
  if (value === undefined || value === null) return "";
  let s = String(value);
  s = s.replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
  return wrapTbd(s);
}

// 사이트 안 주소를 "지금 페이지 기준 상대 주소"로 바꾼다.
// 예) products/hast.html 페이지에서 "css/tokens.css" → "../css/tokens.css"
// 상대 주소라서 사이트를 도메인 맨 위(/)에 올리든 하위 폴더(/29maker/)에 올리든 그대로 동작한다.
function relUrl(target, pageUrl) {
  if (target === undefined || target === null) return "";
  let t = String(target).trim();
  if (!t || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(t)) return t; // https:, tel:, mailto:, #... 는 그대로
  const m = t.match(/^([^?#]*)(.*)$/);
  let p = m[1];
  const rest = m[2];
  if (!p.startsWith("/")) p = "/" + p;
  const fromDir = path.posix.dirname(pageUrl && pageUrl.endsWith("/") ? pageUrl + "x" : pageUrl || "/x");
  let r = path.posix.relative(fromDir, p);
  if (p.endsWith("/") && r) r += "/";
  if (r === "") r = path.posix.basename(p) || "./";
  return r + rest;
}

export default function (eleventyConfig) {
  // ── 그대로 복사하는 파일 (CSS, JS, 사진, 관리자 화면) ──
  eleventyConfig.addPassthroughCopy("site/css");
  eleventyConfig.addPassthroughCopy("site/js");
  eleventyConfig.addPassthroughCopy("site/assets");
  eleventyConfig.addPassthroughCopy("site/admin");

  // ── 페이지로 만들지 않는 파일 ──
  eleventyConfig.ignores.add("site/*.md"); // BUILD.md, PLAN.md, INTEGRATION.md 같은 안내 문서
  eleventyConfig.ignores.add("site/admin/**");
  eleventyConfig.ignores.add("site/assets/**");

  // content/ 폴더가 바뀌면 다시 만든다 (eleventy --serve 쓸 때)
  eleventyConfig.addWatchTarget("content/");
  eleventyConfig.addWatchTarget("lib/");

  // ── 정보 파일 읽기 (content/) ──
  eleventyConfig.addGlobalData("products", () => loadProducts());
  eleventyConfig.addGlobalData("news", () => loadNews());
  eleventyConfig.addGlobalData("catalogs", () => loadCatalogs());
  eleventyConfig.addGlobalData("solutionPicks", () => loadSolutions());

  // 모든 페이지 주소를 원래 파일 이름 그대로(about.html → about.html) 유지
  eleventyConfig.addGlobalData("permalink", () => (data) => `${data.page.filePathStem}.html`);

  // ── 필터 (틀 안에서 {{ 값 | 필터 }} 로 씀) ──
  // 매크로 안에서는 this.page 를 못 읽으므로, 두 번째 값으로 지금 페이지 주소를 넘길 수 있다.
  eleventyConfig.addFilter("rel", function (target, pageUrl) {
    return relUrl(target, pageUrl || (this.page && this.page.url) || (this.ctx && this.ctx.page && this.ctx.page.url));
  });
  eleventyConfig.addFilter("h", (v) => inlineHtml(v)); // 사람이 쓴 글 → HTML (그 뒤에 | safe)
  eleventyConfig.addFilter("md", (v) => wrapTbd(md.render(String(v || "")).trim()));
  eleventyConfig.addFilter("qp", (v) => String(v || "").trim().replace(/\s+/g, "+")); // 문의 주소용: 띄어쓰기 → +
  eleventyConfig.addFilter("dotDate", (v) => String(v || "").replace(/-/g, "."));
  // 메인 "대표 제품": 메인 대표 제품에 체크한 제품을 "메인 표시 순서"대로
  eleventyConfig.addFilter("featuredProducts", (list) =>
    (list || []).filter((p) => p.featured === true).sort((a, b) => (Number(a.featured_order) || 999) - (Number(b.featured_order) || 999)));
  // 메인 "최신 소식" 3개: ① 고정 글 ② "메인에 보이기"를 켠 글, 각각 날짜 최신순 (news 는 이미 고정 → 최신순으로 정렬됨)
  eleventyConfig.addFilter("homeNews", (list, n = 3) => (list || []).filter((x) => x.pinned === true || x.show_on_home === true).slice(0, n));
  // 메인 "공지 띠" n개: 공지(공지사항 분류·고정 글)를 먼저, 모자라면 최신 소식으로 채운다 (news 는 이미 고정 → 최신순)
  eleventyConfig.addFilter("noticeStrip", (list, n = 2) => {
    const all = list || [];
    const first = all.filter((x) => x.pinned === true || x.category === "notice");
    const rest = all.filter((x) => !first.includes(x));
    return [...first, ...rest].slice(0, n);
  });
  // 핵심 수치 하나를 글자로: 값 + 단위, "~" 앞뒤는 띄어 쓴다. 예) "-70~+100" + "°C" → "-70 ~ +100°C"
  eleventyConfig.addFilter("kv", (k) => (k ? String(k.value ?? "") + String(k.unit ?? "") : "").replace(/\s*~\s*/g, " ~ "));
  // 사진 목록에서 특정 사진(주소가 같은 것)을 뺀다. 갤러리에서 대표 사진이 두 번 나오지 않게 한다.
  eleventyConfig.addFilter("withoutSrc", (list, src) => (list || []).filter((x) => x && x.src !== src));
  // 사양표 전체 줄 수 (장비 소개서에서 줄이 많은 제품은 글씨를 조금 줄이는 데 씀)
  eleventyConfig.addFilter("specRows", (tables) => (tables || []).reduce((n, t) => n + ((t && t.rows) || []).length, 0));
  // 자료 목록에서 주소가 https:// 로 시작하는 첫 자료 (제품 상세 오른쪽 "ESPEC 공식 카탈로그" 상자용)
  eleventyConfig.addFilter("firstExternal", (list) => (list || []).find((d) => d && /^https?:/i.test(String(d.url || ""))));
  eleventyConfig.addFilter("where", (list, key, value) => (list || []).filter((x) => x && x[key] === value));
  eleventyConfig.addFilter("findBy", (list, key, value) => (list || []).find((x) => x && x[key] === value));
  eleventyConfig.addFilter("bySlug", (list, slug) => (list || []).find((p) => p.slug === slug));
  eleventyConfig.addFilter("lines", (v) => String(v || "").split("|").map((s) => s.trim()));
  // 카드 하나에 쓸 값: 제품의 기본 카드 + (있으면) 덮어쓸 값
  eleventyConfig.addFilter("cardOf", (product, ...overrides) => {
    const base = { ...(product && product.card) };
    // 카드 칸을 비워 둔 새 제품: 제품 이름·종류·대표 사진으로 채운다
    if (product) {
      if (!base.name) base.name = product.heading || product.name;
      if (!base.type) base.type = product.type_label || "";
      if (!base.temp) base.temp = "";
      if (!Array.isArray(base.images) || !base.images.length) base.images = product.photo && product.photo.src ? [product.photo] : [];
      if (!base.frame) base.frame = "pack";
    }
    for (const o of overrides) {
      if (!o) continue;
      for (const k of ["name", "type", "temp", "frame", "scale", "pos_x", "pos_y"]) if (o[k] !== undefined && o[k] !== null && o[k] !== "") base[k] = o[k];
      if (Array.isArray(o.images) && o.images.length) base.images = o.images;
      if (o.alt && base.images && base.images.length === 1) base.images = [{ ...base.images[0], alt: o.alt }];
    }
    return base;
  });

  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true, trimBlocks: true, lstripBlocks: true });

  return {
    dir: { input: "site", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["html", "njk"],
    htmlTemplateEngine: "njk",
  };
}

export { relUrl, inlineHtml };
