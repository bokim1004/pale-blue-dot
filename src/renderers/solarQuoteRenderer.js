import { PHASE, PLANETS, SAGAN_QUOTES } from "../constants";
import { easeInOutCubic } from "../helpers";

// ═══════════════════════════════════════════════════════════════
//  Solar system / Earth-zoom / Quote phase renderer
// ═══════════════════════════════════════════════════════════════
export function renderSolarQuote(ctx, S, ts, kick) {
    const { w, h } = S.dim;
    const f = S.frame;
    const m = S.mouse;

    // ── Fade-in alpha ──
    if (S.phase === PHASE.SOLAR && S.solarTime) {
        S.solarAlpha = Math.min(1, (ts - S.solarTime) / 2500);
    }
    const alpha = S.phase === PHASE.SOLAR ? S.solarAlpha : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    // ── Background stars ──
    for (const s of S.bgStars) {
        const tw2 = Math.sin(f * s.twinkle + s.offset) * .3 + .7;
        ctx.fillStyle = `rgba(200,210,240,${s.alpha * tw2})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    }

    const cx = w / 2, cy = h / 2, scale = Math.min(w, h);

    // ── Earth zoom progress ──
    let ezp = 0;
    if (S.phase === PHASE.EARTH_ZOOM) {
        if (!S.earthZoomStart) S.earthZoomStart = ts;
        const el = (ts - S.earthZoomStart) / 1000;
        ezp = easeInOutCubic(Math.min(1, el / 3.2));
        S.earthZoomProgress = ezp;
        if (el >= 3.2) {
            S.phase = PHASE.QUOTE;
            S.earthZoomStart = 0;
            kick((n) => n + 1);
        }
    }
    if (S.phase === PHASE.QUOTE) { ezp = 1; S.earthZoomProgress = 1; }

    // ── Camera transform ──
    let camX = 0, camY = 0, camS = 1;
    if (ezp > 0) {
        const ep = PLANETS[2];
        const eA = ep.angle + f * ep.speed;
        const eD = ep.dist * scale;
        const eX = cx + Math.cos(eA) * eD;
        const eY = cy + Math.sin(eA) * eD;
        camX = -(eX - cx) * ezp;
        camY = -(eY - cy) * ezp;
        camS = 1 + ezp * 20;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(camS, camS);
    ctx.translate(-cx + camX, -cy + camY);

    // ── Sun ──
    const sunSz = 10 * (1 - ezp * .3);
    const sG = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunSz * 7);
    sG.addColorStop(0, "rgba(255,220,100,.35)");
    sG.addColorStop(.3, "rgba(255,180,60,.1)");
    sG.addColorStop(1, "transparent");
    ctx.fillStyle = sG;
    ctx.beginPath(); ctx.arc(cx, cy, sunSz * 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff5d0";
    ctx.beginPath(); ctx.arc(cx, cy, sunSz, 0, Math.PI * 2); ctx.fill();

    // ── Planets ──
    for (let i = 0; i < PLANETS.length; i++) {
        const p = PLANETS[i];
        const dist2 = p.dist * scale;
        const ang = p.angle + f * p.speed;
        const px = cx + Math.cos(ang) * dist2;
        const py = cy + Math.sin(ang) * dist2;

        // Orbit line
        ctx.strokeStyle = `rgba(60,80,120,${.12 * (1 - ezp * .8)})`;
        ctx.lineWidth = .5;
        ctx.beginPath(); ctx.arc(cx, cy, dist2, 0, Math.PI * 2); ctx.stroke();

        // Saturn ring
        if (p.hasRing) {
            ctx.save();
            ctx.translate(px, py); ctx.rotate(.4); ctx.scale(1, .35);
            ctx.strokeStyle = "rgba(218,196,122,.35)"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, p.size * 1.8, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        // Planet glow
        const pG = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
        pG.addColorStop(0, p.color + "30");
        pG.addColorStop(1, "transparent");
        ctx.fillStyle = pG;
        ctx.beginPath(); ctx.arc(px, py, p.size * 3, 0, Math.PI * 2); ctx.fill();

        const pSize = i === 2 && ezp > .5 ? p.size * (1 + (ezp - .5) * 5) : p.size;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2); ctx.fill();

        // ── Earth interaction ──
        if (i === 2) {
            if (S.phase === PHASE.SOLAR) {
                const imx = (m.x - cx) / camS + cx - camX;
                const imy = (m.y - cy) / camS + cy - camY;
                const ed = Math.sqrt((imx - px) ** 2 + (imy - py) ** 2);
                S.earthHovered = m.active && ed < 28;
                if (S.earthHovered) {
                    const pr = 10 + Math.sin(f * .05) * 5;
                    ctx.strokeStyle = `rgba(74,158,255,${.3 + Math.sin(f * .05) * .15})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
                    ctx.save();
                    ctx.font = '11px "Courier New",monospace';
                    ctx.textAlign = "center";
                    ctx.fillStyle = "rgba(140,185,255,.75)";
                    ctx.fillText("여기", px, py - 20);
                    ctx.restore();
                }
            }
            if (S.phase === PHASE.QUOTE) {
                const eGl = ctx.createRadialGradient(px, py, 0, px, py, pSize * 8);
                eGl.addColorStop(0, `rgba(80,140,255,${S.earthBrightness * .5})`);
                eGl.addColorStop(.4, `rgba(60,120,255,${S.earthBrightness * .2})`);
                eGl.addColorStop(1, "transparent");
                ctx.fillStyle = eGl;
                ctx.beginPath(); ctx.arc(px, py, pSize * 8, 0, Math.PI * 2); ctx.fill();
                S.earthRotation += .008;
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(S.earthRotation);
                ctx.strokeStyle = `rgba(100,160,255,${S.earthBrightness * .15})`;
                ctx.lineWidth = .5;
                ctx.beginPath(); ctx.arc(0, 0, pSize * 3.5, 0, Math.PI * 1.2); ctx.stroke();
                ctx.restore();
            }
        }

        // Labels
        if (S.phase === PHASE.SOLAR && alpha > .6 && ezp < .15) {
            ctx.save();
            ctx.font = '9px "Courier New",monospace';
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(150,170,200,.35)";
            ctx.fillText(p.label, px, py + p.size + 14);
            ctx.restore();
        }
    }

    ctx.restore(); // camera

    // ── Quote text ──
    if (S.phase === PHASE.QUOTE) {
        renderQuoteText(ctx, S, ts, kick, w, h);
    }

    ctx.restore(); // global alpha
}

