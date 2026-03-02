// ─── App Constants ──────────────────────────────────────────────

export const STAR_COUNT = 1600;
export const DEPTH_LAYERS = 4;
export const CURSOR_RADIUS = 120;
export const CURSOR_FORCE = 0.8;
export const DRIFT_SPEED = 0.15;
export const PARALLAX_STRENGTH = 0.035;

export const PHASE = {
    GALAXY: "galaxy",
    WARP: "warp",
    SOLAR: "solar",
    EARTH_ZOOM: "earth_zoom",
    QUOTE: "quote",
};

export const SAGAN_QUOTES = [
    "저 점을 다시 보세요.",
    "저기 저 점이요.",
    "그곳이 여기입니다.",
    "그곳이 우리의 집입니다.",
    "그곳이 우리입니다.",
    "",
    "당신이 사랑하는 모든 사람,",
    "당신이 아는 모든 사람,",
    "당신이 들어본 적 있는 모든 사람,",
    "존재했던 모든 인간이",
    "그 위에서 삶을 살았습니다.",
    "",
    "우리의 모든 기쁨과 고통,",
    "확신에 찬 수천의 종교와 이념,",
    "모든 사냥꾼과 약탈자,",
    "모든 영웅과 비겁자,",
    "문명의 창조자와 파괴자,",
    "모든 왕과 농부,",
    "사랑에 빠진 모든 젊은 연인들,",
    "모든 어머니와 아버지,",
    "희망에 찬 아이들,",
    "",
    "이 모두가 태양빛 속에 떠다니는",
    "저 작은 먼지 위에서 살았습니다.",
    "",
    "칼 세이건",
];

export const PLANETS = [
    { name: "Mercury", label: "수성", dist: 0.06, size: 1.5, color: "#a0a0a0", speed: 0.018, angle: 0.4 },
    { name: "Venus", label: "금성", dist: 0.10, size: 2.5, color: "#e8c56d", speed: 0.013, angle: 1.2 },
    { name: "Earth", label: "지구", dist: 0.16, size: 2.5, color: "#4a9eff", speed: 0.010, angle: 2.8 },
    { name: "Mars", label: "화성", dist: 0.22, size: 2, color: "#d45a3a", speed: 0.008, angle: 4.1 },
    { name: "Jupiter", label: "목성", dist: 0.34, size: 6, color: "#c8a870", speed: 0.004, angle: 0.9 },
    { name: "Saturn", label: "토성", dist: 0.46, size: 5, color: "#dac47a", speed: 0.003, angle: 3.5, hasRing: true },
    { name: "Uranus", label: "천왕성", dist: 0.58, size: 3.8, color: "#7ec8d4", speed: 0.002, angle: 5.2 },
    { name: "Neptune", label: "해왕성", dist: 0.70, size: 3.5, color: "#4466cc", speed: 0.0015, angle: 1.7 },
];

export const PBD = { relX: 0.62, relY: 0.48, glow: 0.1, pulse: 0.008, size: 1.5 };
