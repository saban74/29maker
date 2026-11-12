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
    (e) => onError(e.code === 1 ? "위치 권한을 허용해 주세요." : "위치를 찾는 중 문제가 생겼어요."),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}
