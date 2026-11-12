// 내 클럽 거리와 추천 클럽, 음성 안내
export const DEFAULT_CLUBS = [
  "드라이버", "3번 우드", "5번 우드", "유틸리티", "4번 아이언", "5번 아이언", "6번 아이언",
  "7번 아이언", "8번 아이언", "9번 아이언", "피칭 웨지", "어프로치 웨지", "샌드 웨지", "로브 웨지",
].map((name) => ({ name, dist: 0 }));

// 남은 거리에 맞는 클럽: 그 거리 이상 보내는 클럽 중 가장 짧은 것 (없으면 가장 긴 클럽)
export function recommendClub(remaining, clubs) {
  const list = (clubs || []).filter((c) => c.dist > 0).sort((a, b) => a.dist - b.dist);
  if (!list.length || remaining == null) return null;
  if (remaining < 15) return { name: "퍼터", dist: 0 };
  return list.find((c) => c.dist >= remaining - 3) || list[list.length - 1]; // 3m 정도는 짧아도 같은 클럽
}

// 휴대폰 기본 음성으로 읽기
export function canSpeak() { return "speechSynthesis" in window; }
export function speak(text) {
  if (!canSpeak()) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 1.0;
  const ko = speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith("ko"));
  if (ko) u.voice = ko;
  speechSynthesis.speak(u);
  return true;
}
