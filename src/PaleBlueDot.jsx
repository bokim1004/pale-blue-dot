import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────
const STAR_COUNT = 1600;
const DEPTH_LAYERS = 4;
const CURSOR_RADIUS = 120;
const CURSOR_FORCE = 0.8;
const DRIFT_SPEED = 0.15;
const PARALLAX_STRENGTH = 0.035;

const PHASE = {
  GALAXY: "galaxy",
  WARP: "warp",
  SOLAR: "solar",
  EARTH_ZOOM: "earth_zoom",
  QUOTE: "quote",
};

const SAGAN_QUOTES = [
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
  "— 칼 세이건",
];

const PLANETS = [
  { name: "Mercury", label: "수성", dist: 0.06, size: 1.5, color: "#a0a0a0", speed: 0.018, angle: 0.4 },
  { name: "Venus", label: "금성", dist: 0.10, size: 2.5, color: "#e8c56d", speed: 0.013, angle: 1.2 },
  { name: "Earth", label: "지구", dist: 0.16, size: 2.5, color: "#4a9eff", speed: 0.010, angle: 2.8 },
  { name: "Mars", label: "화성", dist: 0.22, size: 2, color: "#d45a3a", speed: 0.008, angle: 4.1 },
  { name: "Jupiter", label: "목성", dist: 0.34, size: 6, color: "#c8a870", speed: 0.004, angle: 0.9 },
  { name: "Saturn", label: "토성", dist: 0.46, size: 5, color: "#dac47a", speed: 0.003, angle: 3.5, hasRing: true },
  { name: "Uranus", label: "천왕성", dist: 0.58, size: 3.8, color: "#7ec8d4", speed: 0.002, angle: 5.2 },
  { name: "Neptune", label: "해왕성", dist: 0.70, size: 3.5, color: "#4466cc", speed: 0.0015, angle: 1.7 },
];

