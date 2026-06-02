"use client";

import { useEffect } from "react";

/**
 * Global "magnetic" proximity effect: interactive elements (buttons + bottom-nav
 * links) gently lean toward the cursor as it approaches and spring back on leave.
 * Pairs with the per-card cursor spotlight (.prox-glow in FadeInCard).
 *
 * Implementation notes:
 * - Desktop only (skips touch / no-hover devices).
 * - Element centers are cached and only re-measured on scroll/resize/DOM change,
 *   so the rAF loop does pure math (no per-frame layout reads).
 * - The loop idles when nothing is moving and resumes on pointer move / scroll.
 */
export default function ProximityFX() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;

    const SEL = "button, nav a";
    const MAG_R = 70; // extra reach beyond the element's half-size (px)
    const MAG_MAX = 6; // max pull (px)

    let magnets = [];
    const offs = new WeakMap();
    let px = -99999, py = -99999;
    let raf = 0;
    let measureQueued = false;

    const measure = () => {
      measureQueued = false;
      magnets = Array.from(document.querySelectorAll(SEL))
        .map((el) => {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return null;
          return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2, reach: Math.max(r.width, r.height) / 2 + MAG_R };
        })
        .filter(Boolean);
    };
    const queueMeasure = () => {
      if (!measureQueued) { measureQueued = true; requestAnimationFrame(measure); }
    };

    const ensure = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const loop = () => {
      let busy = false;
      for (let i = 0; i < magnets.length; i++) {
        const m = magnets[i];
        const dx = px - m.cx, dy = py - m.cy;
        const dist = Math.hypot(dx, dy);
        let tx = 0, ty = 0;
        if (dist < m.reach) {
          const f = 1 - dist / m.reach;
          const k = MAG_MAX * f;
          const inv = dist > 0.001 ? 1 / dist : 0;
          tx = dx * inv * k;
          ty = dy * inv * k;
        }
        let s = offs.get(m.el);
        if (!s) { s = { x: 0, y: 0 }; offs.set(m.el, s); }
        s.x += (tx - s.x) * 0.2;
        s.y += (ty - s.y) * 0.2;
        if (Math.abs(s.x - tx) > 0.1 || Math.abs(s.y - ty) > 0.1) busy = true;
        if (Math.abs(s.x) > 0.06 || Math.abs(s.y) > 0.06) {
          m.el.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px)`;
        } else if (m.el.style.transform) {
          m.el.style.transform = "";
        }
      }
      raf = busy ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e) => { px = e.clientX; py = e.clientY; ensure(); };
    const onScroll = () => { queueMeasure(); ensure(); };

    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", queueMeasure);
    const mo = new MutationObserver(queueMeasure);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", queueMeasure);
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
