// 실행: node golf-app/test/betting.test.mjs
import assert from "node:assert/strict";
import { DEFAULT_RULES, holeResult, roundResult, settle } from "../app/betting.js";

const rules = structuredClone(DEFAULT_RULES);

// 1) 기획서 예시: 타당 1,000원, A4 B5 C5 D7 (파4)
let r = holeResult([4, 5, 5, 7], 4, rules);
assert.deepEqual(r.money, [5000, 1000, 1000, -7000]);
assert.equal(r.money.reduce((a, b) => a + b, 0), 0);

// 2) 양파 상한: 파3에서 9타 → 6타로 계산
r = holeResult([3, 9, 3, 3], 3, rules);
assert.deepEqual(r.money, [3000, -9000, 3000, 3000]); // 3타 차이 × 3명
assert.deepEqual(r.triggers, ["3명 동타"]);

// 3) 버디 보너스 + 다음 홀 배판
const r2 = structuredClone(rules);
r2.birdieBonus = 1000;
const holes = [{ par: 4 }, { par: 4 }];
const res = roundResult(holes, 4, [[3, 4, 5, 5], [4, 5, 5, 5]], r2);
// 1홀: 타당 A +1+2+2=5천, B -1+1+1=1천, C,D -2-1+0=-3천 / 버디 A +3천, 나머지 -1천
assert.deepEqual(res.perHole[0].money, [8000, 0, -4000, -4000]);
assert.equal(res.perHole[1].mult, 2); // 버디 다음 홀은 2배
assert.deepEqual(res.perHole[1].money, [6000, -2000, -2000, -2000]);

// 4) 스킨스 이월
const r3 = structuredClone(rules);
r3.unit = 0;
r3.skins = { on: true, amount: 1000, carry: true };
r3.baepan = { mult: 2 };
const sk = roundResult([{ par: 4 }, { par: 4 }], 4, [[4, 4, 5, 5], [4, 5, 5, 5]], r3);
assert.deepEqual(sk.perHole[0].money, [0, 0, 0, 0]);
assert.deepEqual(sk.perHole[1].money, [6000, -2000, -2000, -2000]); // (1천+이월1천)×3명

// 5) 정산: 합계 0, 송금 목록
const t = settle([5000, 1000, 1000, -7000], ["A", "B", "C", "D"]);
assert.deepEqual(t, [
  { from: "D", to: "A", amount: 5000 },
  { from: "D", to: "B", amount: 1000 },
  { from: "D", to: "C", amount: 1000 },
]);

console.log("내기 계산 테스트 모두 통과 ✅");

// 6) 핸디: A 0, B 5, 오장 → B가 A에게서 25,000원
import { handicapMoney, holeExtras } from "../app/betting.js";
assert.deepEqual(handicapMoney([0, 5], 2, 5000), [-25000, 25000]);
assert.deepEqual(handicapMoney([0, 3, 5, 0], 4, 1000), [-8000, 4000, 12000, -8000]); // C: A에게5 + B에게2 + D에게5

// 7) 벌금·보너스: OB 2개(1천), 니어리스트(5천)
const r4 = { ...structuredClone(DEFAULT_RULES), obFine: 1000, nearAmount: 5000 };
assert.deepEqual(holeExtras(0, 4, r4, { "0-3-ob": 2, "0-1-near": 1 }), [-3000, 17000, -3000, -11000]);

// 8) 라운드 합계에 핸디·벌금 포함, 전체 합은 항상 0
const full = roundResult([{ par: 3 }, { par: 4 }], 4, [[3, 4, 4, 5], [4, 4, 4, 4]], r4,
  { events: { "0-3-ob": 1, "0-0-near": 1, "1-2-ob": 1 }, handicaps: [0, 2, 2, 4] });
assert.equal(full.total.reduce((a, b) => a + b, 0), 0);
assert.deepEqual(full.handi, [-8000, 0, 0, 8000]);
console.log("핸디·벌금 테스트 통과 ✅");
