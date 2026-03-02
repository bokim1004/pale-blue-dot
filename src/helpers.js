import { STAR_COUNT, DEPTH_LAYERS } from "./constants";

// ─── Star field (galaxy phase) ──────────────────────────────────
export function createStars(w, h) {
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        const layer = Math.floor(Math.random() * DEPTH_LAYERS);
        const baseSize = Math.random() * 1.8 + 0.3;
        const sizeMul = 1 - layer * 0.18;
        const isMW = Math.random() < 0.42;
        const bandY = h * 0.5 + (Math.random() - 0.5) * h * 0.28;
        stars.push({
            x: Math.random() * w * 1.4 - w * 0.2,
            y: isMW ? bandY + (Math.random() - 0.5) * h * 0.15 : Math.random() * h,
            baseX: 0, baseY: 0, offsetX: 0, offsetY: 0,
            size: baseSize * sizeMul, layer,
            brightness: Math.random() * 0.6 + 0.4,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinkleOffset: Math.random() * Math.PI * 2,
            hue: isMW ? 200 + Math.random() * 60 : Math.random() < 0.15 ? 30 + Math.random() * 30 : 200 + Math.random() * 80,
            saturation: isMW ? 20 + Math.random() * 40 : Math.random() * 30,
        });
    }
    stars.forEach((s) => { s.baseX = s.x; s.baseY = s.y; });
    return stars;
}

// ─── Nebula clouds ──────────────────────────────────────────────
export function createNebula(w, h) {
    const clouds = [];
    for (let i = 0; i < 14; i++) {
        const bandY = h * 0.5 + (Math.random() - 0.5) * h * 0.3;
        clouds.push({
            x: Math.random() * w * 1.2 - w * 0.1,
            y: bandY + (Math.random() - 0.5) * h * 0.12,
            rx: Math.random() * 220 + 90, ry: Math.random() * 80 + 35,
            hue: 210 + Math.random() * 50, alpha: Math.random() * 0.03 + 0.01,
            layer: Math.floor(Math.random() * 3),
        });
    }
    return clouds;
}

// ─── Background stars (solar/quote phase) ───────────────────────
export function createBgStars(w, h) {
    const stars = [];
    for (let i = 0; i < 350; i++) {
        stars.push({
            x: Math.random() * w, y: Math.random() * h,
            size: Math.random() * 1.1 + 0.2,
            alpha: Math.random() * 0.4 + 0.2,
            twinkle: Math.random() * 0.01 + 0.003,
            offset: Math.random() * Math.PI * 2,
        });
    }
    return stars;
}

// ─── Easing ─────────────────────────────────────────────────────
export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
