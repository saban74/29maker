// GPS 거리 계산
// 두 지점 [위도, 경도] 사이의 직선거리(미터) - 하버사인 공식
export function distanceM(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// 휴대폰 위치를 계속 받아오기. 반환값을 호출하면 중지.
export function watchMyPosition(onPos, onError) {
  if (!("geolocation" in navigator)) {
    onError("이 기기는 위치 기능을 지원하지 않아요.");
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (p) => onPos({ latlng: [p.coords.latitude, p.coords.longitude], accuracy: p.coords.accuracy }),
    // 권한 거부만 알림. 일시적인 신호 끊김·시간 초과는 계속 기다리면 다시 잡히므로 조용히 넘어감
    (e) => { if (e.code === 1) onError("위치 권한을 허용해 주세요. (휴대폰 설정 → 브라우저 → 위치)"); },
    { enableHighAccuracy: true, maximumAge: 2000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}
