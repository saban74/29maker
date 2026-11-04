// 제품군(분류). code 는 제품 목록 거르기 버튼과 카드의 data-cat 에 쓰는 영문 코드입니다.
// label: 제품 목록 거르기 버튼 글자 / crumb: 제품 상세 위쪽 경로(Home > 제품소개 > 여기) 글자
// 새 제품군을 만들려면 여기 한 줄을 더하고, site/admin/config.yml 의 제품군 선택 목록에도 같은 code 를 더하세요.
export default [
  { code: "th", label: "항온항습기", crumb: "항온항습기" },
  { code: "rt", label: "급속 온도변화·온도 사이클", crumb: "급속 온도변화·온도 사이클 시험기" },
  { code: "ts", label: "열충격", crumb: "열충격 시험기" },
  { code: "hast", label: "HAST", crumb: "HAST 가속수명 시험기" },
  { code: "wi", label: "워크인 챔버", crumb: "워크인 챔버" },
  { code: "ov", label: "산업용 오븐", crumb: "산업용 오븐" },
  { code: "bt", label: "2차전지 시험", crumb: "2차전지 시험 장비" },
  { code: "sc", label: "반도체·전자부품 평가", crumb: "반도체·전자부품 평가 시스템" },
  { code: "vib", label: "진동 시험기", crumb: "진동 시험기" },
];
