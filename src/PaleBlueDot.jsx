import { PHASE } from "./constants";
import usePhaseManager from "./hooks/usePhaseManager";

// ═══════════════════════════════════════════════════════════════
//  PaleBlueDot – 순수 뷰 레이어
// ═══════════════════════════════════════════════════════════════
export default function PaleBlueDot() {
  const { canvasRef, state: S, handleClick, resetAll, cursor } = usePhaseManager();

  return (
    <div style={{ position: "fixed", inset: 0, background: "#03060d", overflow: "hidden", cursor }}>
      <canvas ref={canvasRef} onClick={handleClick} style={{ display: "block", width: "100%", height: "100%" }} />

      {/* ── Galaxy hint ── */}
      {S.phase === PHASE.GALAXY && (
        <div style={{ position: "fixed", bottom: 44, left: 0, right: 0, textAlign: "center", pointerEvents: "none", animation: "fadeUp 3s ease-out forwards" }}>
          <p style={{ fontFamily: '"Courier New",monospace', fontSize: 12, color: "rgba(140,170,220,.3)", letterSpacing: ".2em", margin: 0 }}>
            은하수 속에서 빛나는 점을 찾으세요
          </p>
        </div>
      )}

      {/* ── Warp label ── */}
      {S.phase === PHASE.WARP && (
        <div style={{ position: "fixed", top: 30, left: 0, right: 0, textAlign: "center", pointerEvents: "none", opacity: 0, animation: "fadeUp 1.5s ease-out .8s forwards" }}>
          <p style={{ fontFamily: '"Courier New",monospace', fontSize: 11, color: "rgba(120,150,200,.4)", letterSpacing: ".35em", margin: 0 }}>W A R P</p>
        </div>
      )}

      {/* ── Solar hint ── */}
      {S.phase === PHASE.SOLAR && S.solarAlpha > .8 && (
        <div style={{ position: "fixed", bottom: 44, left: 0, right: 0, textAlign: "center", pointerEvents: "none", animation: "fadeUp 2.5s ease-out 1.5s forwards", opacity: 0 }}>
          <p style={{ fontFamily: '"Courier New",monospace', fontSize: 12, color: "rgba(140,170,220,.32)", letterSpacing: ".15em", margin: 0 }}>
            창백한 푸른 점을 찾으세요
          </p>
        </div>
      )}

      {/* ── Reset button ── */}
      {S.quoteComplete && (
        <div style={{ position: "fixed", bottom: 36, right: 36, pointerEvents: "auto", opacity: 0, animation: "fadeUp 2s ease-out 2s forwards" }}>
          <button
            onClick={resetAll}
            style={{
              fontFamily: '"Courier New",monospace', fontSize: 11,
              color: "rgba(140,170,220,.5)", background: "rgba(15,25,50,.4)",
              border: "1px solid rgba(100,140,200,.2)", padding: "10px 22px",
              cursor: "pointer", letterSpacing: ".15em", borderRadius: 4,
            }}
            onMouseEnter={(e) => { e.target.style.color = "rgba(160,190,255,.8)"; e.target.style.borderColor = "rgba(120,160,220,.4)"; }}
            onMouseLeave={(e) => { e.target.style.color = "rgba(140,170,220,.5)"; e.target.style.borderColor = "rgba(100,140,200,.2)"; }}
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