// ─── Helpers ─────────────────────────────────────────────────────
function createStars(w, h) {
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

function createNebula(w, h) {
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

function createBgStars(w, h) {
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

const PBD = { relX: 0.62, relY: 0.48, glow: 0.1, pulse: 0.008, size: 1.5 };

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ═══════════════════════════════════════════════════════════════════
export default function PaleBlueDot() {
  const canvasRef = useRef(null);
  const S = useRef({
    phase: PHASE.GALAXY,
    stars: [], nebula: [], bgStars: [],
    mouse: { x: -9999, y: -9999, active: false },
    drift: { x: 0, y: 0 },
    frame: 0, dim: { w: 0, h: 0 },
    lastMouseMove: 0,
    tooltip: { alpha: 0 },
    hovered: false,
    warpProgress: 0, warpStartTime: 0,
    solarAlpha: 0, solarTime: 0,
    earthHovered: false,
    earthZoomProgress: 0, earthZoomStart: 0,
    quoteStartTime: 0, earthBrightness: 0.3,
    quoteComplete: false, earthRotation: 0,
  }).current;

  const [, kick] = useState(0);

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth, h = window.innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + "px"; c.style.height = h + "px";
    c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    S.dim = { w, h };
    S.stars = createStars(w, h);
    S.nebula = createNebula(w, h);
    S.bgStars = createBgStars(w, h);
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  useEffect(() => {
    const onM = (e) => { S.mouse = { x: e.clientX, y: e.clientY, active: true }; S.lastMouseMove = Date.now(); };
    const onL = () => { S.mouse.active = false; };
    window.addEventListener("mousemove", onM);
    window.addEventListener("mouseleave", onL);
    return () => { window.removeEventListener("mousemove", onM); window.removeEventListener("mouseleave", onL); };
  }, []);

  // ─── Main loop ────────────────────────────────────────────────
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let id;

    const loop = (ts) => {
      const { w, h } = S.dim;
      if (!w) { id = requestAnimationFrame(loop); return; }
      S.frame++;
      const f = S.frame;
      const m = S.mouse;

      ctx.fillStyle = "#03060d";
      ctx.fillRect(0, 0, w, h);

      // ── GALAXY + WARP ──
      if (S.phase === PHASE.GALAXY || S.phase === PHASE.WARP) {
        const drift = S.drift;
        const isWarp = S.phase === PHASE.WARP;

        if (!isWarp) {
          const idle = Date.now() - S.lastMouseMove > 2000 || !m.active;
          if (idle) { drift.x += DRIFT_SPEED * 0.3; drift.y += Math.sin(f * 0.001) * DRIFT_SPEED * 0.08; }
        }

        // BG glow
        const bg = ctx.createRadialGradient(w * .5, h * .5, 0, w * .5, h * .5, w * .7);
        bg.addColorStop(0, "rgba(15,20,45,0.3)"); bg.addColorStop(.5, "rgba(8,12,30,0.15)"); bg.addColorStop(1, "transparent");
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

        // Nebula
        for (const cl of S.nebula) {
          const pF = (cl.layer + 1) * PARALLAX_STRENGTH * .5;
          const cx2 = cl.x - drift.x * .3 * (cl.layer + 1) + (m.active ? (m.x - w / 2) * pF * .5 : 0);
          const cy2 = cl.y - drift.y * .3 * (cl.layer + 1) + (m.active ? (m.y - h / 2) * pF * .5 : 0);
          const g = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, cl.rx);
          const p = Math.sin(f * .003 + cl.x) * .005;
          g.addColorStop(0, `hsla(${cl.hue},40%,60%,${cl.alpha + p})`);
          g.addColorStop(.5, `hsla(${cl.hue},30%,40%,${cl.alpha * .4})`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.save(); ctx.translate(cx2, cy2); ctx.scale(1, cl.ry / cl.rx); ctx.translate(-cx2, -cy2);
          ctx.beginPath(); ctx.arc(cx2, cy2, cl.rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }

        // Warp progress
        const wp = isWarp ? S.warpProgress : 0;

        // Stars
        for (const s of S.stars) {
          const pF = (s.layer + 1) * PARALLAX_STRENGTH;
          let tOX = 0, tOY = 0;
          if (m.active) { tOX = (m.x - w / 2) * pF; tOY = (m.y - h / 2) * pF; }
          s.offsetX += (tOX - s.offsetX) * .04;
          s.offsetY += (tOY - s.offsetY) * .04;
          const dM = (s.layer + 1) * .25;
          let sx = s.baseX + s.offsetX - drift.x * dM;
          let sy = s.baseY + s.offsetY - drift.y * dM;
          const mg = 50;
          if (sx < -mg) sx += w + mg * 2; if (sx > w + mg) sx -= w + mg * 2;
          if (sy < -mg) sy += h + mg * 2; if (sy > h + mg) sy -= h + mg * 2;

          if (m.active && !isWarp) {
            const dx = sx - m.x, dy = sy - m.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < CURSOR_RADIUS && d > 0) {
              const force = (1 - d / CURSOR_RADIUS) * CURSOR_FORCE * (s.layer + 1) * .4;
              sx += (dx / d) * force * 30; sy += (dy / d) * force * 30;
            }
          }

          const tw = Math.sin(f * s.twinkleSpeed + s.twinkleOffset) * .3 + .7;
          const a = s.brightness * tw;

          if (isWarp && wp > .05) {
            const stretch = 1 + wp * (s.layer + 1) * 22;
            const ang = Math.atan2(sy - h / 2, sx - w / 2);
            const len = s.size * stretch;
            ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
            const lg = ctx.createLinearGradient(0, 0, len, 0);
            lg.addColorStop(0, `hsla(${s.hue},${s.saturation}%,92%,${a})`);
            lg.addColorStop(1, `hsla(${s.hue},${s.saturation}%,85%,0)`);
            ctx.strokeStyle = lg; ctx.lineWidth = Math.max(.4, s.size * (1 - wp * .3));
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
            ctx.restore();
          } else {
            if (s.size > 1.2) {
              const gG = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.size * 4);
              gG.addColorStop(0, `hsla(${s.hue},${s.saturation}%,90%,${a * .3})`);
              gG.addColorStop(1, "transparent");
              ctx.fillStyle = gG; ctx.beginPath(); ctx.arc(sx, sy, s.size * 4, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = `hsla(${s.hue},${s.saturation}%,${85 + tw * 15}%,${a})`;
            ctx.beginPath(); ctx.arc(sx, sy, s.size, 0, Math.PI * 2); ctx.fill();
          }
        }

        // PBD hint (galaxy only)
        if (S.phase === PHASE.GALAXY) {
          const pbx = PBD.relX * w + (m.active ? (m.x - w / 2) * PARALLAX_STRENGTH * 2 : 0) - drift.x * .5;
          const pby = PBD.relY * h + (m.active ? (m.y - h / 2) * PARALLAX_STRENGTH * 2 : 0) - drift.y * .5;
          let dx2 = ((pbx % w) + w) % w, dy2 = ((pby % h) + h) % h;
          const pulse = Math.sin(f * PBD.pulse) * .5 + .5;
          const mdx = m.x - dx2, mdy = m.y - dy2;
          const mD = Math.sqrt(mdx * mdx + mdy * mdy);
          const isH = m.active && mD < 35;
          S.hovered = isH;
          const hG = isH ? .55 : 0;
          const fG = Math.min(1, PBD.glow + pulse * .08 + hG);
          const gS = isH ? 48 : 22;
          const oG = ctx.createRadialGradient(dx2, dy2, 0, dx2, dy2, gS);
          oG.addColorStop(0, `rgba(100,150,255,${fG * .45})`);
          oG.addColorStop(.3, `rgba(80,130,255,${fG * .15})`);
          oG.addColorStop(1, "transparent");
          ctx.fillStyle = oG; ctx.beginPath(); ctx.arc(dx2, dy2, gS, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(140,180,255,${.5 + fG * .5})`;
          ctx.beginPath(); ctx.arc(dx2, dy2, PBD.size, 0, Math.PI * 2); ctx.fill();

          if (isH) S.tooltip.alpha = Math.min(1, S.tooltip.alpha + .03);
          else S.tooltip.alpha = Math.max(0, S.tooltip.alpha - .03);
          if (S.tooltip.alpha > 0) {
            ctx.save(); ctx.font = '13px "Courier New",monospace'; ctx.textAlign = "center";
            ctx.fillStyle = `rgba(160,190,255,${S.tooltip.alpha * .85})`;
            ctx.fillText("여기서 모든 일이 일어났다", dx2, dy2 - 30); ctx.restore();
          }
        }

        // Warp overlay
        if (isWarp) {
          if (!S.warpStartTime) S.warpStartTime = ts;
          const elapsed = (ts - S.warpStartTime) / 1000;
          const raw = Math.min(1, elapsed / 5.5);
          S.warpProgress = easeInOutCubic(raw);
          const wpp = S.warpProgress;

          if (wpp > .7) {
            const flash = (wpp - .7) / .3;
            const fG2 = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * .25 * flash);
            fG2.addColorStop(0, `rgba(180,200,255,${flash * .2})`); fG2.addColorStop(1, "transparent");
            ctx.fillStyle = fG2; ctx.fillRect(0, 0, w, h);
          }

          const vG = ctx.createRadialGradient(w / 2, h / 2, w * .06 * (1 - wpp), w / 2, h / 2, w * .58);
          vG.addColorStop(0, "transparent");
          vG.addColorStop(.5, `rgba(0,0,0,${wpp * .55})`);
          vG.addColorStop(1, `rgba(0,0,0,${wpp * .93})`);
          ctx.fillStyle = vG; ctx.fillRect(0, 0, w, h);

          if (wpp > .12) {
            const dist = Math.max(0, 6000000000 * (1 - (wpp - .12) / .88));
            const dStr = `지구까지 ${Math.floor(dist).toLocaleString()} km`;
            const cA = wpp < .85 ? Math.min(1, (wpp - .12) * 4) : Math.max(0, (1 - wpp) * 7);
            ctx.save(); ctx.font = '14px "Courier New",monospace'; ctx.textAlign = "center";
            ctx.fillStyle = `rgba(140,175,240,${cA * .8})`; ctx.fillText(dStr, w / 2, h * .6);
            const spd = (wpp * 299792).toFixed(0);
            ctx.font = '11px "Courier New",monospace';
            ctx.fillStyle = `rgba(120,155,220,${cA * .4})`;
            ctx.fillText(`${Number(spd).toLocaleString()} km/s`, w / 2, h * .6 + 22);
            ctx.restore();
          }

          if (raw >= 1) {
            S.phase = PHASE.SOLAR; S.warpStartTime = 0; S.solarTime = ts;
            kick(n => n + 1);
          }
        }

        // Film grain
        if (f % 3 === 0) {
          ctx.fillStyle = "rgba(255,255,255,.004)";
          for (let i = 0; i < 35; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
      }

      // ── SOLAR / EARTH_ZOOM / QUOTE ──
      if (S.phase === PHASE.SOLAR || S.phase === PHASE.EARTH_ZOOM || S.phase === PHASE.QUOTE) {
        if (S.phase === PHASE.SOLAR && S.solarTime) S.solarAlpha = Math.min(1, (ts - S.solarTime) / 2500);
        const alpha = S.phase === PHASE.SOLAR ? S.solarAlpha : 1;
        ctx.save(); ctx.globalAlpha = alpha;

        // Bg stars
        for (const s of S.bgStars) {
          const tw2 = Math.sin(f * s.twinkle + s.offset) * .3 + .7;
          ctx.fillStyle = `rgba(200,210,240,${s.alpha * tw2})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        }

        const cx = w / 2, cy = h / 2, scale = Math.min(w, h);

        // Earth zoom
        let ezp = 0;
        if (S.phase === PHASE.EARTH_ZOOM) {
          if (!S.earthZoomStart) S.earthZoomStart = ts;
          const el = (ts - S.earthZoomStart) / 1000;
          ezp = easeInOutCubic(Math.min(1, el / 3.2));
          S.earthZoomProgress = ezp;
          if (el >= 3.2) { S.phase = PHASE.QUOTE; S.earthZoomStart = 0; kick(n => n + 1); }
        }
        if (S.phase === PHASE.QUOTE) { ezp = 1; S.earthZoomProgress = 1; }

        // Camera
        let camX = 0, camY = 0, camS = 1;
        if (ezp > 0) {
          const ep = PLANETS[2];
          const eA = ep.angle + f * ep.speed;
          const eD = ep.dist * scale;
          const eX = cx + Math.cos(eA) * eD, eY = cy + Math.sin(eA) * eD;
          camX = -(eX - cx) * ezp; camY = -(eY - cy) * ezp;
          camS = 1 + ezp * 20;
        }

        ctx.save();
        ctx.translate(cx, cy); ctx.scale(camS, camS); ctx.translate(-cx + camX, -cy + camY);

        // Sun
        const sunSz = 10 * (1 - ezp * .3);
        const sG = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunSz * 7);
        sG.addColorStop(0, "rgba(255,220,100,.35)"); sG.addColorStop(.3, "rgba(255,180,60,.1)"); sG.addColorStop(1, "transparent");
        ctx.fillStyle = sG; ctx.beginPath(); ctx.arc(cx, cy, sunSz * 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff5d0"; ctx.beginPath(); ctx.arc(cx, cy, sunSz, 0, Math.PI * 2); ctx.fill();

        // Planets
        for (let i = 0; i < PLANETS.length; i++) {
          const p = PLANETS[i];
          const dist2 = p.dist * scale;
          const ang = p.angle + f * p.speed;
          const px = cx + Math.cos(ang) * dist2, py = cy + Math.sin(ang) * dist2;

          // Orbit
          ctx.strokeStyle = `rgba(60,80,120,${.12 * (1 - ezp * .8)})`;
          ctx.lineWidth = .5;
          ctx.beginPath(); ctx.arc(cx, cy, dist2, 0, Math.PI * 2); ctx.stroke();

          // Ring
          if (p.hasRing) {
            ctx.save(); ctx.translate(px, py); ctx.rotate(.4); ctx.scale(1, .35);
            ctx.strokeStyle = "rgba(218,196,122,.35)"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, p.size * 1.8, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
          }

          // Planet glow
          const pG = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
          pG.addColorStop(0, p.color + "30"); pG.addColorStop(1, "transparent");
          ctx.fillStyle = pG; ctx.beginPath(); ctx.arc(px, py, p.size * 3, 0, Math.PI * 2); ctx.fill();

          const pSize = i === 2 && ezp > .5 ? p.size * (1 + (ezp - .5) * 5) : p.size;
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2); ctx.fill();

          // Earth interaction
          if (i === 2) {
            if (S.phase === PHASE.SOLAR) {
              const imx = (m.x - cx) / camS + cx - camX;
              const imy = (m.y - cy) / camS + cy - camY;
              const ed = Math.sqrt((imx - px) ** 2 + (imy - py) ** 2);
              S.earthHovered = m.active && ed < 28;
              if (S.earthHovered) {
                const pr = 10 + Math.sin(f * .05) * 5;
                ctx.strokeStyle = `rgba(74,158,255,${.3 + Math.sin(f * .05) * .15})`;
                ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
                ctx.save(); ctx.font = '11px "Courier New",monospace'; ctx.textAlign = "center";
                ctx.fillStyle = "rgba(140,185,255,.75)"; ctx.fillText("여기", px, py - 20); ctx.restore();
              }
            }
            if (S.phase === PHASE.QUOTE) {
              const eGl = ctx.createRadialGradient(px, py, 0, px, py, pSize * 8);
              eGl.addColorStop(0, `rgba(80,140,255,${S.earthBrightness * .5})`);
              eGl.addColorStop(.4, `rgba(60,120,255,${S.earthBrightness * .2})`);
              eGl.addColorStop(1, "transparent");
              ctx.fillStyle = eGl; ctx.beginPath(); ctx.arc(px, py, pSize * 8, 0, Math.PI * 2); ctx.fill();
              S.earthRotation += .008;
              ctx.save(); ctx.translate(px, py); ctx.rotate(S.earthRotation);
              ctx.strokeStyle = `rgba(100,160,255,${S.earthBrightness * .15})`; ctx.lineWidth = .5;
              ctx.beginPath(); ctx.arc(0, 0, pSize * 3.5, 0, Math.PI * 1.2); ctx.stroke(); ctx.restore();
            }
          }

          // Labels
          if (S.phase === PHASE.SOLAR && alpha > .6 && ezp < .15) {
            ctx.save(); ctx.font = '9px "Courier New",monospace'; ctx.textAlign = "center";
            ctx.fillStyle = "rgba(150,170,200,.35)"; ctx.fillText(p.label, px, py + p.size + 14); ctx.restore();
          }
        }

        ctx.restore(); // camera

        // ── QUOTE TEXT ──
        if (S.phase === PHASE.QUOTE) {
          if (!S.quoteStartTime) S.quoteStartTime = ts;
          const qE = (ts - S.quoteStartTime) / 1000;
          const cps = 10;
          const ld = 1.6;
          const tLine = Math.min(SAGAN_QUOTES.length - 1, Math.floor(qE / ld));
          const lTime = qE - tLine * ld;
          const tChars = SAGAN_QUOTES[tLine] ? Math.min(SAGAN_QUOTES[tLine].length, Math.floor(lTime * cps)) : 0;

          const lines = [];
          for (let i = 0; i <= tLine && i < SAGAN_QUOTES.length; i++) {
            if (i < tLine) lines.push({ text: SAGAN_QUOTES[i], alpha: 1, typing: false });
            else lines.push({ text: SAGAN_QUOTES[i].substring(0, tChars), alpha: 1, typing: true });
          }

          S.earthBrightness = .3 + (tLine / SAGAN_QUOTES.length) * .7;

          ctx.save();
          const fs = Math.min(17, w * .022);
          const lh = fs * 2.4;
          const startY = h * .22;
          const tx = w * .1;
          const maxV = 10;
          const scrOff = Math.max(0, lines.length - maxV) * lh;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const y = startY + i * lh - scrOff;
            if (y < startY - lh || y > h - 50) continue;
            let fA = 1;
            if (i < lines.length - maxV) fA = Math.max(0, 1 - (lines.length - maxV - i) * .35);

            const isAttr = line.text.includes("칼 세이건");
            const isEmpty = line.text.trim() === "";
            if (isEmpty) continue;

            ctx.font = isAttr ? `italic ${fs * .82}px "Courier New",monospace` : `${fs}px "Courier New",monospace`;
            ctx.fillStyle = isAttr
              ? `rgba(120,150,200,${fA * .45})`
              : `rgba(200,215,245,${fA * line.alpha * .88})`;
            ctx.fillText(line.text, tx, y);

            if (line.typing && Math.sin(ts * .006) > 0) {
              const tw3 = ctx.measureText(line.text).width;
              ctx.fillStyle = "rgba(160,190,255,.65)";
              ctx.fillRect(tx + tw3 + 3, y - fs + 3, 1.5, fs);
            }
          }
          ctx.restore();

          // Pointer line
          if (tLine >= SAGAN_QUOTES.length - 4) {
            const la = Math.min(1, (tLine - (SAGAN_QUOTES.length - 4)) * .4);
            if (la > 0) {
              ctx.save(); ctx.strokeStyle = `rgba(100,150,255,${la * .2})`;
              ctx.lineWidth = .5; ctx.setLineDash([4, 8]);
              const fromY = startY + Math.max(0, (SAGAN_QUOTES.length - 5)) * lh - scrOff;
              ctx.beginPath(); ctx.moveTo(tx, fromY); ctx.lineTo(w / 2, h / 2); ctx.stroke();
              ctx.setLineDash([]); ctx.restore();
            }
          }

          if (tLine >= SAGAN_QUOTES.length - 1 && tChars >= SAGAN_QUOTES[SAGAN_QUOTES.length - 1].length && !S.quoteComplete) {
            S.quoteComplete = true;
            kick(n => n + 1);
          }

          // Vignette
          const vg = ctx.createRadialGradient(w / 2, h / 2, w * .12, w / 2, h / 2, w * .62);
          vg.addColorStop(0, "transparent"); vg.addColorStop(1, "rgba(0,0,10,.5)");
          ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
        }

        ctx.restore(); // global alpha
      }

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  // ─── Click ────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    const { w, h } = S.dim;
    if (S.phase === PHASE.GALAXY) {
      const drift = S.drift;
      const pbx = PBD.relX * w + (S.mouse.active ? (S.mouse.x - w / 2) * PARALLAX_STRENGTH * 2 : 0) - drift.x * .5;
      const pby = PBD.relY * h + (S.mouse.active ? (S.mouse.y - h / 2) * PARALLAX_STRENGTH * 2 : 0) - drift.y * .5;
      const dx2 = ((pbx % w) + w) % w, dy2 = ((pby % h) + h) % h;
      const d = Math.sqrt((e.clientX - dx2) ** 2 + (e.clientY - dy2) ** 2);
      if (d < 42) {
        S.phase = PHASE.WARP; S.warpProgress = 0; S.warpStartTime = 0;
        kick(n => n + 1);
      }
    } else if (S.phase === PHASE.SOLAR && S.earthHovered) {
      S.phase = PHASE.EARTH_ZOOM; S.earthZoomStart = 0; S.earthZoomProgress = 0;
      kick(n => n + 1);
    }
  }, []);

  const resetAll = useCallback(() => {
    S.phase = PHASE.GALAXY;
    S.warpProgress = 0; S.solarAlpha = 0;
    S.earthZoomProgress = 0; S.quoteComplete = false;
    S.quoteStartTime = 0; S.earthBrightness = .3;
    S.earthRotation = 0; S.drift = { x: 0, y: 0 };
    S.tooltip.alpha = 0;
    const { w, h } = S.dim;
    S.stars = createStars(w, h);
    kick(n => n + 1);
  }, []);

  const cursor = (S.phase === PHASE.GALAXY && S.hovered) || (S.phase === PHASE.SOLAR && S.earthHovered) ? "pointer" : "default";

  return (
    <div style={{ position: "fixed", inset: 0, background: "#03060d", overflow: "hidden", cursor }}>
      <canvas ref={canvasRef} onClick={handleClick} style={{ display: "block", width: "100%", height: "100%" }} />

      {S.phase === PHASE.GALAXY && (
        <div style={{ position: "fixed", bottom: 44, left: 0, right: 0, textAlign: "center", pointerEvents: "none", animation: "fadeUp 3s ease-out forwards" }}>
          <p style={{ fontFamily: '"Courier New",monospace', fontSize: 12, color: "rgba(140,170,220,.3)", letterSpacing: ".2em", margin: 0 }}>
            은하수 속에서 빛나는 점을 찾으세요
          </p>
        </div>
      )}

      {S.phase === PHASE.WARP && (
        <div style={{ position: "fixed", top: 30, left: 0, right: 0, textAlign: "center", pointerEvents: "none", opacity: 0, animation: "fadeUp 1.5s ease-out .8s forwards" }}>
          <p style={{ fontFamily: '"Courier New",monospace', fontSize: 11, color: "rgba(120,150,200,.4)", letterSpacing: ".35em", margin: 0 }}>W A R P</p>
        </div>
      )}

      {S.phase === PHASE.SOLAR && S.solarAlpha > .8 && (
        <div style={{ position: "fixed", bottom: 44, left: 0, right: 0, textAlign: "center", pointerEvents: "none", animation: "fadeUp 2.5s ease-out 1.5s forwards", opacity: 0 }}>
          <p style={{ fontFamily: '"Courier New",monospace', fontSize: 12, color: "rgba(140,170,220,.32)", letterSpacing: ".15em", margin: 0 }}>
            창백한 푸른 점을 찾으세요
          </p>
        </div>
      )}

      {S.quoteComplete && (
        <div style={{ position: "fixed", bottom: 36, right: 36, pointerEvents: "auto", opacity: 0, animation: "fadeUp 2s ease-out 2s forwards" }}>
          <button onClick={resetAll} style={{
            fontFamily: '"Courier New",monospace', fontSize: 11,
            color: "rgba(140,170,220,.5)", background: "rgba(15,25,50,.4)",
            border: "1px solid rgba(100,140,200,.2)", padding: "10px 22px",
            cursor: "pointer", letterSpacing: ".15em", borderRadius: 4,
          }}
            onMouseEnter={e => { e.target.style.color = "rgba(160,190,255,.8)"; e.target.style.borderColor = "rgba(120,160,220,.4)"; }}
            onMouseLeave={e => { e.target.style.color = "rgba(140,170,220,.5)"; e.target.style.borderColor = "rgba(100,140,200,.2)"; }}
          >다시 떠나기 ↗</button>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
        *{margin:0;padding:0;box-sizing:border-box}
      `}</style>
    </div>
  );
}