// ─── Quote text sub-renderer ────────────────────────────────────
function renderQuoteText(ctx, S, ts, kick, w, h) {
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

        ctx.font = isAttr
            ? `italic ${fs * .82}px "Courier New",monospace`
            : `${fs}px "Courier New",monospace`;
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

    // ── Pointer line ──
    if (tLine >= SAGAN_QUOTES.length - 4) {
        const la = Math.min(1, (tLine - (SAGAN_QUOTES.length - 4)) * .4);
        if (la > 0) {
            ctx.save();
            ctx.strokeStyle = `rgba(100,150,255,${la * .2})`;
            ctx.lineWidth = .5;
            ctx.setLineDash([4, 8]);
            const fromY = startY + Math.max(0, (SAGAN_QUOTES.length - 5)) * lh - scrOff;
            ctx.beginPath(); ctx.moveTo(tx, fromY); ctx.lineTo(w / 2, h / 2); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    if (
        tLine >= SAGAN_QUOTES.length - 1 &&
        tChars >= SAGAN_QUOTES[SAGAN_QUOTES.length - 1].length &&
        !S.quoteComplete
    ) {
        S.quoteComplete = true;
        kick((n) => n + 1);
    }

    // ── Vignette ──
    const vg = ctx.createRadialGradient(w / 2, h / 2, w * .12, w / 2, h / 2, w * .62);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(0,0,10,.5)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
}
