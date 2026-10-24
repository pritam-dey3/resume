import { useCallback, useEffect, useRef, useState } from "react";
import PcbDevtools from "./dev/PcbDevtools";
import { createPcbEngine, type PcbEngine } from "../lib/pcb-background/engine";
import {
  cloneParams,
  DEFAULT_PARAMS,
  formatDefaultsSnippet,
  type PcbParams,
} from "../lib/pcb-background/params";
import { resolvePcbColors } from "../lib/pcb-background/theme-colors";

// The board is a calm background, so it does not need to repaint with every
// display refresh. 30 fps halves the work and is invisible at these speeds.
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
// Soft line art gains almost nothing above 1.5x; the fill rate does. Rendering
// at half resolution on a 2x/3x screen cuts the pixel count by over half.
const MAX_DEVICE_PIXEL_RATIO = 1.5;
// A dropped frame must not teleport pulses across the board.
const MAX_FRAME_DELTA = 0.05;

function devicePixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
}

// Page-wide circuit-board traces. Rendered as a fixed layer behind all content
// and outside #content, because ScrollSmoother transforms #content and that
// would turn `fixed` into a scroll-away element.
export default function PcbBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PcbEngine | null>(null);
  const paramsRef = useRef<PcbParams>(cloneParams(DEFAULT_PARAMS));
  const reducedMotionRef = useRef(false);

  const [params, setParams] = useState<PcbParams>(() =>
    cloneParams(DEFAULT_PARAMS)
  );
  const [panelOpen, setPanelOpen] = useState(false);

  const applyParams = useCallback((next: PcbParams) => {
    const previous = paramsRef.current;
    paramsRef.current = next;
    setParams(next);

    const engine = engineRef.current;
    if (!engine) return;
    engine.setParams(next);

    // A still frame has no update loop, so geometry changes need a fresh pose.
    if (!reducedMotionRef.current) return;
    const geometryChanged =
      previous.wander !== next.wander ||
      previous.cellSize !== next.cellSize ||
      previous.active !== next.active;
    if (geometryChanged) engine.pose();
    engine.render();
  }, []);

  const handleParamChange = useCallback(
    <K extends keyof PcbParams,>(key: K, value: PcbParams[K]) => {
      applyParams({ ...paramsRef.current, [key]: value });
    },
    [applyParams]
  );

  const resetParams = useCallback(() => {
    applyParams(cloneParams(DEFAULT_PARAMS));
  }, [applyParams]);

  const printDefaults = useCallback((): string => {
    const snippet = formatDefaultsSnippet(paramsRef.current);
    console.log(
      "%cPaste over DEFAULT_PARAMS in src/lib/pcb-background/params.ts",
      "font-weight: bold"
    );
    console.log(snippet);
    return snippet;
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => !open);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = resolvePcbColors();
    // Without a resolvable theme token the page keeps its plain background.
    if (!colors) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;

    let frame = 0;
    let last = 0;
    let width = 1;
    let height = 1;
    let dpr = 1;

    const applySize = (nextWidth: number, nextHeight: number) => {
      width = Math.max(1, Math.round(nextWidth));
      height = Math.max(1, Math.round(nextHeight));
      dpr = devicePixelRatio();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Draw in CSS pixels; the transform handles the device scale.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // clientWidth reads the laid-out size without forcing a fresh layout pass.
    applySize(canvas.clientWidth, canvas.clientHeight);

    const engine = createPcbEngine({
      ctx,
      params: paramsRef.current,
      colors,
      width,
      height,
      dpr,
    });
    engineRef.current = engine;

    const drawStill = () => {
      engine.pose();
      engine.render();
    };

    // Keep a steady cadence instead of rendering whenever the display fires.
    // Time accumulates and the remainder carries over, so 60 Hz renders every
    // other frame, 120 Hz every fourth, and a slow display is never skipped.
    let budget = 0;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (last === 0) {
        last = time;
        return;
      }

      budget += time - last;
      last = time;
      if (budget < FRAME_INTERVAL) return;

      const step = Math.min(budget / 1000, MAX_FRAME_DELTA);
      budget %= FRAME_INTERVAL;
      engine.update(step);
      engine.render();
    };

    const stop = () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      budget = 0;
    };

    const start = () => {
      stop();
      if (reducedMotionRef.current) {
        drawStill();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.round(entry.contentRect.width);
      const nextHeight = Math.round(entry.contentRect.height);
      if (
        nextWidth === width &&
        nextHeight === height &&
        devicePixelRatio() === dpr
      ) {
        return;
      }
      applySize(nextWidth, nextHeight);
      engine.resize(width, height, dpr);
      if (reducedMotionRef.current) drawStill();
    });
    resizeObserver.observe(canvas);

    // App toggles `data-theme` on <html>, so watch that attribute rather than
    // sampling styles every frame.
    const themeObserver = new MutationObserver(() => {
      const next = resolvePcbColors();
      if (!next) return;
      engine.setColors(next);
      if (reducedMotionRef.current) engine.render();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const handleMotionChange = () => {
      reducedMotionRef.current = motionQuery.matches;
      start();
    };
    motionQuery.addEventListener("change", handleMotionChange);

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionChange);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const help = () => {
      console.log(
        [
          "PCB background controls",
          "  __pcb.open()       open the panel",
          "  __pcb.close()      close the panel",
          "  __pcb.toggle()     toggle the panel",
          "  __pcb.values()     values the board is using",
          "  __pcb.set({ speed: 180, intensity: 0.5 })   partial update",
          "  __pcb.reset()      restore DEFAULT_PARAMS",
          "  __pcb.defaults()   print a paste-ready DEFAULT_PARAMS block",
        ].join("\n")
      );
    };

    window.__pcb = {
      open: () => setPanelOpen(true),
      close: () => setPanelOpen(false),
      toggle: togglePanel,
      values: () => ({ ...paramsRef.current }),
      set: (patch) => {
        applyParams({ ...paramsRef.current, ...patch });
        return { ...paramsRef.current };
      },
      reset: () => {
        const next = cloneParams(DEFAULT_PARAMS);
        applyParams(next);
        return { ...next };
      },
      defaults: printDefaults,
      help,
    };

    return () => {
      delete window.__pcb;
    };
  }, [applyParams, printDefaults, resetParams, togglePanel]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      />
      {import.meta.env.DEV && (
        <PcbDevtools
          open={panelOpen}
          params={params}
          onParamChange={handleParamChange}
          onReset={resetParams}
          onPrintDefaults={printDefaults}
          onToggleOpen={togglePanel}
        />
      )}
    </>
  );
}
