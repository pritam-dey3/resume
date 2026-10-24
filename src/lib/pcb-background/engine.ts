// PCB traces — a circuit board whose paths carry flowing electrons. Ported from
// eg.local/pcb-paths.js.
//
// One system, not two. A route only exists because a pulse needs a lane, and a
// lane carries exactly one pulse at a time.
//
// The decision point is arrival. When a pulse reaches the far pad, one roll of
// the dice picks what happens next for that lane:
//   keep  -> the same path stays and another pulse is sent through it.
//   reroute -> the path is discarded and a fresh one is routed in its place.
//
// Where two live routes touch the same grid cell and at least one of them turns
// there, a joint pad is drawn: the only place two paths really connect.

import type { PcbParams } from "./params";
import type { PcbColors, PcbRgb } from "./theme-colors";

const TAU = Math.PI * 2;
// Upper bound on the slot table. Fixed length so pulse -> slot indices stay
// valid; Max on screen decides how much of it is used.
const MAX_LANES = 48;
const PAD_R = 2.4;
const VIA_R = 3.4;
// Joint pads sit at shared corners: bigger than a via so a real connection
// never reads as decoration.
const JOINT_HALO_R = 9;
const JOINT_R = 5;
const JOINT_CORE_R = 1.9;
const MAX_SCALE = 1.06;
const GRID_ALPHA = 0.1;
// A routed trace fades in on creation and fades out before it is dropped.
const REVEAL = 0.9;
const RETIRE_FADE = 0.7;
// Minimum time between two routes being born, so the board builds calmly.
const CREATE_GAP = 0.08;
// Pause before a kept lane accepts its next pulse.
const REUSE_GAP = 0.3;
// A lane born for a waiting pulse is dropped after this grace if unused.
const UNUSED_GRACE = 2.5;
// Shortest routed path, measured in cells.
const MIN_TRACE_CELLS = 6;
// Wait for a slider to settle before rebuilding the board.
const REBUILD_DELAY = 0.15;
const MOBILE_WIDTH = 768;
const MOBILE_MAX_ACTIVE = 6;
// Alpha is quantized to this many steps and cached as ready-made strings.
// Building `rgba(...)` on every draw call allocates; a table lookup does not.
const ALPHA_STEPS = 64;
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

export interface PcbPoint {
  x: number;
  y: number;
}

type PcbParticleState = "queued" | "reserved" | "running";

interface PcbParticle {
  state: PcbParticleState;
  trace: number;
  s: number;
  scale: number;
  age: number;
  alpha: number;
  enterAt: number;
}

interface PcbTrace {
  points: PcbPoint[];
  cum: number[];
  total: number;
  path: Path2D;
  vias: PcbPoint[];
  alpha: number;
  width: number;
  bornAt: number;
  readyAt: number;
  served: number;
  occupant: PcbParticle | null;
  retiringSince: number | null;
}

interface PcbLayout {
  cols: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  wander: number;
  cell: number;
  count: number;
}

interface TraceSpec {
  cell: number;
  cols: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  wander: number;
}

export interface PcbEngineHost {
  ctx: CanvasRenderingContext2D;
  params: PcbParams;
  colors: PcbColors;
  width: number;
  height: number;
  /** Device pixel ratio the main canvas is scaled by. */
  dpr: number;
}

export interface PcbEngine {
  update(dt: number): void;
  render(): void;
  /** Lay out a still frame, used when motion is reduced. */
  pose(): void;
  resize(width: number, height: number, dpr: number): void;
  setParams(params: PcbParams): void;
  setColors(colors: PcbColors): void;
  dispose(): void;
}

type AlphaRamp = readonly string[];

function buildRamp(color: PcbRgb): AlphaRamp {
  const ramp: string[] = new Array<string>(ALPHA_STEPS + 1);
  for (let i = 0; i <= ALPHA_STEPS; i++) {
    ramp[i] = `rgba(${color.r}, ${color.g}, ${color.b}, ${i / ALPHA_STEPS})`;
  }
  return ramp;
}

function rampAt(ramp: AlphaRamp, alpha: number): string {
  // Intensity can push a multiplied alpha past 1, and canvas rejects an
  // out-of-range rgba(), which would leave the previous fill in place.
  const clamped = alpha <= 0 ? 0 : alpha >= 1 ? 1 : alpha;
  return ramp[(clamped * ALPHA_STEPS + 0.5) | 0];
}

