// 내기 계산 규칙 (화면과 상관없는 순수 계산만 모아둔 파일)
// 브라우저와 Node(테스트) 양쪽에서 그대로 씁니다.

export const DEFAULT_RULES = {
  unit: 1000,            // 타당 금액 (1타 차이 = 1,000원)
  capDoublePar: true,    // 양파(더블파) 이상은 더블파로 계산
  birdieBonus: 0,        // 버디 1명당 다른 사람 1명에게서 받는 보너스 (이글은 2배)
  baepan: {              // 배판: 조건이 맞으면 "다음 홀"을 배로 계산
    onBirdie: true,      //   버디(이하)가 나온 다음 홀
    onTie3: true,        //   3명 이상 동타가 나온 다음 홀
    onTriple: false,     //   누군가 트리플보기 이상을 한 다음 홀
    mult: 2,             //   몇 배로 할지
  },
  skins: { on: false, amount: 1000, carry: true }, // 스킨스(혼자 1등한 사람이 1명당 금액을 받음, 비기면 이월)
  obFine: 0,             // OB 1개당 벌금 (친 사람이 다른 사람 1명마다 냄)
  hazardFine: 0,         // 해저드(페널티 구역) 1개당 벌금
  nearAmount: 0,         // 니어리스트 상금 (파3, 다른 사람 1명마다 받음)
  longAmount: 0,         // 롱기스트 상금 (파5, 다른 사람 1명마다 받음)
};

// 벌금·보너스. events: { "홀-사람-종류": 개수 }  종류 = ob, hz, near, long
export function holeExtras(h, n, rules, events = {}) {
  const out = new Array(n).fill(0);
  const pay = (from, each) => { for (let j = 0; j < n; j++) if (j !== from) { out[from] -= each; out[j] += each; } };
  for (let p = 0; p < n; p++) {
    const c = (k) => events[`${h}-${p}-${k}`] || 0;
    if (rules.obFine) pay(p, c("ob") * rules.obFine);
    if (rules.hazardFine) pay(p, c("hz") * rules.hazardFine);
    if (rules.nearAmount && c("near")) pay(p, -rules.nearAmount);
    if (rules.longAmount && c("long")) pay(p, -rules.longAmount);
  }
  return out;
}

// 핸디: 핸디 차이 × 타당 금액을 미리 주고받기 (핸디 많은 사람이 받음)
export function handicapMoney(handicaps = [], n, unit) {
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const amt = ((handicaps[i] || 0) - (handicaps[j] || 0)) * unit;
      out[i] += amt;
      out[j] -= amt;
    }
  }
  return out;
}

// 계산에 쓰는 타수 (양파 상한 적용)
export function effectiveScore(strokes, par, rules) {
  if (rules.capDoublePar && par) return Math.min(strokes, par * 2);
  return strokes;
}

