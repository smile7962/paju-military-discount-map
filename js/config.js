// 브이월드 오픈API 인증키 (vworld.kr에서 발급, 서비스 도메인 등록 필요)
const VWORLD_KEY = "EF8BB9D7-A8D9-3864-B825-4C18C49EE296";

// 파주시 중심 좌표 / 기본 줌
const PAJU_CENTER = [37.76, 126.78];
const DEFAULT_ZOOM = 11;

// 업종 카테고리 정의 (표시 순서대로)
const CATEGORIES = {
  food:   { label: "음식점",    emoji: "🍚", color: "#e2574c" },
  cafe:   { label: "카페·간식", emoji: "☕", color: "#b07845" },
  beauty: { label: "미용",      emoji: "💇", color: "#9061c2" },
  bath:   { label: "목욕",      emoji: "🛁", color: "#3d8bd4" },
  stay:   { label: "숙박",      emoji: "🛏️", color: "#3aa374" },
  etc:    { label: "기타",      emoji: "🏪", color: "#7a7a7a" },
};

// 권역 표시 순서 (데이터에 없는 권역은 자동 제외)
const REGION_ORDER = [
  "금촌", "운정", "교하", "조리", "광탄", "월롱",
  "파주", "문산", "법원", "탄현", "적성", "파평",
];
