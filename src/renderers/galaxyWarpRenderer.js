import {
    PARALLAX_STRENGTH, CURSOR_RADIUS, CURSOR_FORCE,
    DRIFT_SPEED, PHASE, PBD, PLANETS, SAGAN_QUOTES,
} from "../constants";
import { easeInOutCubic } from "../helpers";

// ═══════════════════════════════════════════════════════════════
//  Galaxy + Warp phase renderer
// ═══════════════════════════════════════════════════════════════
export function renderGalaxyWarp(ctx, S, ts, kick) {
    const { w, h } = S.dim;
    const f = S.frame;
    const m = S.mouse;
    const drift = S.drift;
    const isWarp = S.phase === PHASE.WARP;

    // ── Idle drift ──
    if (!isWarp) {
        const idle = Date.now() - S.lastMouseMove > 2000 || !m.active;
        if (idle) {
            drift.x += DRIFT_SPEED * 0.3;
            drift.y += Math.sin(f * 0.001) * DRIFT_SPEED * 0.08;
        }
    }

    // ── Background glow ──
    const bg = ctx.createRadialGradient(w * .5, h * .5, 0, w * .5, h * .5, w * .7);
    bg.addColorStop(0, "rgba(15,20,45,0.3)");
    bg.addColorStop(.5, "rgba(8,12,30,0.15)");
    bg.addColorStop(1, "transparent");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // ── Nebula ──
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
        ctx.save();
        ctx.translate(cx2, cy2);
        ctx.scale(1, cl.ry / cl.rx);
        ctx.translate(-cx2, -cy2);
        ctx.beginPath();
        ctx.arc(cx2, cy2, cl.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ── Warp progress factor ──
    const wp = isWarp ? S.warpProgress : 0;

    // ── Stars ──
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
        if (sx < -mg) sx += w + mg * 2;
        if (sx > w + mg) sx -= w + mg * 2;
        if (sy < -mg) sy += h + mg * 2;
        if (sy > h + mg) sy -= h + mg * 2;

        if (m.active && !isWarp) {
            const dx = sx - m.x, dy = sy - m.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < CURSOR_RADIUS && d > 0) {
                const force = (1 - d / CURSOR_RADIUS) * CURSOR_FORCE * (s.layer + 1) * .4;
                sx += (dx / d) * force * 30;
                sy += (dy / d) * force * 30;
            }
        }

        const tw = Math.sin(f * s.twinkleSpeed + s.twinkleOffset) * .3 + .7;
        const a = s.brightness * tw;

        if (isWarp && wp > .05) {
            const stretch = 1 + wp * (s.layer + 1) * 22;
            const ang = Math.atan2(sy - h / 2, sx - w / 2);
            const len = s.size * stretch;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(ang);
            const lg = ctx.createLinearGradient(0, 0, len, 0);
            lg.addColorStop(0, `hsla(${s.hue},${s.saturation}%,92%,${a})`);
            lg.addColorStop(1, `hsla(${s.hue},${s.saturation}%,85%,0)`);
            ctx.strokeStyle = lg;
            ctx.lineWidth = Math.max(.4, s.size * (1 - wp * .3));
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
            ctx.restore();
        } else {
            if (s.size > 1.2) {
                const gG = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.size * 4);
                gG.addColorStop(0, `hsla(${s.hue},${s.saturation}%,90%,${a * .3})`);
                gG.addColorStop(1, "transparent");
                ctx.fillStyle = gG;
                ctx.beginPath(); ctx.arc(sx, sy, s.size * 4, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = `hsla(${s.hue},${s.saturation}%,${85 + tw * 15}%,${a})`;
            ctx.beginPath(); ctx.arc(sx, sy, s.size, 0, Math.PI * 2); ctx.fill();
        }
    }

    // ── PBD hint (galaxy only) ──
    if (S.phase === PHASE.GALAXY) {
        const pbx = PBD.relX * w + (m.active ? (m.x - w / 2) * PARALLAX_STRENGTH * 2 : 0) - drift.x * .5;
        const pby = PBD.relY * h + (m.active ? (m.y - h / 2) * PARALLAX_STRENGTH * 2 : 0) - drift.y * .5;
        const dx2 = ((pbx % w) + w) % w, dy2 = ((pby % h) + h) % h;
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
        ctx.fillStyle = oG;
        ctx.beginPath(); ctx.arc(dx2, dy2, gS, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(140,180,255,${.5 + fG * .5})`;
        ctx.beginPath(); ctx.arc(dx2, dy2, PBD.size, 0, Math.PI * 2); ctx.fill();

        if (isH) S.tooltip.alpha = Math.min(1, S.tooltip.alpha + .03);
        else S.tooltip.alpha = Math.max(0, S.tooltip.alpha - .03);
        if (S.tooltip.alpha > 0) {
            ctx.save();
            ctx.font = '13px "Courier New",monospace';
            ctx.textAlign = "center";
            ctx.fillStyle = `rgba(160,190,255,${S.tooltip.alpha * .85})`;
            ctx.fillText("여기서 모든 일이 일어났다", dx2, dy2 - 30);
            ctx.restore();
        }
    }

    // ── Warp overlay ──
    if (isWarp) {
        if (!S.warpStartTime) S.warpStartTime = ts;
        const elapsed = (ts - S.warpStartTime) / 1000;
        const raw = Math.min(1, elapsed / 5.5);
        S.warpProgress = easeInOutCubic(raw);
        const wpp = S.warpProgress;

        if (wpp > .7) {
            const flash = (wpp - .7) / .3;
            const fG2 = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * .25 * flash);
            fG2.addColorStop(0, `rgba(180,200,255,${flash * .2})`);
            fG2.addColorStop(1, "transparent");
            ctx.fillStyle = fG2;
            ctx.fillRect(0, 0, w, h);
        }

        const vG = ctx.createRadialGradient(w / 2, h / 2, w * .06 * (1 - wpp), w / 2, h / 2, w * .58);
        vG.addColorStop(0, "transparent");
        vG.addColorStop(.5, `rgba(0,0,0,${wpp * .55})`);
        vG.addColorStop(1, `rgba(0,0,0,${wpp * .93})`);
        ctx.fillStyle = vG;
        ctx.fillRect(0, 0, w, h);

        if (wpp > .12) {
            const dist = Math.max(0, 6000000000 * (1 - (wpp - .12) / .88));
            const dStr = `지구까지 ${Math.floor(dist).toLocaleString()} km`;
            const cA = wpp < .85 ? Math.min(1, (wpp - .12) * 4) : Math.max(0, (1 - wpp) * 7);
            ctx.save();
            ctx.font = '14px "Courier New",monospace';
            ctx.textAlign = "center";
            ctx.fillStyle = `rgba(140,175,240,${cA * .8})`;
            ctx.fillText(dStr, w / 2, h * .6);
            const spd = (wpp * 299792).toFixed(0);
            ctx.font = '11px "Courier New",monospace';
            ctx.fillStyle = `rgba(120,155,220,${cA * .4})`;
            ctx.fillText(`${Number(spd).toLocaleString()} km/s`, w / 2, h * .6 + 22);
            ctx.restore();
        }

        if (raw >= 1) {
            S.phase = PHASE.SOLAR;
            S.warpStartTime = 0;
            S.solarTime = ts;
            kick((n) => n + 1);
        }
    }

    // ── Film grain ──
    if (f % 3 === 0) {
        ctx.fillStyle = "rgba(255,255,255,.004)";
        for (let i = 0; i < 35; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
}
