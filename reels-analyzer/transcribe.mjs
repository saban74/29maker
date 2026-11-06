#!/usr/bin/env node
// 릴스 대본 뽑기 스크립트
// fetch-reels.mjs 가 저장한 JSON에서 조회수 상위 N개(기본 10개) 릴스를 골라
// 영상(videoUrl)을 받아 OpenAI 위스퍼 API로 대본을 뽑고, 0~3초 구간을 '훅'으로 따로 저장합니다.
//
// 사용법:
//   node reels-analyzer/transcribe.mjs <릴스 JSON 파일> [개수]
//   예) node reels-analyzer/transcribe.mjs reels-analyzer/output/nike-2026-11-06.json 10
//
// OpenAI API 키는 환경변수 OPENAI_API_KEY 에서 읽습니다. (reels-analyzer/.env 에 적어도 됨)
// 결과: 같은 폴더에 <원래이름>-transcripts.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const HOOK_SECONDS = 3; // 훅 구간: 0~3초
const MAX_BYTES = 25 * 1024 * 1024; // 위스퍼 API 파일 크기 한도 25MB

// .env 읽기 (이미 설정된 값은 덮어쓰지 않음)
const envFile = path.join(here, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const [inFile, rawCount] = process.argv.slice(2);
if (!inFile || !fs.existsSync(inFile)) {
  console.error("사용법: node reels-analyzer/transcribe.mjs <릴스 JSON 파일> [개수]");
  process.exit(1);
}
const topN = rawCount ? Number(rawCount) : 10;
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY 환경변수가 없습니다. reels-analyzer/.env 에 OPENAI_API_KEY=내키 를 적어 주세요.");
  process.exit(1);
}

const views = (r) => r.videoPlayCount ?? r.videoViewCount ?? 0;
const reels = JSON.parse(fs.readFileSync(inFile, "utf8"));
const top = [...reels].sort((a, b) => views(b) - views(a)).slice(0, topN);
console.log(`전체 ${reels.length}개 중 조회수 상위 ${top.length}개 대본 뽑기 시작`);

// 영상 주소 후보: videoUrl(인스타 원본) → Apify가 따로 저장해 둔 영상 사본(있으면)
function videoSources(r) {
  const list = [];
  if (r.videoUrl) list.push(r.videoUrl);
  for (const v of Object.values(r)) {
    if (typeof v === "string" && /apify\.com\/v2\/key-value-stores\//.test(v)) list.push(v);
  }
  return list;
}

async function download(r) {
  let lastErr = "영상 주소(videoUrl)가 없습니다";
  for (const src of videoSources(r)) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_BYTES) throw new Error(`영상이 25MB를 넘습니다 (${(buf.length / 1048576).toFixed(1)}MB)`);
      return buf;
    } catch (err) {
      lastErr = `${new URL(src).host}: ${err.cause?.code || err.message}`;
    }
  }
  throw new Error(`영상 받기 실패 — ${lastErr}`);
}

async function whisper(buf, name) {
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "video/mp4" }), `${name}.mp4`);
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    const hint = res.status === 401 ? " (키가 틀렸습니다)" : res.status === 429 ? " (사용 한도·잔액 부족)" : "";
    throw new Error(`위스퍼 오류 ${res.status}${hint}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

const results = [];
for (const [i, r] of top.entries()) {
  const id = r.shortCode || r.id || `reel${i + 1}`;
  const base = {
    rank: i + 1,
    shortCode: r.shortCode,
    url: r.url,
    views: views(r),
    likes: r.likesCount,
    comments: r.commentsCount,
    duration: r.videoDuration,
    timestamp: r.timestamp,
    caption: r.caption,
  };
  process.stdout.write(`[${i + 1}/${top.length}] ${id} ... `);
  try {
    const buf = await download(r);
    const t = await whisper(buf, id);
    const words = (t.words || []).map((w) => ({ word: w.word, start: w.start, end: w.end }));
    // 훅 = 0~3초 안에 '시작한' 단어들
    const hookWords = words.filter((w) => w.start < HOOK_SECONDS);
    results.push({
      ...base,
      language: t.language,
      transcript: t.text,
      hook: {
        seconds: `0~${HOOK_SECONDS}`,
        text: hookWords.map((w) => w.word).join(" ").trim(),
        firstSpeechAt: words.length ? words[0].start : null, // 첫 발화 시각(초). 없으면 말이 없는 영상
        words: hookWords,
      },
      words,
    });
    console.log(`완료 (훅: "${results.at(-1).hook.text || "말 없음"}")`);
  } catch (err) {
    results.push({ ...base, error: err.message });
    console.log(`실패 — ${err.message}`);
  }
}

const outFile = inFile.replace(/\.json$/i, "") + "-transcripts.json";
fs.writeFileSync(outFile, JSON.stringify(results, null, 2), "utf8");
const ok = results.filter((r) => !r.error).length;
console.log(`\n저장: ${outFile} (성공 ${ok} / 실패 ${results.length - ok})`);
if (ok < results.length) process.exitCode = 1;