// 한 홀의 돈 계산. scores: [4, 5, 5, 7] 처럼 사람 순서대로의 타수
// 반환: { money: [사람별 +/-], parts: 설명용 세부, triggers: 다음 홀 배판 이유 }
export function holeResult(scores, par, rules, mult = 1, skinsPot = 0) {
  const n = scores.length;
  const eff = scores.map((s) => effectiveScore(s, par, rules));
  const stroke = new Array(n).fill(0);
  const birdie = new Array(n).fill(0);
  const skins = new Array(n).fill(0);

  // ① 타당: 모든 두 사람 쌍마다 (타수 차이 × 금액 × 배판)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = eff[j] - eff[i]; // +면 i가 이김
      const amt = diff * rules.unit * mult;
      stroke[i] += amt;
      stroke[j] -= amt;
    }
  }

  // ② 버디 보너스 (실제 타수 기준, 배판 미적용)
  if (rules.birdieBonus > 0 && par) {
    scores.forEach((s, i) => {
      const under = par - s;
      if (under >= 1) {
        const bonus = rules.birdieBonus * (under >= 2 ? 2 : 1);
        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          birdie[i] += bonus;
          birdie[j] -= bonus;
        }
      }
    });
  }

  // ③ 스킨스: 혼자 가장 잘 친 사람이 (이월분 포함) 1명당 금액을 받음
  let carryOut = 0;
  if (rules.skins && rules.skins.on) {
    const best = Math.min(...eff);
    const winners = eff.map((e, i) => (e === best ? i : -1)).filter((i) => i >= 0);
    const perPerson = rules.skins.amount * mult + skinsPot;
    if (winners.length === 1) {
      const w = winners[0];
      for (let j = 0; j < n; j++) {
        if (j === w) continue;
        skins[w] += perPerson;
        skins[j] -= perPerson;
      }
    } else if (rules.skins.carry) {
      carryOut = perPerson; // 비기면 다음 홀로 이월
    }
  }

  // 다음 홀 배판 조건
  const triggers = [];
  const b = rules.baepan || {};
  if (b.onBirdie && par && scores.some((s) => s <= par - 1)) triggers.push("버디");
  if (b.onTie3) {
    const counts = {};
    eff.forEach((e) => (counts[e] = (counts[e] || 0) + 1));
    if (Object.values(counts).some((c) => c >= 3)) triggers.push("3명 동타");
  }
  if (b.onTriple && par && scores.some((s) => s >= par + 3)) triggers.push("트리플 이상");

  const money = stroke.map((v, i) => v + birdie[i] + skins[i]);
  return { money, parts: { stroke, birdie, skins }, triggers, carryOut };
}

// 라운드 전체 계산
// holes: [{par}, ...] (18개), scores: scores[hole][player] = 타수 또는 undefined
// extras: { events, handicaps }
export function roundResult(holes, playerCount, scores, rules, extras = {}) {
  const perHole = [];
  let nextMult = 1;
  let pot = 0;
  for (let h = 0; h < holes.length; h++) {
    const row = (scores[h] || []).slice(0, playerCount);
    const complete = row.length === playerCount && row.every((s) => Number.isInteger(s) && s > 0);
    const extra = holeExtras(h, playerCount, rules, extras.events);
    if (!complete) {
      // 타수가 다 안 들어온 홀은 내기 계산을 안 함 (배판·이월은 다음 완료 홀로). 벌금·보너스만 반영
      perHole.push({ complete: false, mult: nextMult, money: extra, extra });
      continue;
    }
    const mult = nextMult;
    const r = holeResult(row, holes[h].par, rules, mult, pot);
    pot = r.carryOut;
    nextMult = r.triggers.length ? (rules.baepan.mult || 2) : 1;
    perHole.push({ complete: true, mult, ...r, money: r.money.map((v, i) => v + extra[i]), extra });
  }
  const sum = (from, to) => {
    const t = new Array(playerCount).fill(0);
    perHole.slice(from, to).forEach((r) => r.money.forEach((v, i) => (t[i] += v)));
    return t;
  };
  const half = Math.min(9, holes.length);
  const handi = handicapMoney(extras.handicaps, playerCount, rules.unit);
  return {
    perHole,
    front: sum(0, half),
    back: sum(half, holes.length),
    handi,
    total: sum(0, holes.length).map((v, i) => v + handi[i]),
    nextMult,
    pot,
  };
}

// 송금 횟수가 적게 "누가 누구에게 얼마" 목록 만들기
export function settle(totals, names) {
  const debtors = [];
  const creditors = [];
  totals.forEach((v, i) => {
    if (v < 0) debtors.push({ i, amt: -v });
    else if (v > 0) creditors.push({ i, amt: v });
  });
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  const out = [];
  let d = 0, c = 0;
  while (d < debtors.length && c < creditors.length) {
    const pay = Math.min(debtors[d].amt, creditors[c].amt);
    out.push({ from: names[debtors[d].i], to: names[creditors[c].i], amount: pay });
    debtors[d].amt -= pay;
    creditors[c].amt -= pay;
    if (debtors[d].amt === 0) d++;
    if (creditors[c].amt === 0) c++;
  }
  return out;
}

export function won(v) {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return sign + Math.abs(v).toLocaleString("ko-KR") + "원";
}
