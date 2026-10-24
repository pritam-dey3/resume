// Tunables for the PCB background. This file is the single source of truth for
// the dev panel and the console API. To promote a tuned set of values, run
// `__pcb.defaults()` in a dev build (or press Print defaults in the panel) and
// paste the printed block over DEFAULT_PARAMS below.

export interface PcbParams {
  /** Pulse travel speed, in CSS px per second. */
  speed: number;
  /** How readily a route turns away from straight. 0..1. */
  wander: number;
  /** Chance a route is replaced once a pulse arrives. 0..1. */
  reroute: number;
  /** Ceiling on pulses that hold a route at the same time. */
  active: number;
  /** Grid pitch of the board, in CSS px. */
  cellSize: number;
  /** Multiplier applied to every drawn alpha. */
  intensity: number;
  /** Draw the board's dot grid. */
  grid: boolean;
  /** Draw end pads and vias. */
  pads: boolean;
  /** Draw pads where two routes share a corner. */
  joints: boolean;
}

type NumericParamKey = {
  [K in keyof PcbParams]: PcbParams[K] extends number ? K : never;
}[keyof PcbParams];

type ToggleParamKey = {
  [K in keyof PcbParams]: PcbParams[K] extends boolean ? K : never;
}[keyof PcbParams];

interface RangeParamDef {
  type: "range";
  key: NumericParamKey;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
}

interface ToggleParamDef {
  type: "toggle";
  key: ToggleParamKey;
  label: string;
}

export type PcbParamDef = RangeParamDef | ToggleParamDef;

export const DEFAULT_PARAMS: PcbParams = {
  speed: 130,
  wander: 0.8,
  reroute: 0.25,
  active: 10,
  cellSize: 40,
  intensity: 0.65,
  grid: true,
  pads: true,
  joints: true,
};

// Order here is the order the dev panel renders the controls in.
export const PARAM_DEFS: readonly PcbParamDef[] = [
  {
    type: "range",
    key: "speed",
    label: "Speed",
    min: 20,
    max: 260,
    step: 10,
    format: (value) => `${value} px/s`,
  },
  {
    type: "range",
    key: "wander",
    label: "Wander",
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    type: "range",
    key: "reroute",
    label: "Reroute chance",
    min: 0,
    max: 1,
    step: 0.05,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  {
    type: "range",
    key: "active",
    label: "Max on screen",
    min: 4,
    max: 48,
    step: 1,
  },
  {
    type: "range",
    key: "cellSize",
    label: "Grid pitch",
    min: 24,
    max: 64,
    step: 2,
    format: (value) => `${value} px`,
  },
  {
    type: "range",
    key: "intensity",
    label: "Intensity",
    min: 0.1,
    max: 1.6,
    step: 0.05,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  { type: "toggle", key: "grid", label: "Grid" },
  { type: "toggle", key: "pads", label: "Pads" },
  { type: "toggle", key: "joints", label: "Corner joints" },
];

export function cloneParams(params: PcbParams): PcbParams {
  return { ...params };
}

export function formatParamValue(def: PcbParamDef, params: PcbParams): string {
  const value = params[def.key];
  if (typeof value === "boolean") return value ? "On" : "Off";
  return def.type === "range" && def.format ? def.format(value) : String(value);
}

// Renders the current values as a paste-ready replacement for DEFAULT_PARAMS.
export function formatDefaultsSnippet(params: PcbParams): string {
  const keys = Object.keys(DEFAULT_PARAMS) as Array<keyof PcbParams>;
  const entries = keys.map((key) => `  ${key}: ${JSON.stringify(params[key])},`);
  return `export const DEFAULT_PARAMS: PcbParams = {\n${entries.join("\n")}\n};`;
}
