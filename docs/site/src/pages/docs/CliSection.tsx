import { Terminal } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

const sessionCommands = [
  {
    cmd: "pilot",
    desc: "Start Claude with Pilot enhancements, auto-update, and license check",
  },
  {
    cmd: "pilot run [args...]",
    desc: "Same as above, with optional flags (--skip-update-check)",
  },
  { cmd: "ccp", desc: "Alias for pilot — shorter to type" },
  {
    cmd: "pilot check-context --json",
    desc: "Get current context usage percentage (informational)",
  },
  {
    cmd: "pilot register-plan <path> <status>",
    desc: "Associate a plan file with the current session for statusline display",
  },
  {
    cmd: "pilot sessions [--json]",
    desc: "Show count of active Pilot sessions",
  },
];

const worktreeCommands = [
  {
    cmd: "pilot worktree create --json <slug>",
    desc: "Create isolated git worktree for safe experimentation",
  },
  {
    cmd: "pilot worktree detect --json <slug>",
    desc: "Check if a worktree already exists",
  },
  {
    cmd: "pilot worktree diff --json <slug>",
    desc: "List changed files in the worktree",
  },
  {
    cmd: "pilot worktree sync --json <slug>",
    desc: "Squash merge worktree changes back to base branch",
  },
  {
    cmd: "pilot worktree cleanup --json <slug>",
    desc: "Remove worktree and branch when done",
  },
  {
    cmd: "pilot worktree status --json",
    desc: "Show active worktree info for current session",
  },
];

const licenseCommands = [
  {
    cmd: "pilot activate <key>",
    desc: "Activate a license key on this machine",
  },
  { cmd: "pilot deactivate", desc: "Deactivate license on this machine" },
  {
    cmd: "pilot status [--json]",
    desc: "Show current license status and tier",
  },
  {
    cmd: "pilot verify [--json]",
    desc: "Verify license validity (used by hooks)",
  },
  {
    cmd: "pilot trial --check [--json]",
    desc: "Check trial eligibility for this machine",
  },
  {
    cmd: "pilot trial --start [--json]",
    desc: "Start a trial (one-time per machine)",
  },
];

const CommandTable = ({
  title,
  commands,
}: {
  title: string;
  commands: { cmd: string; desc: string }[];
}) => (
  <div className="mb-5">
    <h3 className="font-semibold text-foreground text-sm mb-2">{title}</h3>
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {commands.map((c, i) => (
            <tr
              key={c.cmd}
              className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-card/20"}`}
            >
              <td className="px-4 py-2.5 align-top w-[45%]">
                <code className="text-xs text-primary font-mono whitespace-nowrap">
                  {c.cmd}
                </code>
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                {c.desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CliSection = () => {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section id="cli" className="py-10 border-b border-border/50 scroll-mt-24">
      <div ref={ref} className={inView ? "animate-fade-in-up" : "opacity-0"}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Pilot CLI</h2>
            <p className="text-sm text-muted-foreground">
              Full command reference for the pilot binary at ~/.pilot/bin/pilot
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          The <code className="text-primary">pilot</code> binary manages
          sessions, worktrees, licensing, and context. Run{" "}
          <code className="text-primary">pilot</code> or{" "}
          <code className="text-primary">ccp</code> with no arguments to start
          Claude with Pilot enhancements. All commands support{" "}
          <code className="text-primary">--json</code> for structured output.
          Multiple sessions can run in parallel on the same project — each
          tracks its own worktree and context state independently.
        </p>

        <CommandTable title="Session & Context" commands={sessionCommands} />
        <CommandTable title="Worktree Isolation" commands={worktreeCommands} />
        <CommandTable title="License & Auth" commands={licenseCommands} />

        <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-primary font-medium">Slug format:</span> The{" "}
            <code className="text-primary">&lt;slug&gt;</code> parameter for
            worktree commands is the plan filename without the date prefix and{" "}
            <code className="text-primary">.md</code> extension. For example,{" "}
            <code className="text-primary">
              docs/plans/2026-02-22-add-auth.md
            </code>{" "}
            → <code className="text-primary">add-auth</code>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CliSection;
