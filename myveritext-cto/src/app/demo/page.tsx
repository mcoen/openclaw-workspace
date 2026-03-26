import Link from "next/link";
import { DemoWorkbench } from "@/components/demo-workbench";

const navItems = [
  "Dashboard",
  "Matters",
  "Proceedings",
  "Records",
  "Search",
  "AI Assistant",
  "Audit",
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">MyVeritext 2.0</p>
          <h1 className="mt-2 text-xl font-semibold">Legal Ops Workspace</h1>
          <nav className="mt-6 space-y-1">
            {navItems.map((item, idx) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 text-sm ${idx === 0 ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
              >
                {item}
              </div>
            ))}
          </nav>
          <Link href="/" className="mt-8 inline-block text-xs text-slate-400 underline underline-offset-2">
            Back to Strategy Panel
          </Link>
        </aside>

        <section className="p-6 sm:p-8">
          <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-sky-300">Rebuilt UX Demo</p>
            <h2 className="mt-1 text-3xl font-bold">Matter-Centric Operating Experience</h2>
            <p className="mt-2 text-sm text-slate-300">
              Designed to feel like a production legal operations product: faster workflow execution,
              stronger visibility, and safer AI-assisted operations.
            </p>
          </header>

          <DemoWorkbench defaultUserId="user_demo_admin" defaultMatterId="matter_demo_001" />
        </section>
      </div>
    </main>
  );
}