// Deterministic RNG so a layout can be rebuilt from the same seed.
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type GridCell = [number, number];

// Random walk on the grid: runs of straight cells, then a 90° turn, sometimes
// preceded by a short 45° run. Reversing is never allowed, so paths stay
// board-like instead of scribbling over themselves.
function walkCells(
  rng: () => number,
  startX: number,
  startY: number,
  cols: number,
  rows: number,
  wander: number
): GridCell[] {
  const cells: GridCell[] = [[startX, startY]];
  let x = startX;
  let y = startY;
  let dir = rng() < 0.6 ? (rng() < 0.5 ? 0 : 2) : rng() < 0.5 ? 1 : 3;
  let budget = 10 + ((rng() * 22) | 0);

  while (budget > 0) {
    const run = Math.min(budget, 2 + ((rng() * (2 + (1 - wander) * 6)) | 0));
    let moved = 0;
    for (; moved < run; moved++) {
      const nx = x + DIRS[dir][0];
      const ny = y + DIRS[dir][1];
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) break;
      x = nx;
      y = ny;
    }
    if (moved) cells.push([x, y]);
    budget -= Math.max(1, moved);
    if (moved < run) break; // ran into the board edge

    if (rng() > 0.28 + wander * 0.5) continue; // keep going straight

    const next = (dir + (rng() < 0.5 ? 1 : 3)) % 4;
    if (rng() < wander * 0.7) {
      const dx = DIRS[dir][0] + DIRS[next][0];
      const dy = DIRS[dir][1] + DIRS[next][1];
      const chamfer = 1 + ((rng() * 3) | 0);
      let stepped = 0;
      for (; stepped < chamfer; stepped++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) break;
        x = nx;
        y = ny;
      }
      if (stepped) cells.push([x, y]);
      budget -= Math.max(1, stepped);
      if (stepped < chamfer) break;
    }
    dir = next;
  }

  return cells;
}

function makeTrace(
  rng: () => number,
  startX: number,
  startY: number,
  spec: TraceSpec
): PcbTrace | null {
  const cells = walkCells(
    rng,
    startX,
    startY,
    spec.cols,
    spec.rows,
    spec.wander
  );
  if (cells.length < 2) return null;

  const points: PcbPoint[] = cells.map((cell) => ({
    x: spec.offsetX + cell[0] * spec.cell,
    y: spec.offsetY + cell[1] * spec.cell,
  }));

  // Cumulative arc length drives everything a particle needs.
  let total = 0;
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y
    );
    cum.push(total);
  }
  if (total < MIN_TRACE_CELLS * spec.cell) return null;

  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y);

  const vias: PcbPoint[] = [];
  if (points.length > 5) {
    const wanted = 1 + ((rng() * 2) | 0);
    for (let i = 0; i < wanted; i++) {
      vias.push(points[1 + ((rng() * (points.length - 2)) | 0)]);
    }
  }

  return {
    points,
    cum,
    total,
    path,
    vias,
    alpha: 0.09 + rng() * 0.08,
    width: 1 + rng() * 0.5,
    bornAt: 0, // clock time of routing, drives the fade-in
    readyAt: 0, // earliest clock time the next pulse may enter
    served: 0, // pulses carried so far — the lane's reason to exist
    occupant: null, // the one pulse on this lane, or null. Never more than one.
    retiringSince: null, // clock time the fade-out started, or null
  };
}

