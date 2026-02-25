import { useState } from "react";
import { Modal } from "../../components/ui/Modal.js";

interface ExtendedContextToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ExtendedContextToggle({
  enabled,
  onChange,
}: ExtendedContextToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setShowConfirm(true);
    } else {
      onChange(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-lg border-2 px-4 py-3 ${enabled ? "border-warning bg-warning/10" : "border-base-300 bg-base-200"}`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="toggle toggle-warning toggle-sm mt-0.5"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">
              Extended Context (1M tokens)
            </div>
            <div className="text-xs text-base-content/50 mt-1">
              Enables 1M token context window for all models, commands, and
              sub-agents.
            </div>
          </div>
        </div>
        <div className="mt-2 ml-9 space-y-1.5">
          <div className="text-xs text-warning font-medium">
            Most users should leave this OFF. This feature is only available on
            a small subset of Max 20x subscriptions. Having a Max 20x plan does
            not guarantee access. Enabling this without access will cause API
            rate-limit errors.
          </div>
          <div className="text-xs text-base-content/50">
            This feature is being rolled out very slowly — even if you had
            access before, it may have been removed. To verify, run{" "}
            <code className="bg-base-300 px-1 py-0.5 rounded text-base-content/70">
              /model opus[1m]
            </code>{" "}
            in Claude Code. If the command fails, you don't have access.
          </div>
          <div className="text-xs text-base-content/50">
            <strong className="text-base-content/70">Cost:</strong> Standard
            rates apply up to 200K tokens. Above 200K, input costs are 2x and
            output costs are 1.5x — making long sessions significantly more
            expensive.
          </div>
        </div>
      </div>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Enable Extended Context (1M)?"
        actions={
          <>
            <button
              className="btn btn-sm"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-warning btn-sm"
              onClick={() => {
                onChange(true);
                setShowConfirm(false);
              }}
            >
              I have verified access — enable
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p>
            <strong>
              This feature is not available on most subscriptions.
            </strong>{" "}
            Only a small subset of Max 20x plans include 1M context. Having a
            Max 20x subscription alone does not mean you have it.
          </p>
          <p className="text-warning">
            If you enable this without access, all API calls will fail with
            rate-limit errors and Pilot will not work correctly.
          </p>
          <div className="bg-base-200 rounded p-3 text-xs">
            <div className="font-semibold mb-1">Test first in Claude Code:</div>
            Run <code>/model opus[1m]</code> — if the command fails, you don't
            have access. This feature is being rolled out very slowly and access
            can be removed at any time.
          </div>
        </div>
      </Modal>
    </>
  );
}
