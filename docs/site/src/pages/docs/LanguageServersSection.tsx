import { Eye, FileCode2, CheckCircle2 } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

const lspServers = [
  {
    language: "Python",
    server: "basedpyright",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/30",
    capabilities: [
      "Strict type checking with inference",
      "Real-time diagnostics on every edit",
      "Go-to-definition and find-references",
      "Hover documentation for any symbol",
      "Auto-restart on crash (max 3 attempts)",
    ],
    note: "Configured with strict mode for maximum type safety. Works with uv virtual environments automatically.",
  },
  {
    language: "TypeScript",
    server: "vtsls",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    capabilities: [
      "Full TypeScript and JavaScript support",
      "Vue.js compatibility via Volar integration",
      "Type checking across the entire project",
      "Import auto-completion and refactoring",
      "Auto-restart on crash (max 3 attempts)",
    ],
    note: "Handles both .ts and .tsx files. Respects your tsconfig.json settings automatically.",
  },
  {
    language: "Go",
    server: "gopls",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    capabilities: [
      "Official Go language server by Google",
      "Static analysis and vet diagnostics",
      "Go module-aware resolution",
      "Rename and code actions support",
      "Auto-restart on crash (max 3 attempts)",
    ],
    note: "Requires Go modules. Respects GOPATH and module proxy settings.",
  },
];

const LanguageServersSection = () => {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section
      id="language-servers"
      className="py-10 border-b border-border/50 scroll-mt-24"
    >
      <div ref={ref} className={inView ? "animate-fade-in-up" : "opacity-0"}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Language Servers
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time diagnostics and go-to-definition, auto-installed and
              configured
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Language servers (LSP) give Claude real-time diagnostics, type
          information, and go-to-definition on every file edit. All three are
          auto-installed and configured via stdio transport — no manual setup.
          They work alongside the{" "}
          <code className="text-primary">file_checker.py</code> hook: hooks
          catch formatting and linting errors, LSP provides type-level
          intelligence.
        </p>

        <div className="space-y-4 mb-5">
          {lspServers.map((lsp) => (
            <div
              key={lsp.language}
              className={`rounded-xl border ${lsp.border} bg-card/30 p-4`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-8 h-8 ${lsp.bg} rounded-lg flex items-center justify-center`}
                >
                  <FileCode2 className={`h-4 w-4 ${lsp.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {lsp.language}
                  </h3>
                  <code className={`text-xs ${lsp.color}`}>{lsp.server}</code>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-1.5 mb-2">
                {lsp.capabilities.map((cap) => (
                  <div
                    key={cap}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${lsp.color} flex-shrink-0 mt-0.5`}
                    />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/70 italic mt-2">
                {lsp.note}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-2">
            <FileCode2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                <span className="text-primary font-medium">
                  Add custom language servers
                </span>{" "}
                via <code className="text-primary">.lsp.json</code> in your
                project root. All servers use stdio transport and support
                auto-restart configuration.
              </p>
              <div className="bg-background/80 rounded-lg p-2.5 font-mono text-xs border border-border/50 text-muted-foreground">
                <div className="text-muted-foreground/60 mb-1">
                  # .lsp.json example
                </div>
                <div>{`{ "servers": [{ "name": "rust-analyzer", `}</div>
                <div>{`    "command": "rust-analyzer", "args": [] }] }`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LanguageServersSection;
