import { ArrowCounterClockwiseIcon, CodeIcon, XIcon } from "@phosphor-icons/react";
import type { PcbParams } from "../../lib/pcb-background/params";
import { formatParamValue, PARAM_DEFS } from "../../lib/pcb-background/params";
import { cn } from "../../lib/utils";

interface PcbDevtoolsProps {
  open: boolean;
  params: PcbParams;
  onParamChange: <K extends keyof PcbParams>(
    key: K,
    value: PcbParams[K]
  ) => void;
  onReset: () => void;
  onPrintDefaults: () => void;
  onToggleOpen: () => void;
}

// Dev-only floating panel for tuning the background. Lives bottom-left because
// the chatbot owns bottom-right and the nav owns the top.
export default function PcbDevtools({
  open,
  params,
  onParamChange,
  onReset,
  onPrintDefaults,
  onToggleOpen,
}: PcbDevtoolsProps) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      {open && (
        <div className="card glass-3 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-box">
          <div className="card-body gap-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-poiret text-sm font-bold tracking-wide">
                PCB background
              </h3>
              <button
                type="button"
                aria-label="Close controls"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={onToggleOpen}
              >
                <XIcon size={14} />
              </button>
            </div>

            {PARAM_DEFS.map((def) => (
              <label key={def.key} className="flex flex-col gap-1">
                <span className="flex items-center justify-between text-xs">
                  <span className="opacity-70">{def.label}</span>
                  <span className="font-mono tabular-nums">
                    {formatParamValue(def, params)}
                  </span>
                </span>
                {def.type === "range" ? (
                  <input
                    type="range"
                    className="range range-xs range-primary"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={params[def.key]}
                    onChange={(event) =>
                      onParamChange(def.key, Number(event.target.value))
                    }
                  />
                ) : (
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-primary"
                    checked={params[def.key]}
                    onChange={(event) =>
                      onParamChange(def.key, event.target.checked)
                    }
                  />
                )}
              </label>
            ))}

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={onReset}
              >
                <ArrowCounterClockwiseIcon size={12} />
                Reset
              </button>
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={onPrintDefaults}
              >
                <CodeIcon size={12} />
                Print defaults
              </button>
            </div>

            <p className="text-[0.65rem] leading-snug opacity-60">
              Paste the printed block into{" "}
              <code className="font-mono">
                src/lib/pcb-background/params.ts
              </code>
              . Console: <code className="font-mono">__pcb.help()</code>
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Toggle PCB background controls"
        aria-expanded={open}
        className={cn(
          "btn btn-circle btn-sm shadow-lg",
          open ? "btn-primary" : "btn-ghost glass-1"
        )}
        onClick={onToggleOpen}
      >
        <CodeIcon size={16} />
      </button>
    </div>
  );
}
