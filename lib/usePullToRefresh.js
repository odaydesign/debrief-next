"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 64; // px of (damped) pull that arms a refresh
const MIN_DWELL = 700; // ms the refreshing state is shown, minimum

/**
 * Touch-only pull-to-refresh for a scroll container. Imperative DOM updates
 * during the drag (no per-frame re-renders); React state only for the
 * discrete phases so the caller can render labels.
 *
 * Returns { state: 'idle'|'pulling'|'ready'|'refreshing', indicatorRef }.
 * Attach indicatorRef to an absolutely-positioned element at the top of the
 * scroller — the hook drives its transform/opacity.
 */
export default function usePullToRefresh(scrollerRef, onRefresh, { disabled = false } = {}) {
  const [state, setState] = useState("idle");
  const indicatorRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => { onRefreshRef.current = onRefresh; });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || disabled) return;
    // Touch devices only — desktop has no pull gesture.
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;

    let startY = 0;
    let armed = false;
    let phase = "idle";
    let refreshing = false;

    const indicator = () => indicatorRef.current;
    const move = (y, opacity, animate) => {
      const el = indicator();
      if (!el) return;
      el.style.transition = animate
        ? "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease"
        : "none";
      el.style.transform = `translateY(${y}px)`;
      el.style.opacity = String(opacity);
    };
    const setPhase = (p) => {
      if (phase === p) return;
      if (p === "ready" && navigator.vibrate) { try { navigator.vibrate(10); } catch { /* ignore */ } }
      phase = p;
      setState(p);
    };

    const onStart = (e) => {
      if (refreshing || e.touches.length !== 1) return;
      armed = scroller.scrollTop <= 0;
      startY = e.touches[0].clientY;
    };

    const onMove = (e) => {
      if (!armed || refreshing) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || scroller.scrollTop > 0) {
        if (phase !== "idle") { setPhase("idle"); move(0, 0, true); }
        return;
      }
      if (dy < 8) return;
      e.preventDefault(); // suppress native overscroll/PTR
      const pull = Math.min(96, dy * 0.4);
      setPhase(pull >= THRESHOLD ? "ready" : "pulling");
      move(pull, Math.min(1, pull / THRESHOLD), false);
    };

    const onEnd = async () => {
      if (!armed || refreshing) return;
      armed = false;
      if (phase === "ready") {
        refreshing = true;
        setPhase("refreshing");
        move(THRESHOLD, 1, true);
        try {
          await Promise.all([
            Promise.resolve(onRefreshRef.current?.()),
            new Promise((r) => setTimeout(r, MIN_DWELL)),
          ]);
        } finally {
          refreshing = false;
          setPhase("idle");
          move(0, 0, true);
        }
      } else if (phase !== "idle") {
        setPhase("idle");
        move(0, 0, true);
      }
    };

    scroller.addEventListener("touchstart", onStart, { passive: true });
    scroller.addEventListener("touchmove", onMove, { passive: false });
    scroller.addEventListener("touchend", onEnd);
    scroller.addEventListener("touchcancel", onEnd);
    return () => {
      scroller.removeEventListener("touchstart", onStart);
      scroller.removeEventListener("touchmove", onMove);
      scroller.removeEventListener("touchend", onEnd);
      scroller.removeEventListener("touchcancel", onEnd);
    };
  }, [scrollerRef, disabled]);

  return { state, indicatorRef };
}
