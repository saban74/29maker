// =============================================================
//  도트 캐릭터 메이커 - 부품 목록
//  ★ 공동 개발자는 이 파일만 고쳐서 새 부품을 추가할 수 있습니다 ★
//
//  캐릭터는 32 x 32 칸짜리 그림입니다. (왼쪽 위가 0,0)
//  각 부품은 "at: [x, y]" 위치에서부터 글자 그림(map)으로 그립니다.
//  글자 하나 = 점 하나. "." 은 빈칸(투명)입니다.
//
//  글자 뜻 (소문자 = 기본색, 대문자 = 같은 색의 어두운 그림자)
//    s/S 피부      h/H 머리카락   e 눈        a/A 모자
//    c/C 상의      p/P 하의       b/B 신발    w/W 무기
//    l/L 방패
//    고정색: 1 흰색, 3 나무색, 4 금색, r 입술, k 볼터치
//  외곽선(검은 테두리)은 자동으로 그려지니 따로 그리지 않아도 됩니다.
// =============================================================
window.MAKER = {
  size: 32,

  fixedColors: { "1": "#ffffff", "3": "#7a4a2a", "4": "#f2c14e", r: "#a0413c", k: "#f29b9b" },

  // 색을 고를 수 있는 항목 (글자, 이름, 처음 색)
  colorSlots: [
    { key: "s", name: "피부", def: "#f5cfa0" },
    { key: "h", name: "머리카락", def: "#5b3a29" },
    { key: "e", name: "눈", def: "#2b2b3a" },
    { key: "a", name: "모자", def: "#7e57c2" },
    { key: "c", name: "상의", def: "#3f7fd6" },
    { key: "p", name: "하의", def: "#4a4f63" },
    { key: "b", name: "신발", def: "#6b4226" },
    { key: "w", name: "무기", def: "#c9d3dd" },
    { key: "l", name: "방패", def: "#b23a3a" },
  ],

  skinPresets: ["#ffe3c4", "#f5cfa0", "#e0ac69", "#c68642", "#8d5524", "#a5d66f", "#9ec9f0", "#d7b4f3"],
  palette: [
    "#ffffff", "#c9d3dd", "#8a94a6", "#4a4f63", "#2b2b3a", "#5b3a29", "#8d5a3b", "#c08552",
    "#f2c14e", "#f59e3b", "#e25b45", "#b23a3a", "#e86fa6", "#a066d3", "#7e57c2", "#3f51b5",
    "#3f7fd6", "#4fc3e8", "#2fa39a", "#4caf50", "#8bc34a", "#cddc39", "#fff176", "#ffd6e0",
  ],

  // 몸 바탕 (항상 그려짐). part: "upper" = 윗몸, "lower" = 다리
  base: [
    { layer: "upper", at: [11, 6], map: [
      "..ssssss..",
      ".ssssssss.",
      "ssssssssss",
      "ssssssssss",
      "ssssssssss",
      "ssssssssss",
      "ssssssssss",
      "ssssssssss",
      ".ssssssss.",
      "..SSSSSS..",
    ] },
    { layer: "upper", at: [10, 16], map: [
      "ssssssssssss",
      "ssssssssssss",
      "ss.ssssss.ss",
      "ss.ssssss.ss",
      "ss.ssssss.ss",
      "SS.ssssss.SS",
    ] },
    { layer: "lower", at: [12, 22], map: [
      "sss..sss",
      "sss..sss",
      "sss..sss",
    ] },
  ],

  // 부품 종류. 순서대로 위에 겹쳐 그립니다.
  categories: [
    {
      id: "face", name: "얼굴", layer: "upper",
      options: [
        { name: "기본", at: [11, 6], map: ["", "", "", "", "..ee..ee..", "..ee..ee..", "", "....rr...."] },
        { name: "반짝", at: [11, 6], map: ["", "", "", "", "..1e..1e..", "..ee..ee..", ".k......k.", "....rr...."] },
        { name: "웃음", at: [11, 6], map: ["", "", "", "", "..e....e..", ".e.e..e.e.", ".k......k.", "...rrrr..."] },
        { name: "졸림", at: [11, 6], map: ["", "", "", "", "", ".eee..eee.", "", "....rr...."] },
        { name: "화남", at: [11, 6], map: ["", "", "", ".e......e.", "..ee..ee..", "..ee..ee..", "", "...rrrr..."] },
        { name: "놀람", at: [11, 6], map: ["", "", "", "", "..ee..ee..", "..ee..ee..", "", "....rr....", "....rr...."] },
      ],
    },
    {
      id: "hair", name: "머리", layer: "upper",
      options: [
        { name: "없음", at: [0, 0], map: [] },
        { name: "짧은 머리", at: [10, 4], map: [
          "",
          "...hhhhhh...",
          "..hhhhhhhh..",
          ".hhhhhhhhhh.",
          ".hhhhhhhhhh.",
          ".hhHH..HHhh.",
          ".hh......hh.",
          ".H........H.",
        ] },
        { name: "긴 머리", at: [10, 4], map: [
          "",
          "...hhhhhh...",
          "..hhhhhhhh..",
          ".hhhhhhhhhh.",
          "hhhhhhhhhhhh",
          "hhhH....Hhhh",
          "hhh......hhh",
          "hhh......hhh",
          "hhh......hhh",
          "hh........hh",
          "hh........hh",
          "hh........hh",
          "HH........HH",
          "HH........HH",
        ] },
        { name: "뾰족 머리", at: [10, 3], map: [
          "..h..h..h...",
          "..hh.hh.hh..",
          ".hhhhhhhhhh.",
          "hhhhhhhhhhhh",
          "hhhhhhhhhhhh",
          ".hhhhhhhhhh.",
          ".hH.H..H.Hh.",
          ".h........h.",
        ] },
        { name: "바가지", at: [10, 4], map: [
          "",
          "...hhhhhh...",
          "..hhhhhhhh..",
          ".hhhhhhhhhh.",
          ".hhhhhhhhhh.",
          ".HHHHHHHHHH.",
          ".h........h.",
          ".h........h.",
          ".H........H.",
        ] },
        { name: "포니테일", at: [10, 4], map: [
          "",
          "...hhhhhh...",
          "..hhhhhhhhh.",
          ".hhhhhhhhhhh",
          ".hhhhhhhhhhh",
          ".hhHH..HHhhh",
          ".hh......h.h",
          ".H........hh",
          "..........hh",
          "..........hh",
          "..........HH",
        ] },
        { name: "양갈래", at: [8, 4], map: [
          "",
          ".....hhhhhh.....",
          "....hhhhhhhh....",
          "...hhhhhhhhhh...",
          "...hhhhhhhhhh...",
          "..hhhHH..HHhhh..",
          ".hhhh......hhhh.",
          ".hh.H......H.hh.",
          ".hh..........hh.",
          ".hh..........hh.",
          "..H..........H..",
        ] },
      ],
    },
    {
      id: "lowerP", name: "하의", layer: "lower",
      options: [
        { name: "긴 바지", at: [12, 22], map: ["pppppppp", "ppp..ppp", "PPP..PPP"] },
        { name: "반바지", at: [12, 22], map: ["pppppppp", "PPP..PPP"] },
        { name: "치마", at: [11, 22], map: [".pppppppp.", "pppppppppp", "PPPPPPPPPP"] },
        { name: "없음", at: [0, 0], map: [] },
      ],
    },
    {
      id: "boots", name: "신발", layer: "lower",
      options: [
        { name: "장화", at: [11, 25], map: [".bbb..bbb.", ".bbb..bbb.", "BBBB..BBBB"] },
        { name: "운동화", at: [11, 25], map: [".sss..sss.", ".bbb..bbb.", "1BBB..BBB1"] },
        { name: "맨발", at: [11, 25], map: [".sss..sss.", ".sss..sss.", "SSSS..SSSS"] },
      ],
    },
    {
      id: "top", name: "상의", layer: "upper",
      options: [
        { name: "반팔 티", at: [10, 16], map: [
          "cccccccccccc",
          "CccccccccccC",
          "..cccccccc..",
          "..cccccccc..",
          "..cccccccc..",
          "..CCCCCCCC..",
        ] },
        { name: "긴팔 옷", at: [10, 16], map: [
          "cccccccccccc",
          "cccccccccccc",
          "cc.cccccc.cc",
          "cc.cccccc.cc",
          "CC.cccccc.CC",
          "..CCCCCCCC..",
        ] },
        { name: "갑옷", at: [10, 16], map: [
          "1cccccccccc1",
          "CCccc11cccCC",
          "cc.ccc1ccc.c",
          "CC.cccccCc.C",
          "..33343333..",
          "..cCcCcCcC..",
        ] },
        { name: "조끼", at: [10, 16], map: [
          "11cc1111cc11",
          "11cc1111cc11",
          "..cc1111cc..",
          "..cc1111cc..",
          "..cccccccc..",
          "..CCCCCCCC..",
        ] },
        { name: "마법사 로브", at: [10, 16], map: [
          "ccccc44ccccc",
          "ccccc44ccccc",
          "cc.cc44cc.cc",
          "cc.cc44cc.cc",
          "CC.cc44cc.CC",
          "..ccc44ccc..",
          "..ccc44ccc..",
          "..ccc44ccc..",
          ".cccc44cccc.",
          ".cccc44cccc.",
          ".CCCC44CCCC.",
        ] },
      ],
    },
    {
      id: "hat", name: "모자", layer: "upper",
      options: [
        { name: "없음", at: [0, 0], map: [] },
        { name: "투구", at: [10, 1], map: [
          "", "", "",
          "...aaaaaa...",
          "..aaaaaaaa..",
          ".aaa1aaaaaa.",
          ".aaaaaaaaaa.",
          ".AAAAAAAAAA.",
          ".a........a.",
          ".a........a.",
          ".A........A.",
        ] },
        { name: "마법사 모자", at: [10, 0], map: [
          ".........aa.",
          "........aa..",
          ".......aaa..",
          "......aaaa..",
          ".....aaaaa..",
          "...aaaaaaa..",
          "..aaa4444aa.",
          "aaaaaaaaaaaa",
          "AAAAAAAAAAAA",
        ] },
        { name: "왕관", at: [10, 1], map: [
          "", "",
          "..4..4..4...",
          "..44.44.44..",
          "..44444444..",
          "..4a4444a4..",
        ] },
        { name: "두건", at: [10, 1], map: [
          "", "", "", "",
          "...aaaaaa...",
          "..aaaaaaaa..",
          ".aaaaaaaaaa.",
          ".AAAAAAAAAAa",
          "..........aa",
          "...........a",
        ] },
        { name: "고양이 귀", at: [10, 2], map: [
          "",
          ".a........a.",
          ".aa......aa.",
          ".aka....aka.",
          ".aaa....aaa.",
        ] },
      ],
    },
    {
      id: "shield", name: "방패", layer: "upper",
      options: [
        { name: "없음", at: [0, 0], map: [] },
        { name: "둥근 방패", at: [6, 16], map: [
          ".lll.",
          "llLll",
          "lL4Ll",
          "llLll",
          ".lll.",
        ] },
        { name: "나무 방패", at: [5, 15], map: [
          "llllll",
          "l3333l",
          "l3443l",
          "l3333l",
          ".l33l.",
          "..ll..",
        ] },
      ],
    },
    {
      id: "weapon", name: "무기", layer: "weapon",
      options: [
        { name: "없음", at: [0, 0], map: [] },
        { name: "검", at: [20, 8], map: [
          "..w.",
          ".1w.",
          ".1w.",
          ".1w.",
          ".1w.",
          ".1w.",
          ".1W.",
          ".1W.",
          ".1W.",
          ".1W.",
          ".1W.",
          "4444",
          ".33.",
          ".33.",
          ".44.",
        ] },
        { name: "지팡이", at: [21, 4], map: [
          ".w.",
          "w1w",
          "wwW",
          ".W.",
          ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.",
          ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.",
        ] },
        { name: "도끼", at: [20, 12], map: [
          "...ww.",
          "..3www",
          "..3w1w",
          "..3www",
          "..3WW.",
          "..3...", "..3...", "..3...", "..3...", "..3...", "..3...", "..3...",
        ] },
        { name: "창", at: [21, 1], map: [
          ".w.",
          ".1w",
          "w1w",
          "wwW",
          "444",
          ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.",
          ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.", ".3.",
        ] },
        { name: "망치", at: [19, 12], map: [
          "wwwww.",
          "w1www.",
          "WWWWW.",
          "..3...", "..3...", "..3...", "..3...", "..3...", "..3...", "..3...", "..3...", "..3...",
        ] },
      ],
    },
  ],

  // 움직임: 각 장면(frame)에서 몸의 부분을 몇 칸 옮길지
  //   up = 윗몸, lL/lR = 왼다리/오른다리, wp = 무기  (각각 [x, y])
  animations: [
    { id: "idle", name: "가만히", speed: 500, frames: [{}, { up: [0, 1], wp: [0, 1] }] },
    { id: "walk", name: "걷기", speed: 160, frames: [
      { lL: [0, -1] },
      { up: [0, 1], wp: [0, 1] },
      { lR: [0, -1] },
      { up: [0, 1], wp: [0, 1] },
    ] },
    { id: "attack", name: "공격", speed: 140, frames: [
      { wp: [-2, -2] },
      { up: [1, 0], wp: [3, 3] },
      { up: [1, 0], wp: [3, 3] },
      {},
    ] },
    { id: "jump", name: "점프", speed: 150, frames: [
      { up: [0, 1], wp: [0, 1] },
      { all: [0, -2] },
      { all: [0, -3] },
      { all: [0, -1] },
    ] },
  ],
};
