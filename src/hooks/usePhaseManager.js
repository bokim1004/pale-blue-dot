import { useState, useEffect, useRef, useCallback } from "react";
import { PHASE, PARALLAX_STRENGTH, PBD } from "../constants";
import { createStars, createNebula, createBgStars } from "../helpers";
import { renderGalaxyWarp, renderSolarQuote } from "../renderers";

// ═══════════════════════════════════════════════════════════════
//  usePhaseManager – 비즈니스 로직 (상태, 이벤트, 애니메이션 루프)
// ═══════════════════════════════════════════════════════════════
export default function usePhaseManager() {
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

    // ─── Canvas init ──────────────────────────────────────────────
    const initCanvas = useCallback(() => {
        const c = canvasRef.current;
        if (!c) return;
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth, h = window.innerHeight;
        c.width = w * dpr;
        c.height = h * dpr;
        c.style.width = w + "px";
        c.style.height = h + "px";
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

    // ─── Mouse & Touch tracking ────────────────────────────────
    useEffect(() => {
        const updatePointer = (x, y) => {
            S.mouse = { x, y, active: true };
            S.lastMouseMove = Date.now();
        };

        // Mouse
        const onMouseMove = (e) => updatePointer(e.clientX, e.clientY);
        const onMouseLeave = () => { S.mouse.active = false; };

        // Touch
        const onTouchStart = (e) => {
            const t = e.touches[0];
            updatePointer(t.clientX, t.clientY);
        };
        const onTouchMove = (e) => {
            e.preventDefault(); // 스크롤 방지
            const t = e.touches[0];
            updatePointer(t.clientX, t.clientY);
        };
        const onTouchEnd = () => { S.mouse.active = false; };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseleave", onMouseLeave);
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseleave", onMouseLeave);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, []);

    // ─── Animation loop ──────────────────────────────────────────
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        let id;

        const loop = (ts) => {
            const { w, h } = S.dim;
            if (!w) { id = requestAnimationFrame(loop); return; }
            S.frame++;

            ctx.fillStyle = "#03060d";
            ctx.fillRect(0, 0, w, h);

            if (S.phase === PHASE.GALAXY || S.phase === PHASE.WARP) {
                renderGalaxyWarp(ctx, S, ts, kick);
            }

            if (S.phase === PHASE.SOLAR || S.phase === PHASE.EARTH_ZOOM || S.phase === PHASE.QUOTE) {
                renderSolarQuote(ctx, S, ts, kick);
            }

            id = requestAnimationFrame(loop);
        };

        id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, []);

    // ─── Click handler ────────────────────────────────────────────
    const handleClick = useCallback((e) => {
        const { w, h } = S.dim;
        if (S.phase === PHASE.GALAXY) {
            const drift = S.drift;
            const pbx = PBD.relX * w + (S.mouse.active ? (S.mouse.x - w / 2) * PARALLAX_STRENGTH * 2 : 0) - drift.x * .5;
            const pby = PBD.relY * h + (S.mouse.active ? (S.mouse.y - h / 2) * PARALLAX_STRENGTH * 2 : 0) - drift.y * .5;
            const dx2 = ((pbx % w) + w) % w, dy2 = ((pby % h) + h) % h;
            const d = Math.sqrt((e.clientX - dx2) ** 2 + (e.clientY - dy2) ** 2);
            if (d < 42) {
                S.phase = PHASE.WARP;
                S.warpProgress = 0;
                S.warpStartTime = 0;
                kick((n) => n + 1);
            }
        } else if (S.phase === PHASE.SOLAR && S.earthHovered) {
            S.phase = PHASE.EARTH_ZOOM;
            S.earthZoomStart = 0;
            S.earthZoomProgress = 0;
            kick((n) => n + 1);
        }
    }, []);

    // ─── Reset handler ────────────────────────────────────────────
    const resetAll = useCallback(() => {
        S.phase = PHASE.GALAXY;
        S.warpProgress = 0;
        S.solarAlpha = 0;
        S.earthZoomProgress = 0;
        S.quoteComplete = false;
        S.quoteStartTime = 0;
        S.earthBrightness = .3;
        S.earthRotation = 0;
        S.drift = { x: 0, y: 0 };
        S.tooltip.alpha = 0;
        const { w, h } = S.dim;
        S.stars = createStars(w, h);
        kick((n) => n + 1);
    }, []);

    // ─── Derived state ───────────────────────────────────────────
    const cursor =
        (S.phase === PHASE.GALAXY && S.hovered) ||
            (S.phase === PHASE.SOLAR && S.earthHovered)
            ? "pointer"
            : "default";

    return {
        canvasRef,
        state: S,
        handleClick,
        resetAll,
        cursor,
    };
}
