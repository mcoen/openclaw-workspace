"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DemoWorkbench } from "@/components/demo-workbench";

const navItems = ["Dashboard", "Matters", "Proceedings", "Records", "Search", "AI Assistant", "Audit"] as const;
type NavItem = (typeof navItems)[number];

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 rounded-xl border border-slate-200 bg-slate-50" />
        ))}
      </div>
    </section>
  );
}

export default function DemoPage() {
  const [active, setActive] = useState<NavItem>("Dashboard");

  const content = useMemo(() => {
    if (active === "Dashboard") return <DemoWorkbench defaultUserId="user_demo_admin" defaultMatterId="matter_demo_001" />;
    if (active === "Matters") return <Placeholder title="Matter Management" subtitle="Matter profile, participants, status and key dates." />;
    if (active === "Proceedings") return <Placeholder title="Proceedings" subtitle="Create, modify and track proceedings with clear status transitions." />;
    if (active === "Records") return <Placeholder title="Transcript & Exhibit Records" subtitle="Upload workspace, metadata, and version history." />;
    if (active === "Search") return <Placeholder title="Unified Search" subtitle="Keyword + semantic retrieval experience." />;
    if (active === "AI Assistant") return <Placeholder title="AI Assistant" subtitle="Summary and Q&A with source citations and confidence." />;
    return <Placeholder title="Audit Trail" subtitle="Who did what, when, and against which matter." />;
  }, [active]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <img
              src="https://www.veritext.com/favicon.ico"
              alt="Veritext"
              className="h-8 w-8 rounded"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-sky-700">Veritext</p>
              <h1 className="text-lg font-semibold">MyVeritext 2.0</h1>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  active === item
                    ? "bg-sky-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <Link href="/" className="mt-8 inline-block text-xs text-slate-500 underline underline-offset-2">
            Back to Strategy Panel
          </Link>
        </aside>

        <section className="p-6 sm:p-8">
          <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-sky-700">Rebuilt UX Demo</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Matter-Centric Operating Experience</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tailwind-based UI refresh designed for legal operations clarity, speed, and confidence.
            </p>
          </header>

          {content}
        </section>
      </div>
    </main>
  );
}
