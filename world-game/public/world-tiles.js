// =============================================================
//  월드 타일 (땅 그림) - 월드 스튜디오와 쇼케이스가 함께 사용
//  타일 1칸 = 도트 16 x 16. 화면에는 도트 1개를 2px 로 그려서 32px.
//  새 타일을 추가하려면 TILES 에 한 줄 넣고, drawTile 에 그리는 법을 추가하세요.
//  (게시된 월드는 타일 번호로 저장되므로, 순서를 바꾸지 말고 맨 뒤에 추가하세요.
//   서버 server.js 의 STUDIO_TILES 숫자도 함께 늘려 주세요.)
// =============================================================
const TILES = [
  { id: 0, name: "풀밭", walk: true, mini: "#6fb44f" },
  { id: 1, name: "흙길", walk: true, mini: "#d8b878" },
  { id: 2, name: "모래", walk: true, mini: "#ead9a0" },
  { id: 3, name: "물", walk: false, mini: "#3f8fd6" },
  { id: 4, name: "나무", walk: false, mini: "#2f7d32" },
  { id: 5, name: "꽃밭", walk: true, mini: "#8cc66b" },
  { id: 6, name: "바위", walk: false, mini: "#8a8f99" },
];
const TILE_PX = 32; // 화면 크기
const DOT = 2;      // 도트 1개 = 2px

// 칸마다 조금씩 다른 무늬가 나오도록 하는 "고정된 무작위" 숫자
function hash(x, y, n = 0) {
  let h = (x * 374761393 + y * 668265263 + n * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function dot(ctx, ox, oy, x, y, color, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(ox + x * DOT, oy + y * DOT, w * DOT, h * DOT);
}

function drawGrass(ctx, ox, oy, tx, ty) {
  ctx.fillStyle = "#6fb44f";
  ctx.fillRect(ox, oy, TILE_PX, TILE_PX);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(hash(tx, ty, i) * 14), y = Math.floor(hash(tx, ty, i + 9) * 14);
    dot(ctx, ox, oy, x, y + 1, "#5a9b3f");
    dot(ctx, ox, oy, x + 1, y, "#5a9b3f");
    dot(ctx, ox, oy, x + 2, y + 1, "#5a9b3f");
  }
}

function drawTile(ctx, id, tx, ty, time = 0) {
  const ox = tx * TILE_PX, oy = ty * TILE_PX;
  switch (id) {
    case 1: { // 흙길
      ctx.fillStyle = "#d8b878"; ctx.fillRect(ox, oy, TILE_PX, TILE_PX);
      for (let i = 0; i < 3; i++) dot(ctx, ox, oy, Math.floor(hash(tx, ty, i) * 15), Math.floor(hash(tx, ty, i + 5) * 15), "#bf9d5e");
      break;
    }
    case 2: { // 모래
      ctx.fillStyle = "#ead9a0"; ctx.fillRect(ox, oy, TILE_PX, TILE_PX);
      for (let i = 0; i < 4; i++) dot(ctx, ox, oy, Math.floor(hash(tx, ty, i) * 15), Math.floor(hash(tx, ty, i + 3) * 15), "#d9c27f");
      break;
    }
    case 3: { // 물 (물결이 천천히 움직임)
      ctx.fillStyle = "#3f8fd6"; ctx.fillRect(ox, oy, TILE_PX, TILE_PX);
      const shift = Math.floor(time / 400 + hash(tx, ty) * 8) % 8;
      for (let r = 0; r < 2; r++) {
        const y = 4 + r * 8, x = (shift + r * 5 + Math.floor(hash(tx, ty, r) * 6)) % 12;
        dot(ctx, ox, oy, x, y, "#7cbcf0", 3, 1);
      }
      break;
    }
    case 4: { // 나무
      drawGrass(ctx, ox, oy, tx, ty);
      dot(ctx, ox, oy, 7, 11, "#6b4226", 2, 4);
      const leaf = "#2f7d32", lite = "#4caf50", dark = "#1f5a22";
      dot(ctx, ox, oy, 4, 2, leaf, 8, 9); dot(ctx, ox, oy, 3, 4, leaf, 10, 5); dot(ctx, ox, oy, 5, 1, leaf, 6, 1);
      dot(ctx, ox, oy, 5, 3, lite, 3, 2); dot(ctx, ox, oy, 4, 9, dark, 8, 2);
      break;
    }
    case 5: { // 꽃밭
      drawGrass(ctx, ox, oy, tx, ty);
      const colors = ["#f06292", "#fff176", "#ffffff", "#ba68c8"];
      for (let i = 0; i < 3; i++) {
        const x = 2 + Math.floor(hash(tx, ty, i) * 11), y = 2 + Math.floor(hash(tx, ty, i + 4) * 11);
        const c = colors[Math.floor(hash(tx, ty, i + 8) * colors.length)];
        dot(ctx, ox, oy, x, y - 1, c); dot(ctx, ox, oy, x - 1, y, c); dot(ctx, ox, oy, x + 1, y, c); dot(ctx, ox, oy, x, y + 1, c);
        dot(ctx, ox, oy, x, y, "#f2c14e");
      }
      break;
    }
    case 6: { // 바위
      drawGrass(ctx, ox, oy, tx, ty);
      dot(ctx, ox, oy, 3, 6, "#8a8f99", 10, 7); dot(ctx, ox, oy, 5, 4, "#8a8f99", 6, 2);
      dot(ctx, ox, oy, 5, 5, "#b6bcc6", 3, 2); dot(ctx, ox, oy, 3, 12, "#5f646d", 10, 1);
      break;
    }
    default:
      drawGrass(ctx, ox, oy, tx, ty);
  }
}

// 처음 시작할 때의 기본 지도: 길, 연못, 나무 몇 그루
function defaultMap() {
  const w = 24, h = 16, tiles = new Array(w * h).fill(0);
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = t; };
  for (let x = 0; x < w; x++) set(x, 8, 1);
  for (let y = 0; y < h; y++) set(11, y, 1);
  for (let y = 2; y <= 5; y++) for (let x = 15; x <= 20; x++) set(x, y, (x === 15 || x === 20) && (y === 2 || y === 5) ? 0 : 3);
  for (let x = 14; x <= 21; x++) { set(x, 1, 2); set(x, 6, 2); }
  for (const [x, y] of [[2, 2], [4, 1], [1, 5], [7, 3], [3, 12], [6, 14], [19, 12], [22, 10], [16, 14], [8, 11]]) set(x, y, 4);
  for (const [x, y] of [[5, 5], [6, 5], [5, 6], [14, 11], [15, 11], [14, 12]]) set(x, y, 5);
  for (const [x, y] of [[9, 2], [21, 14], [1, 10]]) set(x, y, 6);
  return { w, h, tiles };
}

// 작은 지도 그림 (쇼케이스 썸네일용)
function drawMiniMap(ctx, map, cell) {
  map.tiles.forEach((t, i) => {
    ctx.fillStyle = (TILES[t] || TILES[0]).mini;
    ctx.fillRect((i % map.w) * cell, Math.floor(i / map.w) * cell, cell, cell);
  });
}
