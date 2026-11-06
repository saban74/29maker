// 제품 목록 맨 아래 "그 밖의 라인업(상담 가능)" 목록입니다. 상세 페이지 없이 ESPEC 원문 링크와 문의 링크만 보여 줍니다.
// name: 장비 이름 / desc: 한 줄 설명 / espec: ESPEC 공식 영문 페이지 주소(없으면 비움) / item: 문의 양식 "관심 제품" 칸에 들어갈 이름
// desc 안에 [확인 필요] 를 쓰면 노란 표시가 됩니다.
export default [
  { name: "SHINKEN 진동 시험기", desc: "진동 시험기. 사양은 문의해 주세요. [확인 필요]", espec: "", item: "SHINKEN 진동 시험기" },
  { name: "Constant Climate Cabinet", desc: "소형 항온항습 캐비닛", espec: "https://www.espec.co.jp/english/products/env-test/mc/", item: "Constant Climate Cabinet" },
  { name: "Compact Ultra Low Temperature Chamber", desc: "소형 초저온 시험기", espec: "https://www.espec.co.jp/english/products/env-test/ls/", item: "Compact Ultra Low Temperature Chamber" },
  { name: "Stability Test Chamber CSH/CWH", desc: "보관 안정성 시험기", espec: "https://www.espec.co.jp/english/products/env-test/csh/", item: "CSH/CWH" },
  { name: "Large HAST Chamber", desc: "대형 HAST 시험기", espec: "https://www.espec.co.jp/english/products/env-test/ehs431/", item: "Large HAST Chamber" },
  { name: "FD Series", desc: "배터리 모듈, EV 파워트레인, 태양광 모듈 등 대형 시험체용", espec: "https://www.espec.co.jp/english/products/env-test/fd/", item: "FD Series" },
  { name: "Altitude Temperature (& Humidity) Chamber MZ Series", desc: "고도(저기압) 시험", espec: "https://www.espec.co.jp/english/products/env-test/mz/", item: "MZ Series" },
  { name: "High-Rate Thermal Cycle Chamber", desc: "고속 온도 사이클 시험기", espec: "https://www.espec.co.jp/english/products/env-test/hr/", item: "High-Rate Thermal Cycle Chamber" },
  { name: "Liquid to Liquid 열충격 TSB Series", desc: "액체식 열충격 시험기", espec: "https://www.espec.co.jp/english/products/env-test/tsb/", item: "TSB Series" },
  { name: "특수 오븐", desc: "초고온, 방폭 벤트, 무산소, 클린, 진공 등", espec: "https://www.espec.co.jp/english/products/env-test/pvc/", item: "특수 오븐" },
  { name: "ESPEC ONLINECORE", desc: "웹 브라우저로 최대 100대의 챔버를 통합 감시", espec: "https://www.espec.co.jp/english/products/env-test/pcs/", item: "ONLINECORE" },
  { name: "맞춤 제작", desc: "진동 복합 등 복합 환경 시험 시스템", espec: "https://www.espec.co.jp/english/products/env-test/#special_example", item: "맞춤 제작" },
  { name: "HALT/HASS, 식물 재배 챔버", desc: "자세한 내용은 문의해 주세요 [확인 필요]", espec: "", item: "HALT/HASS 또는 식물 재배 챔버" },
];
