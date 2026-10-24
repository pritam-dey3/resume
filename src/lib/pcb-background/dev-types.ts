// Shape of the dev-only `window.__pcb` console API. Kept out of the component
// file so the component stays a single default export.

import type { PcbParams } from "./params";

export interface PcbDevApi {
  /** Open the control panel. */
  open(): void;
  /** Close the control panel. */
  close(): void;
  /** Open the panel if closed, close it if open. */
  toggle(): void;
  /** Snapshot of the values the board is currently using. */
  values(): PcbParams;
  /** Apply a partial set of values and return the full result. */
  set(patch: Partial<PcbParams>): PcbParams;
  /** Restore DEFAULT_PARAMS. */
  reset(): PcbParams;
  /** Print a paste-ready DEFAULT_PARAMS block for the current values. */
  defaults(): string;
  /** List the available commands. */
  help(): void;
}
