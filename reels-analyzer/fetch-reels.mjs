#!/usr/bin/env node
// 인스타 릴스 가져오기 스크립트
// Apify의 apify/instagram-reel-scraper 액터로 한 계정의 릴스를 최근 것부터 지정한 개수만큼 가져와
// reels-analyzer/output/<계정>-<날짜>.json 파일로 저장합니다.
//
// 사용법:
//   node reels-analyzer/fetch-reels.mjs <인스타 아이디> [개수]
//   예) node reels-analyzer/fetch-reels.mjs nike 20
//
// API 토큰은 코드에 쓰지 않고 환경변수 APIFY_TOKEN 에서 읽습니다.
// (reels-analyzer/.env 파일에 APIFY_TOKEN=... 을 적어 두면 자동으로 읽습니다)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ACTOR = "apify~instagram-reel-scraper"; // 주소에서는 '/' 대신 '~' 를 씁니다
const DEFAULT_COUNT = 20;

// 1) .env 파일이 있으면 환경변수로 읽어 들이기 (이미 설정된 값은 덮어쓰지 않음)
const envFile = path.join(here, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// 2) 입력값 확인
const [rawUser, rawCount] = process.argv.slice(2);
if (!rawUser) {
  console.error("사용법: node reels-analyzer/fetch-reels.mjs <인스타 아이디> [개수]");
  process.exit(1);
}
// @nike, https://www.instagram.com/nike/ 같은 형태도 아이디만 뽑아 씀
const username = rawUser
  .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
  .replace(/^@/, "")
  .split(/[/?#]/)[0];
const count = rawCount ? Number(rawCount) : DEFAULT_COUNT;
if (!username || !Number.isInteger(count) || count < 1) {
  console.error("아이디가 비었거나 개수가 1 이상의 정수가 아닙니다.");
  process.exit(1);
}

const token = process.env.APIFY_TOKEN;
if (!token) {
  console.error(
    "APIFY_TOKEN 환경변수가 없습니다.\n" +
      "reels-analyzer/.env 파일을 만들고 APIFY_TOKEN=내토큰 한 줄을 적어 주세요.\n" +
      "(토큰 위치: Apify 콘솔 → Settings → API & Integrations)"
  );
  process.exit(1);
}

// 3) 액터 실행 후 결과(데이터셋)를 한 번에 받기
const input = {
  username: [username],
  resultsLimit: count,
};

console.log(`@${username} 릴스 ${count}개 가져오는 중... (보통 1~3분 걸립니다)`);

const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?format=json`;
let res;
try {
  res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // 토큰을 주소가 아니라 머리글에 넣어 기록에 남지 않게 함
    },
    body: JSON.stringify(input),
  });
} catch (err) {
  console.error("Apify 서버에 연결하지 못했습니다:", err.message);
  process.exit(1);
}

if (!res.ok) {
  const text = await res.text();
  console.error(`Apify 오류 (${res.status}): ${text.slice(0, 500)}`);
  if (res.status === 401) console.error("→ 토큰이 틀렸거나 만료되었습니다.");
  if (res.status === 402) console.error("→ Apify 크레딧(사용량)이 부족합니다.");
  if (res.status === 408) console.error("→ 시간이 너무 오래 걸렸습니다. 개수를 줄여 다시 해 보세요.");
  process.exit(1);
}

const items = await res.json();
if (!Array.isArray(items) || items.length === 0) {
  console.error("가져온 릴스가 없습니다. 아이디가 맞는지, 공개 계정인지 확인해 주세요.");
  process.exit(1);
}

// 오류 항목(비공개 계정 등)은 따로 알려 주기
const errors = items.filter((it) => it.error);
const reels = items.filter((it) => !it.error);
if (errors.length) console.warn(`경고: 오류 항목 ${errors.length}개 —`, errors[0].error || errors[0].errorDescription);

// 4) 최근 것부터 정렬하고 개수 맞추기
reels.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
const result = reels.slice(0, count);

// 5) 저장
const outDir = path.join(here, "output");
fs.mkdirSync(outDir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const outFile = path.join(outDir, `${username}-${today}.json`);
fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

// 6) 간단한 요약 출력
console.log(`\n완료: ${result.length}개 저장 → ${path.relative(process.cwd(), outFile)}\n`);
for (const r of result) {
  const views = r.videoPlayCount ?? r.videoViewCount ?? "?";
  const date = (r.timestamp || "").slice(0, 10);
  const caption = (r.caption || "").replace(/\s+/g, " ").slice(0, 40);
  console.log(`${date}  조회 ${views}  좋아요 ${r.likesCount ?? "?"}  댓글 ${r.commentsCount ?? "?"}  ${caption}`);
}
