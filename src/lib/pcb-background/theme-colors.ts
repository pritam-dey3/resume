// Resolves the PCB palette from the live DaisyUI theme. Every color is a design
// token, never a literal, so switching `data-theme` repaints the board.
//
// DaisyUI tokens are often expressed with relative color syntax (`oklch(from
// var(--color-glass-tint) ...)`), which a custom property keeps verbatim.
// Assigning
// the token to a real `color` property makes the CSS engine resolve it, then a
// 1x1 canvas converts whatever it produced into sRGB bytes.

export interface PcbRgb {
  r: number;
  g: number;
  b: number;
}

interface PcbRgba extends PcbRgb {
  a: number;
}

export interface PcbColors {
  /** Copper traces and end pads. */
  trace: PcbRgb;
  /** Pulse trails and joint cores. */
  pulse: PcbRgb;
  /** Board dot grid. */
  grid: PcbRgb;
}

const TOKEN_BASE = "--color-base-100";
const TOKEN_TRACE = "--color-primary";
const TOKEN_PULSE = "--color-accent";
const TOKEN_GRID = "--color-base-300";

// Technical sentinel, not a design color. Both the canvas and the CSS parser
// keep this value when an assignment is rejected, which is how an unparsable
// token is detected. Transparent is never a useful board color.
const UNPARSED = "rgba(0, 0, 0, 0)";

function parseColor(
  color: string,
  ctx: CanvasRenderingContext2D
): PcbRgba | null {
  ctx.fillStyle = UNPARSED;
  ctx.fillStyle = color;
  if (ctx.fillStyle === UNPARSED) return null;

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b, a: a / 255 };
}

// Glass tokens are intentionally translucent. A canvas has no backdrop, so
// flatten them over the page token first or the alpha is silently dropped.
function flatten(color: PcbRgba, base: PcbRgb | null): PcbRgb {
  if (color.a >= 1 || !base) {
    return { r: color.r, g: color.g, b: color.b };
  }
  const alpha = color.a;
  return {
    r: Math.round(color.r * alpha + base.r * (1 - alpha)),
    g: Math.round(color.g * alpha + base.g * (1 - alpha)),
    b: Math.round(color.b * alpha + base.b * (1 - alpha)),
  };
}

function readToken(
  token: string,
  styles: CSSStyleDeclaration,
  probe: HTMLElement,
  ctx: CanvasRenderingContext2D
): PcbRgba | null {
  const value = styles.getPropertyValue(token).trim();
  if (!value) return null;

  // Reject anything the CSS parser does not accept before asking for the
  // computed value, so a broken token cannot silently inherit `color`.
  probe.style.color = UNPARSED;
  probe.style.color = value;
  if (probe.style.color === UNPARSED) return null;

  const computed = getComputedStyle(probe).color;
  if (!computed || computed === UNPARSED) return null;

  return parseColor(computed, ctx);
}

export function resolvePcbColors(): PcbColors | null {
  if (typeof document === "undefined" || !document.body) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.position = "absolute";
  probe.style.width = "0";
  probe.style.height = "0";
  probe.style.overflow = "hidden";
  document.body.appendChild(probe);

  try {
    const styles = getComputedStyle(document.documentElement);
    const base = readToken(TOKEN_BASE, styles, probe, ctx);
    const trace = readToken(TOKEN_TRACE, styles, probe, ctx);
    // Without the trace token there is no board to draw: let the page fall
    // back to its plain theme background rather than inventing a color.
    if (!trace) return null;

    const flatTrace = flatten(trace, base);
    const pulse = readToken(TOKEN_PULSE, styles, probe, ctx);
    const grid = readToken(TOKEN_GRID, styles, probe, ctx);

    return {
      trace: flatTrace,
      pulse: pulse ? flatten(pulse, base) : flatTrace,
      grid: grid ? flatten(grid, base) : flatTrace,
    };
  } finally {
    probe.remove();
  }
}
