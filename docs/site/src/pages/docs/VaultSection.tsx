import { Users, CheckCircle2 } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

const vaultFeatures = [
  {
    title: "Private",
    desc: "Use any Git repo — GitHub, GitLab, Bitbucket, public or private",
  },
  {
    title: "Pull",
    desc: "Install shared assets from your team's vault with one command",
  },
  {
    title: "Push",
    desc: "Share your custom rules, skills, and commands with teammates",
  },
  {
    title: "Versioned",
    desc: "Assets auto-increment versions (v1, v2, v3…) on each push",
  },
];

const assetTypes = [
  {
    type: "rule",
    path: ".claude/rules/<name>.md",
    desc: "Guidelines loaded every session",
  },
  {
    type: "skill",
    path: ".claude/skills/<name>/",
    desc: "Reusable knowledge from /learn",
  },
  {
    type: "command",
    path: ".claude/commands/<name>.md",
    desc: "Slash commands (/mycommand)",
  },
  { type: "hook", path: "Hook scripts", desc: "Quality enforcement hooks" },
];

const VaultSection = () => {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section
      id="vault"
      className="py-10 border-b border-border/50 scroll-mt-24"
    >
      <div ref={ref} className={inView ? "animate-fade-in-up" : "opacity-0"}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              /vault — Team Vault
            </h2>
            <p className="text-sm text-muted-foreground">
              Share rules, commands, and skills across your team via Git
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          The Vault lets your team share custom assets — rules, commands,
          skills, hooks — via a private Git repository. Everyone gets the same
          AI quality standards without manual file sharing. Assets are
          versioned, so updates propagate automatically on next pull.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {vaultFeatures.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-4 border border-border/50 bg-card/30"
            >
              <h3 className="font-semibold text-foreground text-sm mb-1">
                {f.title}
              </h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <h3 className="font-semibold text-foreground text-sm mb-2">Setup</h3>
        <div className="bg-background/80 rounded-lg p-3 font-mono text-xs border border-border/50 text-muted-foreground mb-5">
          <div className="text-muted-foreground/60 mb-1">
            # Initialize vault with your team's private repo
          </div>
          <div>
            <span className="text-primary">$</span> sx init --type git
            --repo-url git@github.com:org/team-vault.git
          </div>
          <div className="mt-2 text-muted-foreground/60"># Verify</div>
          <div>
            <span className="text-primary">$</span> sx vault list
          </div>
        </div>

        <h3 className="font-semibold text-foreground text-sm mb-2">
          Push and Pull
        </h3>
        <div className="bg-background/80 rounded-lg p-3 font-mono text-xs border border-border/50 text-muted-foreground mb-5">
          <div className="text-muted-foreground/60 mb-1">
            # Pull team assets and install to current project
          </div>
          <div>
            <span className="text-primary">$</span> sx install --repair --target
            .
          </div>
          <div className="mt-2 text-muted-foreground/60">
            # Push a custom skill
          </div>
          <div>
            <span className="text-primary">$</span> REPO=$(git remote get-url
            origin)
          </div>
          <div>
            <span className="text-primary">$</span> sx add
            .claude/skills/my-skill --yes --type skill --name "my-skill"
            --scope-repo $REPO
          </div>
        </div>

        <h3 className="font-semibold text-foreground text-sm mb-3">
          Shareable Asset Types
        </h3>
        <div className="rounded-xl border border-border/50 overflow-hidden mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-card/40">
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">
                  Source Path
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody>
              {assetTypes.map((a, i) => (
                <tr
                  key={a.type}
                  className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-card/20"}`}
                >
                  <td className="px-4 py-2.5">
                    <code className="text-xs text-primary">{a.type}</code>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                    {a.path}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                    {a.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl p-4 border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-xs bg-background/80 px-1.5 py-0.5 rounded border border-border/50 text-primary">
                --scope-repo
              </code>
              <span className="text-xs text-primary font-medium">
                Recommended
              </span>
            </div>
            <h4 className="font-medium text-foreground text-sm mb-1">
              Project-scoped
            </h4>
            <p className="text-xs text-muted-foreground">
              Assets install to the project's{" "}
              <code className="text-primary">.claude/</code>. Stays with the
              repo, visible to all contributors.
            </p>
          </div>
          <div className="rounded-xl p-4 border border-border/50 bg-card/30">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-xs bg-background/80 px-1.5 py-0.5 rounded border border-border/50 text-primary">
                --scope-global
              </code>
            </div>
            <h4 className="font-medium text-foreground text-sm mb-1">Global</h4>
            <p className="text-xs text-muted-foreground">
              Assets install to <code className="text-primary">~/.claude/</code>{" "}
              and apply across all your projects on this machine.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl p-3 border border-border/50 bg-card/30">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Assets are auto-versioned — each push creates v1, v2, v3…
              Teammates pull the latest version. Use{" "}
              <code className="text-primary">sx vault show &lt;name&gt;</code>{" "}
              to see all versions of an asset.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VaultSection;