export function createPcbEngine(host: PcbEngineHost): PcbEngine {
  const ctx = host.ctx;
  const particles: PcbParticle[] = [];
  const scratch: PcbPoint = { x: 0, y: 0 };

  let params = host.params;
  let colors = host.colors;
  let width = host.width;
  let height = host.height;
  let dpr = host.dpr > 0 ? host.dpr : 1;

  let ramps = {
    trace: buildRamp(colors.trace),
    pulse: buildRamp(colors.pulse),
    grid: buildRamp(colors.grid),
  };

  // Fixed-length slot table. A slot holds a live route or null when free, so
  // pulse -> slot indices stay valid for the whole session.
  let slots: Array<PcbTrace | null> = [];
  let count = 0;
  let gridPath: Path2D | null = null;
  let layout: PcbLayout | null = null;

  // The static board (grid, traces, joints, pads) is expensive to rasterize and
  // changes only when a lane is born, retired or mid-fade. It is cached in an
  // offscreen canvas and blitted once per frame under the moving pulses.
  let copper: HTMLCanvasElement | null = null;
  let copperCtx: CanvasRenderingContext2D | null = null;
  let copperDirty = true;
  let copperVersion = -1;
  let copperFadesUntil = 0;

  // Joint graphics are cached as paths and rebuilt only when lanes change.
  let jointHalo: Path2D | null = null;
  let jointRing: Path2D | null = null;
  let jointCore: Path2D | null = null;
  let slotsVersion = 0;
  let builtJointsVersion = -1;

  let builtWander = -1;
  let builtCell = -1;
  let pendingTime = 0;
  let seed = (Math.random() * 0x7fffffff) | 0;

  let clock = 0; // seconds since mount
  let committed = 0; // pulses that own a lane, running or still starting
  let nextCreateAt = 0; // rate limit for routes being born

  /* --------------------------------------------------------------- geometry */

  function nextSeed(): number {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return seed;
  }

  // Ceiling on how many pulses may own a lane at once. Reserved pulses count,
  // so a burst cannot claim more lanes than the cap allows. Narrow viewports
  // get a lighter board: fewer pulses, less work per frame.
  function activeCap(): number {
    const requested = params.active | 0;
    const capped =
      width < MOBILE_WIDTH ? Math.min(requested, MOBILE_MAX_ACTIVE) : requested;
    return Math.max(1, Math.min(capped, MAX_LANES));
  }

  // Route a brand new path for one slot. Starts are stratified by slot index so
  // live routes stay spread across the board instead of clumping on one side.
  function routeTrace(index: number): PcbTrace | null {
    if (!layout) return null;
    const spec: TraceSpec = {
      cell: layout.cell,
      cols: layout.cols,
      rows: layout.rows,
      offsetX: layout.offsetX,
      offsetY: layout.offsetY,
      wander: layout.wander,
    };

    for (let attempt = 0; attempt < 4; attempt++) {
      const rng = makeRng(nextSeed());
      const startX = Math.round(
        ((index + rng() * 0.9) / layout.count) * (layout.cols - 1)
      );
      const startY = (rng() * layout.rows) | 0;
      const trace = makeTrace(rng, startX, startY, spec);
      if (!trace) continue;

      trace.bornAt = clock;
      trace.readyAt = clock + REVEAL; // no pulse before the line is visible
      return trace;
    }
    return null;
  }

  function buildBoard(): void {
    const cell = params.cellSize;
    const cols = Math.max(4, Math.floor(width / cell) + 1);
    const rows = Math.max(4, Math.floor(height / cell) + 1);
    const offsetX = (width - (cols - 1) * cell) / 2;
    const offsetY = (height - (rows - 1) * cell) / 2;

    layout = {
      cols,
      rows,
      offsetX,
      offsetY,
      wander: params.wander,
      cell,
      count: MAX_LANES,
    };
    count = layout.count;

    // Start with an empty board. Slots fill themselves as pulses ask for lanes,
    // so the first seconds read as the board routing itself.
    slots = new Array<PcbTrace | null>(count).fill(null);
    slotsVersion++;

    // One Path2D of dots, rebuilt only when the board changes.
    const grid = new Path2D();
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        grid.rect(offsetX + col * cell - 0.7, offsetY + row * cell - 0.7, 1.4, 1.4);
      }
    }
    gridPath = grid;

    builtWander = layout.wander;
    builtCell = layout.cell;
    pendingTime = 0;
    committed = 0;
    nextCreateAt = clock;
    copperDirty = true;

    particles.length = 0;
    syncParticles();
  }

  /* ---------------------------------------------------------------- helpers */

  function hasRoom(): boolean {
    return committed < activeCap();
  }

  // Opacity of a trace: fades in when routed, out before being dropped.
  function revealOf(trace: PcbTrace): number {
    const grow = Math.min(1, (clock - trace.bornAt) / REVEAL);
    if (trace.retiringSince === null) return grow;
    return grow * Math.max(0, 1 - (clock - trace.retiringSince) / RETIRE_FADE);
  }

  /* -------------------------------------------------------------- particles */

  function makeParticle(): PcbParticle {
    return {
      state: "queued",
      trace: -1,
      s: 0,
      scale: 1,
      age: 0,
      alpha: 0,
      enterAt: 0,
    };
  }

  // One pulse per lane means the useful pool size is bounded by both the lane
  // count and the on-screen cap. Extra particles would only ever queue up.
  function syncParticles(): void {
    const target = activeCap();
    while (particles.length < target) {
      const particle = makeParticle();
      // Stagger the first request so the queue does not move as one block.
      particle.enterAt = clock + Math.random() * 0.4;
      particles.push(particle);
    }
    if (particles.length > target) particles.length = target;
  }

  // Put a pulse back in the queue. It will look for a lane again shortly.
  function requeue(particle: PcbParticle): void {
    if (particle.state !== "queued") committed--;
    particle.state = "queued";
    particle.trace = -1;
    particle.s = 0;
    particle.age = 0;
    particle.alpha = 0;
    particle.enterAt = clock + 0.05 + Math.random() * 0.25;
  }

  // A pulse takes a lane. This is the only place a trace becomes occupied, and
  // the occupant guard is what guarantees one pulse per lane.
  function enter(slot: number, particle: PcbParticle): boolean {
    const trace = slots[slot];
    if (!trace || trace.retiringSince !== null) return false;
    if (trace.occupant !== null && trace.occupant !== particle) return false;

    const wasQueued = particle.state === "queued";

    trace.served++;
    trace.occupant = particle;
    trace.readyAt = Infinity; // closed while this pulse is on it

    particle.state = "running";
    particle.trace = slot;
    particle.s = 0;
    particle.age = 0;
    particle.alpha = 0;
    particle.scale = 0.94 + Math.random() * (MAX_SCALE - 0.94);
    if (wasQueued) committed++;
    return true;
  }

  // Arrival is the decision point. Roll once: keep this lane for another pulse,
  // or retire it so a fresh path gets routed in its place.
  function finish(particle: PcbParticle): void {
    const slot = particle.trace;
    const trace = slots[slot];
    requeue(particle);
    if (!trace || trace.occupant !== particle) return;

    trace.occupant = null;
    if (Math.random() < params.reroute) {
      trace.readyAt = Infinity;
      trace.retiringSince = clock; // fade out, then the slot frees up
      slotsVersion++; // the joint it shared is gone with it
    } else {
      trace.readyAt = clock + REUSE_GAP; // kept: open again shortly
    }
  }

  // Fair pick: an empty lane that has carried the fewest pulses, so every live
  // route keeps receiving traffic instead of going dark.
  function findOpenSlot(): number {
    let best = -1;
    let bestServed = Infinity;
    let bestBorn = Infinity;

    for (let i = 0; i < slots.length; i++) {
      const trace = slots[i];
      if (!trace) continue;
      if (trace.retiringSince !== null) continue;
      if (trace.occupant !== null) continue; // occupied lanes take one pulse
      if (trace.readyAt > clock) continue;
      if (
        trace.served < bestServed ||
        (trace.served === bestServed && trace.bornAt < bestBorn)
      ) {
        best = i;
        bestServed = trace.served;
        bestBorn = trace.bornAt;
      }
    }
    return best;
  }

  // Birth: only a pulse that could not find a lane may cause a new route, and
  // that pulse is reserved on it immediately. No route exists without cargo.
  function createRouteFor(particle: PcbParticle): boolean {
    // Reservoir-sample a free slot, so a sparse board still spreads its lanes
    // over the whole board instead of filling in from one edge.
    let slot = -1;
    let free = 0;
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] !== null) continue;
      free++;
      if (Math.random() * free < 1) slot = i;
    }
    if (slot < 0) return false;

    const trace = routeTrace(slot);
    if (!trace) return false;

    slots[slot] = trace;
    slotsVersion++;
    nextCreateAt = clock + CREATE_GAP;

    trace.occupant = particle;
    particle.state = "reserved";
    particle.trace = slot;
    particle.s = 0;
    particle.age = 0;
    particle.alpha = 0;
    particle.enterAt = trace.readyAt;
    committed++;
    return true;
  }

  /* ---------------------------------------------------------------- traffic */

  // Housekeeping only: the keep-or-reroute roll happens on arrival, in finish().
  // This pass drops lanes nobody is using so copper never outnumbers cargo.
  function expireTraces(): void {
    let live = 0;
    for (const trace of slots) if (trace) live++;

    // Only shed copper when the queue is empty. While any pulse is waiting for
    // a lane, an idle route is about to be used again — retiring it would churn
    // the board on every arrival and make Reroute chance meaningless.
    // No slack: the cap is a promise, so lanes never outnumber pulses.
    const waiting = particles.length - committed;
    const surplus = waiting === 0 && live > committed;

    for (let i = 0; i < slots.length; i++) {
      const trace = slots[i];
      if (!trace) continue;

      if (trace.retiringSince === null) {
        const age = clock - trace.bornAt;
        const unused = trace.served === 0 && age >= UNUSED_GRACE;
        const spare = surplus && trace.occupant === null;
        if (!unused && !spare) continue;

        trace.readyAt = Infinity; // closed to new pulses
        if (trace.occupant !== null) continue; // let the pulse finish the path
        trace.retiringSince = clock;
        slotsVersion++;
        continue;
      }

      if (clock - trace.retiringSince < RETIRE_FADE) continue;
      if (trace.occupant !== null) continue;
      slots[i] = null; // free again; traffic may route something new here
      slotsVersion++;
    }
  }

  // Turn queued pulses into travelling ones, creating lanes only when needed.
  function serveQueue(): void {
    for (const particle of particles) {
      if (particle.state === "running") continue;

      if (particle.state === "reserved") {
        const trace = slots[particle.trace];
        if (!trace || trace.retiringSince !== null) {
          // Clear the reservation so the lane is not left claiming an owner.
          if (trace && trace.occupant === particle) trace.occupant = null;
          requeue(particle);
          continue;
        }
        if (clock < trace.readyAt) continue;
        enter(particle.trace, particle);
        continue;
      }

      if (clock < particle.enterAt) continue;
      if (!hasRoom()) continue;

      const slot = findOpenSlot();
      if (slot >= 0) {
        enter(slot, particle);
        continue;
      }

      // A lane that is empty but still in its reuse pause will open by itself.
      // Routing a new path now would churn the board for no reason.
      if (
        slots.some(
          (entry) =>
            entry !== null &&
            entry.occupant === null &&
            entry.retiringSince === null
        )
      ) {
        continue;
      }

      // No lane can take it: either every lane is occupied and this pulse waits,
      // or the board still has room and grows a route to serve it.
      if (slots.includes(null) && clock >= nextCreateAt) {
        createRouteFor(particle);
      }
    }
  }

  /* --------------------------------------------------------------- position */

  function segmentAt(trace: PcbTrace, s: number): number {
    const { cum } = trace;
    let lo = 0;
    let hi = cum.length - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (cum[mid] <= s) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  function pointAt(trace: PcbTrace, s: number, out: PcbPoint): PcbPoint {
    const { points } = trace;
    if (s <= 0) {
      out.x = points[0].x;
      out.y = points[0].y;
      return out;
    }
    if (s >= trace.total) {
      const last = points[points.length - 1];
      out.x = last.x;
      out.y = last.y;
      return out;
    }
    const index = segmentAt(trace, s);
    const { cum } = trace;
    const span = cum[index + 1] - cum[index];
    const t = span > 0 ? (s - cum[index]) / span : 0;
    const a = points[index];
    const b = points[index + 1];
    out.x = a.x + (b.x - a.x) * t;
    out.y = a.y + (b.y - a.y) * t;
    return out;
  }

  // Stroke the piece of the path between two arc lengths.
  function strokeSlice(trace: PcbTrace, from: number, to: number): void {
    const { points, cum } = trace;
    ctx.beginPath();
    pointAt(trace, from, scratch);
    ctx.moveTo(scratch.x, scratch.y);
    let index = segmentAt(trace, from) + 1;
    while (index < points.length && cum[index] < to) {
      ctx.lineTo(points[index].x, points[index].y);
      index++;
    }
    pointAt(trace, to, scratch);
    ctx.lineTo(scratch.x, scratch.y);
    ctx.stroke();
  }

  /* ------------------------------------------------------------------ joints */

  // A joint is a grid cell touched by two different live routes where at least
  // one of them turns. Straight crossings stay plain: only a shared corner is a
  // real connection on a board, so only those get a pad.
  function rebuildJoints(): void {
    builtJointsVersion = slotsVersion;

    const cells = new Map<
      string,
      { x: number; y: number; owners: number[]; corner: boolean }
    >();
    for (let slot = 0; slot < slots.length; slot++) {
      const trace = slots[slot];
      if (!trace || trace.retiringSince !== null) continue;
      const { points } = trace;

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const key = `${point.x.toFixed(2)}:${point.y.toFixed(2)}`;
        let cell = cells.get(key);
        if (!cell) {
          cell = { x: point.x, y: point.y, owners: [slot], corner: false };
          cells.set(key, cell);
        } else if (cell.owners[cell.owners.length - 1] !== slot) {
          cell.owners.push(slot); // a second, different route touches this cell
        }

        if (i === 0 || i === points.length - 1) continue;
        // Every segment is axis-aligned or 45°, so a direction change is just
        // a difference in the signs of the two deltas.
        const prev = points[i - 1];
        const next = points[i + 1];
        if (
          Math.sign(point.x - prev.x) !== Math.sign(next.x - point.x) ||
          Math.sign(point.y - prev.y) !== Math.sign(next.y - point.y)
        ) {
          cell.corner = true;
        }
      }
    }

    const halo = new Path2D();
    const ring = new Path2D();
    const core = new Path2D();
    let found = 0;

    for (const cell of cells.values()) {
      if (!cell.corner || cell.owners.length < 2) continue;
      found++;

      halo.moveTo(cell.x + JOINT_HALO_R, cell.y);
      halo.arc(cell.x, cell.y, JOINT_HALO_R, 0, TAU);

      ring.moveTo(cell.x + JOINT_R, cell.y);
      ring.arc(cell.x, cell.y, JOINT_R, 0, TAU);

      core.moveTo(cell.x + JOINT_CORE_R, cell.y);
      core.arc(cell.x, cell.y, JOINT_CORE_R, 0, TAU);
    }

    jointHalo = found ? halo : null;
    jointRing = found ? ring : null;
    jointCore = found ? core : null;
  }

  /* ----------------------------------------------------------------- render */

  // Size and clear the offscreen board layer. The transform makes it draw in
  // the same CSS-pixel space as the main canvas, so paths are shared as-is.
  function ensureCopper(): CanvasRenderingContext2D | null {
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    if (!copper) {
      const created = document.createElement("canvas");
      const layer = created.getContext("2d");
      if (!layer) return null;
      copper = created;
      copperCtx = layer;
    }
    // A fresh canvas starts at 300x150, so the size check must run on the same
    // pass that created it. Assigning either dimension also resets the
    // transform, which is why the transform is applied afterwards.
    if (copper.width !== pixelWidth || copper.height !== pixelHeight) {
      copper.width = pixelWidth;
      copper.height = pixelHeight;
    }

    const layer = copperCtx;
    if (!layer) return null;
    layer.setTransform(dpr, 0, 0, dpr, 0, 0);
    return layer;
  }

  function drawJoints(layer: CanvasRenderingContext2D): void {
    if (!jointHalo || !jointRing || !jointCore) return;

    const scale = params.intensity;

    layer.fillStyle = rampAt(ramps.trace, 0.15 * scale);
    layer.fill(jointHalo);

    layer.lineWidth = 1.2;
    layer.strokeStyle = rampAt(ramps.pulse, 0.52 * scale);
    layer.stroke(jointRing);

    layer.fillStyle = rampAt(ramps.pulse, 0.85 * scale);
    layer.fill(jointCore);

    layer.lineWidth = 1;
  }

  function drawPads(layer: CanvasRenderingContext2D): void {
    const scale = params.intensity;

    for (const trace of slots) {
      if (!trace) continue;
      const reveal = revealOf(trace);
      if (reveal <= 0.01) continue;

      const first = trace.points[0];
      const last = trace.points[trace.points.length - 1];
      layer.beginPath();
      layer.moveTo(first.x + PAD_R, first.y);
      layer.arc(first.x, first.y, PAD_R, 0, TAU);
      layer.moveTo(last.x + PAD_R, last.y);
      layer.arc(last.x, last.y, PAD_R, 0, TAU);
      layer.fillStyle = rampAt(ramps.trace, 0.5 * reveal * scale);
      layer.fill();

      if (!trace.vias.length) continue;
      layer.beginPath();
      for (const via of trace.vias) {
        layer.moveTo(via.x + VIA_R, via.y);
        layer.arc(via.x, via.y, VIA_R, 0, TAU);
      }
      layer.strokeStyle = rampAt(ramps.trace, 0.2 * reveal * scale);
      layer.lineWidth = 1;
      layer.stroke();
    }
  }

  function drawParticles(): void {
    const scale = params.intensity;

    for (const particle of particles) {
      if (particle.state !== "running") continue;
      if (particle.alpha <= 0.015) continue;
      const trace = slots[particle.trace];
      if (!trace) continue;

      pointAt(trace, particle.s, scratch);
      const headX = scratch.x;
      const headY = scratch.y;
      const alpha = particle.alpha * scale;

      if (particle.s > 6) {
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = rampAt(ramps.pulse, alpha * 0.24);
        strokeSlice(trace, Math.max(0, particle.s - 140), particle.s);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = rampAt(ramps.pulse, alpha * 0.6);
        strokeSlice(trace, Math.max(0, particle.s - 46), particle.s);

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = rampAt(ramps.pulse, alpha * 0.85);
        strokeSlice(trace, Math.max(0, particle.s - 12), particle.s);
      }

      ctx.fillStyle = rampAt(ramps.pulse, alpha * 0.16);
      ctx.beginPath();
      ctx.arc(headX, headY, 7, 0, TAU);
      ctx.fill();

      ctx.fillStyle = rampAt(ramps.pulse, alpha * 0.35);
      ctx.beginPath();
      ctx.arc(headX, headY, 3.2, 0, TAU);
      ctx.fill();

      ctx.fillStyle = rampAt(ramps.pulse, alpha);
      ctx.beginPath();
      ctx.arc(headX, headY, 1.6, 0, TAU);
      ctx.fill();
    }
  }

  /* ------------------------------------------------------------------ public */

  function update(dt: number): void {
    clock += dt;

    // Rebuild only once the slider settles, not on every input tick. Lane
    // count is not part of this: Max on screen just uses more of the table.
    if (
      Math.abs(params.wander - builtWander) > 1e-6 ||
      params.cellSize !== builtCell
    ) {
      pendingTime += dt;
      if (pendingTime >= REBUILD_DELAY) buildBoard();
    } else {
      pendingTime = 0;
    }

    syncParticles();

    // Committed = pulses that own a lane, including ones still waiting out the
    // reveal. Counting reserved ones too is what makes the on-screen cap exact.
    committed = 0;
    for (const particle of particles) {
      if (particle.state !== "queued") committed++;
    }

    // Advance pulses in flight. Arriving is the decision point: finish() rolls
    // the reroute threshold, which either keeps the path or discards it.
    const speed = params.speed;
    for (const particle of particles) {
      if (particle.state !== "running") continue;

      const trace = slots[particle.trace];
      if (!trace) {
        requeue(particle);
        continue;
      }

      particle.age += dt;
      particle.s += speed * particle.scale * dt;

      const fadeIn = Math.min(1, particle.age / 0.45);
      const fadeOut = Math.min(1, (trace.total - particle.s) / 70);
      particle.alpha = Math.max(0, Math.min(fadeIn, fadeOut));

      if (particle.s >= trace.total) finish(particle);
    }

    // Free the lanes that arrived with a reroute roll (after their fade), then
    // let the queue claim empty lanes — or grow new ones — on the same frame.
    expireTraces();
    serveQueue();

    // Lanes only change above, and never mid-frame, so the shared-corner pads
    // are rebuilt at most once per frame here rather than inside render().
    if (builtJointsVersion !== slotsVersion) rebuildJoints();
  }

  // Rasterize the static board once. Everything drawn here changes only on a
  // lane change or while a trace is fading, so most frames skip this entirely.
  function paintCopper(): void {
    const layer = ensureCopper();
    if (!layer) return;

    if (builtJointsVersion !== slotsVersion) rebuildJoints();
    copperVersion = slotsVersion;

    layer.clearRect(0, 0, width, height);

    if (gridPath && params.grid) {
      layer.fillStyle = rampAt(ramps.grid, GRID_ALPHA * params.intensity);
      layer.fill(gridPath);
    }

    layer.lineCap = "round";
    layer.lineJoin = "round";

    const intensity = params.intensity;
    let fadesUntil = 0;

    for (const trace of slots) {
      if (!trace) continue;

      // A fade is still animating if it started recently, so the next frame has
      // to repaint. Track the latest end time while walking the lanes.
      if (trace.retiringSince !== null) {
        const end = trace.retiringSince + RETIRE_FADE;
        if (end > fadesUntil) fadesUntil = end;
      } else if (clock < trace.bornAt + REVEAL) {
        if (trace.bornAt + REVEAL > fadesUntil) {
          fadesUntil = trace.bornAt + REVEAL;
        }
      }

      const reveal = revealOf(trace);
      if (reveal <= 0.01) continue;

      layer.lineWidth = 3.4;
      layer.strokeStyle = rampAt(
        ramps.trace,
        trace.alpha * 0.35 * reveal * intensity
      );
      layer.stroke(trace.path);

      layer.lineWidth = trace.width;
      layer.strokeStyle = rampAt(ramps.trace, trace.alpha * reveal * intensity);
      layer.stroke(trace.path);
    }

    copperFadesUntil = fadesUntil;

    // Joints sit over the copper but under the pulses, so a pulse passing
    // through reads as current crossing a soldered connection.
    if (params.joints) drawJoints(layer);
    if (params.pads) drawPads(layer);
  }

  function render(): void {
    if (width <= 0 || height <= 0) return;

    if (copperDirty || copperVersion !== slotsVersion || clock < copperFadesUntil) {
      paintCopper();
      copperDirty = false;
    }
    if (!copper) return;

    // One composite replaces a clear plus a full redraw of the board: "copy"
    // overwrites every pixel, including the transparent ones.
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(copper, 0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawParticles();

    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.lineWidth = 1;
  }

  // A still frame with traffic on it, for reduced-motion visitors. The board is
  // rebuilt so repeated calls (resize, slider tweak) stay stable.
  function pose(): void {
    buildBoard();

    const target = Math.min(activeCap(), count);
    for (let i = 0; i < target; i++) {
      const slot = Math.floor((i * count) / target);
      const trace = routeTrace(slot);
      if (!trace) continue;

      slots[slot] = trace;
      trace.bornAt = clock - REVEAL; // fully revealed
      trace.served = 1 + (i % 3);
      trace.readyAt = clock;

      const particle = particles[i];
      if (!particle) continue;

      trace.occupant = particle;
      particle.state = "running";
      particle.trace = slot;
      particle.s = trace.total * (0.2 + ((i * 0.17) % 0.6));
      particle.age = 1;
      particle.alpha = 1;
      particle.scale = 1;
    }

    slotsVersion++;
    rebuildJoints();
    copperDirty = true;
  }

  buildBoard();

  return {
    update,
    render,
    pose,
    resize(nextWidth: number, nextHeight: number, nextDpr: number) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      dpr = nextDpr > 0 ? nextDpr : 1;
      buildBoard();
      copperDirty = true;
    },
    setParams(next: PcbParams) {
      // Only the params the board itself is drawn from invalidate the cache.
      // Speed and reroute change the traffic, never the copper.
      if (
        next.intensity !== params.intensity ||
        next.grid !== params.grid ||
        next.pads !== params.pads ||
        next.joints !== params.joints
      ) {
        copperDirty = true;
      }
      params = next;
    },
    setColors(next: PcbColors) {
      colors = next;
      ramps = {
        trace: buildRamp(colors.trace),
        pulse: buildRamp(colors.pulse),
        grid: buildRamp(colors.grid),
      };
      copperDirty = true;
    },
    dispose() {
      particles.length = 0;
      slots = [];
      gridPath = null;
      jointHalo = null;
      jointRing = null;
      jointCore = null;
      layout = null;
      copper = null;
      copperCtx = null;
    },
  };
}
