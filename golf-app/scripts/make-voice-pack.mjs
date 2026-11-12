// 음성팩 만들기
//
// ① 조각 목록만 보기 (무료 음성 사이트에서 직접 만들 때):
//    node golf-app/scripts/make-voice-pack.mjs --list
//    → 표에 나온 "파일 이름"으로 저장해서 golf-app/app/voices/<팩이름>/ 에 넣고 --index 실행
//
// ② 구글 음성(Google Cloud Text-to-Speech)으로 자동 생성:
//    GOOGLE_TTS_API_KEY=키 node golf-app/scripts/make-voice-pack.mjs --google ko-KR-Neural2-A "여성 A"
//    한국어 목소리 예: ko-KR-Standard-A~D, ko-KR-Wavenet-A~D, ko-KR-Neural2-A~C (A·B 여성, C·D 남성 계열)
//
// ③ 직접 넣은 파일로 pack.json 과 목록 만들기:
//    node golf-app/scripts/make-voice-pack.mjs --index <팩이름> "표시 이름" "출처·라이선스 메모"

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHRASES } from "../app/voicepack.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const VOICES = path.join(here, "..", "app", "voices");
const [mode, ...args] = process.argv.slice(2);

function updateIndex(id, name) {
  const idxFile = path.join(VOICES, "index.json");
  const idx = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, "utf8")) : [];
  const next = idx.filter((p) => p.id !== id).concat({ id, name });
  fs.writeFileSync(idxFile, JSON.stringify(next, null, 2) + "\n");
}

function writePack(id, name, source) {
  const dir = path.join(VOICES, id);
  const have = fs.readdirSync(dir);
  const files = {};
  const missing = [];
  for (const key of Object.keys(PHRASES)) {
    const f = have.find((h) => path.parse(h).name === key && /\.(mp3|m4a|wav|ogg)$/i.test(h));
    if (f) files[key] = f; else missing.push(`${key} (${PHRASES[key]})`);
  }
  fs.writeFileSync(path.join(dir, "pack.json"), JSON.stringify({ name, source, files }, null, 2) + "\n");
  updateIndex(id, name);
  console.log(`음성팩 "${name}": ${Object.keys(files).length}/${Object.keys(PHRASES).length}개 조각`);
  if (missing.length) console.log("빠진 조각 (없으면 그 부분은 휴대폰 기본 음성으로 대신 읽음):\n  " + missing.join("\n  "));
}

if (mode === "--list") {
  console.log("| 파일 이름 | 읽을 문장 |\n|---|---|");
  for (const [k, v] of Object.entries(PHRASES)) console.log(`| ${k}.mp3 | ${v} |`);
} else if (mode === "--index") {
  const [id, name = id, source = ""] = args;
  if (!id) throw new Error("팩 이름(폴더 이름)을 넣어주세요");
  writePack(id, name, source);
} else if (mode === "--google") {
  const [voice, name = voice] = args;
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!voice) throw new Error("목소리 이름을 넣어주세요. 예: ko-KR-Neural2-A");
  if (!key) throw new Error("GOOGLE_TTS_API_KEY 가 필요해요");
  const id = voice.toLowerCase();
  const dir = path.join(VOICES, id);
  fs.mkdirSync(dir, { recursive: true });
  for (const [k, text] of Object.entries(PHRASES)) {
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "ko-KR", name: voice },
        audioConfig: { audioEncoding: "MP3", speakingRate: 1.05 },
      }),
    });
    if (!r.ok) throw new Error(`${k} 생성 실패: ${r.status} ${await r.text()}`);
    const { audioContent } = await r.json();
    fs.writeFileSync(path.join(dir, k + ".mp3"), Buffer.from(audioContent, "base64"));
    process.stdout.write(".");
  }
  console.log();
  writePack(id, name, `Google Cloud Text-to-Speech (${voice})`);
} else {
  console.log("사용법은 파일 맨 위 설명을 보세요. (--list | --google | --index)");
}
